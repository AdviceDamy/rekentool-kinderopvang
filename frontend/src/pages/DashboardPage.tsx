import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Badge,
  SimpleGrid,
  Card,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Baby, DollarSign, ExternalLink, Copy, Lightbulb, Target } from 'lucide-react';
import { opvangvormenAPI, tarievenAPI } from '../services/api';

interface Stats {
  opvangvormen: number;
  tarieven: number;
}

const DashboardPage: React.FC = () => {
  const { user, organisatie } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ opvangvormen: 0, tarieven: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Haal statistieken op via de API services
      const [opvangvormen, tarieven] = await Promise.all([
        opvangvormenAPI.getAll(),
        tarievenAPI.getAll()
      ]);

      setStats({
        opvangvormen: opvangvormen.length || 0,
        tarieven: tarieven.length || 0
      });
    } catch (error) {
      console.error('Fout bij laden statistieken:', error);
      // Fallback naar 0 als er een fout optreedt
      setStats({ opvangvormen: 0, tarieven: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === UserRole.SUPERUSER) {
    navigate('/superuser');
    return null;
  }

  if (loading) {
    return (
      <Box p="6">
        <Text>Laden...</Text>
      </Box>
    );
  }

  return (
    <Box p="6" maxW="7xl" mx="auto">
      <VStack gap="6" align="stretch">
        {/* Welcome Header */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <VStack align="start" gap="3">
            <Text fontSize="2xl" fontWeight="bold">
              Welkom bij de Rekentool
            </Text>
            <Text color="gray.600">
              {organisatie ? `Beheer uw kinderopvang data voor ${organisatie.naam}` : 'Beheer uw kinderopvang data'}
            </Text>
            {user && (
              <HStack>
                <Badge colorPalette="green">Ingelogd als {user.email}</Badge>
                {organisatie && <Badge colorPalette="blue">{organisatie.naam}</Badge>}
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
          <Box bg="white" p="6" borderRadius="lg" shadow="sm">
            <VStack align="start" gap="3">
              <HStack>
                <Baby size={24} color="#3b82f6" />
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {loading ? '...' : stats.opvangvormen}
                </Text>
              </HStack>
              <Text color="gray.600">Opvangvormen geconfigureerd</Text>
            </VStack>
          </Box>
          
          <Box bg="white" p="6" borderRadius="lg" shadow="sm">
            <VStack align="start" gap="3">
              <HStack>
                <DollarSign size={24} color="#10b981" />
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {loading ? '...' : stats.tarieven}
                </Text>
              </HStack>
              <Text color="gray.600">Tarieven ingesteld</Text>
            </VStack>
          </Box>
          
          <Box bg="white" p="6" borderRadius="lg" shadow="sm">
            <VStack align="start" gap="3">
              <HStack>
                <Badge colorPalette={stats.opvangvormen > 0 && stats.tarieven > 0 ? 'green' : 'orange'}>
                  {stats.opvangvormen > 0 && stats.tarieven > 0 ? 'Operationeel' : 'Configuratie nodig'}
                </Badge>
              </HStack>
              <Text color="gray.600">Status rekentool</Text>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Quick Actions */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="6">Beheer</Text>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <Card.Root>
              <Card.Body>
                <VStack align="start" gap="4">
                  <HStack>
                    <Baby size={20} color="#3b82f6" />
                    <Text fontSize="lg" fontWeight="semibold">Opvangvormen</Text>
                  </HStack>
                  <Text color="gray.600">
                    Beheer de verschillende opvangvormen van uw organisatie zoals KDV, BSO, gastouder, etc.
                  </Text>
                  <Button 
                    colorPalette="blue" 
                    onClick={() => navigate('/opvangvormen')}
                    width="full"
                  >
                    Opvangvormen beheren
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Body>
                <VStack align="start" gap="4">
                  <HStack>
                    <DollarSign size={20} color="#10b981" />
                    <Text fontSize="lg" fontWeight="semibold">Tarieven</Text>
                  </HStack>
                  <Text color="gray.600">
                    Stel tarieven in voor uw opvangvormen. Per uur, per dag of vaste maandbedragen.
                  </Text>
                  <Button 
                    colorPalette="green" 
                    onClick={() => navigate('/tarieven')}
                    width="full"
                  >
                    Tarieven beheren
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Box>

        {/* Rekenmodule - NIEUW IN STAP 3 */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <HStack mb="4">
            <Target size={20} color="#374151" />
            <Text fontSize="xl" fontWeight="bold">Publieke Rekenmodule</Text>
          </HStack>
          <Text color="gray.600" mb="4">
            Uw rekenmodule is nu beschikbaar voor ouders! Deel de onderstaande link zodat ouders 
            eenvoudig de kosten kunnen berekenen.
          </Text>
          
          <Box bg="gray.50" p="4" borderRadius="md" mb="4">
            <Text fontSize="sm" fontWeight="medium" mb="2">Publieke link:</Text>
            <Text 
              fontSize="sm" 
              fontFamily="mono" 
              bg="white" 
              p="2" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="gray.200"
            >
              {window.location.origin}/rekentool/zonnebloem
            </Text>
          </Box>

          <HStack gap="4">
            <Button 
              onClick={() => window.open('/rekentool/zonnebloem', '_blank')}
              colorPalette="blue"
              size="sm"
            >
              <HStack gap="2">
                <ExternalLink size={14} />
                <Text>Rekenmodule openen</Text>
              </HStack>
            </Button>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/rekentool/zonnebloem`);
              }}
              variant="outline"
              size="sm"
            >
              <HStack gap="2">
                <Copy size={14} />
                <Text>Link kopiëren</Text>
              </HStack>
            </Button>
          </HStack>

          <Box mt="4" p="4" bg="blue.50" borderRadius="md">
            <HStack gap="2" mb="1">
              <Lightbulb size={16} color="#1d4ed8" />
              <Text fontSize="sm" color="blue.800" fontWeight="medium">Tip</Text>
            </HStack>
            <Text fontSize="sm" color="blue.700">
              U kunt deze link op uw website plaatsen of delen met ouders via e-mail of sociale media.
            </Text>
          </Box>
        </Box>

        {/* Status */}
        <Box bg="white" p="6" borderRadius="lg" shadow="sm">
          <Text fontSize="xl" fontWeight="bold" mb="4">Status & Aanbevelingen</Text>
          
          <VStack align="stretch" gap="3">
            {stats.opvangvormen === 0 && (
              <Box p="4" bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                <Text fontWeight="medium" color="orange.800">
                  Geen opvangvormen geconfigureerd
                </Text>
                <Text fontSize="sm" color="orange.700">
                  Voeg minimaal één opvangvorm toe om te kunnen beginnen met tarieven.
                </Text>
              </Box>
            )}
            
            {stats.tarieven === 0 && stats.opvangvormen > 0 && (
              <Box p="4" bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                <Text fontWeight="medium" color="orange.800">
                  Geen tarieven ingesteld
                </Text>
                <Text fontSize="sm" color="orange.700">
                  Stel tarieven in voor uw opvangvormen zodat ouders kostenberekeningen kunnen maken.
                </Text>
              </Box>
            )}
            
            {stats.opvangvormen > 0 && stats.tarieven > 0 && (
              <Box p="4" bg="green.50" borderRadius="md" borderLeft="4px solid" borderColor="green.400">
                <Text fontWeight="medium" color="green.800">
                  Rekentool is operationeel!
                </Text>
                <Text fontSize="sm" color="green.700">
                  Ouders kunnen nu kostenberekeningen maken voor uw organisatie.
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default DashboardPage; 