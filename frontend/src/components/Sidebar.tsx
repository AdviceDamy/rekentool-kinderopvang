import React from 'react';
import { Box, Button, Text, VStack, HStack, Badge, Separator } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import TableChartIcon from '@mui/icons-material/TableChart';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import AppsIcon from '@mui/icons-material/Apps';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, organisatie } = useAuth();

  const regularMenuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: HomeIcon,
      description: 'Overzicht & statistieken'
    },
    { 
      path: '/opvangvormen', 
      label: 'Opvangvormen', 
      icon: AssignmentIcon,
      description: 'KDV, BSO, Gastouder'
    },
    { 
      path: '/tarieven', 
      label: 'Tarieven', 
      icon: AttachMoneyIcon,
      description: 'Prijzen & kosten'
    },
    { 
      path: '/rekentool-instellingen', 
      label: 'Rekentool', 
      icon: SettingsIcon,
      description: 'Wizard & configuratie'
    },
    { 
      path: '/toeslag-instellingen', 
      label: 'Toeslag', 
      icon: CreditCardIcon,
      description: 'Kinderopvangtoeslag'
    },
    { 
      path: '/organisatie-profiel', 
      label: 'Organisatie', 
      icon: BusinessIcon,
      description: 'Profiel & instellingen'
    },
  ];

  const superuserMenuItems = [
    { 
      path: '/superuser', 
      label: 'Command Center', 
      icon: SecurityIcon,
      description: 'Systeem overzicht'
    },
    { 
      path: '/organisaties-beheer', 
      label: 'Organisaties', 
      icon: BusinessIcon,
      description: 'Beheer organisaties'
    },
    { 
      path: '/gebruikers-beheer', 
      label: 'Gebruikers', 
      icon: GroupIcon,
      description: 'Account beheer'
    },
    { 
      path: '/toeslagtabellen', 
      label: 'Toeslagtabellen', 
      icon: TableChartIcon,
      description: 'Landelijke tabellen'
    },
    { 
      path: '/systeem-instellingen', 
      label: 'Systeem', 
      icon: SettingsIcon,
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
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <AppsIcon fontSize="large" style={{ color: '#2563eb' }} />
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
                  <SecurityIcon fontSize="small" style={{ color: '#7c3aed' }} />
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
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <IconComponent 
                      fontSize="small" 
                      style={{ color: isActive ? "#1d4ed8" : "#4b5563" }} 
                    />
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
                 <PlayArrowIcon fontSize="small" style={{ color: '#16a34a' }} />
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
              <LogoutIcon fontSize="small" style={{ color: '#4b5563' }} />
              <Text fontSize="xs" color="gray.600">Uitloggen</Text>
            </HStack>
          </Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Sidebar; 