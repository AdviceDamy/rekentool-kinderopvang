import React from 'react';
import { Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <Box display="flex" height="100vh">
      <Sidebar />
      <Box flex={1} overflow="auto" bg="gray.50">
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout; 