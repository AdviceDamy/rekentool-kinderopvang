import { ToeslagtabelModel, ToeslagtabelData } from '../models/Toeslagtabel';

export interface KindInput {
  opvangvorm: 'dagopvang' | 'bso' | 'gastouder';
  uren_per_maand: number;
  uurtarief: number;
}

export interface ToeslagBerekeningInput {
  organisatieId: number;
  actief_toeslagjaar: number;
  gemeente_toeslag_percentage: number;
  gemeente_toeslag_actief: boolean;
  gezinsinkomen: number;
  kinderen: KindInput[];
}

export interface KindResultaat {
  brutokosten: number;
  toeslag_landelijk: number;
  toeslag_gemeente: number;
  toeslag_totaal: number;
  nettokosten: number;
  vergoed_uurtarief: number;
  vergoed_uren: number;
  is_eerste_kind: boolean;
}

export interface ToeslagBerekeningResultaat {
  totaal_brutokosten: number;
  totaal_toeslag_landelijk: number;
  totaal_toeslag_gemeente: number;
  totaal_toeslag: number;
  totaal_nettokosten: number;
  kinderen: KindResultaat[];
  gebruikte_toeslagtabel: {
    jaar: number;
    max_hourly_rates: ToeslagtabelData['max_hourly_rates'];
  };
}

export class ToeslagService {
  
  /**
   * Bereken kinderopvangtoeslag voor meerdere kinderen
   */
  static async berekenToeslag(input: ToeslagBerekeningInput): Promise<ToeslagBerekeningResultaat> {
    // Haal toeslagtabel op
    const toeslagtabel = await ToeslagtabelModel.getByJaar(input.actief_toeslagjaar);
    if (!toeslagtabel) {
      throw new Error(`Geen toeslagtabel gevonden voor jaar ${input.actief_toeslagjaar}`);
    }

    const toeslagData = ToeslagtabelModel.parseData(toeslagtabel.data);
    
    // Bepaal toeslagpercentages op basis van inkomen
    const percentages = this.bepaalToeslagpercentages(input.gezinsinkomen, toeslagData);
    
    // Sorteer kinderen op afnemend aantal uren (eerste kind = meeste uren)
    const gesorteerdeKinderen = [...input.kinderen]
      .map((kind, index) => ({ ...kind, origineleIndex: index }))
      .sort((a, b) => b.uren_per_maand - a.uren_per_maand);

    const kinderResultaten: KindResultaat[] = [];
    let totaal_brutokosten = 0;
    let totaal_toeslag_landelijk = 0;
    let totaal_toeslag_gemeente = 0;

    // Bereken per kind
    gesorteerdeKinderen.forEach((kind, sorteerIndex) => {
      const isEersteKind = sorteerIndex === 0;
      const percentage = isEersteKind ? percentages.eerste_kind : percentages.volgende_kinderen;
      
      const resultaat = this.berekenKindToeslag(
        kind,
        toeslagData,
        percentage,
        input.gemeente_toeslag_percentage,
        input.gemeente_toeslag_actief,
        isEersteKind
      );

      kinderResultaten[kind.origineleIndex] = resultaat;
      
      totaal_brutokosten += resultaat.brutokosten;
      totaal_toeslag_landelijk += resultaat.toeslag_landelijk;
      totaal_toeslag_gemeente += resultaat.toeslag_gemeente;
    });

    const totaal_toeslag = totaal_toeslag_landelijk + totaal_toeslag_gemeente;
    const totaal_nettokosten = Math.max(0, totaal_brutokosten - totaal_toeslag); // Kan niet negatief zijn

    return {
      totaal_brutokosten: this.afrondenCenten(totaal_brutokosten),
      totaal_toeslag_landelijk: this.afrondenCenten(totaal_toeslag_landelijk),
      totaal_toeslag_gemeente: this.afrondenCenten(totaal_toeslag_gemeente),
      totaal_toeslag: this.afrondenCenten(totaal_toeslag),
      totaal_nettokosten: this.afrondenCenten(totaal_nettokosten),
      kinderen: kinderResultaten,
      gebruikte_toeslagtabel: {
        jaar: toeslagData.year,
        max_hourly_rates: toeslagData.max_hourly_rates
      }
    };
  }

