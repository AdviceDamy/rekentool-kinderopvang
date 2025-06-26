import React from 'react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SuperuserDashboard from './pages/SuperuserDashboard';
import OrganisatieAdminPage from './pages/OrganisatieAdminPage';
import OpvangvormenPage from './pages/OpvangvormenPage';
import TarievenPage from './pages/TarievenPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import RekentoolPage from './pages/RekentoolPage';
import MultitenancyTestPage from './pages/MultitenancyTestPage';

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Test pagina voor multitenancy */}
            <Route path="/test" element={<MultitenancyTestPage />} />
            
            {/* Publieke route voor ouders - geen authenticatie vereist */}
            <Route path="/rekentool/:organisatieSlug" element={<RekentoolPage />} />
            
            {/* Beveiligde routes voor organisatiebeheer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/superuser" element={<ProtectedRoute><AppLayout><SuperuserDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/:slug" element={<ProtectedRoute><AppLayout><OrganisatieAdminPage /></AppLayout></ProtectedRoute>} />
            <Route path="/opvangvormen" element={<ProtectedRoute><AppLayout><OpvangvormenPage /></AppLayout></ProtectedRoute>} />
            <Route path="/tarieven" element={<ProtectedRoute><AppLayout><TarievenPage /></AppLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
