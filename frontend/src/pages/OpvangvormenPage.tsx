import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Input,
  Textarea,
  IconButton,
  Text,
  createToaster,
  Card,
  Badge,
  Separator,
  Flex,
  Grid,
  GridItem,
  Container,
  VStack,
  HStack,
} from '@chakra-ui/react';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { Opvangvorm } from '../types';
import { opvangvormenAPI } from '../services/api';

const OpvangvormenPage: React.FC = () => {
  const { organisatie } = useAuth();
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpvangvorm, setSelectedOpvangvorm] = useState<Opvangvorm | null>(null);
  const [formData, setFormData] = useState({ naam: '', omschrijving: '' });
  const [deleteOpvangvorm, setDeleteOpvangvorm] = useState<Opvangvorm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    loadOpvangvormen();
  }, []);

  const loadOpvangvormen = async () => {
    try {
      setLoading(true);
      const data = await opvangvormenAPI.getAll();
      setOpvangvormen(data);
    } catch (error) {
      toaster.create({
        title: 'Fout bij laden',
        description: 'Kon opvangvormen niet laden',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (opvangvorm?: Opvangvorm) => {
    if (opvangvorm) {
      setSelectedOpvangvorm(opvangvorm);
      setFormData({
        naam: opvangvorm.naam,
        omschrijving: opvangvorm.omschrijving || '',
      });
    } else {
      setSelectedOpvangvorm(null);
      setFormData({ naam: '', omschrijving: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedOpvangvorm(null);
    setFormData({ naam: '', omschrijving: '' });
    setShowModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.naam.trim()) {
      toaster.create({
        title: 'Validatiefout',
        description: 'Naam is verplicht',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      if (selectedOpvangvorm) {
        await opvangvormenAPI.update(selectedOpvangvorm.id!, formData);
        toaster.create({
          title: 'Bijgewerkt',
          description: 'Opvangvorm is succesvol bijgewerkt',
          status: 'success',
          duration: 3000,
        });
      } else {
        await opvangvormenAPI.create(formData);
        toaster.create({
          title: 'Aangemaakt',
          description: 'Opvangvorm is succesvol aangemaakt',
          status: 'success',
          duration: 3000,
        });
      }
      
      handleCloseModal();
      loadOpvangvormen();
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: 'Er is een fout opgetreden',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteOpvangvorm) return;

    try {
      await opvangvormenAPI.delete(deleteOpvangvorm.id!);
      toaster.create({
        title: 'Verwijderd',
        description: 'Opvangvorm is succesvol verwijderd',
        status: 'success',
        duration: 3000,
      });
      
      setShowDeleteDialog(false);
      setDeleteOpvangvorm(null);
      loadOpvangvormen();
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const openDeleteDialog = (opvangvorm: Opvangvorm) => {
    setDeleteOpvangvorm(opvangvorm);
    setShowDeleteDialog(true);
  };

  // Statistics calculations
  const totalOpvangvormen = opvangvormen.length;
  const activeOpvangvormen = opvangvormen.filter(o => o.actief).length;
  const inactiveOpvangvormen = totalOpvangvormen - activeOpvangvormen;

  if (loading) {
    return (
      <Box 
        bg="gray.50" 
        minH="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Box textAlign="center">
          <Box 
            width="12" 
            height="12" 
            borderWidth="3px" 
            borderColor="blue.200" 
            borderTopColor="blue.500" 
            borderRadius="full" 
            animation="spin 1s linear infinite" 
            mx="auto" 
            mb="4"
          />
          <Text color="gray.600" fontSize="lg">Opvangvormen laden...</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header Background */}
      <Box 
        bg="blue.50" 
        minH="240px" 
        position="relative"
        borderBottom="1px solid"
        borderColor="blue.100"
      >
        <Container maxW="7xl" pt="8" pb="16" position="relative" zIndex={1}>
          <VStack gap="4" align="start">
            <HStack gap="3">
              <Box 
                p="3" 
                borderRadius="xl" 
                bg="blue.100"
                border="1px solid"
                borderColor="blue.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <AssignmentIcon fontSize="large" style={{ color: '#2563eb' }} />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  Opvangvormen beheren
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Beheer alle beschikbare opvangvormen voor uw organisatie
                </Text>
              </VStack>
            </HStack>
            
            <HStack gap="3" mt="4">
              {organisatie && (
                <Badge 
                  bg="gray.100" 
                  color="gray.700"
                  px="3" 
                  py="1" 
                  borderRadius="full"
                  fontSize="sm"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <HStack gap="2">
                    <CheckCircleIcon fontSize="small" style={{ color: '#4b5563' }} />
                    <Text color="gray.700">{organisatie.naam}</Text>
                  </HStack>
                </Badge>
              )}
              
              <Badge 
                bg="green.100"
                color="green.700"
                px="3" 
                py="1" 
                borderRadius="full"
                fontSize="sm"
                border="1px solid"
                borderColor="green.200"
              >
                {totalOpvangvormen} Opvangvormen
              </Badge>

              <Button 
                colorPalette="blue" 
                size="sm"
                onClick={() => handleOpenModal()}
                px={4}
              >
                + Nieuwe opvangvorm
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      <Container maxW="7xl" mt="-12" position="relative" zIndex={2} pb="8">
        <VStack gap="8" align="stretch">
          {/* Statistics Cards */}
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
            <GridItem>
              <Card.Root 
                bg="white" 
                shadow="md" 
                borderTop="4px" 
                borderTopColor="blue.500"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <Card.Body p={6}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium" mb={1}>
                        TOTAAL OPVANGVORMEN
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                        {totalOpvangvormen}
                      </Text>
                    </Box>
                    <Box 
                      bg="blue.100" 
                      p={3} 
                      borderRadius="lg"
                      color="blue.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <AssignmentIcon fontSize="large" />
                    </Box>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </GridItem>

            <GridItem>
              <Card.Root 
                bg="white" 
                shadow="md" 
                borderTop="4px" 
                borderTopColor="green.500"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <Card.Body p={6}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium" mb={1}>
                        ACTIEVE VORMEN
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                        {activeOpvangvormen}
                      </Text>
                    </Box>
                    <Box 
                      bg="green.100" 
                      p={3} 
                      borderRadius="lg"
                      color="green.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <CheckCircleIcon fontSize="large" />
                    </Box>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </GridItem>

            <GridItem>
              <Card.Root 
                bg="white" 
                shadow="md" 
                borderTop="4px" 
                borderTopColor="orange.500"
                transition="all 0.2s"
                _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
              >
                <Card.Body p={6}>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text color="gray.500" fontSize="sm" fontWeight="medium" mb={1}>
                        INACTIEVE VORMEN
                      </Text>
                      <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                        {inactiveOpvangvormen}
                      </Text>
                    </Box>
                    <Box 
                      bg="orange.100" 
                      p={3} 
                      borderRadius="lg"
                      color="orange.600"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <PauseCircleIcon fontSize="large" />
                    </Box>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </GridItem>
          </Grid>

          {/* Main Table Card */}
          <Card.Root bg="white" shadow="md">
            <Card.Header p={6} pb={0}>
              <Text fontSize="xl" fontWeight="semibold" color="gray.800">
                Alle opvangvormen
              </Text>
            </Card.Header>
            <Card.Body p={6}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Naam</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Omschrijving</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Status</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold" width="120px">Acties</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {opvangvormen.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={4}>
                        <Box textAlign="center" py={8}>
                          <Text color="gray.500" fontSize="lg" mb={2}>
                            Geen opvangvormen gevonden
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Voeg uw eerste opvangvorm toe om te beginnen
                          </Text>
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    opvangvormen.map((opvangvorm) => (
                      <Table.Row key={opvangvorm.id} _hover={{ bg: "gray.50" }}>
                        <Table.Cell>
                          <Text fontWeight="medium" color="gray.800">
                            {opvangvorm.naam}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray.600">
                            {opvangvorm.omschrijving || '-'}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge 
                            colorPalette={opvangvorm.actief ? 'green' : 'red'}
                            size="sm"
                          >
                            {opvangvorm.actief ? 'Actief' : 'Inactief'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap={2}>
                            <IconButton
                              size="sm"
                              colorPalette="blue"
                              variant="ghost"
                              onClick={() => handleOpenModal(opvangvorm)}
                              title="Bewerken"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="sm"
                              colorPalette="red"
                              variant="ghost"
                              onClick={() => openDeleteDialog(opvangvorm)}
                              title="Verwijderen"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>

          {/* Add/Edit Modal */}
          {showModal && (
            <Box
              position="fixed"
              top={0}
              left={0}
              width="100%"
              height="100%"
              bg="rgba(0, 0, 0, 0.5)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1000}
            >
              <Card.Root
                bg="white"
                maxW="500px"
                width="90%"
                shadow="xl"
                borderRadius="lg"
                overflow="hidden"
              >
                <Card.Header bg="gray.50" px={6} py={4}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {selectedOpvangvorm ? 'Opvangvorm bewerken' : 'Nieuwe opvangvorm'}
                  </Text>
                </Card.Header>
                <Card.Body p={6}>
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Naam *</Text>
                    <Input
                      value={formData.naam}
                      onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                      placeholder="Naam van de opvangvorm"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                  
                  <Box mb={6}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Omschrijving</Text>
                    <Textarea
                      value={formData.omschrijving}
                      onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                      placeholder="Optionele omschrijving"
                      rows={3}
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                  
                  <Flex gap={3} justify="flex-end">
                    <Button variant="outline" onClick={handleCloseModal}>
                      Annuleren
                    </Button>
                    <Button colorPalette="blue" onClick={handleSubmit}>
                      {selectedOpvangvorm ? 'Bijwerken' : 'Aanmaken'}
                    </Button>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </Box>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteDialog && deleteOpvangvorm && (
            <Box
              position="fixed"
              top={0}
              left={0}
              width="100%"
              height="100%"
              bg="rgba(0, 0, 0, 0.5)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              zIndex={1000}
            >
              <Card.Root
                bg="white"
                maxW="400px"
                width="90%"
                shadow="xl"
                borderRadius="lg"
                overflow="hidden"
              >
                <Card.Header bg="red.50" px={6} py={4}>
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    Opvangvorm verwijderen
                  </Text>
                </Card.Header>
                <Card.Body p={6}>
                  <Text color="gray.600" mb={6}>
                    Weet u zeker dat u "{deleteOpvangvorm.naam}" wilt verwijderen? 
                    Deze actie kan niet ongedaan worden gemaakt.
                  </Text>
                  
                  <Flex gap={3} justify="flex-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setDeleteOpvangvorm(null);
                      }}
                    >
                      Annuleren
                    </Button>
                    <Button colorPalette="red" onClick={handleDelete}>
                      Verwijderen
                    </Button>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default OpvangvormenPage; 