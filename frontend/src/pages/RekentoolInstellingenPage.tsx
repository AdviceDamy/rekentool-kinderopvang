import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Badge,
  SimpleGrid,
  VStack,
  HStack,
  Container,
  Spinner
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  Target, 
  Settings, 
  ExternalLink, 
  Copy, 
  Lightbulb,
  Star,
  Wand2,
  Eye,
  Palette
} from 'lucide-react';

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

const RekentoolInstellingenPage: React.FC = () => {
  const { user, organisatie } = useAuth();
  const navigate = useNavigate();
  
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
  const [savingWizard, setSavingWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === UserRole.SUPERUSER) {
      navigate('/superuser');
      return;
    }
    loadWizardConfiguratie();
  }, [user, navigate, organisatie]);

  const loadWizardConfiguratie = async () => {
    if (!organisatie?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/${organisatie.id}/wizard-configuratie`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWizardConfiguratie(result.data);
        }
      }
    } catch (error) {
      console.error('Fout bij laden wizard configuratie:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWizardConfiguratie = async () => {
    if (!organisatie?.id) return;
    
    try {
      setSavingWizard(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/${organisatie.id}/wizard-configuratie`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wizardConfiguratie)
      });

      if (response.ok) {
        alert('Wizard configuratie opgeslagen!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij opslaan');
      }
    } catch (error) {
      console.error('Fout bij opslaan wizard configuratie:', error);
      alert('Kon wizard configuratie niet opslaan: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
    } finally {
      setSavingWizard(false);
    }
  };

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="gray.50"
        display="flex" 
        justifyContent="center" 
        alignItems="center"
      >
        <VStack gap="4">
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.800" fontSize="lg">Rekentool instellingen laden...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header Background */}
      <Box 
        bg="blue.50" 
        minH="240px" 
        position="relative"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" pt="8" pb="16" position="relative" zIndex={1}>
          <VStack gap="4" align="start">
            <HStack gap="3">
              <Box 
                p="3" 
                borderRadius="xl" 
                bg="blue.100"
                border="1px solid"
                borderColor="blue.200"
              >
                <Target size={32} color="blue.600" />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  Rekentool Instellingen
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Configureer uw kostencalculator voor ouders
                </Text>
              </VStack>
            </HStack>
            
            <HStack gap="3" mt="4">
              <Badge 
                bg="gray.100" 
                color="gray.700"
                px="3" 
                py="1" 
                borderRadius="full"
                fontSize="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <HStack gap="2">
                  <Star size={16} color="gray.600" />
                  <Text color="gray.700">{organisatie?.naam}</Text>
                </HStack>
              </Badge>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-12" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* Public Calculator Section */}
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="xl"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            <Box 
              p="6" 
              borderBottom="1px solid" 
              borderColor="gray.100"
              bgGradient="linear(135deg, blue.50 0%, white 100%)"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bg="blue.100"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <Eye size={20} color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🌐 Publieke Rekentool
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Deel uw kostencalculator met ouders
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <Text color="gray.700" mb="6" fontSize="sm">
                Uw rekentool is beschikbaar voor ouders! Deel de onderstaande link zodat ouders 
                eenvoudig kinderopvangkosten kunnen berekenen.
              </Text>
              
              <Box 
                bg="gray.50" 
                p="4" 
                borderRadius="xl" 
                mb="6"
                border="1px solid"
                borderColor="gray.200"
              >
                <Text fontSize="sm" fontWeight="medium" mb="2" color="gray.700">
                  Publieke link:
                </Text>
                <Text 
                  fontSize="sm" 
                  fontFamily="mono" 
                  bg="white" 
                  p="3" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="gray.200"
                  color="gray.800"
                >
                  {window.location.origin}/rekentool/demo
                </Text>
              </Box>

              <HStack gap="4" mb="6">
                <Button 
                  onClick={() => window.open('/rekentool/demo', '_blank')}
                  colorScheme="blue"
                  variant="solid"
                  borderRadius="lg"
                  size="sm"
                  _hover={{
                    transform: "translateY(-1px)"
                  }}
                  transition="all 0.2s ease"
                >
                  <HStack gap="2">
                    <ExternalLink size={14} />
                    <Text>Rekenmodule openen</Text>
                  </HStack>
                </Button>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/rekentool/demo`);
                    alert('Link gekopieerd naar klembord!');
                  }}
                  variant="outline"
                  borderColor="gray.300"
                  color="gray.700"
                  borderRadius="lg"
                  size="sm"
                  _hover={{
                    bg: "gray.50",
                    borderColor: "gray.400"
                  }}
                >
                  <HStack gap="2">
                    <Copy size={14} />
                    <Text>Link kopiëren</Text>
                  </HStack>
                </Button>
              </HStack>

              <Box 
                p="4" 
                bg="blue.50" 
                borderRadius="xl"
                border="1px solid"
                borderColor="blue.200"
              >
                <HStack gap="2" mb="2">
                  <Lightbulb size={16} color="#1d4ed8" />
                  <Text fontSize="sm" color="blue.800" fontWeight="medium">Tip</Text>
                </HStack>
                <Text fontSize="sm" color="blue.700">
                  Plaats deze link op uw website, in nieuwsbrieven of deel via sociale media voor maximale bereik.
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Wizard Configuration */}
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="xl"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            <Box 
              p="6" 
              borderBottom="1px solid" 
              borderColor="gray.100"
              bgGradient="linear(135deg, purple.50 0%, white 100%)"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bg="purple.100"
                  border="1px solid"
                  borderColor="purple.200"
                >
                  <Wand2 size={20} color="purple.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🧙‍♂️ Wizard Configuratie
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Pas de stappen aan uw doelgroep aan
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <Text color="gray.700" mb="6" fontSize="sm">
                Configureer welke stappen ouders doorlopen in uw kostencalculator. U kunt kiezen tussen 
                een eenvoudige snelle berekening of een uitgebreide wizard met alle functionaliteiten.
              </Text>
              
              <SimpleGrid columns={{ base: 2, md: 4 }} gap="4" mb="6">
                {Object.entries(wizardConfiguratie).map(([stap, enabled]) => {
                  const isRequired = ['welkom', 'opvangvorm', 'tarief', 'resultaat'].includes(stap);
                  const stapTitels: { [key: string]: string } = {
                    welkom: '1. Welkom',
                    kinderen: '2. Kinderen',
                    opvangvorm: '3. Opvangvorm',
                    tarief: '4. Tarief',
                    planning: '5. Planning',
                    resultaat: '6. Resultaat',
                    jaarplanning: '7. Jaarplanning',
                    vergelijking: '8. Vergelijking'
                  };
                  
                  const stapBeschrijvingen: { [key: string]: string } = {
                    welkom: 'Welkomstscherm met organisatie info',
                    kinderen: 'Meerdere kinderen toevoegen/beheren',
                    opvangvorm: 'Type kinderopvang selecteren',
                    tarief: 'Tariefkeuze voor geselecteerde opvangvorm',
                    planning: 'Uren en dagen per week invullen',
                    resultaat: 'Kosten berekening en toeslag weergave',
                    jaarplanning: 'Vakantieweken selectie voor jaarkosten',
                    vergelijking: 'Scenario\'s vergelijken en opslaan'
                  };
                  
                  return (
                    <Box
                      key={stap}
                      p="3"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={enabled ? 'green.200' : 'gray.200'}
                      bg={enabled ? 'green.50' : 'gray.50'}
                      opacity={isRequired ? 1 : enabled ? 1 : 0.7}
                      position="relative"
                      _hover={{
                        shadow: "md",
                        transform: "translateY(-1px)"
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack justifyContent="space-between" mb="2">
                        <Text fontWeight="bold" fontSize="xs" color={enabled ? 'green.800' : 'gray.600'}>
                          {stapTitels[stap] || stap}
                        </Text>
                        <HStack>
                          {isRequired && (
                            <Badge colorScheme="red" size="xs">Verplicht</Badge>
                          )}
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={isRequired}
                            onChange={(e) => {
                              if (!isRequired) {
                                setWizardConfiguratie({
                                  ...wizardConfiguratie,
                                  [stap]: e.target.checked
                                });
                              }
                            }}
                            style={{
                              transform: 'scale(1.1)',
                              cursor: isRequired ? 'not-allowed' : 'pointer'
                            }}
                          />
                        </HStack>
                      </HStack>
                      <Text fontSize="xs" color={enabled ? 'green.700' : 'gray.500'}>
                        {stapBeschrijvingen[stap] || 'Geen beschrijving beschikbaar'}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>

              <VStack gap="4" align="stretch">
                {/* Quick templates */}
                <Box>
                  <Text fontWeight="bold" mb="3" fontSize="sm" color="gray.700">
                    🚀 Snelle configuraties:
                  </Text>
                  <HStack gap="2" flexWrap="wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="blue.300"
                      color="blue.600"
                      borderRadius="lg"
                      _hover={{ bg: "blue.50" }}
                      onClick={() => setWizardConfiguratie({
                        welkom: true,
                        kinderen: false,
                        opvangvorm: true,
                        tarief: true,
                        planning: true,
                        resultaat: true,
                        jaarplanning: false,
                        vergelijking: false
                      })}
                    >
                      🚀 Eenvoudig (5 stappen)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="purple.300"
                      color="purple.600"
                      borderRadius="lg"
                      _hover={{ bg: "purple.50" }}
                      onClick={() => setWizardConfiguratie({
                        welkom: true,
                        kinderen: true,
                        opvangvorm: true,
                        tarief: true,
                        planning: true,
                        resultaat: true,
                        jaarplanning: false,
                        vergelijking: true
                      })}
                    >
                      ⚖️ Standaard (7 stappen)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="green.300"
                      color="green.600"
                      borderRadius="lg"
                      _hover={{ bg: "green.50" }}
                      onClick={() => setWizardConfiguratie({
                        welkom: true,
                        kinderen: true,
                        opvangvorm: true,
                        tarief: true,
                        planning: true,
                        resultaat: true,
                        jaarplanning: true,
                        vergelijking: true
                      })}
                    >
                      🎯 Volledig (8 stappen)
                    </Button>
                  </HStack>
                </Box>

                {/* Live preview */}
                <Box 
                  bg="gray.50" 
                  p="4" 
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontWeight="bold" fontSize="sm" mb="2" color="gray.800">
                    👁️ Live preview:
                  </Text>
                  <Text fontSize="xs" color="gray.700" mb="1">
                    Actieve stappen: {Object.values(wizardConfiguratie).filter(Boolean).length} van 8
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Ouders doorlopen: {Object.entries(wizardConfiguratie)
                      .filter(([_, enabled]) => enabled)
                      .map(([stap, _]) => {
                        const titels: { [key: string]: string } = {
                          welkom: 'Welkom',
                          kinderen: 'Kinderen',
                          opvangvorm: 'Opvangvorm',
                          tarief: 'Tarief',
                          planning: 'Planning',
                          resultaat: 'Resultaat',
                          jaarplanning: 'Jaarplanning',
                          vergelijking: 'Vergelijking'
                        };
                        return titels[stap] || stap;
                      })
                      .join(' → ')
                    }
                  </Text>
                </Box>

                {/* Save button */}
                <Button
                  colorScheme="purple"
                  variant="solid"
                  borderRadius="lg"
                  onClick={saveWizardConfiguratie}
                  loading={savingWizard}
                  _hover={{
                    transform: "translateY(-1px)"
                  }}
                  transition="all 0.2s ease"
                  size="lg"
                >
                  {savingWizard ? 'Opslaan...' : '💾 Wizard configuratie opslaan'}
                </Button>
              </VStack>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default RekentoolInstellingenPage; 