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
  GridItem
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
  Home
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

  if (loading) {
    return (
      <Box p="6" display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p="6" maxW="7xl" mx="auto">
      <VStack gap="6" align="stretch">
        {/* Header */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <HStack justifyContent="space-between" alignItems="center">
            <Box>
              <HStack mb="2">
                <Settings size={28} color="#805ad5" />
                <Text fontSize="2xl" fontWeight="bold">Superuser Dashboard</Text>
              </HStack>
              <Text color="gray.600">Beheer alle organisaties in het systeem</Text>
            </Box>
            <Badge colorPalette="purple" size="lg">
              {user?.email}
            </Badge>
          </HStack>
        </Box>

        {/* Statistics */}
        <HStack gap="6">
          <Box bg="white" p="6" borderRadius="lg" shadow="sm" flex="1">
            <VStack align="start" gap="2">
              <HStack>
                <Building2 size={20} color="#805ad5" />
                <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                  {organisaties.length}
                </Text>
              </HStack>
              <Text color="gray.600">Totaal Organisaties</Text>
            </VStack>
          </Box>
          
          <Box bg="white" p="6" borderRadius="lg" shadow="sm" flex="1">
            <VStack align="start" gap="2">
              <HStack>
                <Building2 size={20} color="#10b981" />
                <Text fontSize="3xl" fontWeight="bold" color="green.600">
                  {organisaties.filter(o => o.actief).length}
                </Text>
              </HStack>
              <Text color="gray.600">Actieve Organisaties</Text>
            </VStack>
          </Box>
        </HStack>

        {/* Organisaties List */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <HStack justifyContent="space-between" alignItems="center" mb="6">
            <HStack>
              <Building2 size={20} color="#374151" />
              <Text fontSize="xl" fontWeight="bold">Organisaties Overzicht</Text>
            </HStack>
            <Button 
              colorPalette="purple" 
              onClick={openModal}
            >
              <HStack gap="2">
                <Plus size={16} />
                <Text>Nieuwe Organisatie</Text>
              </HStack>
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
            {organisaties.map((org) => (
              <Box
                key={org.id}
                p="4"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
                _hover={{ shadow: 'md', borderColor: 'purple.300' }}
                transition="all 0.2s"
              >
                <VStack align="stretch" gap="3">
                  <Box>
                    <HStack justifyContent="space-between" alignItems="start">
                      <Text fontWeight="bold" fontSize="lg" color="gray.800">
                        {org.naam}
                      </Text>
                      <Badge colorPalette={org.actief ? 'green' : 'red'} size="sm">
                        {org.actief ? 'Actief' : 'Inactief'}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.500" fontFamily="mono">
                      /{org.slug}
                    </Text>
                    
                    {org.plaats && (
                      <HStack gap="1">
                        <MapPin size={14} color="#6b7280" />
                        <Text fontSize="sm" color="gray.600">
                          {org.plaats}
                        </Text>
                      </HStack>
                    )}
                    
                    {org.email && (
                      <HStack gap="1">
                        <Mail size={14} color="#6b7280" />
                        <Text fontSize="sm" color="gray.600">
                          {org.email}
                        </Text>
                      </HStack>
                    )}
                  </Box>

                  <VStack gap="2" align="stretch">
                    <Button
                      size="sm"
                      colorPalette="blue"
                      onClick={() => viewPublicPage(org)}
                      width="full"
                    >
                      <HStack gap="2">
                        <Eye size={14} />
                        <Text>Bekijk Publieke Pagina</Text>
                      </HStack>
                    </Button>
                    
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => goToOrganisatieDashboard(org)}
                      width="full"
                    >
                      <HStack gap="2">
                        <Wrench size={14} />
                        <Text>Support Dashboard</Text>
                      </HStack>
                    </Button>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>

          {organisaties.length === 0 && (
            <Box textAlign="center" py="8">
              <VStack gap="3">
                <Building2 size={48} color="#9ca3af" />
                <Text color="gray.500" fontSize="lg">
                  Geen organisaties gevonden
                </Text>
              </VStack>
            </Box>
          )}
        </Box>

        {/* Quick Actions */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <HStack mb="4">
            <Settings size={20} color="#374151" />
            <Text fontSize="xl" fontWeight="bold">Quick Actions</Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
            <Button
              colorPalette="purple"
              onClick={() => alert('Systeemstatistieken feature komt binnenkort!')}
              height="auto"
              p="4"
              variant="outline"
            >
              <VStack gap="2">
                <BarChart3 size={24} />
                <Text>Systeemstatistieken</Text>
              </VStack>
            </Button>
            
            <Button
              colorPalette="orange"
              onClick={() => alert('Gebruikersbeheer feature komt binnenkort!')}
              height="auto"
              p="4"
              variant="outline"
            >
              <VStack gap="2">
                <Users size={24} />
                <Text>Gebruikersbeheer</Text>
              </VStack>
            </Button>
            
            <Button
              colorPalette="teal"
              onClick={() => alert('Systeemlogboek feature komt binnenkort!')}
              height="auto"
              p="4"
              variant="outline"
            >
              <VStack gap="2">
                <FileText size={24} />
                <Text>Systeemlogboek</Text>
              </VStack>
            </Button>
          </SimpleGrid>
        </Box>
      </VStack>

      {/* Modal voor nieuwe organisatie */}
      {showModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="rgba(0, 0, 0, 0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
          p={4}
        >
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="lg"
            width="700px"
            maxWidth="95%"
            maxHeight="90vh"
            display="flex"
            flexDirection="column"
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
                  colorPalette="purple" 
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