  /**
   * Bepaal toeslagpercentages op basis van gezinsinkomen
   */
  private static bepaalToeslagpercentages(gezinsinkomen: number, toeslagData: ToeslagtabelData): {
    eerste_kind: number;
    volgende_kinderen: number;
  } {
    for (const bracket of toeslagData.income_brackets) {
      if (gezinsinkomen >= bracket.min && (bracket.max === null || gezinsinkomen <= bracket.max)) {
        return {
          eerste_kind: bracket.perc_first_child,
          volgende_kinderen: bracket.perc_other_children
        };
      }
    }
    
    // Fallback naar hoogste inkomensklasse als geen match
    const hoogsteKlasse = toeslagData.income_brackets[toeslagData.income_brackets.length - 1];
    return {
      eerste_kind: hoogsteKlasse.perc_first_child,
      volgende_kinderen: hoogsteKlasse.perc_other_children
    };
  }

  /**
   * Bereken toeslag voor één kind
   */
  private static berekenKindToeslag(
    kind: KindInput & { origineleIndex: number },
    toeslagData: ToeslagtabelData,
    toeslagpercentage: number,
    gemeente_toeslag_percentage: number,
    gemeente_toeslag_actief: boolean,
    isEersteKind: boolean
  ): KindResultaat {
    
    // Bepaal maximum uurtarief voor deze opvangvorm
    const maxUurtarief = toeslagData.max_hourly_rates[kind.opvangvorm];
    
    // Gebruik minimum van werkelijk tarief en maximum tarief voor toeslag
    const vergoedUurtarief = Math.min(kind.uurtarief, maxUurtarief);
    
    // Maximum 230 uur per maand voor toeslag
    const vergoedUren = Math.min(kind.uren_per_maand, 230);
    
    // Bereken brutokosten (volledig tarief, alle uren)
    const brutokosten = kind.uurtarief * kind.uren_per_maand;
    
    // Bereken basis voor toeslag (vergoed tarief, max 230 uur)
    const toeslagBasis = vergoedUurtarief * vergoedUren;
    
    // Landelijke toeslag
    const toeslagLandelijk = toeslagBasis * (toeslagpercentage / 100);
    
    // Gemeentelijke toeslag (alleen als actief)
    const toeslagGemeente = gemeente_toeslag_actief 
      ? toeslagBasis * (gemeente_toeslag_percentage / 100)
      : 0;
    
    const toeslagTotaal = toeslagLandelijk + toeslagGemeente;
    const nettokosten = brutokosten - toeslagTotaal;

    return {
      brutokosten: this.afrondenCenten(brutokosten),
      toeslag_landelijk: this.afrondenCenten(toeslagLandelijk),
      toeslag_gemeente: this.afrondenCenten(toeslagGemeente),
      toeslag_totaal: this.afrondenCenten(toeslagTotaal),
      nettokosten: this.afrondenCenten(Math.max(nettokosten, 0)), // Netto kan niet negatief zijn
      vergoed_uurtarief: vergoedUurtarief,
      vergoed_uren: vergoedUren,
      is_eerste_kind: isEersteKind
    };
  }

  /**
   * Rondt bedrag af op centen
   */
  private static afrondenCenten(bedrag: number): number {
    return Math.round(bedrag * 100) / 100;
  }

  /**
   * Helper: Converteer opvangvorm naam naar toeslag type
   */
  static mapOpvangvormNaarToeslagType(opvangvormNaam: string): 'dagopvang' | 'bso' | 'gastouder' {
    const naam = opvangvormNaam.toLowerCase();
    
    if (naam.includes('kdv') || naam.includes('kinderdagverblijf') || naam.includes('dagopvang')) {
      return 'dagopvang';
    } else if (naam.includes('bso') || naam.includes('buitenschoolse') || naam.includes('naschoolse')) {
      return 'bso';
    } else if (naam.includes('gastouder') || naam.includes('peuteropvang')) {
      return 'gastouder';
    } else {
      // Default naar dagopvang
      return 'dagopvang';
    }
  }
} 