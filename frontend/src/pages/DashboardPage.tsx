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
  Flex,
  Spinner,
  IconButton,
  Separator
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  Baby, 
  DollarSign, 
  ExternalLink, 
  Target, 
  Settings, 
  User,
  TrendingUp,
  Activity,
  Zap,
  Star,
  Shield,
  CreditCard,
  Building2,
  ArrowRight,
  Eye,
  BarChart3,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Rocket,
  Users,
  FileText,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  RefreshCw,
  Globe,
  Bookmark
} from 'lucide-react';
import { opvangvormenAPI, tarievenAPI } from '../services/api';
import { gradients } from '../theme';

interface Stats {
  opvangvormen: number;
  tarieven: number;
}

interface DashboardMetrics {
  totalSetupSteps: number;
  completedSteps: number;
  lastActivity: string;
  monthlyCalculations: number;
  activeConfigurations: number;
}

const DashboardPage: React.FC = () => {
  const { user, organisatie, isImpersonating, originalUser, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ opvangvormen: 0, tarieven: 0 });
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSetupSteps: 6,
    completedSteps: 0,
    lastActivity: new Date().toLocaleDateString('nl-NL'),
    monthlyCalculations: 0,
    activeConfigurations: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [organisatie]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel loading voor betere performance
      const [opvangvormen, tarieven] = await Promise.all([
        opvangvormenAPI.getAll(),
        tarievenAPI.getAll()
      ]);

      const newStats = {
        opvangvormen: opvangvormen.length || 0,
        tarieven: tarieven.length || 0
      };

      setStats(newStats);

      // Calculate metrics
      const completedSteps = [
        newStats.opvangvormen > 0,
        newStats.tarieven > 0,
        true, // Organisatie bestaat altijd
        true, // User is ingelogd
      ].filter(Boolean).length;

      setMetrics(prev => ({
        ...prev,
        completedSteps,
        activeConfigurations: newStats.opvangvormen + newStats.tarieven,
        monthlyCalculations: Math.floor(Math.random() * 150) + 20 // Simulate data
      }));

    } catch (error) {
      console.error('Fout bij laden dashboard data:', error);
      setStats({ opvangvormen: 0, tarieven: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    return Math.round((metrics.completedSteps / metrics.totalSetupSteps) * 100);
  };

  const getStatusColor = () => {
    const percentage = getCompletionPercentage();
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'yellow';
    return 'red';
  };

  const isSystemReady = () => stats.opvangvormen > 0 && stats.tarieven > 0;

  if (user?.role === UserRole.SUPERUSER) {
    navigate('/superuser');
    return null;
  }

  if (loading) {
    return (
      <Box 
        minH="100vh" 
        bg="gray.50"
        display="flex" 
        justifyContent="center" 
        alignItems="center"
      >
        <VStack gap="6">
          <Box position="relative">
            <Spinner size="xl" color="blue.500" />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
            >
              <Sparkles size={20} color="blue.600" />
            </Box>
          </Box>
          <VStack gap="2">
            <Text color="gray.800" fontSize="xl" fontWeight="semibold">
              Dashboard wordt geladen...
            </Text>
            <Text color="gray.600" fontSize="sm">
              Een moment geduld terwijl we uw gegevens ophalen
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="bg.subtle">
      {/* Hero Section */}
      <Box 
        bg="blue.50"
        minH="320px" 
        position="relative"
        overflow="hidden"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" pt="8" pb="20" position="relative" zIndex={1}>
          {/* Impersonation Banner */}
          {isImpersonating && (
            <Box 
              bg="white" 
              border="1px solid"
              borderColor="blue.200"
              p="4" 
              borderRadius="2xl" 
              mb="8"
              boxShadow="lg"
            >
              <HStack justify="space-between" align="center">
                <HStack gap="4">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="purple.100"
                    border="1px solid"
                    borderColor="purple.200"
                  >
                    <Shield size={24} color="purple.600" />
                  </Box>
                  <VStack align="start" gap="1">
                    <HStack gap="2">
                      <Text fontWeight="bold" fontSize="lg" color="gray.800">
                        🎭 Superuser Modus
                      </Text>
                      <Badge colorScheme="purple" variant="solid">ACTIEF</Badge>
                    </HStack>
                    <Text fontSize="md" color="gray.700">
                      Ingelogd als <strong>{organisatie?.naam}</strong>
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Originele gebruiker: {originalUser?.email}
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  size="lg"
                  colorScheme="purple"
                  variant="solid"
                  borderRadius="xl"
                  onClick={() => {
                    stopImpersonation?.();
                    navigate('/superuser');
                  }}
                >
                  <HStack gap="2">
                    <ArrowRight size={16} />
                    <Text>Terug naar Command Center</Text>
                  </HStack>
                </Button>
              </HStack>
            </Box>
          )}

          {/* Main Header */}
          <Flex justify="space-between" align="start" wrap="wrap" gap="6">
            <VStack align="start" gap="4" flex="1">
              <HStack gap="4">
                <Box
                  width="80px"
                  height="80px"
                  borderRadius="full"
                  bg="blue.100"
                  border="3px solid"
                  borderColor="blue.200"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                >
                  <Building2 size={32} color="blue.600" />
                  <Box
                    position="absolute"
                    bottom="0"
                    right="0"
                    width="20px"
                    height="20px"
                    borderRadius="full"
                    bg={isSystemReady() ? "green.500" : "orange.400"}
                    border="2px solid white"
                  />
                </Box>
                <VStack align="start" gap="1">
                  <Text fontSize="4xl" fontWeight="900" color="gray.800" letterSpacing="tight">
                    Dashboard
                  </Text>
                  <Text fontSize="xl" color="gray.600" fontWeight="medium">
                    {organisatie ? `Welkom bij ${organisatie.naam}` : 'Kinderopvang Rekentool'}
                  </Text>
                  <HStack gap="3" mt="2">
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
                        <User size={14} color="gray.600" />
                        <Text color="gray.700">{user?.email}</Text>
                      </HStack>
                    </Badge>
                    <Badge 
                      colorScheme={isSystemReady() ? 'green' : 'orange'}
                      variant="solid"
                      px="4" 
                      py="2" 
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      <HStack gap="2">
                        {isSystemReady() ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        <Text>{isSystemReady() ? 'Operationeel' : 'Setup Vereist'}</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
            </VStack>

            {/* Quick Stats in Hero */}
            <VStack align="end" gap="3">
              <VStack align="end" gap="1">
                <Text fontSize="3xl" fontWeight="900" color="gray.800">
                  {getCompletionPercentage()}%
                </Text>
                <Text fontSize="sm" color="gray.600">Setup Voltooid</Text>
              </VStack>
              <Box 
                w="120px" 
                h="12px" 
                bg="gray.200" 
                borderRadius="full" 
                overflow="hidden"
              >
                <Box 
                  h="full" 
                  bg={getStatusColor() === 'green' ? 'green.400' : getStatusColor() === 'yellow' ? 'yellow.400' : 'red.400'}
                  width={`${getCompletionPercentage()}%`}
                  transition="width 0.5s ease"
                />
              </Box>
              <Text fontSize="xs" color="gray.500">
                {metrics.completedSteps} van {metrics.totalSetupSteps} stappen
              </Text>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" mt="-16" position="relative" zIndex={2} pb="12">
        <VStack gap="8" align="stretch">
          
          {/* Key Metrics Cards - Modern Floating Design */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="6">
            {/* Opvangvormen Card */}
            <Box
              bg="bg.panel"
              borderRadius="3xl"
              p="8"
              shadow="2xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _hover={{ 
                shadow: "3xl", 
                transform: "translateY(-4px)",
                borderColor: "blue.200"
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              cursor="pointer"
              onClick={() => navigate('/opvangvormen')}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                bgGradient: gradients.blue
              }}
            >
              <VStack align="start" gap="6" position="relative">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="4" 
                    borderRadius="2xl" 
                    bg="blue.100"
                    border="1px solid"
                    borderColor="blue.200"
                    shadow="lg"
                  >
                    <Baby size={28} color="blue.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="4xl" fontWeight="900" color="fg" lineHeight="1">
                      {stats.opvangvormen}
                    </Text>
                    <Text fontSize="sm" color="blue.600" fontWeight="semibold">
                      Geconfigureerd
                    </Text>
                  </VStack>
                </HStack>
                <VStack align="start" gap="2" width="full">
                  <Text fontSize="lg" fontWeight="bold" color="fg">
                    Opvangvormen
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    KDV, BSO en Gastouder opties
                  </Text>
                  <HStack gap="2" mt="2">
                    <Box w="2px" h="4px" bg="blue.500" borderRadius="full" />
                    <Text fontSize="xs" color="fg.subtle">
                      Klik om te beheren
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Tarieven Card */}
            <Box
              bg="bg.panel"
              borderRadius="3xl"
              p="8"
              shadow="2xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _hover={{ 
                shadow: "3xl", 
                transform: "translateY(-4px)",
                borderColor: "green.200"
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              cursor="pointer"
              onClick={() => navigate('/tarieven')}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                bgGradient: gradients.green
              }}
            >
              <VStack align="start" gap="6" position="relative">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="4" 
                    borderRadius="2xl" 
                    bg="green.100"
                    border="1px solid"
                    borderColor="green.200"
                    shadow="lg"
                  >
                    <DollarSign size={28} color="green.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="4xl" fontWeight="900" color="fg" lineHeight="1">
                      {stats.tarieven}
                    </Text>
                    <Text fontSize="sm" color="green.600" fontWeight="semibold">
                      Ingesteld
                    </Text>
                  </VStack>
                </HStack>
                <VStack align="start" gap="2" width="full">
                  <Text fontSize="lg" fontWeight="bold" color="fg">
                    Tarieven
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Prijzen per uur, dag of maand
                  </Text>
                  <HStack gap="2" mt="2">
                    <Box w="2px" h="4px" bg="green.500" borderRadius="full" />
                    <Text fontSize="xs" color="fg.subtle">
                      Klik om aan te passen
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* System Status Card */}
            <Box
              bg="bg.panel"
              borderRadius="3xl"
              p="8"
              shadow="2xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _hover={{ 
                shadow: "3xl", 
                transform: "translateY(-4px)",
                borderColor: isSystemReady() ? "green.200" : "orange.200"
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                bgGradient: isSystemReady() ? gradients.green : gradients.orange
              }}
            >
              <VStack align="start" gap="6" position="relative">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="4" 
                    borderRadius="2xl" 
                    bg={isSystemReady() ? "green.100" : "orange.100"}
                    border="1px solid"
                    borderColor={isSystemReady() ? "green.200" : "orange.200"}
                    shadow="lg"
                  >
                    {isSystemReady() ? <Shield size={28} color="green.600" /> : <AlertCircle size={28} color="orange.600" />}
                  </Box>
                  <VStack align="end" gap="0">
                    <Badge 
                      colorScheme={isSystemReady() ? 'green' : 'orange'} 
                      variant="solid"
                      borderRadius="xl"
                      px="4"
                      py="2"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {isSystemReady() ? 'LIVE' : 'SETUP'}
                    </Badge>
                  </VStack>
                </HStack>
                <VStack align="start" gap="2" width="full">
                  <Text fontSize="lg" fontWeight="bold" color="fg">
                    Systeem Status
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {isSystemReady() 
                      ? 'Rekentool is operationeel' 
                      : 'Configuratie vereist'
                    }
                  </Text>
                  <HStack gap="2" mt="2">
                    <Box 
                      w="2px" 
                      h="4px" 
                      bg={isSystemReady() ? "green.500" : "orange.500"} 
                      borderRadius="full" 
                    />
                    <Text fontSize="xs" color="fg.subtle">
                      {isSystemReady() ? 'Alle systemen actief' : 'Actie vereist'}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>

            {/* Monthly Usage Card */}
            <Box
              bg="bg.panel"
              borderRadius="3xl"
              p="8"
              shadow="2xl"
              border="1px solid"
              borderColor="border.muted"
              position="relative"
              overflow="hidden"
              _hover={{ 
                shadow: "3xl", 
                transform: "translateY(-4px)",
                borderColor: "purple.200"
              }}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                bgGradient: gradients.purple
              }}
            >
              <VStack align="start" gap="6" position="relative">
                <HStack justify="space-between" width="full">
                  <Box 
                    p="4" 
                    borderRadius="2xl" 
                    bg="purple.100"
                    border="1px solid"
                    borderColor="purple.200"
                    shadow="lg"
                  >
                    <BarChart3 size={28} color="purple.600" />
                  </Box>
                  <VStack align="end" gap="0">
                    <Text fontSize="4xl" fontWeight="900" color="fg" lineHeight="1">
                      {metrics.monthlyCalculations}
                    </Text>
                    <Text fontSize="sm" color="purple.600" fontWeight="semibold">
                      Deze maand
                    </Text>
                  </VStack>
                </HStack>
                <VStack align="start" gap="2" width="full">
                  <Text fontSize="lg" fontWeight="bold" color="fg">
                    Berekeningen
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Door ouders uitgevoerd
                  </Text>
                  <HStack gap="2" mt="2">
                    <TrendingUp size={12} color="#8b5cf6" />
                    <Text fontSize="xs" color="fg.subtle">
                      +12% t.o.v. vorige maand
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Action Center - Two Column Layout */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="8">
            
            {/* Left Column - Primary Actions */}
            <Box
              bg="bg.panel"
              borderRadius="3xl"
              shadow="2xl"
              border="1px solid"
              borderColor="border.muted"
              overflow="hidden"
            >
              <Box 
                p="8" 
                bg="blue.50"
                borderBottom="1px solid"
                borderColor="blue.100"
                position="relative"
              >
                <HStack gap="4" position="relative">
                  <Box 
                    p="3" 
                    borderRadius="xl" 
                    bg="blue.100"
                    border="1px solid"
                    borderColor="blue.200"
                  >
                    <Rocket size={32} color="blue.600" />
                  </Box>
                  <VStack align="start" gap="1">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      🚀 Snelle Acties
                    </Text>
                    <Text fontSize="md" color="gray.600">
                      Beheer uw organisatie en instellingen
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <VStack gap="0" p="8">
                {/* Primary Actions */}
                {[
                  {
                    icon: Baby,
                    title: 'Opvangvormen Beheren',
                    description: 'KDV, BSO, Gastouder configureren',
                    badge: `${stats.opvangvormen} actief`,
                    color: 'blue',
                    path: '/opvangvormen'
                  },
                  {
                    icon: DollarSign,
                    title: 'Tarieven Instellen',
                    description: 'Prijzen per uur, dag of maand',
                    badge: `${stats.tarieven} tarieven`,
                    color: 'green',
                    path: '/tarieven'
                  },
                  {
                    icon: Target,
                    title: 'Rekentool Configureren',
                    description: 'Wizard stappen en publicatie',
                    badge: 'Geavanceerd',
                    color: 'purple',
                    path: '/rekentool-instellingen'
                  },
                  {
                    icon: CreditCard,
                    title: 'Toeslag Instellingen',
                    description: 'Kinderopvangtoeslag configuratie',
                    badge: 'Overheid',
                    color: 'orange',
                    path: '/toeslag-instellingen'
                  }
                ].map((action, index) => (
                  <Box key={index} width="full">
                    <HStack
                      p="4"
                      borderRadius="xl"
                      _hover={{ 
                        bg: "bg.muted",
                        transform: "translateX(8px)",
                        shadow: "md"
                      }}
                      transition="all 0.3s ease"
                      cursor="pointer"
                      onClick={() => navigate(action.path)}
                      justify="space-between"
                      align="center"
                    >
                      <HStack gap="4" flex="1">
                        <Box 
                          p="3" 
                          borderRadius="lg" 
                          bg={`${action.color}.50`}
                          color={`${action.color}.600`}
                        >
                          <action.icon size={20} />
                        </Box>
                        <VStack align="start" gap="1" flex="1">
                          <Text fontWeight="semibold" color="fg">
                            {action.title}
                          </Text>
                          <Text fontSize="sm" color="fg.muted">
                            {action.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack gap="3">
                        <Badge 
                          colorScheme={action.color} 
                          variant="subtle"
                          borderRadius="lg"
                          px="3"
                          py="1"
                        >
                          {action.badge}
                        </Badge>
                        <ChevronRight size={16} color="#9CA3AF" />
                      </HStack>
                    </HStack>
                    {index < 3 && <Separator my="2" />}
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* Right Column - Secondary Actions & Info */}
            <VStack gap="6" align="stretch">
              
              {/* Organisation Management */}
              <Box
                bg="bg.panel"
                borderRadius="3xl"
                p="8"
                shadow="2xl"
                border="1px solid"
                borderColor="border.muted"
                _hover={{ shadow: "3xl" }}
                transition="all 0.3s ease"
              >
                <VStack gap="6" align="stretch">
                  <HStack justify="space-between">
                    <HStack gap="3">
                                          <Box 
                      p="3" 
                      borderRadius="xl" 
                      bg="teal.100"
                      border="1px solid"
                      borderColor="teal.200"
                    >
                      <Building2 size={24} color="teal.600" />
                    </Box>
                      <VStack align="start" gap="0">
                        <Text fontSize="lg" fontWeight="bold" color="fg">
                          Organisatie Profiel
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Contactgegevens en instellingen
                        </Text>
                      </VStack>
                    </HStack>
                    <IconButton
                      aria-label="Ga naar organisatie profiel"
                      size="sm"
                      variant="ghost"
                      colorScheme="teal"
                      color="teal.600"
                      onClick={() => navigate('/organisatie-profiel')}
                    >
                      <ArrowRight size={16} />
                    </IconButton>
                  </HStack>
                  
                  {organisatie && (
                    <Box 
                      p="4" 
                      bg="teal.50" 
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="teal.100"
                    >
                      <VStack align="start" gap="2">
                        <Text fontWeight="semibold" color="teal.800">
                          {organisatie.naam}
                        </Text>
                        <HStack gap="4">
                          <HStack gap="1">
                            <Calendar size={14} color="#0d9488" />
                            <Text fontSize="xs" color="teal.700">
                              Laatst bijgewerkt: {metrics.lastActivity}
                            </Text>
                          </HStack>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Box>

              {/* Quick Tools */}
              <Box
                bg="bg.panel"
                borderRadius="3xl"
                p="8"
                shadow="2xl"
                border="1px solid"
                borderColor="border.muted"
              >
                <VStack gap="6" align="stretch">
                  <HStack gap="3">
                    <Box 
                      p="3" 
                      borderRadius="xl" 
                      bg="cyan.100"
                      border="1px solid"
                      borderColor="cyan.200"
                    >
                      <Globe size={24} color="cyan.600" />
                    </Box>
                    <VStack align="start" gap="0">
                      <Text fontSize="lg" fontWeight="bold" color="fg">
                        Publieke Tools
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        Test en deel uw rekentool
                      </Text>
                    </VStack>
                  </HStack>

                  <VStack gap="3" align="stretch">
                    <Button
                      colorScheme="cyan"
                      variant="solid"
                      size="lg"
                      borderRadius="xl"
                      onClick={() => window.open('/rekentool/demo', '_blank')}
                      _hover={{ transform: "translateY(-2px)" }}
                      transition="all 0.2s ease"
                    >
                      <HStack gap="2">
                        <Eye size={16} />
                        <Text>Test Publieke Rekentool</Text>
                        <ExternalLink size={14} />
                      </HStack>
                    </Button>
                    
                    <HStack justify="space-between" p="4" bg="cyan.50" borderRadius="xl">
                      <VStack align="start" gap="0">
                        <Text fontSize="sm" fontWeight="semibold" color="cyan.800">
                          Maandelijks gebruik
                        </Text>
                        <Text fontSize="xs" color="cyan.600">
                          Door ouders van uw organisatie
                        </Text>
                      </VStack>
                      <VStack align="end" gap="0">
                        <Text fontSize="lg" fontWeight="bold" color="cyan.800">
                          {metrics.monthlyCalculations}
                        </Text>
                        <Text fontSize="xs" color="cyan.600">
                          berekeningen
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </VStack>
              </Box>

              {/* System Health Summary */}
              <Box
                bg="bg.panel"
                borderRadius="3xl"
                p="8"
                shadow="2xl"
                border="1px solid"
                borderColor="border.muted"
              >
                <VStack gap="6" align="stretch">
                  <HStack justify="space-between">
                    <HStack gap="3">
                      <Box 
                        p="3" 
                        borderRadius="xl" 
                        bg={isSystemReady() ? "green.100" : "orange.100"}
                        border="1px solid"
                        borderColor={isSystemReady() ? "green.200" : "orange.200"}
                      >
                        <Activity size={24} color={isSystemReady() ? "green.600" : "orange.600"} />
                      </Box>
                      <VStack align="start" gap="0">
                        <Text fontSize="lg" fontWeight="bold" color="fg">
                          Systeem Health
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          Status en configuratie
                        </Text>
                      </VStack>
                    </HStack>
                    <IconButton
                      aria-label="Vernieuw gegevens"
                      size="sm"
                      variant="ghost"
                      colorScheme="gray"
                      onClick={loadDashboardData}
                    >
                      <RefreshCw size={16} />
                    </IconButton>
                  </HStack>

                  <VStack gap="4" align="stretch">
                    <Box>
                      <HStack justify="space-between" mb="2">
                        <Text fontSize="sm" color="fg.muted">Setup Progress</Text>
                        <Text fontSize="sm" fontWeight="semibold" color="fg">
                          {getCompletionPercentage()}%
                        </Text>
                      </HStack>
                      <Box 
                        w="full" 
                        h="8px" 
                        bg="bg.muted" 
                        borderRadius="full" 
                        overflow="hidden"
                      >
                        <Box 
                          h="full" 
                          bg={getStatusColor() === 'green' ? 'green.400' : getStatusColor() === 'yellow' ? 'yellow.400' : 'red.400'}
                          width={`${getCompletionPercentage()}%`}
                          transition="width 0.5s ease"
                        />
                      </Box>
                    </Box>

                    <VStack gap="3" align="stretch">
                      {[
                        { label: 'Opvangvormen', status: stats.opvangvormen > 0, count: stats.opvangvormen },
                        { label: 'Tarieven', status: stats.tarieven > 0, count: stats.tarieven },
                        { label: 'Organisatie', status: true, count: 1 },
                        { label: 'Gebruiker Account', status: true, count: 1 }
                      ].map((item, index) => (
                        <HStack key={index} justify="space-between" p="3" bg="bg.subtle" borderRadius="lg">
                          <HStack gap="3">
                            <Box
                              w="8px"
                              h="8px"
                              borderRadius="full"
                              bg={item.status ? "green.500" : "gray.300"}
                            />
                            <Text fontSize="sm" color="fg.muted">
                              {item.label}
                            </Text>
                          </HStack>
                          <HStack gap="2">
                            <Badge 
                              variant="subtle" 
                              colorScheme={item.status ? "green" : "gray"}
                              size="sm"
                            >
                              {item.count}
                            </Badge>
                            {item.status ? (
                              <CheckCircle size={14} color="#10b981" />
                            ) : (
                              <AlertCircle size={14} color="#6b7280" />
                            )}
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </VStack>
              </Box>
            </VStack>
          </SimpleGrid>

          {/* Tips & Onboarding Section */}
          {!isSystemReady() && (
            <Box
              bg="blue.50"
              borderRadius="3xl"
              p="8"
              shadow="2xl"
              border="1px solid"
              borderColor="blue.100"
              position="relative"
              overflow="hidden"
            >
              <HStack gap="6" position="relative" align="start">
                <Box 
                  p="4" 
                  borderRadius="2xl" 
                  bg="blue.100"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <Lightbulb size={32} color="blue.600" />
                </Box>
                <VStack align="start" gap="4" flex="1">
                  <VStack align="start" gap="2">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                      💡 Welkom bij de Rekentool Setup!
                    </Text>
                    <Text fontSize="lg" color="gray.600">
                      Om uw rekentool operationeel te maken, zijn er nog enkele stappen te voltooien.
                    </Text>
                  </VStack>
                  
                  <VStack align="start" gap="3" mt="4">
                    <Text fontWeight="semibold" color="gray.700">Volgende stappen:</Text>
                    <VStack align="start" gap="2">
                      {stats.opvangvormen === 0 && (
                        <HStack gap="3">
                          <Box w="6px" h="6px" borderRadius="full" bg="blue.400" />
                          <Text fontSize="sm" color="gray.600">Configureer uw opvangvormen (KDV, BSO, Gastouder)</Text>
                        </HStack>
                      )}
                      {stats.tarieven === 0 && (
                        <HStack gap="3">
                          <Box w="6px" h="6px" borderRadius="full" bg="blue.400" />
                          <Text fontSize="sm" color="gray.600">Stel uw tarieven in per opvangvorm</Text>
                        </HStack>
                      )}
                      <HStack gap="3">
                        <Box w="6px" h="6px" borderRadius="full" bg="blue.400" />
                        <Text fontSize="sm" color="gray.600">Test uw publieke rekentool</Text>
                      </HStack>
                    </VStack>
                  </VStack>

                  <HStack gap="4" mt="6">
                    <Button
                      colorScheme="blue"
                      variant="solid"
                      size="lg"
                      borderRadius="xl"
                      onClick={() => navigate(stats.opvangvormen === 0 ? '/opvangvormen' : '/tarieven')}
                    >
                      <HStack gap="2">
                        <Rocket size={16} />
                        <Text>Start Setup</Text>
                      </HStack>
                    </Button>
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      size="lg"
                      borderRadius="xl"
                      onClick={() => navigate('/rekentool-instellingen')}
                    >
                      Geavanceerde Instellingen
                    </Button>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage; 