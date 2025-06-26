import React from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Home, Baby, DollarSign, Settings, Building2, LogOut, Calculator } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, organisatie } = useAuth();

  const regularMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/opvangvormen', label: 'Opvangvormen', icon: Baby },
    { path: '/tarieven', label: 'Tarieven', icon: DollarSign },
  ];

  const superuserMenuItems = [
    { path: '/superuser', label: 'Superuser Dashboard', icon: Settings },
    { path: '/toeslagtabellen', label: 'Toeslagtabellen', icon: Calculator },
    { path: '/dashboard', label: 'Organisatie Dashboard', icon: Building2 },
  ];

  const menuItems = user?.role === UserRole.SUPERUSER ? superuserMenuItems : regularMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      width={{ base: "200px", md: "250px" }}
      height="100vh"
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
      p={4}
      display="flex"
      flexDirection="column"
      minWidth="200px"
    >
      {/* Header */}
      <Box mb={6}>
        <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color="blue.600" mb={2}>
          Rekentool Kinderopvang
        </Text>
        {user?.role === UserRole.SUPERUSER && (
          <Box display="flex" alignItems="center" gap={2}>
            <Settings size={16} color="#805ad5" />
            <Text fontSize="sm" color="purple.600" fontWeight="bold">
              Superuser
            </Text>
          </Box>
        )}
        {organisatie && user?.role !== UserRole.SUPERUSER && (
          <Text fontSize="sm" color="gray.600">
            {organisatie.naam}
          </Text>
        )}
        {user && (
          <Text fontSize="xs" color="gray.500">
            {user.email}
          </Text>
        )}
      </Box>

      {/* Navigation */}
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              variant={location.pathname === item.path ? "solid" : "ghost"}
              colorPalette={location.pathname === item.path ? (user?.role === UserRole.SUPERUSER ? "purple" : "blue") : undefined}
              justifyContent="flex-start"
              size="md"
              width="100%"
              fontSize={{ base: "sm", md: "md" }}
            >
              <Box mr={3}>
                <IconComponent size={18} />
              </Box>
              <Text display={{ base: "none", sm: "block" }}>{item.label}</Text>
            </Button>
          );
        })}
      </Box>

      {/* Footer */}
      <Box mt={6}>
        <Button
          onClick={handleLogout}
          variant="outline"
          colorPalette="red"
          size="sm"
          width="100%"
          fontSize={{ base: "xs", md: "sm" }}
        >
          <Box mr={2}>
            <LogOut size={14} />
          </Box>
          <Text display={{ base: "none", sm: "inline" }}>Uitloggen</Text>
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar; 