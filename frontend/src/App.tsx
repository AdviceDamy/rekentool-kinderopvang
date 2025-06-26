import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SuperuserDashboard from './pages/SuperuserDashboard';
import OrganisatieAdminPage from './pages/OrganisatieAdminPage';
import OpvangvormenPage from './pages/OpvangvormenPage';
import TarievenPage from './pages/TarievenPage';
import ToeslagtabelBeheerPage from './pages/ToeslagtabelBeheerPage';
import RekentoolInstellingenPage from './pages/RekentoolInstellingenPage';
import ToeslagInstellingenPage from './pages/ToeslagInstellingenPage';
import OrganisatieProfielPage from './pages/OrganisatieProfielPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import RekentoolPage from './pages/RekentoolPage';
import RekentoolWizardPage from './pages/RekentoolWizardPage';
import MultitenancyTestPage from './pages/MultitenancyTestPage';
import { system } from './theme';

function App() {
  return (
    <ChakraProvider value={system}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Test pagina voor multitenancy */}
            <Route path="/test" element={<MultitenancyTestPage />} />
            
            {/* Publieke routes voor ouders - geen authenticatie vereist */}
            <Route path="/rekentool/:organisatieSlug" element={<RekentoolPage />} />
            <Route path="/wizard/:organisatieSlug" element={<RekentoolWizardPage />} />
            
            {/* Beveiligde routes voor organisatiebeheer */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/superuser" element={<ProtectedRoute><AppLayout><SuperuserDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/:slug" element={<ProtectedRoute><AppLayout><OrganisatieAdminPage /></AppLayout></ProtectedRoute>} />
            <Route path="/opvangvormen" element={<ProtectedRoute><AppLayout><OpvangvormenPage /></AppLayout></ProtectedRoute>} />
            <Route path="/tarieven" element={<ProtectedRoute><AppLayout><TarievenPage /></AppLayout></ProtectedRoute>} />
            <Route path="/toeslagtabellen" element={<ProtectedRoute><AppLayout><ToeslagtabelBeheerPage /></AppLayout></ProtectedRoute>} />
            <Route path="/rekentool-instellingen" element={<ProtectedRoute><AppLayout><RekentoolInstellingenPage /></AppLayout></ProtectedRoute>} />
            <Route path="/toeslag-instellingen" element={<ProtectedRoute><AppLayout><ToeslagInstellingenPage /></AppLayout></ProtectedRoute>} />
            <Route path="/organisatie-profiel" element={<ProtectedRoute><AppLayout><OrganisatieProfielPage /></AppLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
