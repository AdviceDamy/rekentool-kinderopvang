import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  SimpleGrid
} from '@chakra-ui/react';

// Material Icons
import HomeIcon from '@mui/icons-material/Home';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface Organisatie {
  id: number;
  naam: string;
  slug: string;
  actief_toeslagjaar?: number;
  gemeente_toeslag_percentage?: number;
  gemeente_toeslag_actief?: boolean;
  standaard_inkomensklasse?: string;
  toeslag_automatisch_berekenen?: boolean;
}

interface WizardConfiguratie {
  welkom: boolean;
  kinderen: boolean;
  opvangvorm: boolean;
  tarief: boolean;
  planning: boolean;
  resultaat: boolean;
  jaarplanning: boolean;
  vergelijking: boolean;
}

interface Opvangvorm {
  id: number;
  naam: string;
  omschrijving?: string;
}

interface Tarief {
  id: number;
  naam: string;
  type: string;
  tarief: number;
  opvangvorm_id: number;
  configuratie?: any;
}

interface Inkomensklasse {
  id: number;
  min: number;
  max: number | null;
  label: string;
  perc_first_child: number;
  perc_other_children: number;
}

interface Kind {
  id: string; // Unieke ID voor elk kind
  naam: string; // Naam van het kind (optioneel)
  opvangvorm_id: string;
  tariefId: string;
  uren_per_week: number;
  dagen_per_week: number;
}

interface ToeslagResultaat {
  totaal_brutokosten: number;
  totaal_toeslag_landelijk: number;
  totaal_toeslag_gemeente: number;
  totaal_toeslag: number;
  totaal_nettokosten: number;
  kinderen: Array<{
    brutokosten: number;
    toeslag_landelijk: number;
    toeslag_gemeente: number;
    toeslag_totaal: number;
    nettokosten: number;
    vergoed_uurtarief: number;
    vergoed_uren: number;
    is_eerste_kind: boolean;
  }>;
  gebruikte_toeslagtabel: {
    jaar: number;
    max_hourly_rates: {
      dagopvang: number;
      bso: number;
      gastouder: number;
    };
  };
}

interface VakantieWeek {
  weekNummer: number;
  naam: string;
  datum: string;
  geselecteerd: boolean;
}

interface JaarPlanningResultaat {
  maandelijkse_kosten: number;
  werkelijke_jaarkosten: number;
  besparing_door_vakanties: number;
  maandelijkse_breakdown: Array<{
    maand: string;
    weken: number;
    kosten: number;
    vakantieweken: string[];
  }>;
  totaal_opvang_weken: number;
  totaal_vakantie_weken: number;
}

interface Scenario {
  id: string;
  naam: string;
  kinderen: Kind[];
  resultaat: {
    brutokosten: number;
    berekening_details: string;
    toeslag?: ToeslagResultaat;
    jaarplanning?: JaarPlanningResultaat;
  };
  vakantieweken: VakantieWeek[];
  aangemaakt_op: Date;
}

// Wizard stappen
const WIZARD_STEPS = [
  { id: 1, title: 'Welkom', icon: HomeIcon, description: 'Organisatie informatie' },
  { id: 2, title: 'Kinderen', icon: FamilyRestroomIcon, description: 'Aantal kinderen' },
  { id: 3, title: 'Opvangvorm', icon: ChildCareIcon, description: 'Kies type opvang' },
  { id: 4, title: 'Tarief', icon: AttachMoneyIcon, description: 'Selecteer tarief' },
  { id: 5, title: 'Planning', icon: ScheduleIcon, description: 'Uren en dagen' },
  { id: 6, title: 'Resultaat', icon: AssessmentIcon, description: 'Kosten berekening' },
  { id: 7, title: 'Jaarplanning', icon: EventIcon, description: 'Vakantieweken selectie' },
  { id: 8, title: 'Vergelijken', icon: CompareArrowsIcon, description: 'Scenario vergelijking' }
];

