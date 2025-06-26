import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Badge,
  Icon,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  LogIn, 
  Layers, 
  Shield, 
  Building2,
  Users,
  Sparkles
} from 'lucide-react';

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
    <Box minH="100vh" bg="gray.50">
      {/* Header Section */}
      <Box 
        bg="blue.50" 
        py="12"
        position="relative"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" position="relative" zIndex={1}>
          <VStack gap="6" textAlign="center">
            <VStack gap="4">
              <Box 
                p="4" 
                borderRadius="2xl" 
                bg="blue.100"
                border="1px solid"
                borderColor="blue.200"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: "-2px",
                  left: "-2px",
                  right: "-2px", 
                  bottom: "-2px",
                  borderRadius: "2xl",
                  bgGradient: "linear(135deg, blue.400, purple.400)",
                  zIndex: -1
                }}
              >
                <Icon as={Layers} boxSize={12} color="blue.600" />
              </Box>
              
              <VStack gap="2">
                <Heading size="2xl" color="gray.800" letterSpacing="tight">
                  Rekentool Kinderopvang
                </Heading>
                <Text fontSize="lg" color="gray.600" maxW="md">
                  Welkom terug! Log in om toegang te krijgen tot uw dashboard en rekentool
                </Text>
              </VStack>
            </VStack>

            <HStack gap="4" flexWrap="wrap" justify="center">
              <Badge 
                bg="gray.100" 
                color="gray.700"
                px="4" 
                py="2" 
                borderRadius="full"
                fontSize="sm"
                border="1px solid"
                borderColor="gray.200"
              >
                <HStack gap="2">
                  <Icon as={Building2} boxSize={3.5} color="gray.600" />
                  <Text color="gray.700">Voor Organisaties</Text>
                </HStack>
              </Badge>
              
              <Badge 
                bg="purple.100" 
                color="purple.700"
                px="4" 
                py="2" 
                borderRadius="full"
                fontSize="sm"
                border="1px solid"
                borderColor="purple.200"
              >
                <HStack gap="2">
                  <Icon as={Shield} boxSize={3.5} color="purple.600" />
                  <Text color="purple.700">Superuser Portal</Text>
                </HStack>
              </Badge>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Login Form */}
      <Container maxW="lg" py="16">
        <VStack gap="8" align="stretch">
          <Box
            bg="white"
            borderRadius="3xl"
            shadow="2xl"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
            position="relative"
          >
            <Box 
              p="8" 
              borderBottom="1px solid" 
              borderColor="gray.100"
              bg="blue.50"
            >
              <HStack gap="3" justify="center">
                <Box 
                  p="3" 
                  borderRadius="xl" 
                  bg="blue.100"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <Icon as={LogIn} boxSize={6} color="blue.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    🔐 Inloggen
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Voer uw inloggegevens in
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="8">
              <form onSubmit={handleSubmit}>
                <VStack gap="6" align="stretch">
                  {error && (
                    <Box 
                      p="4" 
                      bg="red.50" 
                      color="red.700" 
                      borderRadius="xl" 
                      border="1px solid"
                      borderColor="red.200"
                    >
                      <HStack gap="2">
                        <Text fontSize="sm" fontWeight="medium">⚠️ {error}</Text>
                      </HStack>
                    </Box>
                  )}

                  <VStack align="start" gap="3">
                    <HStack gap="2">
                      <Icon as={Mail} boxSize={4} color="gray.600" />
                      <Text fontWeight="medium" color="gray.700" fontSize="sm">
                        E-mailadres
                      </Text>
                    </HStack>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="uw@email.nl"
                      size="lg"
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="xl"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6",
                        bg: "white"
                      }}
                      _hover={{
                        borderColor: "gray.400"
                      }}
                      required
                    />
                  </VStack>

                  <VStack align="start" gap="3">
                    <HStack gap="2">
                      <Icon as={Lock} boxSize={4} color="gray.600" />
                      <Text fontWeight="medium" color="gray.700" fontSize="sm">
                        Wachtwoord
                      </Text>
                    </HStack>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Uw wachtwoord"
                      size="lg"
                      bg="gray.50"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="xl"
                      _focus={{
                        borderColor: "blue.400",
                        boxShadow: "0 0 0 1px #3b82f6",
                        bg: "white"
                      }}
                      _hover={{
                        borderColor: "gray.400"
                      }}
                      required
                    />
                  </VStack>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    borderRadius="xl"
                    w="full"
                    disabled={isLoading}
                    _hover={{
                      transform: "translateY(-1px)",
                      shadow: "lg"
                    }}
                    transition="all 0.2s ease"
                  >
                    <HStack gap="2">
                      <Icon as={isLoading ? Sparkles : LogIn} boxSize={4.5} />
                      <Text>{isLoading ? 'Inloggen...' : 'Inloggen'}</Text>
                    </HStack>
                  </Button>
                </VStack>
              </form>
            </Box>
          </Box>

          {/* Test Accounts */}
          <Box
            bg="white"
            borderRadius="2xl"
            shadow="lg"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
          >
            <Box 
              p="6" 
              borderBottom="1px solid" 
              borderColor="gray.100"
              bg="gray.50"
            >
              <HStack gap="3" justify="center">
                <Box 
                  p="2" 
                  borderRadius="lg" 
                  bg="gray.100"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Icon as={Users} boxSize={5} color="gray.600" />
                </Box>
                <VStack align="start" gap="0">
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    🧪 Test Accounts
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Voor demonstratie doeleinden
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Box p="6">
              <VStack gap="4" align="stretch">
                <Box 
                  p="4" 
                  bg="blue.50" 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="blue.200"
                >
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Icon as={Building2} boxSize={4} color="blue.600" />
                      <Text fontSize="sm" fontWeight="bold" color="blue.800">
                        Organisatie Account
                      </Text>
                    </HStack>
                    <VStack align="start" gap="1" fontSize="sm">
                      <Text color="blue.700"><strong>Email:</strong> admin@zonnebloem.nl</Text>
                      <Text color="blue.700"><strong>Wachtwoord:</strong> password123</Text>
                    </VStack>
                  </VStack>
                </Box>

                <Box 
                  p="4" 
                  bg="purple.50" 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="purple.200"
                >
                  <VStack align="start" gap="2">
                    <HStack gap="2">
                      <Icon as={Shield} boxSize={4} color="purple.600" />
                      <Text fontSize="sm" fontWeight="bold" color="purple.800">
                        Superuser Account
                      </Text>
                    </HStack>
                    <VStack align="start" gap="1" fontSize="sm">
                      <Text color="purple.700"><strong>Email:</strong> superuser@admin.nl</Text>
                      <Text color="purple.700"><strong>Wachtwoord:</strong> superadmin123</Text>
                    </VStack>
                  </VStack>
                </Box>
              </VStack>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LoginPage; 