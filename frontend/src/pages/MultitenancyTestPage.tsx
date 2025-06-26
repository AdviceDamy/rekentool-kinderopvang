import React from 'react';
import { Box, Text, VStack, Button, Heading, Card } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const MultitenancyTestPage: React.FC = () => {
  const organisaties = [
    {
      naam: 'Kinderopvang De Zonnebloem',
      slug: 'zonnebloem',
      plaats: 'Amsterdam'
    },
    {
      naam: 'BSO De Regenboog',
      slug: 'regenboog',
      plaats: 'Utrecht'
    },
    {
      naam: 'Kinderopvang Zonnetje',
      slug: 'zonnetje',
      plaats: 'Eindhoven'
    }
  ];

  return (
    <Box minHeight="100vh" bg="gray.50" py={8}>
      <Box maxWidth="800px" mx="auto" px={4}>
        <Heading mb={6} textAlign="center">
          🎯 Multitenancy Test - Stap 4 Voltooid!
        </Heading>
        
        <Text mb={8} textAlign="center" color="gray.600">
          Test de rekentool voor verschillende organisaties. Elke organisatie heeft zijn eigen data en tarieven.
        </Text>

        <VStack gap={6}>
          {organisaties.map((org) => (
            <Card.Root key={org.slug} width="100%" p={6}>
              <Card.Body>
                <VStack align="start" gap={4}>
                  <Box>
                    <Heading size="lg">{org.naam}</Heading>
                    <Text color="gray.600">{org.plaats}</Text>
                    <Text fontSize="sm" color="gray.500">Slug: {org.slug}</Text>
                  </Box>
                  
                  <Link to={`/rekentool/${org.slug}`}>
                    <Button 
                      colorPalette="blue"
                      size="lg"
                      width="100%"
                    >
                      Open Rekentool voor {org.naam}
                    </Button>
                  </Link>
                  
                  <Text fontSize="sm" color="gray.500">
                    URL: /rekentool/{org.slug}
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </VStack>

        <Box mt={12} p={6} bg="green.50" borderRadius="lg" border="1px solid" borderColor="green.200">
          <Heading size="md" mb={4} color="green.800">
            ✅ Stap 4 Implementatie Voltooid
          </Heading>
          <VStack align="start" gap={2}>
            <Text color="green.700">• Multitenancy uitgebreid met meerdere organisaties</Text>
            <Text color="green.700">• Organisatie context middleware geïmplementeerd</Text>
            <Text color="green.700">• API endpoints ondersteunen organisatie-specifieke data</Text>
            <Text color="green.700">• Frontend werkt met organisatie slugs in URL</Text>
            <Text color="green.700">• Data-isolatie tussen organisaties gegarandeerd</Text>
            <Text color="green.700">• Publieke rekentool werkt per organisatie</Text>
          </VStack>
        </Box>

        <Box mt={6} p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
          <Text fontWeight="bold" color="blue.800" mb={2}>🔧 Technische Details:</Text>
          <VStack align="start" gap={1} fontSize="sm" color="blue.700">
            <Text>• Organisatie context via ?org=slug parameter</Text>
            <Text>• Middleware voor automatische data filtering</Text>
            <Text>• Publieke API endpoints: /api/organisaties/public/:slug</Text>
            <Text>• Organisatie-specifieke opvangvormen en tarieven</Text>
            <Text>• Superuser endpoints voor organisatie beheer</Text>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default MultitenancyTestPage; 