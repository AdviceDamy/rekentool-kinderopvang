import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Text, Button, Input, VStack, HStack } from '@chakra-ui/react';
// Material Icons imports
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

// Wizard stappen
const WIZARD_STEPS = [
  { id: 1, title: 'Welkom', icon: HomeIcon, description: 'Organisatie informatie' },
  { id: 2, title: 'Opvangvorm', icon: ChildCareIcon, description: 'Kies type opvang' },
  { id: 3, title: 'Tarief', icon: AttachMoneyIcon, description: 'Selecteer tarief' },
  { id: 4, title: 'Planning', icon: ScheduleIcon, description: 'Uren en dagen' },
  { id: 5, title: 'Resultaat', icon: AssessmentIcon, description: 'Kosten berekening' }
];

const RekentoolWizardPage: React.FC = () => {
  const { organisatieSlug } = useParams<{ organisatieSlug: string }>();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Data state
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [berekening, setBerekening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [kind, setKind] = useState<Kind>({
    opvangvorm_id: '',
    tariefId: '',
    uren_per_week: 32,
    dagen_per_week: 4
  });
  
  // Resultaat
  const [resultaat, setResultaat] = useState<{
    brutokosten: number;
    berekening_details: string;
    toeslag?: ToeslagResultaat;
  } | null>(null);

  // Load data when component mounts
  useEffect(() => {
    loadOrganisatieData();
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

    } catch (error) {
      console.error('Fout bij laden organisatiedata:', error);
      setError(error instanceof Error ? error.message : 'Kon organisatiegegevens niet laden');
    } finally {
      setLoading(false);
    }
  };

  const getGeschikteTarieven = () => {
    if (!kind.opvangvorm_id) return [];
    return tarieven.filter(t => t.opvangvorm_id === parseInt(kind.opvangvorm_id));
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
    switch (step) {
      case 1: return true; // Welkom stap is altijd geldig
      case 2: return kind.opvangvorm_id !== '';
      case 3: return kind.tariefId !== '';
      case 4: return kind.uren_per_week > 0 && kind.dagen_per_week > 0;
      case 5: return resultaat !== null;
      default: return false;
    }
  };

  const canGoToNextStep = (): boolean => {
    return isStepValid(currentStep);
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length && canGoToNextStep()) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 4) {
        // Auto-berekenen bij stap 5
        berekenKosten();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const berekenKosten = async () => {
    if (!kind.opvangvorm_id || !kind.tariefId) {
      setError('Selecteer een opvangvorm en tarief');
      return;
    }

    setBerekening(true);
    setError(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      const geselecteerdTarief = tarieven.find(t => t.id === parseInt(kind.tariefId));
      const geselecteerdeOpvangvorm = opvangvormen.find(o => o.id === parseInt(kind.opvangvorm_id));
      
      if (!geselecteerdTarief || !geselecteerdeOpvangvorm) {
        throw new Error('Tarief of opvangvorm niet gevonden');
      }

      let brutokosten = 0;
      let berekening_details = '';
      let uurtarief = 0;

      // Bereken brutokosten en bepaal uurtarief (simplified for wizard)
      if (geselecteerdTarief.type === 'uur') {
        uurtarief = geselecteerdTarief.tarief;
        brutokosten = geselecteerdTarief.tarief * kind.uren_per_week * 4.33;
        berekening_details = `${kind.uren_per_week} uren/week × €${geselecteerdTarief.tarief}/uur × 4.33 weken/maand`;
      } else if (geselecteerdTarief.type === 'dag') {
        uurtarief = geselecteerdTarief.tarief / 8;
        brutokosten = geselecteerdTarief.tarief * kind.dagen_per_week * 4.33;
        berekening_details = `${kind.dagen_per_week} dagen/week × €${geselecteerdTarief.tarief}/dag × 4.33 weken/maand`;
      } else {
        uurtarief = geselecteerdTarief.tarief;
        brutokosten = geselecteerdTarief.tarief;
        berekening_details = `Vast maandbedrag: €${geselecteerdTarief.tarief}`;
      }

      // Automatische toeslag berekening
      let toeslagResultaat: ToeslagResultaat | undefined;

      if (organisatie?.toeslag_automatisch_berekenen !== false && organisatie?.actief_toeslagjaar) {
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
            const opvangvormNaam = geselecteerdeOpvangvorm?.naam || '';
            const toeslagType = mapOpvangvormNaarToeslagType(opvangvormNaam);
            
            const toeslagInput = {
              organisatieId: organisatie.id,
              actief_toeslagjaar: organisatie.actief_toeslagjaar,
              gemeente_toeslag_percentage: organisatie.gemeente_toeslag_percentage || 0,
              gemeente_toeslag_actief: organisatie.gemeente_toeslag_actief || false,
              gezinsinkomen: (standaardKlasse.min + (standaardKlasse.max || standaardKlasse.min)) / 2,
              kinderen: [{
                opvangvorm: toeslagType,
                uren_per_maand: kind.uren_per_week * 4.33,
                uurtarief: uurtarief
              }]
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
        brutokosten: Math.round(brutokosten * 100) / 100,
        berekening_details,
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
    switch (currentStep) {
      case 1:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <HomeIcon style={{ fontSize: 80, color: '#3182CE', marginBottom: '1rem' }} />
              <Text fontSize="3xl" fontWeight="bold" mb={4} color="blue.600">
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
              <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200">
                <HStack gap={3}>
                  <CheckCircleIcon style={{ color: '#3182CE' }} />
                  <VStack align="start" gap={1}>
                    <Text fontWeight="bold" color="blue.800">
                      Kinderopvangtoeslag inbegrepen
                    </Text>
                    <Text fontSize="sm" color="blue.700">
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
              <ChildCareIcon style={{ fontSize: 60, color: '#38A169', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="green.600">
                Kies uw opvangvorm
              </Text>
              <Text color="gray.600">
                Selecteer het type kinderopvang dat u zoekt
              </Text>
            </Box>
            
            <VStack gap={3} align="stretch">
              {opvangvormen.map((opvangvorm) => (
                <Box
                  key={opvangvorm.id}
                  p={4}
                  border="2px solid"
                  borderColor={kind.opvangvorm_id === opvangvorm.id.toString() ? 'green.500' : 'gray.200'}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={kind.opvangvorm_id === opvangvorm.id.toString() ? 'green.50' : 'white'}
                  onClick={() => {
                    setKind({ 
                      ...kind, 
                      opvangvorm_id: opvangvorm.id.toString(),
                      tariefId: '' // Reset tarief bij wijziging opvangvorm
                    });
                    setResultaat(null);
                  }}
                  _hover={{ borderColor: 'green.300', bg: 'green.25' }}
                  transition="all 0.2s"
                >
                  <HStack gap={3}>
                    {kind.opvangvorm_id === opvangvorm.id.toString() && (
                      <CheckCircleIcon style={{ color: '#38A169' }} />
                    )}
                    <VStack align="start" gap={1} flex={1}>
                      <Text fontWeight="bold" color={kind.opvangvorm_id === opvangvorm.id.toString() ? 'green.800' : 'gray.800'}>
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

      case 3:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <AttachMoneyIcon style={{ fontSize: 60, color: '#D69E2E', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="yellow.600">
                Selecteer uw tarief
              </Text>
              <Text color="gray.600">
                Kies het tarief dat bij uw situatie past
              </Text>
            </Box>
            
            <VStack gap={3} align="stretch">
              {getGeschikteTarieven().map((tarief) => (
                <Box
                  key={tarief.id}
                  p={4}
                  border="2px solid"
                  borderColor={kind.tariefId === tarief.id.toString() ? 'yellow.500' : 'gray.200'}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={kind.tariefId === tarief.id.toString() ? 'yellow.50' : 'white'}
                  onClick={() => {
                    setKind({ ...kind, tariefId: tarief.id.toString() });
                    setResultaat(null);
                  }}
                  _hover={{ borderColor: 'yellow.300', bg: 'yellow.25' }}
                  transition="all 0.2s"
                >
                  <HStack gap={3} justifyContent="space-between">
                    <HStack gap={3} flex={1}>
                      {kind.tariefId === tarief.id.toString() && (
                        <CheckCircleIcon style={{ color: '#D69E2E' }} />
                      )}
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="bold" color={kind.tariefId === tarief.id.toString() ? 'yellow.800' : 'gray.800'}>
                          {tarief.naam}
                        </Text>
                        <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                          Per {tarief.type === 'uur' ? 'uur' : tarief.type === 'dag' ? 'dag' : 'maand'}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text fontSize="xl" fontWeight="bold" color="yellow.600">
                      €{tarief.tarief.toFixed(2)}
                    </Text>
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
              <ScheduleIcon style={{ fontSize: 60, color: '#805AD5', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="purple.600">
                Planning invullen
              </Text>
              <Text color="gray.600">
                Hoeveel uren en dagen per week heeft u opvang nodig?
              </Text>
            </Box>
            
            <VStack gap={6} align="stretch">
              <Box>
                <Text mb={3} fontWeight="medium" fontSize="lg">Uren per week</Text>
                <Input
                  type="number"
                  value={kind.uren_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setKind({ ...kind, uren_per_week: parseInt(e.target.value) || 0 });
                    setResultaat(null);
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
                  value={kind.dagen_per_week}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setKind({ ...kind, dagen_per_week: parseInt(e.target.value) || 0 });
                    setResultaat(null);
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

      case 5:
        return (
          <VStack gap={6} align="stretch">
            <Box textAlign="center">
              <AssessmentIcon style={{ fontSize: 60, color: '#E53E3E', marginBottom: '1rem' }} />
              <Text fontSize="2xl" fontWeight="bold" mb={2} color="red.600">
                Uw kostenberekening
              </Text>
              <Text color="gray.600">
                Dit zijn uw geschatte maandelijkse kosten
              </Text>
            </Box>
            
            {berekening && (
              <Box textAlign="center" py={8}>
                <Text>Berekenen...</Text>
              </Box>
            )}

            {resultaat && !berekening && (
              <VStack gap={4} align="stretch">
                {/* Brutokosten */}
                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontWeight="bold" fontSize="lg" color="gray.800">
                    Brutokosten per maand
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    €{resultaat.brutokosten.toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {resultaat.berekening_details}
                  </Text>
                </Box>

                {/* Toeslag resultaten */}
                {resultaat.toeslag && (
                  <>
                    <Box borderTop="1px solid" borderColor="gray.200" pt={4} />
                    
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      💰 Kinderopvangtoeslag
                    </Text>

                    {/* Eindresultaat */}
                    <Box bg="purple.50" p={6} borderRadius="xl" border="2px solid" borderColor="purple.200">
                      <HStack gap={4} align="center">
                        <Box 
                          minW={12} 
                          h={12} 
                          bg="purple.100" 
                          borderRadius="full" 
                          display="flex" 
                          alignItems="center" 
                          justifyContent="center"
                          fontSize="lg"
                          fontWeight="bold"
                          color="purple.600"
                        >
                          =
                        </Box>
                        <Box flex={1}>
                          <Text fontSize="xl" fontWeight="bold" color="purple.800">
                            Uw netto kosten per maand
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Na aftrek van kinderopvangtoeslag
                          </Text>
                        </Box>
                        <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                          €{resultaat.toeslag.totaal_nettokosten.toFixed(2)}
                        </Text>
                      </HStack>
                    </Box>

                    {/* Besparingen */}
                    <Box bg="green.50" p={4} borderRadius="lg" border="1px solid" borderColor="green.200">
                      <HStack gap={4} align="center">
                        <Text fontSize="2xl">💚</Text>
                        <VStack align="start" gap={0} flex={1}>
                          <Text fontWeight="bold" color="green.800">
                            Uw besparing per maand
                          </Text>
                          <Text fontSize="sm" color="green.700">
                            Door kinderopvangtoeslag
                          </Text>
                        </VStack>
                        <Text fontSize="2xl" fontWeight="bold" color="green.600">
                          €{(resultaat.toeslag.totaal_toeslag_landelijk + resultaat.toeslag.totaal_toeslag_gemeente).toFixed(2)}
                        </Text>
                      </HStack>
                    </Box>
                  </>
                )}
              </VStack>
            )}

            {error && (
              <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
                <Text color="red.800" fontWeight="medium">❌ {error}</Text>
              </Box>
            )}
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box minHeight="100vh" bg="gray.50" py={8}>
      <Box maxW="4xl" mx="auto" px={4}>
        {/* Progress Header */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm" mb={6}>
          <Text fontSize="sm" color="gray.500" mb={2}>
            Stap {currentStep} van {WIZARD_STEPS.length}
          </Text>
          <Box 
            w="full" 
            h="3" 
            bg="gray.200" 
            borderRadius="full" 
            mb={4}
            overflow="hidden"
          >
            <Box 
              h="full" 
              bg="blue.500" 
              borderRadius="full"
              w={`${(currentStep / WIZARD_STEPS.length) * 100}%`}
              transition="width 0.3s ease"
            />
          </Box>
          
          {/* Step indicators */}
          <HStack justifyContent="space-between">
            {WIZARD_STEPS.map((step) => {
              const IconComponent = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <VStack key={step.id} gap={2}>
                  <Box
                    w={12}
                    h={12}
                    borderRadius="full"
                    bg={isCompleted ? 'green.500' : isActive ? 'blue.500' : 'gray.300'}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.2s"
                  >
                    {isCompleted ? (
                      <CheckCircleIcon style={{ color: 'white', fontSize: 24 }} />
                    ) : (
                      <IconComponent style={{ 
                        color: isActive ? 'white' : '#A0AEC0', 
                        fontSize: 24 
                      }} />
                    )}
                  </Box>
                  <VStack gap={0} align="center">
                    <Text 
                      fontSize="xs" 
                      fontWeight={isActive ? 'bold' : 'medium'}
                      color={isActive ? 'blue.600' : isCompleted ? 'green.600' : 'gray.500'}
                    >
                      {step.title}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {step.description}
                    </Text>
                  </VStack>
                </VStack>
              );
            })}
          </HStack>
        </Box>

        {/* Step Content */}
        <Box bg="white" p={8} borderRadius="lg" shadow="sm" mb={6}>
          {renderStepContent()}
        </Box>

        {/* Navigation */}
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <HStack justifyContent="space-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              <HStack gap={2}>
                <ArrowBackIcon style={{ fontSize: 16 }} />
                <Text>Vorige</Text>
              </HStack>
            </Button>
            
            <Button
              onClick={nextStep}
              disabled={!canGoToNextStep() || currentStep === WIZARD_STEPS.length}
              colorScheme="blue"
            >
              <HStack gap={2}>
                <Text>{currentStep === WIZARD_STEPS.length ? 'Voltooid' : 'Volgende'}</Text>
                <ArrowForwardIcon style={{ fontSize: 16 }} />
              </HStack>
            </Button>
          </HStack>
        </Box>

        {/* Disclaimer */}
        {currentStep === 5 && resultaat?.toeslag && (
          <Box bg="yellow.50" p={4} borderRadius="lg" border="1px solid" borderColor="yellow.200" mt={6}>
            <HStack gap={3} align="start">
              <Text fontSize="xl">⚠️</Text>
              <VStack align="start" gap={1} flex={1}>
                <Text fontSize="sm" fontWeight="bold" color="yellow.800">
                  Belangrijke informatie
                </Text>
                <Text fontSize="sm" color="yellow.700">
                  Dit is een <strong>indicatieve berekening</strong>. Voor de definitieve kinderopvangtoeslag 
                  dient u een aanvraag in bij de Belastingdienst via <strong>toeslagen.nl</strong>.
                </Text>
              </VStack>
            </HStack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RekentoolWizardPage; 