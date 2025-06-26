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
import { gradients } from '../theme';
import { 
  CreditCard, 
  Settings, 
  Building2,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Organisatie {
  id: number;
  naam: string;
  email?: string;
  telefoon?: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  website?: string;
  actief: boolean;
  actief_toeslagjaar?: number;
  gemeente_toeslag_percentage?: number;
  gemeente_toeslag_actief?: boolean;
  standaard_inkomensklasse?: string;
  toeslag_automatisch_berekenen?: boolean;
  created_at: string;
  updated_at: string;
}

interface Toeslagtabel {
  id: number;
  jaar: number;
  actief: boolean;
}

interface Inkomensklasse {
  id: number;
  min: number;
  max: number | null;
  label: string;
  perc_first_child: number;
  perc_other_children: number;
}

const ToeslagInstellingenPage: React.FC = () => {
  const { user, organisatie: authOrganisatie } = useAuth();
  const navigate = useNavigate();
  
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
  const [savingToeslag, setSavingToeslag] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === UserRole.SUPERUSER) {
      navigate('/superuser');
      return;
    }
    if (authOrganisatie) {
      setOrganisatie(authOrganisatie as Organisatie);
      loadToeslagData();
    }
  }, [user, navigate, authOrganisatie]);

  const loadToeslagData = async () => {
    if (!authOrganisatie?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Haal toeslagtabellen op
      const toeslagResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/toeslagtabellen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (toeslagResponse.ok) {
        const toeslagResult = await toeslagResponse.json();
        if (toeslagResult.success) {
          setToeslagtabellen(toeslagResult.data || []);
        }
      }

      // Haal inkomensklassen op als organisatie een actief toeslagjaar heeft
      const currentOrg = organisatie || authOrganisatie as Organisatie;
      if (currentOrg.actief_toeslagjaar) {
        const inkomensResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/toeslag/${currentOrg.actief_toeslagjaar}/inkomensklassen`);
        if (inkomensResponse.ok) {
          const inkomensResult = await inkomensResponse.json();
          if (inkomensResult.success) {
            setInkomensklassen(inkomensResult.data.inkomensklassen || []);
          }
        }
      }
    } catch (error) {
      console.error('Fout bij laden toeslag data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToeslagjarChange = async (jaar: string) => {
    if (!organisatie) return;
    
    const nieuwJaar = jaar ? parseInt(jaar) : null;
    setOrganisatie({ ...organisatie, actief_toeslagjaar: nieuwJaar || undefined });
    setInkomensklassen([]);
    
    if (nieuwJaar) {
      const inkomensResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/toeslag/${nieuwJaar}/inkomensklassen`);
      if (inkomensResponse.ok) {
        const inkomensResult = await inkomensResponse.json();
        if (inkomensResult.success) {
          setInkomensklassen(inkomensResult.data.inkomensklassen || []);
        }
      }
    }
  };

  const saveToeslagInstellingen = async () => {
    if (!organisatie) return;
    
    try {
      setSavingToeslag(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/${organisatie.id}/toeslag-instellingen`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actief_toeslagjaar: organisatie.actief_toeslagjaar,
          gemeente_toeslag_percentage: organisatie.gemeente_toeslag_percentage || 0,
          gemeente_toeslag_actief: organisatie.gemeente_toeslag_actief || false,
          standaard_inkomensklasse: organisatie.standaard_inkomensklasse,
          toeslag_automatisch_berekenen: organisatie.toeslag_automatisch_berekenen !== false
        })
      });

      if (response.ok) {
        alert('Toeslag instellingen opgeslagen!');
      } else {
        throw new Error('Fout bij opslaan');
      }
    } catch (error) {
      console.error('Fout bij opslaan toeslag instellingen:', error);
      alert('Kon toeslag instellingen niet opslaan');
    } finally {
      setSavingToeslag(false);
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
          <Text color="gray.800" fontSize="lg">Toeslag instellingen laden...</Text>
        </VStack>
      </Box>
    );
  }

  if (!organisatie) {
    return (
      <Box minH="100vh" bg="bg.subtle" display="flex" alignItems="center" justifyContent="center">
        <Text color="fg" fontSize="lg">Organisatie data niet beschikbaar</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="bg.subtle">
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
                <CreditCard size={32} color="blue.600" />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  Toeslag Instellingen
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Configureer kinderopvangtoeslag berekeningen
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
                  <Building2 size={16} color="gray.600" />
                  <Text color="gray.700">{organisatie.naam}</Text>
                </HStack>
              </Badge>
              
              <Badge 
                colorScheme={organisatie.toeslag_automatisch_berekenen !== false ? 'green' : 'orange'} 
                variant="solid"
                px="3" 
                py="1" 
                borderRadius="full"
                fontSize="sm"
              >
                {organisatie.toeslag_automatisch_berekenen !== false ? 'Toeslag Actief' : 'Toeslag Uitgeschakeld'}
              </Badge>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-12" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* Quick Status Overview */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
            <Box
              bg="bg.panel"
              borderRadius="2xl"
              p="6"
              shadow="xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: organisatie.toeslag_automatisch_berekenen !== false 
                  ? gradients.green
                  : gradients.orange
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg={organisatie.toeslag_automatisch_berekenen !== false 
                      ? "green.100"
                      : "orange.100"
                    }
                    border="1px solid"
                    borderColor={organisatie.toeslag_automatisch_berekenen !== false 
                      ? "green.200"
                      : "orange.200"
                    }
                  >
                    {organisatie.toeslag_automatisch_berekenen !== false ? (
                      <CheckCircle size={24} color="green.600" />
                    ) : (
                      <AlertTriangle size={24} color="orange.600" />
                    )}
                  </Box>
                  <VStack align="end" gap="0">
                    <Badge 
                      colorScheme={organisatie.toeslag_automatisch_berekenen !== false ? 'green' : 'orange'} 
                      variant="solid"
                      borderRadius="full"
                      px="3"
                      py="1"
                    >
                      {organisatie.toeslag_automatisch_berekenen !== false ? 'Actief' : 'Inactief'}
                    </Badge>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="fg.muted">Automatische Berekening</Text>
              </VStack>
            </Box>

            <Box
              bg="bg.panel"
              borderRadius="2xl"
              p="6"
              shadow="xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: organisatie.actief_toeslagjaar 
                  ? gradients.blue
                  : 'linear(135deg, #ef4444, #dc2626)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg={organisatie.actief_toeslagjaar 
                      ? "blue.100"
                      : "red.100"
                    }
                    border="1px solid"
                    borderColor={organisatie.actief_toeslagjaar 
                      ? "blue.200"
                      : "red.200"
                    }
                  >
                    <Shield size={24} color={organisatie.actief_toeslagjaar ? "blue.600" : "red.600"} />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="2xl" fontWeight="bold" color="fg">
                      {organisatie.actief_toeslagjaar || 'Geen'}
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="fg.muted">Actief Toeslagjaar</Text>
              </VStack>
            </Box>

            <Box
              bg="bg.panel"
              borderRadius="2xl"
              p="6"
              shadow="xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: organisatie.gemeente_toeslag_actief 
                  ? gradients.purple
                  : 'linear(135deg, #6b7280, #4b5563)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg={organisatie.gemeente_toeslag_actief 
                      ? "purple.100"
                      : "gray.100"
                    }
                    border="1px solid"
                    borderColor={organisatie.gemeente_toeslag_actief 
                      ? "purple.200"
                      : "gray.200"
                    }
                  >
                    <Building2 size={24} color={organisatie.gemeente_toeslag_actief ? "purple.600" : "gray.600"} />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="2xl" fontWeight="bold" color="fg">
                      {organisatie.gemeente_toeslag_percentage || 0}%
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="fg.muted">Gemeente Toeslag</Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Main Settings */}
          <Box
            bg="bg.panel"
            borderRadius="2xl"
            shadow="xl"
            border="1px solid"
            borderColor="border.muted"
            overflow="hidden"
          >
            <Box 
              p="6" 
              borderBottom="1px solid" 
              borderColor="border.muted"
              bg="bg.subtle"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bg="green.100"
                  border="1px solid"
                  borderColor="green.200"
                >
                  <Settings size={20} color="green.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="fg">
                    🏛️ Hoofdinstellingen
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Configureer de basis toeslag instellingen
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <VStack gap="6" align="stretch">
                {/* Enable/Disable Toggle */}
                <Box
                  p="4"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="border.muted"
                  bg="bg.subtle"
                >
                  <HStack mb="3">
                    <input
                      type="checkbox"
                      checked={organisatie.toeslag_automatisch_berekenen !== false}
                      onChange={(e) => setOrganisatie({
                        ...organisatie,
                        toeslag_automatisch_berekenen: e.target.checked
                      })}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <Text fontWeight="medium" color="fg">
                      ✅ Automatische toeslagberekening inschakelen
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    Wanneer uitgeschakeld zien ouders geen toeslagberekening in de rekentool. 
                    Dit is nuttig als u alleen de basistarieven wilt tonen zonder toeslagcalculaties.
                  </Text>
                </Box>

                {organisatie.toeslag_automatisch_berekenen !== false && (
                  <VStack gap="6" align="stretch">
                    {/* Year Selection */}
                    <Box>
                      <Text mb="3" fontWeight="medium" color="fg" fontSize="lg">
                        📅 Toeslagjaar Selectie
                      </Text>
                      <Text fontSize="sm" color="fg.muted" mb="4">
                        Selecteer het toeslagjaar dat gebruikt wordt voor berekeningen
                      </Text>
                      <select
                        value={organisatie.actief_toeslagjaar || ''}
                        onChange={(e) => handleToeslagjarChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          backgroundColor: 'white',
                          fontSize: '14px',
                          color: '#374151'
                        }}
                      >
                        <option value="">Geen toeslagjaar geselecteerd</option>
                        {toeslagtabellen.map((tabel) => (
                          <option key={tabel.id} value={tabel.jaar}>
                            {tabel.jaar} {tabel.actief ? '(Actief)' : '(Inactief)'}
                          </option>
                        ))}
                      </select>
                    </Box>

                    {/* Standard Income Class */}
                    {inkomensklassen.length > 0 && (
                      <Box>
                        <Text mb="3" fontWeight="medium" color="fg" fontSize="lg">
                          💰 Standaard Inkomensklasse
                        </Text>
                        <Text fontSize="sm" color="fg.muted" mb="4">
                          Selecteer de inkomensklasse die standaard wordt voorgeselecteerd
                        </Text>
                        <select
                          value={organisatie.standaard_inkomensklasse || ''}
                          onChange={(e) => setOrganisatie({
                            ...organisatie,
                            standaard_inkomensklasse: e.target.value || undefined
                          })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            fontSize: '14px',
                            color: '#374151'
                          }}
                        >
                          <option value="">Geen standaard inkomensklasse</option>
                          {inkomensklassen.map((klasse) => (
                            <option key={klasse.id} value={klasse.label}>
                              {klasse.label} (€{klasse.min.toLocaleString()}{klasse.max ? ` - €${klasse.max.toLocaleString()}` : '+'})
                            </option>
                          ))}
                        </select>
                      </Box>
                    )}

                    {/* Municipality Settings */}
                    <Box>
                      <Text mb="3" fontWeight="medium" color="fg" fontSize="lg">
                        🏛️ Gemeente Toeslag
                      </Text>
                      <Text fontSize="sm" color="fg.muted" mb="4">
                        Sommige gemeenten bieden extra toeslag bovenop de landelijke kinderopvangtoeslag
                      </Text>
                      
                      <VStack gap="4" align="stretch">
                        <Box
                          p="4"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="border.muted"
                          bg="bg.subtle"
                        >
                          <HStack mb="3">
                            <input
                              type="checkbox"
                              checked={organisatie.gemeente_toeslag_actief || false}
                              onChange={(e) => setOrganisatie({
                                ...organisatie,
                                gemeente_toeslag_actief: e.target.checked
                              })}
                              style={{ transform: 'scale(1.2)' }}
                            />
                            <Text fontWeight="medium" color="fg">
                              Gemeente toeslag inschakelen
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="fg.muted">
                            Schakel dit in als uw gemeente extra toeslag biedt
                          </Text>
                        </Box>

                        {organisatie.gemeente_toeslag_actief && (
                          <Box>
                            <Text mb="2" fontSize="sm" fontWeight="medium" color="fg">
                              Gemeente toeslag percentage
                            </Text>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={organisatie.gemeente_toeslag_percentage || 0}
                              onChange={(e) => setOrganisatie({
                                ...organisatie,
                                gemeente_toeslag_percentage: parseFloat(e.target.value) || 0
                              })}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                fontSize: '14px',
                                color: '#374151'
                              }}
                              placeholder="0.0"
                            />
                            <Text fontSize="xs" color="fg.muted" mt="2">
                              Percentage van de kindkosten dat de gemeente vergoedt (0-100%)
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </VStack>
            </Box>
          </Box>

          {/* Current Settings Overview */}
          {organisatie.actief_toeslagjaar && inkomensklassen.length > 0 && (
            <Box
              bg="bg.panel"
              borderRadius="2xl"
              shadow="xl"
              border="1px solid"
              borderColor="border.muted"
              overflow="hidden"
            >
              <Box 
                p="6" 
                borderBottom="1px solid" 
                borderColor="border.muted"
                bg="green.50"
              >
                <HStack gap="3">
                  <Box 
                    p="2" 
                    borderRadius="lg" 
                    bg="green.100"
                    border="1px solid"
                    borderColor="green.200"
                  >
                    <Info size={20} color="green.600" />
                  </Box>
                  <VStack align="start" gap="0">
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                      📊 Inkomensklassen {organisatie.actief_toeslagjaar}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Overzicht van beschikbare inkomensklassen
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Box p="6">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                  {inkomensklassen.map((klasse) => (
                    <Box
                      key={klasse.id}
                      p="4"
                      border="1px solid"
                      borderColor="border.muted"
                      borderRadius="xl"
                      bg={organisatie.standaard_inkomensklasse === klasse.label ? 'green.50' : 'bg.subtle'}
                      _hover={{ shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <VStack align="start" gap="2">
                        <HStack justify="space-between" width="full">
                          <Text fontWeight="bold" color="fg">
                            {klasse.label}
                          </Text>
                          {organisatie.standaard_inkomensklasse === klasse.label && (
                            <Badge colorScheme="green" size="sm">Standaard</Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="fg.muted">
                          €{klasse.min.toLocaleString()}{klasse.max ? ` - €${klasse.max.toLocaleString()}` : '+'}
                        </Text>
                        <VStack align="start" gap="1" fontSize="xs" color="fg.subtle">
                          <Text>Eerste kind: {klasse.perc_first_child}%</Text>
                          <Text>Overige kinderen: {klasse.perc_other_children}%</Text>
                        </VStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Box>
          )}

          {/* Save Button */}
          <Box
            bg="bg.panel"
            borderRadius="2xl"
            p="6"
            shadow="xl"
            border="1px solid"
            borderColor="border.muted"
          >
            <HStack justify="space-between" align="center">
              <VStack align="start" gap="1">
                <Text fontWeight="bold" color="fg" fontSize="lg">
                  💾 Instellingen Opslaan
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  Sla alle wijzigingen op om ze actief te maken
                </Text>
              </VStack>
              
              <Button
                onClick={saveToeslagInstellingen}
                disabled={savingToeslag}
                colorScheme="green"
                size="lg"
                borderRadius="xl"
                px="8"
              >
                {savingToeslag ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default ToeslagInstellingenPage; 