import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Badge,
  SimpleGrid,
  VStack,
  HStack,
  Spinner,
  Breadcrumb,
  Container
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  Settings, 
  Building2, 
  Users, 
  Eye, 
  Wrench, 
  Plus,
  BarChart3,
  FileText,
  Globe,
  User,
  Lock,
  MapPin,
  Mail,
  Phone,
  Home,
  Shield,
  Activity,
  TrendingUp,
  Zap,
  Star,
  DollarSign,
  Baby
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
  slug: string;
  actief: boolean;
  actief_toeslagjaar?: number;
  gemeente_toeslag_percentage?: number;
  gemeente_toeslag_actief?: boolean;
  standaard_inkomensklasse?: string;
  toeslag_automatisch_berekenen?: boolean;
  created_at: string;
  updated_at: string;
}

interface Opvangvorm {
  id: number;
  naam: string;
  omschrijving?: string;
  actief: boolean;
}

interface Tarief {
  id: number;
  naam: string;
  type: string;
  tarief: number;
  opvangvorm_id: number;
  actief: boolean;
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

const OrganisatieAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [savingToeslag, setSavingToeslag] = useState(false);
  const [savingWizard, setSavingWizard] = useState(false);

  useEffect(() => {
    if (user?.role !== UserRole.SUPERUSER) {
      navigate('/dashboard');
      return;
    }
    if (slug) {
      loadOrganisatieData();
    }
  }, [user, navigate, slug]);

