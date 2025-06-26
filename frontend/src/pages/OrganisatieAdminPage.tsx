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
  Breadcrumb
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

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

const OrganisatieAdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [inkomensklassen, setInkomensklassen] = useState<Inkomensklasse[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingToeslag, setSavingToeslag] = useState(false);

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

  if (loading) {
    return (
      <Box p="6" display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!organisatie) {
    return (
      <Box p="6">
        <Text color="red.600" fontSize="lg">Organisatie niet gevonden</Text>
        <Button mt="4" onClick={() => navigate('/superuser')}>
          Terug naar Superuser Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box p="6" maxW="7xl" mx="auto">
      <VStack gap="6" align="stretch">
        {/* Breadcrumb */}
        <Box>
          <HStack gap="2" mb="4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/superuser')}
              colorPalette="purple"
            >
              ← Superuser Dashboard
            </Button>
            <Text color="gray.400">/</Text>
            <Text fontWeight="medium">{organisatie.naam}</Text>
          </HStack>
        </Box>

        {/* Header */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <HStack justifyContent="space-between" alignItems="start">
            <Box>
              <Text fontSize="2xl" fontWeight="bold" mb="2">
                🛠️ Support: {organisatie.naam}
              </Text>
              <Text color="gray.600" mb="4">
                Beheer en ondersteuning voor deze organisatie
              </Text>
              
              <VStack align="start" gap="1">
                <Text fontSize="sm"><strong>Slug:</strong> /{organisatie.slug}</Text>
                {organisatie.email && <Text fontSize="sm"><strong>Email:</strong> {organisatie.email}</Text>}
                {organisatie.telefoon && <Text fontSize="sm"><strong>Telefoon:</strong> {organisatie.telefoon}</Text>}
                {organisatie.plaats && <Text fontSize="sm"><strong>Plaats:</strong> {organisatie.plaats}</Text>}
              </VStack>
            </Box>
            
            <VStack gap="2">
              <Badge colorPalette={organisatie.actief ? 'green' : 'red'} size="lg">
                {organisatie.actief ? 'Actief' : 'Inactief'}
              </Badge>
              <Button
                size="sm"
                colorPalette="blue"
                onClick={openPublicPage}
              >
                🔗 Open Publieke Pagina
              </Button>
            </VStack>
          </HStack>
        </Box>

        {/* Statistieken */}
        <HStack gap="6">
          <Box bg="white" p="6" borderRadius="lg" shadow="sm" flex="1">
            <Text fontSize="3xl" fontWeight="bold" color="blue.600">
              {opvangvormen.length}
            </Text>
            <Text color="gray.600">Opvangvormen</Text>
            <Text fontSize="sm" color="gray.500">
              {opvangvormen.filter(o => o.actief).length} actief
            </Text>
          </Box>
          
          <Box bg="white" p="6" borderRadius="lg" shadow="sm" flex="1">
            <Text fontSize="3xl" fontWeight="bold" color="green.600">
              {tarieven.length}
            </Text>
            <Text color="gray.600">Tarieven</Text>
            <Text fontSize="sm" color="gray.500">
              {tarieven.filter(t => t.actief).length} actief
            </Text>
          </Box>
        </HStack>

        {/* Opvangvormen Overzicht */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="4">👶 Opvangvormen</Text>
          
          {opvangvormen.length === 0 ? (
            <Box bg="yellow.50" p="4" borderRadius="md">
              <Text color="yellow.800">⚠️ Geen opvangvormen geconfigureerd</Text>
              <Text color="yellow.700" fontSize="sm">
                Deze organisatie moet eerst opvangvormen toevoegen via hun dashboard.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
              {opvangvormen.map((opvangvorm) => (
                <Box
                  key={opvangvorm.id}
                  p="4"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg={opvangvorm.actief ? "white" : "gray.50"}
                >
                  <HStack justifyContent="space-between" mb="2">
                    <Text fontWeight="medium">{opvangvorm.naam}</Text>
                    <Badge colorPalette={opvangvorm.actief ? 'green' : 'gray'} size="sm">
                      {opvangvorm.actief ? 'Actief' : 'Inactief'}
                    </Badge>
                  </HStack>
                  {opvangvorm.omschrijving && (
                    <Text fontSize="sm" color="gray.600">
                      {opvangvorm.omschrijving}
                    </Text>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Tarieven Overzicht */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="4">💰 Tarieven</Text>
          
          {tarieven.length === 0 ? (
            <Box bg="yellow.50" p="4" borderRadius="md">
              <Text color="yellow.800">⚠️ Geen tarieven geconfigureerd</Text>
              <Text color="yellow.700" fontSize="sm">
                Deze organisatie moet tarieven instellen voor hun opvangvormen.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
              {tarieven.map((tarief) => (
                <Box
                  key={tarief.id}
                  p="4"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg={tarief.actief ? "white" : "gray.50"}
                >
                  <HStack justifyContent="space-between" mb="2">
                    <Text fontWeight="medium">{tarief.naam}</Text>
                    <Badge colorPalette={tarief.actief ? 'green' : 'gray'} size="sm">
                      {tarief.actief ? 'Actief' : 'Inactief'}
                    </Badge>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold" color="green.600">
                    €{tarief.tarief.toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                    Per {tarief.type === 'uur' ? 'uur' : tarief.type === 'dag' ? 'dag' : 'maand'}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* Toeslag Instellingen */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="4">🏛️ Kinderopvangtoeslag Instellingen</Text>
          
          <VStack gap="6" align="stretch">
            {/* Automatisch berekenen */}
            <Box>
              <HStack mb="2">
                <input
                  type="checkbox"
                  checked={organisatie.toeslag_automatisch_berekenen !== false}
                  onChange={(e) => setOrganisatie({
                    ...organisatie,
                    toeslag_automatisch_berekenen: e.target.checked
                  })}
                />
                <Text fontWeight="medium">Automatisch toeslagberekening inschakelen</Text>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Als dit uitstaat, zien ouders geen toeslagberekening in de rekentool
              </Text>
            </Box>

            {organisatie.toeslag_automatisch_berekenen !== false && (
              <>
                {/* Toeslagjaar selectie */}
                <Box>
                  <Text mb="2" fontWeight="medium">Actief toeslagjaar *</Text>
                  <select
                    value={organisatie.actief_toeslagjaar || ''}
                    onChange={(e) => handleToeslagjarChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Geen toeslagjaar geselecteerd</option>
                    {toeslagtabellen.map((tabel) => (
                      <option key={tabel.jaar} value={tabel.jaar}>
                        {tabel.jaar} {tabel.actief ? '(Actief)' : '(Inactief)'}
                      </option>
                    ))}
                  </select>
                  <Text fontSize="sm" color="gray.500" mt="1">
                    Selecteer welke toeslagtabel gebruikt moet worden voor berekeningen
                  </Text>
                </Box>

                {/* Standaard inkomensklasse */}
                {inkomensklassen.length > 0 && (
                  <Box>
                    <Text mb="2" fontWeight="medium">Standaard inkomensklasse (optioneel)</Text>
                    <select
                      value={organisatie.standaard_inkomensklasse || ''}
                      onChange={(e) => setOrganisatie({
                        ...organisatie,
                        standaard_inkomensklasse: e.target.value || undefined
                      })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        backgroundColor: 'white'
                      }}
                    >
                      <option value="">Ouders moeten zelf kiezen</option>
                      {inkomensklassen.map((klasse) => (
                        <option key={klasse.id} value={JSON.stringify(klasse)}>
                          {klasse.label} ({klasse.perc_first_child}% toeslag)
                        </option>
                      ))}
                    </select>
                    <Text fontSize="sm" color="gray.500" mt="1">
                      Als u dit instelt, hoeven ouders niet zelf hun inkomensklasse te selecteren
                    </Text>
                  </Box>
                )}

                {/* Gemeentelijke toeslag */}
                <Box>
                  <HStack mb="2">
                    <input
                      type="checkbox"
                      checked={organisatie.gemeente_toeslag_actief || false}
                      onChange={(e) => setOrganisatie({
                        ...organisatie,
                        gemeente_toeslag_actief: e.target.checked
                      })}
                    />
                    <Text fontWeight="medium">Gemeentelijke toeslag actief</Text>
                  </HStack>
                  
                  {organisatie.gemeente_toeslag_actief && (
                    <Box mt="3">
                      <Text mb="2">Gemeentelijk toeslagpercentage</Text>
                      <HStack>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={organisatie.gemeente_toeslag_percentage || 0}
                          onChange={(e) => setOrganisatie({
                            ...organisatie,
                            gemeente_toeslag_percentage: parseFloat(e.target.value) || 0
                          })}
                          style={{
                            padding: '0.5rem',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            width: '120px'
                          }}
                        />
                        <Text>%</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.500" mt="1">
                        Extra percentage dat de gemeente vergoedt (bijv. Amsterdam 4%)
                      </Text>
                    </Box>
                  )}
                </Box>
              </>
            )}

            {/* Opslaan knop */}
            <Box>
              <Button
                onClick={saveToeslagInstellingen}
                colorScheme="blue"
                loading={savingToeslag}
              >
                {savingToeslag ? 'Opslaan...' : '💾 Toeslag Instellingen Opslaan'}
              </Button>
            </Box>
          </VStack>
        </Box>

        {/* Status & Acties */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="4">🔧 Support Acties</Text>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <Button
              colorPalette="blue"
              onClick={openPublicPage}
              height="auto"
              p="4"
            >
              <VStack gap="2">
                <Text fontSize="2xl">🔍</Text>
                <Text>Test Publieke Pagina</Text>
                <Text fontSize="sm" color="blue.600">
                  Bekijk hoe ouders de rekentool zien
                </Text>
              </VStack>
            </Button>
            
            <Button
              colorPalette="purple"
              onClick={() => alert('Directe configuratie editing komt binnenkort!')}
              height="auto"
              p="4"
            >
              <VStack gap="2">
                <Text fontSize="2xl">⚙️</Text>
                <Text>Configuratie Bewerken</Text>
                <Text fontSize="sm" color="purple.600">
                  Wijzig instellingen namens organisatie
                </Text>
              </VStack>
            </Button>
          </SimpleGrid>

          {/* Configuratie Status */}
          <Box mt="6" p="4" borderRadius="md" bg={
            opvangvormen.length > 0 && tarieven.length > 0 ? "green.50" : "yellow.50"
          }>
            {opvangvormen.length > 0 && tarieven.length > 0 ? (
              <>
                <Text fontWeight="bold" color="green.800">✅ Volledig geconfigureerd</Text>
                <Text color="green.700" fontSize="sm">
                  Deze organisatie heeft {opvangvormen.length} opvangvormen en {tarieven.length} tarieven ingesteld. 
                  De rekentool is volledig functioneel voor ouders.
                </Text>
              </>
            ) : (
              <>
                <Text fontWeight="bold" color="yellow.800">⚠️ Configuratie incompleet</Text>
                <Text color="yellow.700" fontSize="sm">
                  {opvangvormen.length === 0 && "Opvangvormen ontbreken. "}
                  {tarieven.length === 0 && "Tarieven ontbreken. "}
                  Ouders kunnen nog geen berekeningen maken.
                </Text>
              </>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default OrganisatieAdminPage; 