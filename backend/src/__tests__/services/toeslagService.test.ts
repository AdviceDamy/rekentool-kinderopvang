import { ToeslagService, ToeslagBerekeningInput } from '../../services/toeslagService';
import { ToeslagtabelModel } from '../../models/Toeslagtabel';
import database from '../../utils/database';

describe('ToeslagService', () => {
  
  beforeEach(async () => {
    // Insert test toeslagtabel data
    const testToeslagtabelData = {
      year: 2024,
      income_brackets: [
        { min: 0, max: 23000, perc_first_child: 96, perc_other_children: 96 },
        { min: 23001, max: 53000, perc_first_child: 83, perc_other_children: 83 },
        { min: 53001, max: 75000, perc_first_child: 50, perc_other_children: 50 },
        { min: 75001, max: null, perc_first_child: 0, perc_other_children: 0 }
      ],
      max_hourly_rates: {
        dagopvang: 10.25,
        bso: 9.12,
        gastouder: 7.53
      }
    };

    await database('toeslagtabellen').insert({
      jaar: 2024,
      data: JSON.stringify(testToeslagtabelData),
      actief: true,
      created_at: new Date(),
      updated_at: new Date()
    });
  });

  describe('berekenToeslag', () => {
    it('should calculate correct toeslag for single child with low income', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const result = await ToeslagService.berekenToeslag(input);

      // Expected calculations:
      // Brutokosten: 160 * 8.50 = 1360
      // Vergoed uurtarief: min(8.50, 10.25) = 8.50
      // Toeslag basis: 160 * 8.50 = 1360
      // Landelijke toeslag: 1360 * 0.96 = 1305.60
      // Netto kosten: 1360 - 1305.60 = 54.40

      expect(result.totaal_brutokosten).toBe(1360);
      expect(result.totaal_toeslag_landelijk).toBe(1305.60);
      expect(result.totaal_toeslag_gemeente).toBe(0);
      expect(result.totaal_nettokosten).toBe(54.40);
      expect(result.kinderen).toHaveLength(1);
      expect(result.kinderen[0].is_eerste_kind).toBe(true);
    });

    it('should calculate correct toeslag for single child with high hourly rate', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 12.00 // Higher than max rate
        }]
      };

      const result = await ToeslagService.berekenToeslag(input);

      // Expected calculations:
      // Brutokosten: 160 * 12.00 = 1920
      // Vergoed uurtarief: min(12.00, 10.25) = 10.25 (capped at max)
      // Toeslag basis: 160 * 10.25 = 1640
      // Landelijke toeslag: 1640 * 0.96 = 1574.40
      // Netto kosten: 1920 - 1574.40 = 345.60

      expect(result.totaal_brutokosten).toBe(1920);
      expect(result.totaal_toeslag_landelijk).toBe(1574.40);
      expect(result.totaal_nettokosten).toBe(345.60);
    });

    it('should limit hours to 230 per month for toeslag calculation', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 300, // More than 230 limit
          uurtarief: 8.50
        }]
      };

      const result = await ToeslagService.berekenToeslag(input);

      // Expected calculations:
      // Brutokosten: 300 * 8.50 = 2550 (full hours)
      // Vergoed uren: min(300, 230) = 230 (capped at 230)
      // Toeslag basis: 230 * 8.50 = 1955
      // Landelijke toeslag: 1955 * 0.96 = 1876.80
      // Netto kosten: 2550 - 1876.80 = 673.20

      expect(result.totaal_brutokosten).toBe(2550);
      expect(result.totaal_toeslag_landelijk).toBe(1876.80);
      expect(result.totaal_nettokosten).toBe(673.20);
      expect(result.kinderen[0].vergoed_uren).toBe(230);
    });

    it('should calculate correct toeslag with gemeente toeslag', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 10,
        gemeente_toeslag_actief: true,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const result = await ToeslagService.berekenToeslag(input);

      // Expected calculations:
      // Brutokosten: 160 * 8.50 = 1360
      // Landelijke toeslag: 1360 * 0.96 = 1305.60
      // Gemeente toeslag: 1360 * 0.10 = 136.00
      // Totaal toeslag: 1305.60 + 136.00 = 1441.60
      // Netto kosten: max(0, 1360 - 1441.60) = 0 (can't be negative)

      expect(result.totaal_brutokosten).toBe(1360);
      expect(result.totaal_toeslag_landelijk).toBe(1305.60);
      expect(result.totaal_toeslag_gemeente).toBe(136.00);
      expect(result.totaal_toeslag).toBe(1441.60);
      expect(result.totaal_nettokosten).toBe(0); // Can't be negative
    });

    it('should calculate correct toeslag for multiple children', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 40000, // Middle income bracket (83%)
        kinderen: [
          {
            opvangvorm: 'dagopvang',
            uren_per_maand: 160,
            uurtarief: 8.50
          },
          {
            opvangvorm: 'bso',
            uren_per_maand: 80,
            uurtarief: 7.00
          }
        ]
      };

      const result = await ToeslagService.berekenToeslag(input);

      // Child with most hours gets eerste_kind percentage (160 hours)
      // Child with fewer hours gets volgende_kinderen percentage (80 hours)
      
      // Child 1 (dagopvang, 160 hours, eerste kind):
      // Brutokosten: 160 * 8.50 = 1360
      // Toeslag: 1360 * 0.83 = 1128.80
      
      // Child 2 (bso, 80 hours, volgend kind):
      // Brutokosten: 80 * 7.00 = 560
      // Toeslag: 560 * 0.83 = 464.80
      
      // Totals:
      // Brutokosten: 1360 + 560 = 1920
      // Toeslag: 1128.80 + 464.80 = 1593.60
      // Netto: 1920 - 1593.60 = 326.40

      expect(result.totaal_brutokosten).toBe(1920);
      expect(result.totaal_toeslag_landelijk).toBe(1593.60);
      expect(result.totaal_nettokosten).toBe(326.40);
      expect(result.kinderen).toHaveLength(2);
      
      // Check that the child with most hours is marked as eerste_kind
      const eersteKind = result.kinderen.find(k => k.is_eerste_kind);
      const volgendeKind = result.kinderen.find(k => !k.is_eerste_kind);
      
      expect(eersteKind).toBeDefined();
      expect(volgendeKind).toBeDefined();
      expect(eersteKind!.brutokosten).toBe(1360); // Dagopvang child
      expect(volgendeKind!.brutokosten).toBe(560); // BSO child
    });

    it('should handle high income with 0% toeslag', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2024,
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 80000, // High income bracket (0%)
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      const result = await ToeslagService.berekenToeslag(input);

      expect(result.totaal_brutokosten).toBe(1360);
      expect(result.totaal_toeslag_landelijk).toBe(0);
      expect(result.totaal_nettokosten).toBe(1360);
    });

    it('should throw error for non-existent year', async () => {
      const input: ToeslagBerekeningInput = {
        organisatieId: 1,
        actief_toeslagjaar: 2030, // Non-existent year
        gemeente_toeslag_percentage: 0,
        gemeente_toeslag_actief: false,
        gezinsinkomen: 20000,
        kinderen: [{
          opvangvorm: 'dagopvang',
          uren_per_maand: 160,
          uurtarief: 8.50
        }]
      };

      await expect(ToeslagService.berekenToeslag(input))
        .rejects.toThrow('Geen toeslagtabel gevonden voor jaar 2030');
    });
  });

  describe('mapOpvangvormNaarToeslagType', () => {
    it('should map daycare variants to dagopvang', () => {
      expect(ToeslagService.mapOpvangvormNaarToeslagType('KDV')).toBe('dagopvang');
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Kinderdagverblijf')).toBe('dagopvang');
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Dagopvang')).toBe('dagopvang');
    });

    it('should map after school care variants to bso', () => {
      expect(ToeslagService.mapOpvangvormNaarToeslagType('BSO')).toBe('bso');
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Buitenschoolse opvang')).toBe('bso');
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Naschoolse opvang')).toBe('bso');
    });

    it('should map childminder variants to gastouder', () => {
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Gastouder')).toBe('gastouder');
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Peuteropvang')).toBe('gastouder');
    });

    it('should default to dagopvang for unknown types', () => {
      expect(ToeslagService.mapOpvangvormNaarToeslagType('Unknown type')).toBe('dagopvang');
    });
  });
}); 