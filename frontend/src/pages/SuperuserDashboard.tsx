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
  Input,
  createToaster,
  Grid,
  GridItem,
  Container,
  Flex
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
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
  TrendingUp,
  Shield,
  Activity
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
  created_at: string;
  updated_at: string;
}

const SuperuserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toaster = createToaster({
    placement: 'top-right',
  });
  
  const [organisaties, setOrganisaties] = useState<Organisatie[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Form state voor nieuwe organisatie
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    adres: '',
    postcode: '',
    plaats: '',
    website: '',
    slug: '',
    beheerderEmail: '',
    beheerderWachtwoord: ''
  });

  useEffect(() => {
    if (user?.role !== UserRole.SUPERUSER) {
      navigate('/dashboard');
      return;
    }
    loadOrganisaties();
  }, [user, navigate]);

  const loadOrganisaties = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setOrganisaties(result.data || []);
        }
      }
    } catch (error) {
      console.error('Fout bij laden organisaties:', error);
      alert('Kon organisaties niet laden');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-generate slug vanaf naam
    if (field === 'naam') {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setFormData(prev => ({
        ...prev,
        slug: autoSlug
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      naam: '',
      email: '',
      telefoon: '',
      adres: '',
      postcode: '',
      plaats: '',
      website: '',
      slug: '',
      beheerderEmail: '',
      beheerderWachtwoord: ''
    });
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const createOrganisatie = async () => {
    try {
      setCreateLoading(true);
      
      // Validatie
      if (!formData.naam || !formData.slug || !formData.beheerderEmail || !formData.beheerderWachtwoord) {
        toaster.create({
          title: 'Vereiste velden ontbreken',
          description: 'Vul alle verplichte velden in.',
          status: 'error',
          duration: 5000,
        });
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toaster.create({
          title: 'Organisatie aangemaakt!',
          description: `${result.data.organisatie.naam} is succesvol aangemaakt.`,
          status: 'success',
          duration: 5000,
        });
        
        // Refresh de lijst
        await loadOrganisaties();
        
        // Sluit modal en reset form
        closeModal();
      } else {
        toaster.create({
          title: 'Fout bij aanmaken',
          description: result.error || 'Er is iets misgegaan.',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Fout bij aanmaken organisatie:', error);
      toaster.create({
        title: 'Fout bij aanmaken',
        description: 'Er is een onverwachte fout opgetreden.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const viewPublicPage = (organisatie: Organisatie) => {
    window.open(`/rekentool/${organisatie.slug}`, '_blank');
  };

  const goToOrganisatieDashboard = (organisatie: Organisatie) => {
    // Ga naar de admin pagina voor deze organisatie
    navigate(`/admin/${organisatie.slug}`);
  };

  const loginAsOrganisatie = async (organisatie: Organisatie) => {
    try {
      const confirmMessage = `Wilt u inloggen als organisatie "${organisatie.naam}"?\n\nU krijgt dan toegang tot hun dashboard alsof u een beheerder van deze organisatie bent.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Impersonate de organisatie door een speciale context te zetten
      // We kunnen dit doen door de organisatie context in de auth context te updaten
      const token = localStorage.getItem('token');
      
      // Maak een tijdelijke "organisatie context" voor de superuser
      const impersonateData = {
        originalRole: 'superuser',
        impersonatingOrganisatie: organisatie
      };
      
      // Sla de impersonation data op
      localStorage.setItem('superuser_impersonation', JSON.stringify(impersonateData));
      
      // Navigeer naar het organisatie dashboard
      navigate('/dashboard');
      
      // Refresh de pagina om de nieuwe context te laden
      window.location.reload();
      
    } catch (error) {
      console.error('Fout bij impersonation:', error);
      alert('Kon niet inloggen als organisatie');
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
          <Text color="gray.800" fontSize="lg">Laden van dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Main Background with Gradient */}
      <Box 
        bg="blue.50" 
        minH="300px" 
        position="relative"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" pt="8" pb="20" position="relative" zIndex={1}>
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
                <Shield size={32} color="blue.600" />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  🛡️ Superuser Command Center
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Volledige systeembeheer en monitoring
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
                  <User size={16} color="gray.600" />
                  <Text color="gray.700">{user?.email}</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="purple" variant="solid" px="3" py="1" borderRadius="full">
                System Admin
              </Badge>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-16" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="6">
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
                bgGradient: 'linear(90deg, #667eea 0%, #764ba2 100%)'
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
                    <Building2 size={24} color="blue.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {organisaties.length}
                    </Text>
                    <Text fontSize="sm" color="gray.600">+12% deze maand</Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Totaal Organisaties</Text>
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
                    <Users size={24} color="green.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {organisaties.filter(o => o.actief).length}
                    </Text>
                    <Text fontSize="sm" color="green.600">Stabiel</Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Actieve Organisaties</Text>
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
                bgGradient: 'linear(90deg, #3b82f6 0%, #1d4ed8 100%)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="purple.100"
                    border="1px solid"
                    borderColor="purple.200"
                  >
                    <FileText size={24} color="purple.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      {organisaties.length * 2.3 | 0}
                    </Text>
                    <Text fontSize="sm" color="blue.600">+5% deze week</Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Actieve Gebruikers</Text>
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
                bgGradient: 'linear(90deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              <VStack align="start" gap="4">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="orange.100"
                    border="1px solid"
                    borderColor="orange.200"
                  >
                    <Activity size={24} color="orange.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                      99.2%
                    </Text>
                    <Text fontSize="sm" color="orange.600">Excellent</Text>
                  </VStack>
                </HStack>
                <Text fontWeight="medium" color="gray.700">Systeem Uptime</Text>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Organisaties Overview */}
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="xl"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            {/* Header */}
            <Box 
              p="6" 
              borderBottom="1px solid" 
              borderColor="border.muted"
              bg="blue.50"
            >
              <HStack gap="3">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bg="blue.100"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <Building2 size={20} color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🏢 Organisaties
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Beheer alle organisaties
                  </Text>
                </VStack>
              </HStack>
              <Button 
                colorScheme="blue"
                variant="solid"
                borderRadius="xl"
                px="6"
                py="3"
                _hover={{
                  transform: "translateY(-2px)",
                  shadow: "xl"
                }}
                onClick={openModal}
                transition="all 0.3s ease"
              >
                <HStack gap="2">
                  <Plus size={16} />
                  <Text fontWeight="medium">Nieuwe Organisatie</Text>
                </HStack>
              </Button>
            </Box>

            {/* Content */}
            <Box p="6">
              {organisaties.length === 0 ? (
                <VStack gap="6" py="12">
                  <Box 
                    p="6" 
                    borderRadius="2xl" 
                    bg="gray.50"
                    border="2px dashed"
                    borderColor="gray.300"
                  >
                    <Building2 size={48} color="#9ca3af" />
                  </Box>
                  <VStack gap="2">
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                      Geen organisaties gevonden
                    </Text>
                    <Text color="gray.600" textAlign="center">
                      Voeg uw eerste organisatie toe om te beginnen
                    </Text>
                  </VStack>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
                  {organisaties.map((org) => (
                    <Box
                      key={org.id}
                      bg="white"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="gray.200"
                      overflow="hidden"
                      shadow="md"
                      _hover={{ 
                        shadow: "2xl", 
                        transform: "translateY(-4px)",
                        borderColor: "purple.300"
                      }}
                      transition="all 0.3s ease"
                      position="relative"
                    >
                      {/* Status Indicator */}
                      <Box
                        position="absolute"
                        top="4"
                        right="4"
                        zIndex="1"
                      >
                        <Badge 
                          colorScheme={org.actief ? 'green' : 'red'} 
                          variant="solid"
                          borderRadius="full"
                          px="3"
                          py="1"
                        >
                          {org.actief ? 'Actief' : 'Inactief'}
                        </Badge>
                      </Box>

                      {/* Header */}
                      <Box 
                        p="6" 
                        bgGradient="linear(135deg, gray.50 0%, white 100%)"
                        borderBottom="1px solid"
                        borderColor="gray.100"
                      >
                        <VStack align="start" gap="3">
                          <Text fontWeight="bold" fontSize="lg" color="gray.800">
                            {org.naam}
                          </Text>
                          
                          <Text 
                            fontSize="sm" 
                            color="purple.600" 
                            fontFamily="mono"
                            bg="purple.50"
                            px="2"
                            py="1"
                            borderRadius="md"
                          >
                            /{org.slug}
                          </Text>
                          
                          <VStack align="start" gap="1" width="full">
                            {org.plaats && (
                              <HStack gap="2">
                                <MapPin size={14} color="#6b7280" />
                                <Text fontSize="sm" color="gray.600">
                                  {org.plaats}
                                </Text>
                              </HStack>
                            )}
                            
                            {org.email && (
                              <HStack gap="2">
                                <Mail size={14} color="#6b7280" />
                                                               <Text fontSize="sm" color="gray.600" truncate>
                                 {org.email}
                               </Text>
                              </HStack>
                            )}
                          </VStack>
                        </VStack>
                      </Box>

                      {/* Actions */}
                      <Box p="4">
                        <VStack gap="2" align="stretch">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="solid"
                            borderRadius="lg"
                            onClick={() => viewPublicPage(org)}
                            _hover={{
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s ease"
                          >
                            <HStack gap="2">
                              <Eye size={14} />
                              <Text>Publieke Pagina</Text>
                            </HStack>
                          </Button>
                          
                          <Button
                            size="sm"
                            colorScheme="green"
                            variant="solid"
                            borderRadius="lg"
                            onClick={() => goToOrganisatieDashboard(org)}
                            _hover={{
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s ease"
                          >
                            <HStack gap="2">
                              <Wrench size={14} />
                              <Text>Support Dashboard</Text>
                            </HStack>
                          </Button>
                          
                          <Button
                            size="sm"
                            colorScheme="purple"
                            variant="solid"
                            borderRadius="lg"
                            onClick={() => loginAsOrganisatie(org)}
                            _hover={{
                              transform: "translateY(-1px)"
                            }}
                            transition="all 0.2s ease"
                          >
                            <HStack gap="2">
                              <User size={14} />
                              <Text>Login als Organisatie</Text>
                            </HStack>
                          </Button>
                        </VStack>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>

          {/* Quick Actions */}
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
              bgGradient="linear(135deg, gray.50 0%, white 100%)"
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
                    Systeembeheer
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Geavanceerde beheertools en statistieken
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
                <Box
                  p="6"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                  _hover={{ 
                    shadow: "lg", 
                    transform: "translateY(-2px)",
                    borderColor: "purple.300"
                  }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  onClick={() => alert('Systeemstatistieken feature komt binnenkort!')}
                >
                  <VStack gap="4">
                    <Box 
                      p="4" 
                      borderRadius="xl" 
                      bgGradient="linear(135deg, #667eea, #764ba2)"
                      color="white"
                    >
                      <BarChart3 size={32} />
                    </Box>
                    <VStack gap="1">
                      <Text fontWeight="bold" color="gray.800">Systeemstatistieken</Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        Detailleerde analytics en rapportages
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
                
                <Box
                  p="6"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                  _hover={{ 
                    shadow: "lg", 
                    transform: "translateY(-2px)",
                    borderColor: "orange.300"
                  }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  onClick={() => alert('Gebruikersbeheer feature komt binnenkort!')}
                >
                  <VStack gap="4">
                    <Box 
                      p="4" 
                      borderRadius="xl" 
                      bgGradient="linear(135deg, #f59e0b, #d97706)"
                      color="white"
                    >
                      <Users size={32} />
                    </Box>
                    <VStack gap="1">
                      <Text fontWeight="bold" color="gray.800">Gebruikersbeheer</Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        Beheer accounts en permissies
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
                
                <Box
                  p="6"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                  _hover={{ 
                    shadow: "lg", 
                    transform: "translateY(-2px)",
                    borderColor: "teal.300"
                  }}
                  transition="all 0.3s ease"
                  cursor="pointer"
                  onClick={() => alert('Systeemlogboek feature komt binnenkort!')}
                >
                  <VStack gap="4">
                    <Box 
                      p="4" 
                      borderRadius="xl" 
                      bgGradient="linear(135deg, #10b981, #059669)"
                      color="white"
                    >
                      <FileText size={32} />
                    </Box>
                    <VStack gap="1">
                      <Text fontWeight="bold" color="gray.800">Systeemlogboek</Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        Activiteitenlogs en troubleshooting
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </Box>
          </Box>
        </VStack>
      </Container>

      {/* Modal for new organisation - keeping existing modal code but with updated styling */}
      {showModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="blackAlpha.600"
          backdropFilter="blur(8px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
          p={4}
        >
          <Box
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            width="700px"
            maxWidth="95%"
            maxHeight="90vh"
            display="flex"
            flexDirection="column"
            border="1px solid"
            borderColor="gray.200"
          >
            {/* Header */}
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <HStack>
                <Building2 size={20} color="#805ad5" />
                <Text fontSize="lg" fontWeight="bold">
                  Nieuwe Organisatie Aanmaken
                </Text>
              </HStack>
            </Box>
            
            {/* Scrollable content */}
            <Box p={6} overflowY="auto" flex={1}>
              <VStack gap="4" align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap="4">
                  <GridItem colSpan={{ base: 2, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <Building2 size={16} color="#374151" />
                        <Text>Organisatie Naam *</Text>
                      </HStack>
                      <Input
                        value={formData.naam}
                        onChange={(e) => handleInputChange('naam', e.target.value)}
                        placeholder="Bijv. Kinderopvang De Bloem"
                      />
                    </Box>
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 2, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <Globe size={16} color="#374151" />
                        <Text>Slug (URL) *</Text>
                      </HStack>
                      <Input
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value)}
                        placeholder="kinderopvang-de-bloem"
                      />
                    </Box>
                  </GridItem>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap="4">
                  <GridItem colSpan={{ base: 2, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <Mail size={16} color="#374151" />
                        <Text>E-mail</Text>
                      </HStack>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="info@organisatie.nl"
                      />
                    </Box>
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 2, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <Phone size={16} color="#374151" />
                        <Text>Telefoon</Text>
                      </HStack>
                      <Input
                        value={formData.telefoon}
                        onChange={(e) => handleInputChange('telefoon', e.target.value)}
                        placeholder="020-1234567"
                      />
                    </Box>
                  </GridItem>
                </Grid>

                <Box>
                  <HStack mb={2}>
                    <Home size={16} color="#374151" />
                    <Text>Adres</Text>
                  </HStack>
                  <Input
                    value={formData.adres}
                    onChange={(e) => handleInputChange('adres', e.target.value)}
                    placeholder="Hoofdstraat 123"
                  />
                </Box>

                <Grid templateColumns="repeat(3, 1fr)" gap="4">
                  <GridItem colSpan={{ base: 3, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <MapPin size={16} color="#374151" />
                        <Text>Postcode</Text>
                      </HStack>
                      <Input
                        value={formData.postcode}
                        onChange={(e) => handleInputChange('postcode', e.target.value)}
                        placeholder="1234AB"
                      />
                    </Box>
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 3, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <MapPin size={16} color="#374151" />
                        <Text>Plaats</Text>
                      </HStack>
                      <Input
                        value={formData.plaats}
                        onChange={(e) => handleInputChange('plaats', e.target.value)}
                        placeholder="Amsterdam"
                      />
                    </Box>
                  </GridItem>
                  
                  <GridItem colSpan={{ base: 3, md: 1 }}>
                    <Box>
                      <HStack mb={2}>
                        <Globe size={16} color="#374151" />
                        <Text>Website</Text>
                      </HStack>
                      <Input
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.organisatie.nl"
                      />
                    </Box>
                  </GridItem>
                </Grid>

                <Box borderTop="1px solid" borderColor="gray.200" pt="4" mt="4">
                  <HStack mb="4">
                    <User size={18} color="#374151" />
                    <Text fontSize="lg" fontWeight="bold">Beheerder Account</Text>
                  </HStack>
                  
                  <Grid templateColumns="repeat(2, 1fr)" gap="4">
                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <Box>
                        <HStack mb={2}>
                          <Mail size={16} color="#374151" />
                          <Text>Beheerder E-mail *</Text>
                        </HStack>
                        <Input
                          type="email"
                          value={formData.beheerderEmail}
                          onChange={(e) => handleInputChange('beheerderEmail', e.target.value)}
                          placeholder="admin@organisatie.nl"
                        />
                      </Box>
                    </GridItem>
                    
                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <Box>
                        <HStack mb={2}>
                          <Lock size={16} color="#374151" />
                          <Text>Wachtwoord *</Text>
                        </HStack>
                        <Input
                          type="password"
                          value={formData.beheerderWachtwoord}
                          onChange={(e) => handleInputChange('beheerderWachtwoord', e.target.value)}
                          placeholder="Minimaal 8 karakters"
                        />
                      </Box>
                    </GridItem>
                  </Grid>
                </Box>

                <Box bg="blue.50" p="3" borderRadius="md">
                  <HStack gap="2">
                    <Globe size={16} color="#1d4ed8" />
                    <Text fontSize="sm" color="blue.700">
                      <strong>Preview URL:</strong> /rekentool/{formData.slug || '[slug]'}
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </Box>

            {/* Footer */}
            <Box p={6} borderTop="1px solid" borderColor="gray.200">
              <Box display="flex" gap={3} justifyContent="flex-end">
                <Button variant="outline" onClick={closeModal}>
                  Annuleren
                </Button>
                <Button 
                  colorScheme="purple" 
                  onClick={createOrganisatie}
                  loading={createLoading}
                  disabled={!formData.naam || !formData.slug || !formData.beheerderEmail || !formData.beheerderWachtwoord}
                >
                  <HStack gap="2">
                    <Plus size={16} />
                    <Text>Organisatie Aanmaken</Text>
                  </HStack>
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SuperuserDashboard; 