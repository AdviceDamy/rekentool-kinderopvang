import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { Euro, TrendingDown, Calculator, Info } from 'lucide-react';

interface ToeslagResultaatProps {
  brutokosten: number;
  toeslag: {
    totaal_brutokosten: number;
    totaal_toeslag_landelijk: number;
    totaal_toeslag_gemeente: number;
    totaal_toeslag: number;
    totaal_nettokosten: number;
    kinderen: Array<{
      brutokosten: number;
      toeslag_landelijk: number;
      toeslag_gemeente: number;
      toeslag_totaal: number;
      nettokosten: number;
      vergoed_uurtarief: number;
      vergoed_uren: number;
      is_eerste_kind: boolean;
    }>;
    gebruikte_toeslagtabel: {
      jaar: number;
      max_hourly_rates: {
        dagopvang: number;
        bso: number;
        gastouder: number;
      };
    };
  };
  organisatie: {
    gemeente_toeslag_percentage?: number;
    gemeente_toeslag_actief?: boolean;
  };
}

const ToeslagResultaat: React.FC<ToeslagResultaatProps> = ({ brutokosten, toeslag, organisatie }) => {
  const toeslagPercentage = (toeslag.totaal_toeslag / brutokosten) * 100;
  const landelijkPercentage = (toeslag.totaal_toeslag_landelijk / brutokosten) * 100;
  const gemeentePercentage = (toeslag.totaal_toeslag_gemeente / brutokosten) * 100;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <VStack align="stretch" gap={6}>
      {/* Hoofdoverzicht */}
      <Card.Root p={6}>
        <VStack align="stretch" gap={4}>
          <HStack justifyContent="space-between">
            <Text fontSize="lg" fontWeight="bold">Kostenoverzicht</Text>
            <Badge colorPalette="blue">
              Toeslagjaar {toeslag.gebruikte_toeslagtabel.jaar}
            </Badge>
          </HStack>

          {/* Kosten breakdown */}
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <GridItem>
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600">Bruto maandkosten</Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {formatCurrency(brutokosten)}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600">Totale toeslag</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  {formatCurrency(toeslag.totaal_toeslag)}
                </Text>
              </VStack>
            </GridItem>

            <GridItem>
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.600">Netto maandkosten</Text>
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                  {formatCurrency(toeslag.totaal_nettokosten)}
                </Text>
              </VStack>
            </GridItem>
          </Grid>

          {/* Visuele progress bar */}
          <Box>
            <HStack justifyContent="space-between" mb={2}>
              <Text fontSize="sm" color="gray.600">Vergoedingspercentage</Text>
              <Text fontSize="sm" fontWeight="medium">{toeslagPercentage.toFixed(1)}%</Text>
            </HStack>
            <Box h="12px" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                w={`${Math.min(toeslagPercentage, 100)}%`}
                bg="green.500"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        </VStack>
      </Card.Root>

      {/* Toeslag breakdown */}
      <Card.Root p={6}>
        <VStack align="stretch" gap={4}>
          <HStack gap={2}>
            <Calculator size={20} />
            <Text fontSize="lg" fontWeight="bold">Toeslagen Breakdown</Text>
          </HStack>

          {/* Landelijke toeslag */}
          <Box p={4} bg="green.50" borderRadius="md">
            <HStack justifyContent="space-between" mb={2}>
              <VStack align="start" gap={0}>
                <Text fontWeight="medium">Kinderopvangtoeslag (Rijksoverheid)</Text>
                <Text fontSize="sm" color="gray.600">
                  {landelijkPercentage.toFixed(1)}% van de brutokosten
                </Text>
              </VStack>
              <Text fontSize="xl" fontWeight="bold" color="green.700">
                {formatCurrency(toeslag.totaal_toeslag_landelijk)}
              </Text>
            </HStack>
            <Box h="6px" bg="gray.200" borderRadius="full" overflow="hidden">
              <Box
                h="100%"
                w={`${Math.min(landelijkPercentage, 100)}%`}
                bg="green.500"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>

          {/* Gemeentelijke toeslag */}
          {organisatie.gemeente_toeslag_actief && toeslag.totaal_toeslag_gemeente > 0 && (
            <Box p={4} bg="blue.50" borderRadius="md">
              <HStack justifyContent="space-between" mb={2}>
                <VStack align="start" gap={0}>
                  <Text fontWeight="medium">Gemeentelijke toeslag</Text>
                  <Text fontSize="sm" color="gray.600">
                    {gemeentePercentage.toFixed(1)}% extra van de brutokosten
                  </Text>
                </VStack>
                <Text fontSize="xl" fontWeight="bold" color="blue.700">
                  {formatCurrency(toeslag.totaal_toeslag_gemeente)}
                </Text>
              </HStack>
              <Box h="6px" bg="gray.200" borderRadius="full" overflow="hidden">
                <Box
                  h="100%"
                  w={`${Math.min(gemeentePercentage, 100)}%`}
                  bg="blue.500"
                  transition="width 0.3s ease"
                />
              </Box>
            </Box>
          )}

          {/* Totaal */}
          <Box p={4} bg="purple.50" borderRadius="md">
            <HStack justifyContent="space-between">
              <VStack align="start" gap={0}>
                <Text fontWeight="bold" fontSize="lg">Uw netto kosten</Text>
                <Text fontSize="sm" color="gray.600">
                  Na aftrek van alle toeslagen
                </Text>
              </VStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.700">
                {formatCurrency(toeslag.totaal_nettokosten)}
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Card.Root>

      {/* Berekeningsdetails */}
      <Card.Root p={6}>
        <VStack align="stretch" gap={4}>
          <HStack gap={2}>
            <Info size={20} />
            <Text fontSize="lg" fontWeight="bold">Berekeningsdetails</Text>
          </HStack>

          {toeslag.kinderen.map((kind, index) => (
            <Box key={index} p={4} bg="gray.50" borderRadius="md">
              <HStack justifyContent="space-between" mb={2}>
                <Text fontWeight="medium">
                  {kind.is_eerste_kind ? '1e Kind' : `${index + 1}e Kind`}
                </Text>
                <Badge colorPalette={kind.is_eerste_kind ? 'green' : 'blue'}>
                  {kind.is_eerste_kind ? 'Hoogste vergoeding' : 'Standaard vergoeding'}
                </Badge>
              </HStack>
              
              <Grid templateColumns="repeat(2, 1fr)" gap={2} fontSize="sm">
                <Text color="gray.600">Vergoed uurtarief:</Text>
                <Text textAlign="right">{formatCurrency(kind.vergoed_uurtarief)}/uur</Text>
                
                <Text color="gray.600">Vergoede uren:</Text>
                <Text textAlign="right">{kind.vergoed_uren} uur/maand</Text>
                
                <Text color="gray.600">Landelijke toeslag:</Text>
                <Text textAlign="right" color="green.600">
                  {formatCurrency(kind.toeslag_landelijk)}
                </Text>
                
                {kind.toeslag_gemeente > 0 && (
                  <>
                    <Text color="gray.600">Gemeentelijke toeslag:</Text>
                    <Text textAlign="right" color="blue.600">
                      {formatCurrency(kind.toeslag_gemeente)}
                    </Text>
                  </>
                )}
              </Grid>
            </Box>
          ))}

          <Box p={3} bg="yellow.50" borderRadius="md">
            <HStack gap={2} align="start">
              <Info size={16} color="#ca8a04" />
              <Text fontSize="sm" color="yellow.800">
                <strong>Let op:</strong> Dit is een indicatieve berekening op basis van de toeslagtabel {toeslag.gebruikte_toeslagtabel.jaar}. 
                De werkelijke toeslag kan afwijken afhankelijk van uw persoonlijke situatie. 
                Voor de definitieve toeslag dient u een aanvraag in bij de Belastingdienst.
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Card.Root>

      {/* Besparing visualisatie */}
      <Card.Root p={6} bg="gradient.to-br" gradientFrom="purple.50" gradientTo="blue.50">
        <VStack align="center" gap={2}>
          <TrendingDown size={32} color="#7c3aed" />
          <Text fontSize="lg" fontWeight="bold">U bespaart maandelijks</Text>
          <Text fontSize="3xl" fontWeight="bold" color="purple.700">
            {formatCurrency(toeslag.totaal_toeslag)}
          </Text>
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Dat is {formatCurrency(toeslag.totaal_toeslag * 12)} per jaar aan kinderopvangtoeslag
          </Text>
        </VStack>
      </Card.Root>
    </VStack>
  );
};

export default ToeslagResultaat;