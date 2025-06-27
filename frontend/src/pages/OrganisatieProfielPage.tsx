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
  Spinner,
  Input
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  Building2, 
  Settings, 
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Info
} from 'lucide-react';

const OrganisatieProfielPage: React.FC = () => {
  const { user, organisatie } = useAuth();
  const navigate = useNavigate();
  
  const [organisatieData, setOrganisatieData] = useState({
    naam: '',
    email: '',
    telefoon: '',
    adres: '',
    postcode: '',
    plaats: '',
    website: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === UserRole.SUPERUSER) {
      navigate('/superuser');
      return;
    }
    
    if (organisatie) {
      setOrganisatieData({
        naam: organisatie.naam || '',
        email: organisatie.email || '',
        telefoon: organisatie.telefoon || '',
        adres: organisatie.adres || '',
        postcode: organisatie.postcode || '',
        plaats: organisatie.plaats || '',
        website: organisatie.website || ''
      });
      setLoading(false);
    }
  }, [user, navigate, organisatie]);

  const handleInputChange = (field: string, value: string) => {
    setOrganisatieData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveOrganisatieProfiel = async () => {
    if (!organisatie?.id) return;
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5007'}/api/organisaties/${organisatie.id}/profiel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organisatieData)
      });

      if (response.ok) {
        alert('Organisatie profiel opgeslagen!');
        // Optioneel: refresh de context
        window.location.reload();
      } else {
        throw new Error('Fout bij opslaan');
      }
    } catch (error) {
      console.error('Fout bij opslaan organisatie profiel:', error);
      alert('Kon organisatie profiel niet opslaan');
    } finally {
      setSaving(false);
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
          <Text color="gray.800" fontSize="lg">Organisatie profiel laden...</Text>
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
                <Building2 size={32} color="blue.600" />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  Organisatie Profiel
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Beheer uw organisatie informatie en instellingen
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
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-12" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* General Information */}
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
                  <Building2 size={20} color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🏢 Algemene Informatie
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Basis organisatie gegevens
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <VStack gap="6" align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
                  {/* Organisation Name */}
                  <VStack align="start" gap="2">
                    <Text fontWeight="medium" color="gray.700">
                      Organisatie Naam *
                    </Text>
                    <Input
                      value={organisatieData.naam}
                      onChange={(e) => handleInputChange('naam', e.target.value)}
                      placeholder="Naam van uw organisatie"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6"
                      }}
                    />
                  </VStack>

                  {/* Email */}
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Mail size={16} color="#6b7280" />
                      <Text fontWeight="medium" color="gray.700">
                        E-mailadres
                      </Text>
                    </HStack>
                    <Input
                      type="email"
                      value={organisatieData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@organisatie.nl"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6"
                      }}
                    />
                  </VStack>

                  {/* Phone */}
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Phone size={16} color="#6b7280" />
                      <Text fontWeight="medium" color="gray.700">
                        Telefoonnummer
                      </Text>
                    </HStack>
                    <Input
                      type="tel"
                      value={organisatieData.telefoon}
                      onChange={(e) => handleInputChange('telefoon', e.target.value)}
                      placeholder="06-12345678"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6"
                      }}
                    />
                  </VStack>

                  {/* Website */}
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Globe size={16} color="#6b7280" />
                      <Text fontWeight="medium" color="gray.700">
                        Website
                      </Text>
                    </HStack>
                    <Input
                      type="url"
                      value={organisatieData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://www.organisatie.nl"
                      bg="white"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="lg"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6"
                      }}
                    />
                  </VStack>
                </SimpleGrid>

                {/* Address Section */}
                <Box 
                  p="4" 
                  bg="gray.50" 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <HStack gap="2" mb="4">
                    <MapPin size={16} color="#6b7280" />
                    <Text fontWeight="medium" color="gray.700">
                      Adresgegevens
                    </Text>
                  </HStack>
                  
                  <VStack gap="4" align="stretch">
                    <VStack align="start" gap="2">
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Adres
                      </Text>
                      <Input
                        value={organisatieData.adres}
                        onChange={(e) => handleInputChange('adres', e.target.value)}
                        placeholder="Straatnaam 123"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.300"
                        borderRadius="lg"
                        _focus={{
                          borderColor: "blue.400",
                          boxShadow: "0 0 0 1px #3b82f6"
                        }}
                      />
                    </VStack>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                      <VStack align="start" gap="2">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          Postcode
                        </Text>
                        <Input
                          value={organisatieData.postcode}
                          onChange={(e) => handleInputChange('postcode', e.target.value)}
                          placeholder="1234 AB"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="lg"
                          _focus={{
                            borderColor: "blue.400",
                            boxShadow: "0 0 0 1px #3b82f6"
                          }}
                        />
                      </VStack>

                      <VStack align="start" gap="2">
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          Plaats
                        </Text>
                        <Input
                          value={organisatieData.plaats}
                          onChange={(e) => handleInputChange('plaats', e.target.value)}
                          placeholder="Amsterdam"
                          bg="white"
                          border="1px solid"
                          borderColor="gray.300"
                          borderRadius="lg"
                          _focus={{
                            borderColor: "blue.400",
                            boxShadow: "0 0 0 1px #3b82f6"
                          }}
                        />
                      </VStack>
                    </SimpleGrid>
                  </VStack>
                </Box>

                {/* Info Box */}
                <Box 
                  p="4" 
                  bg="blue.50" 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <HStack gap="2" mb="2">
                    <Info size={16} color="#1d4ed8" />
                    <Text fontSize="sm" color="blue.800" fontWeight="medium">Informatie</Text>
                  </HStack>
                  <VStack align="start" gap="1">
                    <Text fontSize="sm" color="blue.700">
                      • Deze gegevens worden getoond op uw publieke rekentool pagina
                    </Text>
                    <Text fontSize="sm" color="blue.700">
                      • Ouders kunnen contact met u opnemen via deze gegevens
                    </Text>
                    <Text fontSize="sm" color="blue.700">
                      • Velden met * zijn verplicht
                    </Text>
                  </VStack>
                </Box>

                {/* Save Button */}
                <Button
                  colorScheme="blue"
                  variant="solid"
                  borderRadius="lg"
                  onClick={saveOrganisatieProfiel}
                  loading={saving}
                  size="lg"
                  _hover={{
                    transform: "translateY(-1px)"
                  }}
                  transition="all 0.2s ease"
                >
                  <HStack gap="2">
                    <Save size={16} />
                    <Text>{saving ? 'Opslaan...' : 'Profiel opslaan'}</Text>
                  </HStack>
                </Button>
              </VStack>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default OrganisatieProfielPage; 