const RekentoolWizardPage: React.FC = () => {
  const { organisatieSlug } = useParams<{ organisatieSlug: string }>();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data state
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [wizardConfiguratie, setWizardConfiguratie] = useState<WizardConfiguratie>({
    welkom: true,
    kinderen: true,
    opvangvorm: true,
    tarief: true,
    planning: true,
    resultaat: true,
    jaarplanning: true,
    vergelijking: true
  });
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [berekening, setBerekening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state - meerdere kinderen
  const [kinderen, setKinderen] = useState<Kind[]>([{
    id: '1',
    naam: 'Kind 1',
    opvangvorm_id: '',
    tariefId: '',
    uren_per_week: 32,
    dagen_per_week: 4
  }]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  
  // Resultaat voor alle kinderen
  const [resultaat, setResultaat] = useState<{
    brutokosten: number;
    berekening_details: string;
    toeslag?: ToeslagResultaat;
  } | null>(null);

  // Scenario vergelijking
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioNaam, setScenarioNaam] = useState<string>('');

  // Jaarplanning
  const [vakantieweken, setVakantieweken] = useState<VakantieWeek[]>([]);
  const [jaarplanningResultaat, setJaarplanningResultaat] = useState<JaarPlanningResultaat | null>(null);

  // Dynamic wizard steps based on configuration
  const getActiveSteps = () => {
    const stepMapping = [
      { config: wizardConfiguratie.welkom, step: WIZARD_STEPS[0] },
      { config: wizardConfiguratie.kinderen, step: WIZARD_STEPS[1] },
      { config: wizardConfiguratie.opvangvorm, step: WIZARD_STEPS[2] },
      { config: wizardConfiguratie.tarief, step: WIZARD_STEPS[3] },
      { config: wizardConfiguratie.planning, step: WIZARD_STEPS[4] },
      { config: wizardConfiguratie.resultaat, step: WIZARD_STEPS[5] },
      { config: wizardConfiguratie.jaarplanning, step: WIZARD_STEPS[6] },
      { config: wizardConfiguratie.vergelijking, step: WIZARD_STEPS[7] }
    ];
    
    return stepMapping
      .filter(item => item.config)
      .map((item, index) => ({ ...item.step, id: index + 1 }));
  };

  const getStepByOriginalId = (originalId: number) => {
    const activeSteps = getActiveSteps();
    const stepMapping = [
      { original: 1, config: 'welkom' },
      { original: 2, config: 'kinderen' },
      { original: 3, config: 'opvangvorm' },
      { original: 4, config: 'tarief' },
      { original: 5, config: 'planning' },
      { original: 6, config: 'resultaat' },
      { original: 7, config: 'jaarplanning' },
      { original: 8, config: 'vergelijking' }
    ];
    
    const mapping = stepMapping.find(s => s.original === originalId);
    if (!mapping) return null;
    
    return activeSteps.find(step => 
      step.title.toLowerCase() === mapping.config.replace('jaarplanning', 'jaarplanning').replace('vergelijking', 'vergelijken')
    );
  };

  const getCurrentStepConfig = () => {
    const activeSteps = getActiveSteps();
    return activeSteps[currentStep - 1];
  };

  const getTotalSteps = () => {
    return getActiveSteps().length;
  };

  // Helper functions voor kinderen beheer
  const addKind = () => {
    const newId = (kinderen.length + 1).toString();
    const newKind: Kind = {
      id: newId,
      naam: `Kind ${newId}`,
      opvangvorm_id: '',
      tariefId: '',
      uren_per_week: 32,
      dagen_per_week: 4
    };
    setKinderen([...kinderen, newKind]);
  };

  const removeKind = (index: number) => {
    if (kinderen.length > 1) {
      const newKinderen = kinderen.filter((_, i) => i !== index);
      setKinderen(newKinderen);
      if (currentChildIndex >= newKinderen.length) {
        setCurrentChildIndex(newKinderen.length - 1);
      }
    }
  };

  const updateKind = (index: number, updates: Partial<Kind>) => {
    const newKinderen = [...kinderen];
    newKinderen[index] = { ...newKinderen[index], ...updates };
    setKinderen(newKinderen);
    setResultaat(null); // Reset resultaat bij wijzigingen
  };

  const getCurrentKind = (): Kind => {
    return kinderen[currentChildIndex] || kinderen[0];
  };

  // Scenario management functions
  const saveCurrentScenario = () => {
    if (!resultaat) return;
    
    const naam = scenarioNaam || `Scenario ${scenarios.length + 1}`;
    const newScenario: Scenario = {
      id: Date.now().toString(),
      naam,
      kinderen: [...kinderen], // Deep copy
      resultaat: { 
        ...resultaat, 
        jaarplanning: jaarplanningResultaat ? { ...jaarplanningResultaat } : undefined 
      },
      vakantieweken: [...vakantieweken],
      aangemaakt_op: new Date()
    };
    
    setScenarios([...scenarios, newScenario]);
    setScenarioNaam('');
  };

  const deleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const loadScenario = (scenario: Scenario) => {
    setKinderen([...scenario.kinderen]);
    setResultaat({ ...scenario.resultaat });
    setVakantieweken([...scenario.vakantieweken]);
    setJaarplanningResultaat(scenario.resultaat.jaarplanning || null);
    setCurrentChildIndex(0);
    setCurrentStep(3); // Ga naar opvangvorm stap om te bewerken
  };

  const getBestScenario = (): Scenario | null => {
    if (scenarios.length === 0) return null;
    
    return scenarios.reduce((best, current) => {
      const currentCost = current.resultaat.toeslag 
        ? current.resultaat.toeslag.totaal_nettokosten 
        : current.resultaat.brutokosten;
      const bestCost = best.resultaat.toeslag 
        ? best.resultaat.toeslag.totaal_nettokosten 
        : best.resultaat.brutokosten;
      
      return currentCost < bestCost ? current : best;
    });
  };

  // Jaarplanning helper functions
  const initializeVakantieweken = () => {
    const standaardVakanties: VakantieWeek[] = [
      { weekNummer: 9, naam: 'Voorjaarsvakantie', datum: 'Februari/Maart', geselecteerd: true },
      { weekNummer: 18, naam: 'Meivakantie', datum: 'Mei', geselecteerd: true },
      { weekNummer: 29, naam: 'Zomervakantie week 1', datum: 'Juli', geselecteerd: true },
      { weekNummer: 30, naam: 'Zomervakantie week 2', datum: 'Juli', geselecteerd: true },
      { weekNummer: 31, naam: 'Zomervakantie week 3', datum: 'Juli', geselecteerd: true },
      { weekNummer: 32, naam: 'Zomervakantie week 4', datum: 'Augustus', geselecteerd: true },
      { weekNummer: 33, naam: 'Zomervakantie week 5', datum: 'Augustus', geselecteerd: true },
      { weekNummer: 34, naam: 'Zomervakantie week 6', datum: 'Augustus', geselecteerd: true },
      { weekNummer: 42, naam: 'Herfstvakantie', datum: 'Oktober', geselecteerd: true },
      { weekNummer: 52, naam: 'Kerstvakantie', datum: 'December', geselecteerd: true },
      { weekNummer: 1, naam: 'Nieuwjaarsvakantie', datum: 'Januari', geselecteerd: true }
    ];
    
    setVakantieweken(standaardVakanties);
  };

  const toggleVakantieweek = (weekNummer: number) => {
    setVakantieweken(prev => 
      prev.map(week => 
        week.weekNummer === weekNummer 
          ? { ...week, geselecteerd: !week.geselecteerd }
          : week
      )
    );
    setJaarplanningResultaat(null); // Reset resultaat bij wijzigingen
  };

  const berekenJaarplanning = () => {
    if (!resultaat) return;

    const geselecteerdeVakanties = vakantieweken.filter(v => v.geselecteerd);
    const totaalVakantieWeken = geselecteerdeVakanties.length;
    const totaalOpvangWeken = 52 - totaalVakantieWeken;
    
    // Bereken werkelijke kosten
    const weekelijkseKosten = resultaat.brutokosten / 4.33; // Van maandelijks naar wekelijks
    const werkelijkeJaarkosten = weekelijkseKosten * totaalOpvangWeken;
    const theoretischeJaarkosten = resultaat.brutokosten * 12;
    const besparingDoorVakanties = theoretischeJaarkosten - werkelijkeJaarkosten;

    // Maandelijkse breakdown
    const maandelijkseBreakdown = [
      { maand: 'Januari', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Februari', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Maart', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'April', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Mei', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Juni', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Juli', weken: 5, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Augustus', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'September', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'Oktober', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'November', weken: 4, kosten: 0, vakantieweken: [] as string[] },
      { maand: 'December', weken: 5, kosten: 0, vakantieweken: [] as string[] }
    ];

    // Voeg vakantieweken toe aan juiste maanden
    geselecteerdeVakanties.forEach(vakantie => {
      let maandIndex = -1;
      if (vakantie.weekNummer <= 4) maandIndex = 0; // Januari
      else if (vakantie.weekNummer <= 8) maandIndex = 1; // Februari  
      else if (vakantie.weekNummer <= 13) maandIndex = 2; // Maart
      else if (vakantie.weekNummer <= 17) maandIndex = 3; // April
      else if (vakantie.weekNummer <= 22) maandIndex = 4; // Mei
      else if (vakantie.weekNummer <= 26) maandIndex = 5; // Juni
      else if (vakantie.weekNummer <= 31) maandIndex = 6; // Juli
      else if (vakantie.weekNummer <= 35) maandIndex = 7; // Augustus
      else if (vakantie.weekNummer <= 39) maandIndex = 8; // September
      else if (vakantie.weekNummer <= 43) maandIndex = 9; // Oktober
      else if (vakantie.weekNummer <= 47) maandIndex = 10; // November
      else maandIndex = 11; // December

      if (maandIndex >= 0) {
        maandelijkseBreakdown[maandIndex].vakantieweken.push(vakantie.naam);
        maandelijkseBreakdown[maandIndex].weken -= 1;
      }
    });

    // Bereken kosten per maand
    maandelijkseBreakdown.forEach(maand => {
      maand.kosten = weekelijkseKosten * maand.weken;
    });

    const jaarplanning: JaarPlanningResultaat = {
      maandelijkse_kosten: resultaat.brutokosten,
      werkelijke_jaarkosten: werkelijkeJaarkosten,
      besparing_door_vakanties: besparingDoorVakanties,
      maandelijkse_breakdown: maandelijkseBreakdown,
      totaal_opvang_weken: totaalOpvangWeken,
      totaal_vakantie_weken: totaalVakantieWeken
    };

    setJaarplanningResultaat(jaarplanning);
  };

  // Load data when component mounts
  useEffect(() => {
    loadOrganisatieData();
    initializeVakantieweken();
  }, [organisatieSlug]);

  const loadOrganisatieData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      
      // Haal organisatie op via de publieke route
      const orgResponse = await fetch(`${apiUrl}/api/organisaties/public/${organisatieSlug}`);
      if (!orgResponse.ok) {
        throw new Error('Organisatie niet gevonden');
      }
      const orgResult = await orgResponse.json();
      
      if (!orgResult.success) {
        throw new Error(orgResult.error || 'Organisatie niet gevonden');
      }
      
      setOrganisatie(orgResult.data);

      // Haal opvangvormen op
      const opvangvormenResponse = await fetch(`${apiUrl}/api/opvangvormen?org=${organisatieSlug}`);
      if (opvangvormenResponse.ok) {
        const opvangvormenResult = await opvangvormenResponse.json();
        if (opvangvormenResult.success) {
          setOpvangvormen(opvangvormenResult.data || []);
        }
      }

      // Haal tarieven op
      const tarievenResponse = await fetch(`${apiUrl}/api/tarieven?org=${organisatieSlug}`);
      if (tarievenResponse.ok) {
        const tarievenResult = await tarievenResponse.json();
        if (tarievenResult.success) {
          setTarieven(tarievenResult.data || []);
        }
      }

      // Haal inkomensklassen op als organisatie een actief toeslagjaar heeft
      if (orgResult.data.actief_toeslagjaar) {
        const inkomensResponse = await fetch(`${apiUrl}/api/toeslag/${orgResult.data.actief_toeslagjaar}/inkomensklassen`);
        if (inkomensResponse.ok) {
          const inkomensResult = await inkomensResponse.json();
          if (inkomensResult.success) {
            setInkomensklassen(inkomensResult.data.inkomensklassen || []);
          }
        }
      }

      // Haal wizard configuratie op
      const wizardResponse = await fetch(`${apiUrl}/api/organisaties/public/${organisatieSlug}/wizard-configuratie`);
      if (wizardResponse.ok) {
        const wizardResult = await wizardResponse.json();
        if (wizardResult.success) {
          setWizardConfiguratie(wizardResult.data);
        }
      }

    } catch (error) {
      console.error('Fout bij laden organisatiedata:', error);
      setError(error instanceof Error ? error.message : 'Kon organisatiegegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getGeschikteTarieven = () => {
    const currentKind = getCurrentKind();
    if (!currentKind || !currentKind.opvangvorm_id) return [];
    return tarieven.filter(t => t.opvangvorm_id === parseInt(currentKind.opvangvorm_id));
  };

  const mapOpvangvormNaarToeslagType = (opvangvormNaam: string): 'dagopvang' | 'bso' | 'gastouder' => {
    const naam = opvangvormNaam.toLowerCase();
    
    if (naam.includes('kdv') || naam.includes('kinderdagverblijf') || naam.includes('dagopvang')) {
      return 'dagopvang';
    } else if (naam.includes('bso') || naam.includes('buitenschoolse') || naam.includes('naschoolse')) {
      return 'bso';
    } else if (naam.includes('gastouder') || naam.includes('peuteropvang')) {
      return 'gastouder';
    } else {
      return 'dagopvang';
    }
  };

  const isStepValid = (step: number): boolean => {
    const activeSteps = getActiveSteps();
    const stepConfig = activeSteps[step - 1];
    if (!stepConfig) return false;
    
    const currentKind = getCurrentKind();
    const allKinderenComplete = kinderen.every(k => 
      k.opvangvorm_id !== '' && k.tariefId !== '' && k.uren_per_week > 0 && k.dagen_per_week > 0
    );
    
    switch (stepConfig.title) {
      case 'Welkom': return true;
      case 'Kinderen': return kinderen.length > 0;
      case 'Opvangvorm': return currentKind && currentKind.opvangvorm_id !== '';
      case 'Tarief': return currentKind && currentKind.tariefId !== '';
      case 'Planning': return currentKind && currentKind.uren_per_week > 0 && currentKind.dagen_per_week > 0;
      case 'Resultaat': return allKinderenComplete && resultaat !== null;
      case 'Jaarplanning': return vakantieweken.length > 0;
      case 'Vergelijken': return true;
      default: return false;
    }
  };

  const canGoToNextStep = (): boolean => {
    return isStepValid(currentStep);
  };

  const nextStep = () => {
    const totalSteps = getTotalSteps();
    if (currentStep < totalSteps && canGoToNextStep()) {
      const activeSteps = getActiveSteps();
      const currentStepConfig = activeSteps[currentStep - 1];
      const nextStepConfig = activeSteps[currentStep];
      
      // Auto-berekenen bij resultaat stap
      if (currentStepConfig?.title === 'Planning' && nextStepConfig?.title === 'Resultaat') {
        berekenKosten();
      } else if (currentStepConfig?.title === 'Jaarplanning' && nextStepConfig?.title === 'Vergelijken' && resultaat) {
        berekenJaarplanning();
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const berekenKosten = async () => {
    // Controleer of alle kinderen complete gegevens hebben
    const incompleteKinderen = kinderen.filter(k => 
      !k.opvangvorm_id || !k.tariefId || k.uren_per_week <= 0 || k.dagen_per_week <= 0
    );

    if (incompleteKinderen.length > 0) {
      setError('Vul voor alle kinderen de opvangvorm, tarief, uren en dagen in');
      return;
    }

    setBerekening(true);
    setError(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      
      let totaleBrutokosten = 0;
      let berekeningSamenvatting: string[] = [];
      const toeslagKinderen: any[] = [];

      // Bereken voor elk kind apart
      for (let i = 0; i < kinderen.length; i++) {
        const kind = kinderen[i];
        const geselecteerdTarief = tarieven.find(t => t.id === parseInt(kind.tariefId));
        const geselecteerdeOpvangvorm = opvangvormen.find(o => o.id === parseInt(kind.opvangvorm_id));
        
        if (!geselecteerdTarief || !geselecteerdeOpvangvorm) {
          throw new Error(`Tarief of opvangvorm niet gevonden voor ${kind.naam}`);
        }

        let brutokosten = 0;
        let uurtarief = 0;

        // Bereken brutokosten en bepaal uurtarief
        if (geselecteerdTarief.type === 'uur') {
          uurtarief = geselecteerdTarief.tarief;
          brutokosten = geselecteerdTarief.tarief * kind.uren_per_week * 4.33;
          berekeningSamenvatting.push(`${kind.naam}: ${kind.uren_per_week} uren/week × €${geselecteerdTarief.tarief}/uur × 4.33 weken/maand = €${brutokosten.toFixed(2)}`);
        } else if (geselecteerdTarief.type === 'dag') {
          uurtarief = geselecteerdTarief.tarief / 8;
          brutokosten = geselecteerdTarief.tarief * kind.dagen_per_week * 4.33;
          berekeningSamenvatting.push(`${kind.naam}: ${kind.dagen_per_week} dagen/week × €${geselecteerdTarief.tarief}/dag × 4.33 weken/maand = €${brutokosten.toFixed(2)}`);
        } else {
          uurtarief = geselecteerdTarief.tarief;
          brutokosten = geselecteerdTarief.tarief;
          berekeningSamenvatting.push(`${kind.naam}: Vast maandbedrag €${geselecteerdTarief.tarief}`);
        }

        totaleBrutokosten += brutokosten;

        // Voeg toe aan toeslag berekening
        const opvangvormNaam = geselecteerdeOpvangvorm?.naam || '';
        const toeslagType = mapOpvangvormNaarToeslagType(opvangvormNaam);
        
        toeslagKinderen.push({
          opvangvorm: toeslagType,
          uren_per_maand: kind.uren_per_week * 4.33,
          uurtarief: uurtarief
        });
      }

      // Automatische toeslag berekening voor alle kinderen
      let toeslagResultaat: ToeslagResultaat | undefined;

      if (organisatie?.toeslag_automatisch_berekenen !== false && organisatie?.actief_toeslagjaar && toeslagKinderen.length > 0) {
        try {
          let standaardKlasse: Inkomensklasse | undefined;
          
          if (organisatie.standaard_inkomensklasse) {
            try {
              standaardKlasse = JSON.parse(organisatie.standaard_inkomensklasse);
            } catch {
              standaardKlasse = inkomensklassen[0];
            }
          } else {
            standaardKlasse = inkomensklassen[0];
          }
          
          if (standaardKlasse) {
            const toeslagInput = {
              organisatieId: organisatie.id,
              actief_toeslagjaar: organisatie.actief_toeslagjaar,
              gemeente_toeslag_percentage: organisatie.gemeente_toeslag_percentage || 0,
              gemeente_toeslag_actief: organisatie.gemeente_toeslag_actief || false,
              gezinsinkomen: (standaardKlasse.min + (standaardKlasse.max || standaardKlasse.min)) / 2,
              kinderen: toeslagKinderen
            };

            const toeslagResponse = await fetch(`${apiUrl}/api/toeslag/bereken`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(toeslagInput)
            });

            if (toeslagResponse.ok) {
              const toeslagData = await toeslagResponse.json();
              if (toeslagData.success) {
                toeslagResultaat = toeslagData.data;
              }
            }
          }
        } catch (toeslagError) {
          console.error('Fout bij toeslagberekening:', toeslagError);
        }
      }

      setResultaat({
        brutokosten: Math.round(totaleBrutokosten * 100) / 100,
        berekening_details: berekeningSamenvatting.join('\n'),
        toeslag: toeslagResultaat
      });

    } catch (error) {
      console.error('Fout bij berekening:', error);
      setError('Kon kosten niet berekenen');
    } finally {
      setBerekening(false);
    }
  };

  if (loading) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
      >
        <Text>Laden...</Text>
      </Box>
    );
  }

  if (!organisatie) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg="gray.50"
      >
        <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold" color="red.800">Organisatie niet gevonden</Text>
          <Text color="red.700">De opgegeven organisatie-code is ongeldig.</Text>
        </Box>
      </Box>
    );
  }

  const renderStepContent = () => {
    const currentKind = getCurrentKind();
    
    switch (currentStep) {
      case 1:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <HomeIcon style={{ fontSize: 80, color: '#FF6766', marginBottom: '1rem' }} />
              <Text fontSize="3xl" fontWeight="bold" mb={4} color="#FF6766">
                Welkom bij de Kostencalculator
              </Text>
              <Text fontSize="xl" color="gray.600" mb={2}>
                {organisatie.naam}
              </Text>
              <Text color="gray.500">
                Bereken in een paar eenvoudige stappen uw maandelijkse kinderopvangkosten
                {organisatie.actief_toeslagjaar ? ' inclusief kinderopvangtoeslag' : ''}
              </Text>
            </Box>
            
            {organisatie.toeslag_automatisch_berekenen !== false && organisatie.actief_toeslagjaar && (
              <Box bg="#FFF2F2" p={4} borderRadius="lg" border="1px solid" borderColor="#FFB3B2">
                <HStack gap={3}>
                  <CheckCircleIcon style={{ color: '#FF6766' }} />
                  <VStack align="start" gap={1}>
                    <Text fontWeight="bold" color="#CC5251">
                      Kinderopvangtoeslag inbegrepen
                    </Text>
                    <Text fontSize="sm" color="#B84544">
                      Uw berekening bevat automatisch een schatting van de kinderopvangtoeslag voor {organisatie.actief_toeslagjaar}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}
          </VStack>
        );

      case 2:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <FamilyRestroomIcon style={{ fontSize: 60, color: '#FF8A89', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#FF8A89">
                Hoeveel kinderen?
              </Text>
              <Text color="gray.600">
                Voeg kinderen toe waarvoor u kinderopvang zoekt
              </Text>
            </Box>
            
            <VStack gap={4} align="stretch">
              {kinderen.map((kind, index) => (
                <Box key={kind.id} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
                  <HStack justifyContent="space-between" mb={3}>
                    <Input
                      value={kind.naam}
                      onChange={(e) => updateKind(index, { naam: e.target.value })}
                      placeholder={`Kind ${index + 1}`}
                      size="sm"
                      maxWidth="200px"
                    />
                    {kinderen.length > 1 && (
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => removeKind(index)}
                      >
                        <RemoveIcon style={{ fontSize: 16 }} />
                      </Button>
                    )}
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600">
                    {kind.opvangvorm_id ? '✓' : '○'} Opvangvorm {kind.opvangvorm_id ? 'gekozen' : 'nog kiezen'}
                    {' • '}
                    {kind.tariefId ? '✓' : '○'} Tarief {kind.tariefId ? 'gekozen' : 'nog kiezen'}
                    {' • '}
                    {kind.uren_per_week > 0 ? '✓' : '○'} Planning {kind.uren_per_week > 0 ? 'ingevuld' : 'nog invullen'}
                  </Text>
                </Box>
              ))}
              
                             <Button
                 onClick={addKind}
                 variant="outline"
                 size="lg"
                 borderColor="#FF8A89"
                 color="#FF8A89"
                 _hover={{ bg: '#FFF5F5' }}
               >
                 <AddIcon style={{ marginRight: '8px' }} />
                 Kind toevoegen
               </Button>
            </VStack>
          </VStack>
        );

      case 3:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <ChildCareIcon style={{ fontSize: 60, color: '#FF9933', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#FF9933">
                Kies opvangvorm voor {currentKind.naam}
              </Text>
              <Text color="gray.600">
                Selecteer het type kinderopvang dat u zoekt
              </Text>
            </Box>
            
            {kinderen.length > 1 && (
              <HStack justifyContent="center" gap={2} wrap="wrap">
                {kinderen.map((kind, index) => (
                  <Button
                    key={kind.id}
                    size="sm"
                    variant={currentChildIndex === index ? "solid" : "outline"}
                    colorScheme={currentChildIndex === index ? "orange" : "gray"}
                    onClick={() => setCurrentChildIndex(index)}
                  >
                    {kind.naam}
                  </Button>
                ))}
              </HStack>
            )}
            
            <VStack gap={3} align="stretch">
              {opvangvormen.map((opvangvorm) => (
                <Box
                  key={opvangvorm.id}
                  p={4}
                  border="2px solid"
                  borderColor={currentKind.opvangvorm_id === opvangvorm.id.toString() ? '#FF9933' : 'gray.200'}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={currentKind.opvangvorm_id === opvangvorm.id.toString() ? '#FFF8F0' : 'white'}
                  onClick={() => {
                    updateKind(currentChildIndex, { 
                      opvangvorm_id: opvangvorm.id.toString(),
                      tariefId: '' // Reset tarief bij wijziging opvangvorm
                    });
                  }}
                  _hover={{ borderColor: '#FFCC99', bg: '#FFFBF7' }}
                  transition="all 0.2s"
                >
                  <HStack gap={3}>
                    {currentKind.opvangvorm_id === opvangvorm.id.toString() && (
                      <CheckCircleIcon style={{ color: '#FF9933' }} />
                    )}
                    <VStack align="start" gap={1} flex={1}>
                      <Text fontWeight="bold" color={currentKind.opvangvorm_id === opvangvorm.id.toString() ? '#CC6600' : 'gray.800'}>
                        {opvangvorm.naam}
                      </Text>
                      {opvangvorm.omschrijving && (
                        <Text fontSize="sm" color="gray.600">
                          {opvangvorm.omschrijving}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </VStack>
        );

      case 4:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <AttachMoneyIcon style={{ fontSize: 60, color: '#D65DB1', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#D65DB1">
                Selecteer tarief voor {currentKind.naam}
              </Text>
              <Text color="gray.600">
                Kies het tarief dat bij uw situatie past
              </Text>
            </Box>
            
            {kinderen.length > 1 && (
              <HStack justifyContent="center" gap={2} wrap="wrap">
                {kinderen.map((kind, index) => (
                  <Button
                    key={kind.id}
                    size="sm"
                    variant={currentChildIndex === index ? "solid" : "outline"}
                    colorScheme={currentChildIndex === index ? "purple" : "gray"}
                    onClick={() => setCurrentChildIndex(index)}
                  >
                    {kind.naam}
                  </Button>
                ))}
              </HStack>
            )}
            
            <VStack gap={3} align="stretch">
              {getGeschikteTarieven().map((tarief) => (
                <Box
                  key={tarief.id}
                  p={4}
                  border="2px solid"
                  borderColor={currentKind.tariefId === tarief.id.toString() ? '#D65DB1' : 'gray.200'}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={currentKind.tariefId === tarief.id.toString() ? '#FAF5FF' : 'white'}
                  onClick={() => {
                    updateKind(currentChildIndex, { tariefId: tarief.id.toString() });
                  }}
                  _hover={{ borderColor: '#E879F9', bg: '#FEFCFF' }}
                  transition="all 0.2s"
                >
                  <HStack gap={3} justifyContent="space-between">
                    <HStack gap={3} flex={1}>
                      {currentKind.tariefId === tarief.id.toString() && (
                        <CheckCircleIcon style={{ color: '#D65DB1' }} />
                      )}
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="bold" color={currentKind.tariefId === tarief.id.toString() ? '#A855F7' : 'gray.800'}>
                          {tarief.naam}
                        </Text>
                        <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                          Per {tarief.type === 'uur' ? 'uur' : tarief.type === 'dag' ? 'dag' : 'maand'}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="xl" fontWeight="bold" color="#D65DB1">
                      €{tarief.tarief.toFixed(2)}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </VStack>
        );

      case 5:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <ScheduleIcon style={{ fontSize: 60, color: '#B8312F', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#B8312F">
                Planning voor {currentKind.naam}
              </Text>
              <Text color="gray.600">
                Hoeveel uren en dagen per week heeft u opvang nodig?
              </Text>
            </Box>
            
            {kinderen.length > 1 && (
              <HStack justifyContent="center" gap={2} wrap="wrap">
                {kinderen.map((kind, index) => (
                  <Button
                    key={kind.id}
                    size="sm"
                    variant={currentChildIndex === index ? "solid" : "outline"}
                    colorScheme={currentChildIndex === index ? "red" : "gray"}
                    onClick={() => setCurrentChildIndex(index)}
                  >
                    {kind.naam}
                  </Button>
                ))}
              </HStack>
            )}
            
            <VStack gap={6} align="stretch">
              <Box>
                <Text mb={3} fontWeight="medium" fontSize="lg">Uren per week</Text>
                <Input
                  type="number"
                  value={currentKind.uren_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateKind(currentChildIndex, { uren_per_week: parseInt(e.target.value) || 0 });
                  }}
                  min={1}
                  max={50}
                  placeholder="32"
                  size="lg"
                  fontSize="xl"
                  textAlign="center"
                />
                <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                  Gemiddeld aantal uren per week
                </Text>
              </Box>

              <Box>
                <Text mb={3} fontWeight="medium" fontSize="lg">Dagen per week</Text>
                <Input
                  type="number"
                  value={currentKind.dagen_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateKind(currentChildIndex, { dagen_per_week: parseInt(e.target.value) || 0 });
                  }}
                  min={1}
                  max={5}
                  placeholder="4"
                  size="lg"
                  fontSize="xl"
                  textAlign="center"
                />
                <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                  Aantal dagen per week
                </Text>
              </Box>
            </VStack>
          </VStack>
        );

      case 6:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <AssessmentIcon style={{ fontSize: 60, color: '#B8312F', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#B8312F">
                Uw kostenberekening
              </Text>
              <Text color="gray.600">
                Dit zijn uw geschatte maandelijkse kosten voor {kinderen.length === 1 ? '1 kind' : `${kinderen.length} kinderen`}
              </Text>
            </Box>
            
            {berekening && (
              <Box textAlign="center" py={8}>
                <Text>Berekenen...</Text>
              </Box>
            )}

            {resultaat && !berekening && (
              <VStack gap={4} align="stretch">
                {/* Totale kosten */}
                <Box bg="gray.50" p={6} borderRadius="lg" textAlign="center">
                  <Text fontSize="lg" color="gray.600" mb={2}>Totale maandelijkse kosten</Text>
                  <Text fontSize="4xl" fontWeight="bold" color="#B8312F">
                    €{resultaat.brutokosten.toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    Voor {kinderen.length} {kinderen.length === 1 ? 'kind' : 'kinderen'}
                  </Text>
                </Box>

                {/* Per kind opsplitsing */}
                {kinderen.length > 1 && (
                  <Box>
                    <Text fontWeight="bold" mb={3}>Opsplitsing per kind:</Text>
                    <VStack gap={2} align="stretch">
                      {resultaat.berekening_details.split('\n').map((detail, index) => (
                        <Text key={index} fontSize="sm" color="gray.600" p={2} bg="gray.50" borderRadius="md">
                          {detail}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Toeslag informatie */}
                {resultaat.toeslag && (
                  <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold" color="green.800" mb={2}>
                      🎉 Geschatte kinderopvangtoeslag
                    </Text>
                    <SimpleGrid columns={[1, 2]} gap={4}>
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="green.700">Landelijke toeslag:</Text>
                        <Text fontWeight="bold" color="green.800">€{resultaat.toeslag.totaal_toeslag_landelijk.toFixed(2)}</Text>
                      </VStack>
                      {resultaat.toeslag.totaal_toeslag_gemeente > 0 && (
                        <VStack align="start" gap={1}>
                          <Text fontSize="sm" color="green.700">Gemeente toeslag:</Text>
                          <Text fontWeight="bold" color="green.800">€{resultaat.toeslag.totaal_toeslag_gemeente.toFixed(2)}</Text>
                        </VStack>
                      )}
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="green.700">Totale toeslag:</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.800">€{resultaat.toeslag.totaal_toeslag.toFixed(2)}</Text>
                      </VStack>
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" color="green.700">Eigen bijdrage:</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.800">€{Math.max(0, resultaat.toeslag.totaal_nettokosten).toFixed(2)}</Text>
                      </VStack>
                    </SimpleGrid>

                    {/* Besparing berekening */}
                    {resultaat.toeslag.totaal_toeslag > 0 && (
                      <Box bg="green.100" p={3} borderRadius="md" mt={4}>
                        <Text textAlign="center" fontWeight="bold" color="green.800">
                          💰 U bespaart €{resultaat.toeslag.totaal_toeslag.toFixed(2)} per maand
                        </Text>
                        <Text textAlign="center" fontSize="sm" color="green.700">
                          (€{(resultaat.toeslag.totaal_toeslag * 12).toFixed(2)} per jaar)
                        </Text>
                      </Box>
                    )}

                    {/* Eerste vs volgende kinderen */}
                    {kinderen.length > 1 && resultaat.toeslag.kinderen && (
                      <Box mt={4}>
                        <Text fontWeight="bold" color="green.800" mb={2}>Per kind:</Text>
                        <VStack gap={2} align="stretch">
                          {resultaat.toeslag.kinderen.map((kindToeslag, index) => (
                            <Box key={index} p={2} bg="green.100" borderRadius="md">
                              <HStack justifyContent="space-between">
                                <Text fontSize="sm" color="green.700">
                                  {kinderen[index]?.naam || `Kind ${index + 1}`} {kindToeslag.is_eerste_kind ? '(eerste kind)' : '(volgend kind)'}
                                </Text>
                                <Text fontWeight="bold" color="green.800">
                                  €{kindToeslag.toeslag_totaal.toFixed(2)}
                                </Text>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    <Text fontSize="xs" color="green.600" mt={3} fontStyle="italic">
                      * Dit is een indicatieve berekening op basis van de standaard inkomensklasse die is ingesteld door uw kinderopvangorganisatie.
                      Uw werkelijke toeslag kan afwijken afhankelijk van uw daadwerkelijke gezinsinkomen.
                    </Text>
                  </Box>
                )}

                                 {/* Scenario opslaan */}
                 <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200">
                   <Text fontWeight="bold" color="blue.800" mb={3}>
                     💡 Scenario opslaan
                   </Text>
                   <Text fontSize="sm" color="blue.700" mb={3}>
                     Sla dit scenario op om verschillende opties te vergelijken
                   </Text>
                   <HStack gap={3}>
                     <Input
                       placeholder="Naam voor dit scenario..."
                       value={scenarioNaam}
                       onChange={(e) => setScenarioNaam(e.target.value)}
                       size="sm"
                       flex={1}
                     />
                     <Button
                       onClick={saveCurrentScenario}
                       size="sm"
                       bg="blue.600"
                       color="white"
                       _hover={{ bg: 'blue.700' }}
                     >
                       <SaveIcon style={{ marginRight: '8px', fontSize: '16px' }} />
                       Opslaan
                     </Button>
                   </HStack>
                   {scenarios.length > 0 && (
                     <Text fontSize="xs" color="blue.600" mt={2}>
                       {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''} opgeslagen
                     </Text>
                   )}
                 </Box>

                 {/* Disclaimer */}
                 <Box bg="gray.50" p={4} borderRadius="lg">
                   <Text fontSize="sm" color="gray.600" textAlign="center">
                     <strong>Disclaimer:</strong> Dit is een indicatieve berekening. De werkelijke kosten kunnen afwijken door bijvoorbeeld vakanties, 
                     feestdagen of veranderingen in uw opvangbehoefte. Voor exacte tarieven kunt u contact opnemen met {organisatie.naam}.
                   </Text>
                 </Box>
              </VStack>
            )}

            {error && (
              <Box bg="red.50" p={4} borderRadius="lg" border="1px solid" borderColor="red.200">
                <Text color="red.800" textAlign="center">{error}</Text>
              </Box>
            )}
          </VStack>
        );

      case 7:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <EventIcon style={{ fontSize: 60, color: '#8B5CF6', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#8B5CF6">
                Jaarplanning
              </Text>
              <Text color="gray.600">
                Selecteer uw vakantieweken om uw werkelijke jaarkosten te berekenen
              </Text>
            </Box>

            <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200">
              <HStack gap={3} mb={3}>
                <CalendarTodayIcon style={{ color: '#3B82F6' }} />
                <VStack align="start" gap={1}>
                  <Text fontWeight="bold" color="blue.800">
                    Waarom jaarplanning?
                  </Text>
                  <Text fontSize="sm" color="blue.700">
                    In vakantieweken betaalt u vaak geen kinderopvang. Deze berekening toont uw werkelijke jaarkosten.
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <VStack gap={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">
                Selecteer uw vakantieweken:
              </Text>
              
              <SimpleGrid columns={[1, 2]} gap={3}>
                {vakantieweken.map((vakantie) => (
                  <Box
                    key={vakantie.weekNummer}
                    p={3}
                    border="2px solid"
                    borderColor={vakantie.geselecteerd ? '#8B5CF6' : 'gray.200'}
                    borderRadius="lg"
                    cursor="pointer"
                    bg={vakantie.geselecteerd ? '#F3F4F6' : 'white'}
                    onClick={() => toggleVakantieweek(vakantie.weekNummer)}
                    _hover={{ borderColor: vakantie.geselecteerd ? '#7C3AED' : '#D1D5DB', bg: '#FAFAFA' }}
                    transition="all 0.2s"
                  >
                    <HStack gap={3}>
                      <Box
                        w={6}
                        h={6}
                        borderRadius="md"
                        bg={vakantie.geselecteerd ? '#8B5CF6' : 'gray.300'}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontSize="sm"
                        fontWeight="bold"
                      >
                        {vakantie.geselecteerd ? '✓' : vakantie.weekNummer}
                      </Box>
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontWeight="bold" color={vakantie.geselecteerd ? '#7C3AED' : 'gray.800'}>
                          {vakantie.naam}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Week {vakantie.weekNummer} - {vakantie.datum}
                        </Text>
                      </VStack>
                      {vakantie.geselecteerd && (
                        <BeachAccessIcon style={{ color: '#8B5CF6', fontSize: '20px' }} />
                      )}
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>

              {/* Snelle acties */}
              <HStack justifyContent="center" gap={4} pt={4}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="#8B5CF6"
                  color="#8B5CF6"
                  onClick={() => {
                    setVakantieweken(prev => prev.map(v => ({ ...v, geselecteerd: true })));
                    setJaarplanningResultaat(null);
                  }}
                  _hover={{ bg: '#F3F4F6' }}
                >
                  Alles selecteren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="gray.400"
                  color="gray.600"
                  onClick={() => {
                    setVakantieweken(prev => prev.map(v => ({ ...v, geselecteerd: false })));
                    setJaarplanningResultaat(null);
                  }}
                  _hover={{ bg: '#F9FAFB' }}
                >
                  Alles deselecteren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="blue.400"
                  color="blue.600"
                  onClick={() => {
                    initializeVakantieweken(); // Reset naar standaard
                    setJaarplanningResultaat(null);
                  }}
                  _hover={{ bg: '#EFF6FF' }}
                >
                  Standaard herstel
                </Button>
              </HStack>

              {/* Vakantie overzicht */}
              <Box bg="gray.50" p={4} borderRadius="lg">
                <Text fontWeight="bold" mb={2}>Overzicht:</Text>
                <SimpleGrid columns={[2, 4]} gap={4}>
                  <VStack gap={1}>
                    <Text fontSize="sm" color="gray.600">Vakantieweken</Text>
                    <Text fontSize="lg" fontWeight="bold" color="red.600">
                      {vakantieweken.filter(v => v.geselecteerd).length}
                    </Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text fontSize="sm" color="gray.600">Opvangweken</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                      {52 - vakantieweken.filter(v => v.geselecteerd).length}
                    </Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text fontSize="sm" color="gray.600">Theoretisch per jaar</Text>
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">
                      €{resultaat ? (resultaat.brutokosten * 12).toFixed(0) : '0'}
                    </Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text fontSize="sm" color="gray.600">Geschatte besparing</Text>
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                      €{resultaat ? ((resultaat.brutokosten / 4.33) * vakantieweken.filter(v => v.geselecteerd).length * 4.33).toFixed(0) : '0'}
                    </Text>
                  </VStack>
                </SimpleGrid>
              </Box>

              {/* Jaarplanning resultaat */}
              {jaarplanningResultaat && (
                <VStack gap={4} align="stretch">
                  <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold" color="green.800" mb={3}>
                      🗓️ Jaarkosten Overzicht
                    </Text>
                    <SimpleGrid columns={[1, 3]} gap={4}>
                      <VStack gap={1}>
                        <Text fontSize="sm" color="green.700">Werkelijke jaarkosten</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.800">
                          €{jaarplanningResultaat.werkelijke_jaarkosten.toFixed(0)}
                        </Text>
                      </VStack>
                      <VStack gap={1}>
                        <Text fontSize="sm" color="green.700">Besparing door vakanties</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.800">
                          €{jaarplanningResultaat.besparing_door_vakanties.toFixed(0)}
                        </Text>
                      </VStack>
                      <VStack gap={1}>
                        <Text fontSize="sm" color="green.700">Opvang weken per jaar</Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.800">
                          {jaarplanningResultaat.totaal_opvang_weken}
                        </Text>
                      </VStack>
                    </SimpleGrid>
                  </Box>

                  {/* Maandelijkse breakdown */}
                  <Box>
                    <Text fontWeight="bold" mb={3}>Maandelijkse kosten:</Text>
                    <SimpleGrid columns={[2, 3, 4]} gap={2}>
                      {jaarplanningResultaat.maandelijkse_breakdown.map((maand) => (
                        <Box 
                          key={maand.maand} 
                          p={3} 
                          bg={maand.vakantieweken.length > 0 ? 'orange.50' : 'white'} 
                          borderRadius="md" 
                          border="1px solid" 
                          borderColor={maand.vakantieweken.length > 0 ? 'orange.200' : 'gray.200'}
                        >
                          <Text fontWeight="bold" fontSize="sm">
                            {maand.maand}
                          </Text>
                          <Text fontSize="lg" fontWeight="bold" color={maand.vakantieweken.length > 0 ? 'orange.600' : 'gray.800'}>
                            €{maand.kosten.toFixed(0)}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {maand.weken} weken
                          </Text>
                          {maand.vakantieweken.length > 0 && (
                            <Text fontSize="xs" color="orange.600">
                              🏖️ {maand.vakantieweken.length} vakantie{maand.vakantieweken.length > 1 ? 's' : ''}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                </VStack>
              )}
            </VStack>
          </VStack>
        );

      case 8:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <CompareArrowsIcon style={{ fontSize: 60, color: '#8B5CF6', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="#8B5CF6">
                Scenario Vergelijking
              </Text>
              <Text color="gray.600">
                Vergelijk uw opgeslagen scenario's om de beste keuze te maken
              </Text>
            </Box>

            {scenarios.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text fontSize="lg" color="gray.500" mb={4}>
                  🤔 Nog geen scenario's opgeslagen
                </Text>
                <Text color="gray.600" mb={4}>
                  Ga terug naar de resultaten (stap 6) om uw huidige berekening op te slaan
                </Text>
                <Button
                  onClick={() => setCurrentStep(6)}
                  variant="outline"
                  borderColor="#8B5CF6"
                  color="#8B5CF6"
                  _hover={{ bg: '#F3F4F6' }}
                >
                  Terug naar resultaten
                </Button>
              </Box>
            ) : (
              <VStack gap={4} align="stretch">
                {/* Beste scenario indicator */}
                {scenarios.length > 1 && (
                  <Box bg="yellow.50" p={4} borderRadius="lg" border="1px solid" borderColor="yellow.200">
                    <HStack gap={3}>
                      <StarIcon style={{ color: '#F59E0B' }} />
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold" color="yellow.800">
                          Aanbevolen: {getBestScenario()?.naam}
                        </Text>
                        <Text fontSize="sm" color="yellow.700">
                          Dit scenario heeft de laagste maandelijkse kosten
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}

                {/* Scenario vergelijkingstabel */}
                <Box overflowX="auto">
                  <Box minWidth="600px">
                    {/* Headers */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2} mb={2}>
                      <Box p={3} fontWeight="bold" color="gray.700">
                        Vergelijking
                      </Box>
                      {scenarios.map((scenario) => {
                        const isBest = getBestScenario()?.id === scenario.id;
                        return (
                          <Box 
                            key={scenario.id} 
                            p={3} 
                            bg={isBest ? 'yellow.50' : 'gray.50'} 
                            borderRadius="md"
                            border="1px solid"
                            borderColor={isBest ? 'yellow.200' : 'gray.200'}
                            position="relative"
                          >
                            {isBest && (
                              <StarIcon 
                                style={{ 
                                  position: 'absolute', 
                                  top: '4px', 
                                  right: '4px', 
                                  fontSize: '16px', 
                                  color: '#F59E0B' 
                                }} 
                              />
                            )}
                            <Text fontWeight="bold" color={isBest ? 'yellow.800' : 'gray.800'}>
                              {scenario.naam}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {scenario.aangemaakt_op.toLocaleDateString()}
                            </Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>

                    {/* Brutokosten */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2} mb={2}>
                      <Box p={3} fontWeight="medium" color="gray.700">
                        Brutokosten
                      </Box>
                      {scenarios.map((scenario) => (
                        <Box key={scenario.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <Text fontWeight="bold" color="red.600">
                            €{scenario.resultaat.brutokosten.toFixed(2)}
                          </Text>
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Toeslag */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2} mb={2}>
                      <Box p={3} fontWeight="medium" color="gray.700">
                        Toeslag
                      </Box>
                      {scenarios.map((scenario) => (
                        <Box key={scenario.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          {scenario.resultaat.toeslag ? (
                            <Text fontWeight="bold" color="green.600">
                              €{scenario.resultaat.toeslag.totaal_toeslag.toFixed(2)}
                            </Text>
                          ) : (
                            <Text color="gray.500" fontSize="sm">
                              Geen toeslag
                            </Text>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Nettokosten */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2} mb={4}>
                      <Box p={3} fontWeight="medium" color="gray.700">
                        Eigen kosten
                      </Box>
                      {scenarios.map((scenario) => {
                        const nettokosten = scenario.resultaat.toeslag 
                          ? Math.max(0, scenario.resultaat.toeslag.totaal_nettokosten)
                          : scenario.resultaat.brutokosten;
                        const isBest = getBestScenario()?.id === scenario.id;
                        
                        return (
                          <Box 
                            key={scenario.id} 
                            p={3} 
                            bg={isBest ? 'green.50' : 'white'} 
                            borderRadius="md" 
                            border="2px solid" 
                            borderColor={isBest ? 'green.300' : 'gray.200'}
                          >
                            <Text fontWeight="bold" fontSize="lg" color={isBest ? 'green.700' : 'gray.800'}>
                              €{nettokosten.toFixed(2)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              per maand
                            </Text>
                          </Box>
                        );
                      })}
                    </SimpleGrid>

                    {/* Kinderen details */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2} mb={4}>
                      <Box p={3} fontWeight="medium" color="gray.700">
                        Kinderen
                      </Box>
                      {scenarios.map((scenario) => (
                        <Box key={scenario.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <Text fontSize="sm" color="gray.700">
                            {scenario.kinderen.length} {scenario.kinderen.length === 1 ? 'kind' : 'kinderen'}
                          </Text>
                          <VStack align="start" gap={1} mt={2}>
                            {scenario.kinderen.map((kind, index) => {
                              const opvangvorm = opvangvormen.find(o => o.id === parseInt(kind.opvangvorm_id));
                              return (
                                <Text key={index} fontSize="xs" color="gray.600">
                                  {kind.naam}: {opvangvorm?.naam || 'Onbekend'} - {kind.uren_per_week}u/week
                                </Text>
                              );
                            })}
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Acties */}
                    <SimpleGrid columns={scenarios.length + 1} gap={2}>
                      <Box p={3} fontWeight="medium" color="gray.700">
                        Acties
                      </Box>
                      {scenarios.map((scenario) => (
                        <Box key={scenario.id} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="gray.200">
                          <VStack gap={2}>
                            <Button
                              size="xs"
                              variant="outline"
                              borderColor="blue.300"
                              color="blue.600"
                              _hover={{ bg: 'blue.50' }}
                              onClick={() => loadScenario(scenario)}
                              width="full"
                            >
                              <EditIcon style={{ marginRight: '4px', fontSize: '12px' }} />
                              Bewerken
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              borderColor="red.300"
                              color="red.600"
                              _hover={{ bg: 'red.50' }}
                              onClick={() => deleteScenario(scenario.id)}
                              width="full"
                            >
                              <DeleteIcon style={{ marginRight: '4px', fontSize: '12px' }} />
                              Verwijderen
                            </Button>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                </Box>

                {/* Voordelen overzicht */}
                {scenarios.length > 1 && (
                  <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200">
                    <Text fontWeight="bold" color="green.800" mb={2}>
                      💰 Kostenverschillen
                    </Text>
                    {(() => {
                      const best = getBestScenario();
                      const worst = scenarios.reduce((worst, current) => {
                        const currentCost = current.resultaat.toeslag 
                          ? current.resultaat.toeslag.totaal_nettokosten 
                          : current.resultaat.brutokosten;
                        const worstCost = worst.resultaat.toeslag 
                          ? worst.resultaat.toeslag.totaal_nettokosten 
                          : worst.resultaat.brutokosten;
                        
                        return currentCost > worstCost ? current : worst;
                      });
                      
                      const bestCost = best?.resultaat.toeslag 
                        ? Math.max(0, best.resultaat.toeslag.totaal_nettokosten)
                        : best?.resultaat.brutokosten || 0;
                      const worstCost = worst.resultaat.toeslag 
                        ? Math.max(0, worst.resultaat.toeslag.totaal_nettokosten)
                        : worst.resultaat.brutokosten;
                      
                      const verschil = worstCost - bestCost;
                      
                      return (
                        <Text fontSize="sm" color="green.700">
                          Door de beste optie ({best?.naam}) te kiezen bespaart u <strong>€{verschil.toFixed(2)} per maand</strong> 
                          {' '}(€{(verschil * 12).toFixed(2)} per jaar) ten opzichte van de duurste optie ({worst.naam}).
                        </Text>
                      );
                    })()}
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        );

      default:
        return <Text>Onbekende stap</Text>;
    }
  };

  return (
    <Box minHeight="100vh" bg="gray.50">
      {/* Progress bar */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" px={4} py={3}>
        <Box maxWidth="800px" mx="auto">
          <HStack gap={2} mb={2}>
            {getActiveSteps().map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const stepColor = isActive ? '#FF6766' : isCompleted ? '#4CAF50' : '#CBD5E0';
              
              return (
                <React.Fragment key={step.id}>
                  <Box 
                    bg={stepColor}
                    color="white" 
                    w={8} 
                    h={8} 
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {isCompleted ? <CheckCircleIcon style={{ fontSize: 16 }} /> : step.id}
                  </Box>
                  {index < getActiveSteps().length - 1 && (
                    <Box flex={1} h="2px" bg={isCompleted ? '#4CAF50' : '#E2E8F0'} />
                  )}
                </React.Fragment>
              );
            })}
          </HStack>
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Stap {currentStep} van {getTotalSteps()}: {getCurrentStepConfig()?.title}
          </Text>
        </Box>
      </Box>

      {/* Main content */}
      <Box maxWidth="800px" mx="auto" p={4}>
        <Box bg="white" borderRadius="lg" p={8} shadow="sm">
          {renderStepContent()}
        </Box>

        {/* Navigation buttons */}
        <HStack justifyContent="space-between" mt={6}>
                     <Button
             onClick={prevStep}
             disabled={currentStep === 1}
             variant="outline"
             size="lg"
             borderColor="gray.300"
             _hover={{ bg: 'gray.50' }}
           >
             <ArrowBackIcon style={{ marginRight: '8px' }} />
             Vorige
           </Button>

           <Button
             onClick={nextStep}
             disabled={!canGoToNextStep() || currentStep === getTotalSteps()}
             bg="#FF6766"
             color="white"
             size="lg"
             _hover={{ bg: '#E55A59' }}
           >
             {currentStep === getTotalSteps() ? 'Voltooien' : 'Volgende'}
             {currentStep < getTotalSteps() && (
               <ArrowForwardIcon style={{ marginLeft: '8px' }} />
             )}
           </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default RekentoolWizardPage; 