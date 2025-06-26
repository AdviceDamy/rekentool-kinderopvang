import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Input,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();

  useEffect(() => {
    // Clear any existing errors when component mounts
    setError('');
  }, []);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het inloggen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py="12" px="6">
      <Container maxW="md">
        <Box textAlign="center" mb="8">
          <Heading size="xl" color="blue.600" mb="2">
            Rekentool Kinderopvang
          </Heading>
          <Text color="gray.600">
            Log in om toegang te krijgen tot uw dashboard
          </Text>
        </Box>

        <Box w="full" bg="white" p="8" borderRadius="lg" shadow="lg">
          <form onSubmit={handleSubmit}>
            {error && (
              <Box p="3" bg="red.100" color="red.700" borderRadius="md" mb="4">
                {error}
              </Box>
            )}

            <Box mb="4">
              <Text mb="2" fontWeight="medium">E-mailadres</Text>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uw@email.nl"
                size="lg"
                required
              />
            </Box>

            <Box mb="6">
              <Text mb="2" fontWeight="medium">Wachtwoord</Text>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Uw wachtwoord"
                size="lg"
                required
              />
            </Box>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              w="full"
              disabled={isLoading}
            >
              {isLoading ? 'Inloggen...' : 'Inloggen'}
            </Button>
          </form>
        </Box>

        <Box textAlign="center" fontSize="sm" color="gray.500" mt="6">
          <Text>Test accounts:</Text>
          <Text>Organisatie: admin@zonnebloem.nl / password123</Text>
          <Text>Superuser: superuser@admin.nl / superadmin123</Text>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 