  const loadOrganisatieData = async () => {
    try {
      setLoading(true);
      
      // Haal organisatie informatie op
      const orgResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/public/${slug}`);
      if (!orgResponse.ok) {
        throw new Error('Organisatie niet gevonden');
      }
      const orgResult = await orgResponse.json();
      if (orgResult.success) {
        setOrganisatie(orgResult.data);
      }

      // Haal opvangvormen op voor deze organisatie
      const opvangvormenResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/opvangvormen?org=${slug}`);
      if (opvangvormenResponse.ok) {
        const opvangvormenResult = await opvangvormenResponse.json();
        if (opvangvormenResult.success) {
          setOpvangvormen(opvangvormenResult.data || []);
        }
      }

      // Haal tarieven op voor deze organisatie
      const tarievenResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/tarieven?org=${slug}`);
      if (tarievenResponse.ok) {
        const tarievenResult = await tarievenResponse.json();
        if (tarievenResult.success) {
          setTarieven(tarievenResult.data || []);
        }
      }

      // Haal beschikbare toeslagtabellen op (superuser endpoint)
      const token = localStorage.getItem('token');
      if (token) {
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
        if (orgResult.data.actief_toeslagjaar) {
          const inkomensResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/toeslag/${orgResult.data.actief_toeslagjaar}/inkomensklassen`);
          if (inkomensResponse.ok) {
            const inkomensResult = await inkomensResponse.json();
            if (inkomensResult.success) {
              setInkomensklassen(inkomensResult.data.inkomensklassen || []);
            }
          }
        }

        // Haal wizard configuratie op
        if (orgResult.data.id) {
          const wizardResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/${orgResult.data.id}/wizard-configuratie`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (wizardResponse.ok) {
            const wizardResult = await wizardResponse.json();
            if (wizardResult.success) {
              setWizardConfiguratie(wizardResult.data);
            }
          }
        }
      }

    } catch (error) {
      console.error('Fout bij laden organisatie data:', error);
      alert('Kon organisatie data niet laden');
    } finally {
      setLoading(false);
    }
  };

  const openPublicPage = () => {
    window.open(`/rekentool/${slug}`, '_blank');
  };

  const handleToeslagjarChange = async (jaar: string) => {
    if (!organisatie) return;
    
    const nieuwJaar = jaar ? parseInt(jaar) : null;
    
    // Update lokale state
    setOrganisatie({ ...organisatie, actief_toeslagjaar: nieuwJaar || undefined });
    
    // Reset inkomensklassen als jaar verandert
    setInkomensklassen([]);
    
    // Haal nieuwe inkomensklassen op
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

  const saveWizardConfiguratie = async () => {
    if (!organisatie) return;
    
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
          <Text color="gray.800" fontSize="lg">Organisatie data laden...</Text>
        </VStack>
      </Box>
    );
  }

  if (!organisatie) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="6" textAlign="center">
          <Box 
            p="6" 
            borderRadius="2xl" 
            bg="red.50"
            border="2px solid"
            borderColor="red.200"
          >
            <Building2 size={48} color="#dc2626" />
          </Box>
          <VStack gap="2">
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              Organisatie niet gevonden
            </Text>
            <Text color="gray.600">
              De opgevraagde organisatie bestaat niet of is niet toegankelijk
            </Text>
          </VStack>
          <Button 
            colorScheme="purple"
            variant="solid"
            borderRadius="lg"
            onClick={() => navigate('/superuser')}
            _hover={{
              transform: "translateY(-1px)"
            }}
            transition="all 0.2s ease"
          >
            Terug naar Superuser Dashboard
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Main Background */}
      <Box 
        bg="blue.50" 
        minH="300px" 
        position="relative"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" pt="8" pb="20" position="relative" zIndex={1}>
          {/* Breadcrumb */}
          <Box mb="6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/superuser')}
              color="gray.700"
              _hover={{
                bg: "gray.200"
              }}
            >
              ← Superuser Dashboard
            </Button>
            <Text color="gray.600" fontSize="sm" mt="2">
              / {organisatie.naam}
            </Text>
          </Box>

          {/* Header Section */}
          <VStack gap="4" align="start">
            <HStack gap="3">
              <Box 
                p="3" 
                borderRadius="xl" 
                bg="blue.100"
                border="1px solid"
                borderColor="blue.200"
              >
                <Wrench size={32} color="blue.600" />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  🛠️ Support: {organisatie.naam}
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Beheer en ondersteuning voor deze organisatie
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
                  <Activity size={16} color="gray.600" />
                  <Text color="gray.700">Slug: /{organisatie.slug}</Text>
                </HStack>
              </Badge>

              <Badge 
                colorScheme={organisatie.actief ? 'green' : 'red'} 
                variant="solid"
                px="3" 
                py="1" 
                borderRadius="full"
                fontSize="sm"
              >
                {organisatie.actief ? 'Actief' : 'Inactief'}
              </Badge>

              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                borderRadius="lg"
                onClick={openPublicPage}
              >
                🔗 Open Publieke Pagina
              </Button>
            </HStack>

            {/* Organization Details */}
            <Box 
              mt="4" 
              p="4" 
              borderRadius="xl"
              bg="gray.100"
              border="1px solid"
              borderColor="gray.200"
            >
              <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
                {organisatie.email && (
                  <HStack gap="2">
                    <Mail size={16} color="gray.600" />
                    <Text fontSize="sm" color="gray.700">{organisatie.email}</Text>
                  </HStack>
                )}
                {organisatie.telefoon && (
                  <HStack gap="2">
                    <Phone size={16} color="gray.600" />
                    <Text fontSize="sm" color="gray.700">{organisatie.telefoon}</Text>
                  </HStack>
                )}
                {organisatie.plaats && (
                  <HStack gap="2">
                    <MapPin size={16} color="gray.600" />
                    <Text fontSize="sm" color="gray.700">{organisatie.plaats}</Text>
                  </HStack>
                )}
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-16" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
            <Box
              bg="white"
              borderRadius="2xl"
              p="6"
              shadow="xl"
              border="1px solid"
              borderColor="gray.100"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'linear(90deg, #3b82f6 0%, #1d4ed8 100%)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="blue.100"
                    border="1px solid"
                    borderColor="blue.200"
                  >
                    <Baby size={24} color="blue.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {opvangvormen.length}
                    </Text>
                    <Text fontSize="sm" color="blue.600">
                      {opvangvormen.filter(o => o.actief).length} actief
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Opvangvormen</Text>
              </VStack>
            </Box>

            <Box
              bg="white"
              borderRadius="2xl"
              p="6"
              shadow="xl"
              border="1px solid"
              borderColor="gray.100"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'linear(90deg, #10b981 0%, #059669 100%)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="green.100"
                    border="1px solid"
                    borderColor="green.200"
                  >
                    <DollarSign size={24} color="green.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {tarieven.length}
                    </Text>
                    <Text fontSize="sm" color="green.600">
                      {tarieven.filter(t => t.actief).length} actief
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Tarieven</Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Opvangvormen Overview */}
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
                  <Baby size={20} color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    👶 Opvangvormen
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Geconfigureerde opvangvormen
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              {opvangvormen.length === 0 ? (
                <VStack gap="6" py="8">
                  <Box 
                    p="6" 
                    borderRadius="2xl" 
                    bg="yellow.50"
                    border="2px solid"
                    borderColor="yellow.200"
                  >
                    <Baby size={48} color="#d97706" />
                  </Box>
                  <VStack gap="2">
                    <Text fontSize="lg" fontWeight="bold" color="yellow.800">
                      ⚠️ Geen opvangvormen geconfigureerd
                    </Text>
                    <Text color="yellow.700" fontSize="sm" textAlign="center">
                      Deze organisatie moet eerst opvangvormen toevoegen via hun dashboard.
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                  {opvangvormen.map((opvangvorm) => (
                    <Box
                      key={opvangvorm.id}
                      p="4"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      bg={opvangvorm.actief ? "white" : "gray.50"}
                      _hover={{ 
                        shadow: "md", 
                        transform: "translateY(-2px)" 
                      }}
                      transition="all 0.2s ease"
                    >
                      <VStack align="start" gap="3">
                        <HStack justifyContent="space-between">
                          <Text fontWeight="medium" color="gray.800">
                            {opvangvorm.naam}
                          </Text>
                          <Badge 
                            colorScheme={opvangvorm.actief ? 'green' : 'gray'} 
                            variant="solid"
                            borderRadius="full"
                            px="2"
                            py="1"
                            fontSize="xs"
                          >
                            {opvangvorm.actief ? 'Actief' : 'Inactief'}
                          </Badge>
                        </HStack>
                        {opvangvorm.omschrijving && (
                          <Text fontSize="sm" color="gray.600">
                            {opvangvorm.omschrijving}
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>

          {/* Tarieven Overview */}
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
              bgGradient="linear(135deg, green.50 0%, white 100%)"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bgGradient="linear(135deg, #10b981, #059669)"
                  color="white"
                >
                  <DollarSign size={20} />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    💰 Tarieven
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Ingestelde tarieven
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              {tarieven.length === 0 ? (
                <VStack gap="6" py="8">
                  <Box 
                    p="6" 
                    borderRadius="2xl" 
                    bg="yellow.50"
                    border="2px solid"
                    borderColor="yellow.200"
                  >
                    <DollarSign size={48} color="#d97706" />
                  </Box>
                  <VStack gap="2">
                    <Text fontSize="lg" fontWeight="bold" color="yellow.800">
                      ⚠️ Geen tarieven geconfigureerd
                    </Text>
                    <Text color="yellow.700" fontSize="sm" textAlign="center">
                      Deze organisatie moet tarieven instellen voor hun opvangvormen.
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
                  {tarieven.map((tarief) => (
                    <Box
                      key={tarief.id}
                      p="4"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      bg={tarief.actief ? "white" : "gray.50"}
                      _hover={{ 
                        shadow: "md", 
                        transform: "translateY(-2px)" 
                      }}
                      transition="all 0.2s ease"
                    >
                      <VStack align="start" gap="3">
                        <HStack justifyContent="space-between">
                          <Text fontWeight="medium" color="gray.800">
                            {tarief.naam}
                          </Text>
                          <Badge 
                            colorScheme={tarief.actief ? 'green' : 'gray'} 
                            variant="solid"
                            borderRadius="full"
                            px="2"
                            py="1"
                            fontSize="xs"
                          >
                            {tarief.actief ? 'Actief' : 'Inactief'}
                          </Badge>
                        </HStack>
                        <VStack align="start" gap="1">
                          <Text fontSize="lg" fontWeight="bold" color="green.600">
                            €{tarief.tarief.toFixed(2)}
                          </Text>
                          <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                            Per {tarief.type === 'uur' ? 'uur' : tarief.type === 'dag' ? 'dag' : 'maand'}
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>

          {/* Toeslag Settings */}
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
                  bgGradient="linear(135deg, #667eea, #764ba2)"
                  color="white"
                >
                  <Settings size={20} />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🏛️ Kinderopvangtoeslag Instellingen
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Configureer toeslag berekeningen
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <VStack gap="6" align="stretch">
                {/* Automatic calculation toggle */}
                <Box
                  p="4"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="gray.50"
                >
                  <HStack mb="2">
                    <input
                      type="checkbox"
                      checked={organisatie.toeslag_automatisch_berekenen !== false}
                      onChange={(e) => setOrganisatie({
                        ...organisatie,
                        toeslag_automatisch_berekenen: e.target.checked
                      })}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <Text fontWeight="medium" color="gray.800">
                      Automatisch toeslagberekening inschakelen
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Als dit uitstaat, zien ouders geen toeslagberekening in de rekentool
                  </Text>
                </Box>

                {organisatie.toeslag_automatisch_berekenen !== false && (
                  <VStack gap="4" align="stretch">
                    {/* Toeslagjaar selection */}
                    <Box>
                      <Text mb="2" fontWeight="medium" color="gray.800">
                        Actief toeslagjaar *
                      </Text>
                      <select
                        value={organisatie.actief_toeslagjaar || ''}
                        onChange={(e) => handleToeslagjarChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          backgroundColor: 'white',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Geen toeslagjaar geselecteerd</option>
                        {toeslagtabellen.map((tabel) => (
                          <option key={tabel.jaar} value={tabel.jaar}>
                            {tabel.jaar} {tabel.actief ? '(Actief)' : '(Inactief)'}
                          </option>
                        ))}
                      </select>
                    </Box>

                    {/* Municipality supplement */}
                    <Box>
                      <HStack mb="2">
                        <input
                          type="checkbox"
                          checked={organisatie.gemeente_toeslag_actief || false}
                          onChange={(e) => setOrganisatie({
                            ...organisatie,
                            gemeente_toeslag_actief: e.target.checked
                          })}
                          style={{ transform: 'scale(1.1)' }}
                        />
                        <Text fontWeight="medium" color="gray.800">
                          Gemeente toeslag actief
                        </Text>
                      </HStack>
                      {organisatie.gemeente_toeslag_actief && (
                        <Box mt="2">
                          <Text fontSize="sm" mb="1" color="gray.700">
                            Gemeente toeslag percentage:
                          </Text>
                          <input
                            type="number"
                            value={organisatie.gemeente_toeslag_percentage || 0}
                            onChange={(e) => setOrganisatie({
                              ...organisatie,
                              gemeente_toeslag_percentage: parseFloat(e.target.value) || 0
                            })}
                            min="0"
                            max="100"
                            step="0.1"
                            style={{
                              width: '150px',
                              padding: '0.5rem',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              backgroundColor: 'white'
                            }}
                          />
                          <Text fontSize="xs" color="gray.500" mt="1">
                            Percentage extra toeslag van de gemeente
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {/* Default income class */}
                    {organisatie.actief_toeslagjaar && inkomensklassen.length > 0 && (
                      <Box>
                        <Text mb="2" fontWeight="medium" color="gray.800">
                          Standaard inkomensklasse
                        </Text>
                        <select
                          value={organisatie.standaard_inkomensklasse || ''}
                          onChange={(e) => setOrganisatie({
                            ...organisatie,
                            standaard_inkomensklasse: e.target.value
                          })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            backgroundColor: 'white',
                            fontSize: '14px'
                          }}
                        >
                          <option value="">Selecteer standaard inkomensklasse</option>
                          {inkomensklassen.map((klasse) => (
                            <option key={klasse.id} value={klasse.label}>
                              {klasse.label} (€{klasse.min.toLocaleString()} - 
                              {klasse.max ? `€${klasse.max.toLocaleString()}` : 'en hoger'})
                            </option>
                          ))}
                        </select>
                      </Box>
                    )}

                    {/* Save button */}
                                         <Button
                       bgGradient="linear(135deg, #667eea, #764ba2)"
                       color="white"
                       borderRadius="lg"
                       onClick={saveToeslagInstellingen}
                       loading={savingToeslag}
                       _hover={{
                         bgGradient: "linear(135deg, #5a67d8, #6b46c1)",
                         transform: "translateY(-1px)"
                       }}
                       transition="all 0.2s ease"
                     >
                       {savingToeslag ? 'Opslaan...' : 'Toeslag instellingen opslaan'}
                     </Button>
                  </VStack>
                )}
              </VStack>
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
              bgGradient="linear(135deg, orange.50 0%, white 100%)"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bgGradient="linear(135deg, #f59e0b, #d97706)"
                  color="white"
                >
                  <Settings size={20} />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🎛️ Wizard Configuratie
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Aanpassing van de rekentool stappen
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <SimpleGrid columns={{ base: 2, md: 4 }} gap="3" mb="6">
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
                  
                  return (
                    <Box
                      key={stap}
                      p="3"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={enabled ? 'green.200' : 'gray.200'}
                      bg={enabled ? 'green.50' : 'gray.50'}
                      opacity={isRequired ? 1 : enabled ? 1 : 0.7}
                    >
                      <HStack justifyContent="space-between" mb="1">
                        <Text fontWeight="bold" fontSize="xs" color={enabled ? 'green.800' : 'gray.600'}>
                          {stapTitels[stap] || stap}
                        </Text>
                        <HStack>
                          {isRequired && (
                            <Badge colorScheme="red" size="xs">!</Badge>
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
                    </Box>
                  );
                })}
              </SimpleGrid>

                             <Button
                 bgGradient="linear(135deg, #f59e0b, #d97706)"
                 color="white"
                 borderRadius="lg"
                 onClick={saveWizardConfiguratie}
                 loading={savingWizard}
                 size="sm"
                 _hover={{
                   bgGradient: "linear(135deg, #d97706, #b45309)",
                   transform: "translateY(-1px)"
                 }}
                 transition="all 0.2s ease"
               >
                 {savingWizard ? 'Opslaan...' : 'Wizard configuratie opslaan'}
               </Button>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default OrganisatieAdminPage; 