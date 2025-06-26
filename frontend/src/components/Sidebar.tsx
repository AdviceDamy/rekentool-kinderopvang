import React from 'react';
import { Box, Button, Text, VStack, HStack, Badge, Separator } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { 
  Home, 
  Baby, 
  DollarSign, 
  Settings, 
  Building2, 
  LogOut, 
  FileText, 
  User,
  Target,
  CreditCard,
  Shield,
  Users,
  Layers,
  Palette
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, organisatie } = useAuth();

  const regularMenuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overzicht & statistieken'
    },
    { 
      path: '/opvangvormen', 
      label: 'Opvangvormen', 
      icon: Baby,
      description: 'KDV, BSO, Gastouder'
    },
    { 
      path: '/tarieven', 
      label: 'Tarieven', 
      icon: DollarSign,
      description: 'Prijzen & kosten'
    },
    { 
      path: '/rekentool-instellingen', 
      label: 'Rekentool', 
      icon: Target,
      description: 'Wizard & configuratie'
    },
    { 
      path: '/toeslag-instellingen', 
      label: 'Toeslag', 
      icon: CreditCard,
      description: 'Kinderopvangtoeslag'
    },
    { 
      path: '/organisatie-profiel', 
      label: 'Organisatie', 
      icon: Building2,
      description: 'Profiel & instellingen'
    },
  ];

  const superuserMenuItems = [
    { 
      path: '/superuser', 
      label: 'Command Center', 
      icon: Shield,
      description: 'Systeem overzicht'
    },
    { 
      path: '/organisaties-beheer', 
      label: 'Organisaties', 
      icon: Building2,
      description: 'Beheer organisaties'
    },
    { 
      path: '/gebruikers-beheer', 
      label: 'Gebruikers', 
      icon: Users,
      description: 'Account beheer'
    },
    { 
      path: '/toeslagtabellen', 
      label: 'Toeslagtabellen', 
      icon: FileText,
      description: 'Landelijke tabellen'
    },
    { 
      path: '/systeem-instellingen', 
      label: 'Systeem', 
      icon: Settings,
      description: 'Configuratie & logs'
    },
  ];

  const menuItems = user?.role === UserRole.SUPERUSER ? superuserMenuItems : regularMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Box
      width="280px"
      height="100vh"
      bg="gray.50"
      position="relative"
      display="flex"
      flexDirection="column"
      borderRight="1px solid"
      borderColor="gray.200"
    >
      <Box position="relative" zIndex={1} p="6" display="flex" flexDirection="column" height="full">
        {/* Header */}
        <VStack gap="4" mb="8" align="stretch">
          {/* Logo & Title */}
          <Box>
            <HStack gap="3" mb="2">
              <Box 
                p="2" 
                borderRadius="lg" 
                bg="blue.100"
                border="1px solid"
                borderColor="blue.200"
              >
                <Layers size={24} color="blue.600" />
              </Box>
              <VStack align="start" gap="0">
                <Text fontSize="lg" fontWeight="bold" color="gray.800" lineHeight="1.2">
                  Rekentool
                </Text>
                <Text fontSize="sm" color="gray.600" lineHeight="1.2">
                  Kinderopvang
                </Text>
              </VStack>
            </HStack>
            
            {/* User Role Badge */}
            {user?.role === UserRole.SUPERUSER && (
              <Badge 
                bg="purple.100" 
                color="purple.700"
                px="3" 
                py="1" 
                borderRadius="full"
                fontSize="xs"
                border="1px solid"
                borderColor="purple.200"
              >
                <HStack gap="1">
                  <Shield size={12} color="purple.600" />
                  <Text color="purple.700">Superuser</Text>
                </HStack>
              </Badge>
            )}
          </Box>

                     {/* User Info */}
           <Box 
             p="4" 
             borderRadius="xl"
             bg="gray.100"
             border="1px solid"
             borderColor="gray.200"
           >
             <HStack gap="3">
               <Box
                 width="32px"
                 height="32px"
                 borderRadius="full"
                 bg="blue.600"
                 color="white"
                 display="flex"
                 alignItems="center"
                 justifyContent="center"
                 fontSize="xs"
                 fontWeight="bold"
               >
                 {user?.email && getUserInitials(user.email)}
               </Box>
               <VStack align="start" gap="0" flex="1">
                 {organisatie && user?.role !== UserRole.SUPERUSER && (
                   <Text fontSize="sm" fontWeight="medium" color="gray.800" truncate>
                     {organisatie.naam}
                   </Text>
                 )}
                 <Text fontSize="xs" color="gray.600" truncate>
                   {user?.email}
                 </Text>
               </VStack>
             </HStack>
           </Box>
        </VStack>

        {/* Navigation */}
        <VStack gap="2" flex="1" align="stretch">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                bg={isActive ? "blue.100" : "transparent"}
                color="gray.700"
                borderRadius="xl"
                justifyContent="flex-start"
                size="md"
                width="full"
                height="auto"
                py="3"
                px="4"
                _hover={{
                  bg: "blue.50",
                  transform: "translateX(4px)",
                  color: "gray.800"
                }}
                _active={{
                  bg: "blue.100",
                  color: "gray.800"
                }}
                transition="all 0.2s ease"
                border={isActive ? "1px solid" : "1px solid transparent"}
                borderColor={isActive ? "blue.200" : "transparent"}
              >
                <HStack gap="3" width="full">
                  <Box 
                    p="2" 
                    borderRadius="lg"
                    bg={isActive ? "blue.200" : "transparent"}
                  >
                    <IconComponent size={18} color={isActive ? "blue.700" : "gray.600"} />
                  </Box>
                  <VStack align="start" gap="0" flex="1">
                    <Text fontSize="sm" fontWeight="medium" color={isActive ? "gray.800" : "gray.700"}>
                      {item.label}
                    </Text>
                    <Text fontSize="xs" color={isActive ? "gray.600" : "gray.500"}>
                      {item.description}
                    </Text>
                  </VStack>
                </HStack>
              </Button>
            );
          })}
        </VStack>

        <Separator my="4" borderColor="gray.300" />

        {/* Footer */}
        <VStack gap="3">
                     {/* Quick Actions */}
           {user?.role !== UserRole.SUPERUSER && (
             <Button
               onClick={() => window.open(`/rekentool/demo`, '_blank')}
               bg="green.100"
               color="green.700"
               borderRadius="xl"
               size="sm"
               width="full"
               _hover={{
                 bg: "green.200",
                 color: "green.800"
               }}
               border="1px solid"
               borderColor="green.200"
             >
               <HStack gap="2">
                 <Target size={14} color="green.600" />
                 <Text fontSize="xs" color="green.700">Test Rekentool</Text>
               </HStack>
             </Button>
           )}

          {/* Logout */}
          <Button
            onClick={handleLogout}
            bg="transparent"
            color="gray.600"
            borderRadius="xl"
            size="sm"
            width="full"
            border="1px solid"
            borderColor="gray.300"
            _hover={{
              bg: "red.500",
              borderColor: "red.400",
              color: "white"
            }}
          >
            <HStack gap="2">
              <LogOut size={14} color="gray.600" />
              <Text fontSize="xs" color="gray.600">Uitloggen</Text>
            </HStack>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Sidebar; 