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
  Flex,
  Grid,
  GridItem,
  Container,
  VStack,
  HStack,
} from '@chakra-ui/react';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';
import { Opvangvorm, Tarief, TariefType, DagenWeekConfiguratie, VrijUrenConfiguratie } from '../types';
import { opvangvormenAPI, tarievenAPI } from '../services/api';

const TarievenPage: React.FC = () => {
  const { organisatie } = useAuth();
  const [tarieven, setTarieven] = useState<Tarief[]>([]);
  const [opvangvormen, setOpvangvormen] = useState<Opvangvorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTarief, setSelectedTarief] = useState<Tarief | null>(null);
  const [formData, setFormData] = useState({
    naam: '',
    type: 'uur' as TariefType,
    tarief: '',
    omschrijving: '',
    opvangvorm_id: '',
    // Voor dagen_week configuratie
    dagen: [] as string[],
    uurtarief: '',
    urenPerDag: {} as { [dag: string]: string },
    // Voor vrije uren configuratie
    maxUren: '',
    vrijeUrenTarief: '',
  });
  const [deleteTarief, setDeleteTarief] = useState<Tarief | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const toaster = createToaster({
    placement: 'top-right',
  });

  const weekDagen = [
    { key: 'ma', label: 'Maandag' },
    { key: 'di', label: 'Dinsdag' },
    { key: 'wo', label: 'Woensdag' },
    { key: 'do', label: 'Donderdag' },
    { key: 'vr', label: 'Vrijdag' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tarievenData, opvangvormenData] = await Promise.all([
        tarievenAPI.getAll(),
        opvangvormenAPI.getAll()
      ]);
      setTarieven(tarievenData);
      setOpvangvormen(opvangvormenData.filter(o => o.actief));
    } catch (error) {
      toaster.create({
        title: 'Fout bij laden',
        description: 'Kon gegevens niet laden',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (tarief?: Tarief) => {
    if (tarief) {
      setSelectedTarief(tarief);
      
      // Parse configuratie voor formulier
      let dagen: string[] = [];
      let uurtarief = '';
      let urenPerDag: { [dag: string]: string } = {};
      let maxUren = '';
      let vrijeUrenTarief = '';

      if (tarief.configuratie) {
        if (tarief.type === 'dagen_week') {
          const config = tarief.configuratie as DagenWeekConfiguratie;
          dagen = config.dagen || [];
          uurtarief = config.uurtarief?.toString() || '';
          if (config.uren_per_dag) {
            urenPerDag = Object.fromEntries(
              Object.entries(config.uren_per_dag).map(([dag, uren]) => [dag, uren.toString()])
            );
          }
        } else if (tarief.type === 'vrij_uren_week' || tarief.type === 'vrij_uren_maand') {
          const config = tarief.configuratie as VrijUrenConfiguratie;
          maxUren = config.max_uren?.toString() || '';
          vrijeUrenTarief = config.uurtarief?.toString() || '';
        }
      }

      setFormData({
        naam: tarief.naam,
        type: tarief.type,
        tarief: tarief.tarief.toString(),
        omschrijving: tarief.omschrijving || '',
        opvangvorm_id: tarief.opvangvorm_id.toString(),
        dagen,
        uurtarief,
        urenPerDag,
        maxUren,
        vrijeUrenTarief,
      });
    } else {
      setSelectedTarief(null);
      setFormData({
        naam: '',
        type: 'uur',
        tarief: '',
        omschrijving: '',
        opvangvorm_id: '',
        dagen: [],
        uurtarief: '',
        urenPerDag: {},
        maxUren: '',
        vrijeUrenTarief: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedTarief(null);
    setFormData({
      naam: '',
      type: 'uur',
      tarief: '',
      omschrijving: '',
      opvangvorm_id: '',
      dagen: [],
      uurtarief: '',
      urenPerDag: {},
      maxUren: '',
      vrijeUrenTarief: '',
    });
    setShowModal(false);
  };

  const handleDagChange = (dag: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        dagen: [...prev.dagen, dag]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dagen: prev.dagen.filter(d => d !== dag),
        urenPerDag: { ...prev.urenPerDag, [dag]: '' }
      }));
    }
  };

  const handleUrenPerDagChange = (dag: string, uren: string) => {
    setFormData(prev => ({
      ...prev,
      urenPerDag: { ...prev.urenPerDag, [dag]: uren }
    }));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit aangeroepen', { formData });
    
    // Basis validatie
    if (!formData.naam.trim()) {
      console.log('Validatie gefaald: naam leeg');
      toaster.create({
        title: 'Validatiefout',
        description: 'Naam is verplicht',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!formData.opvangvorm_id) {
      console.log('Validatie gefaald: opvangvorm_id leeg');
      toaster.create({
        title: 'Validatiefout',
        description: 'Opvangvorm is verplicht',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Type-specifieke validatie
    let finalTarief = 0;
    let configuratie: any = undefined;

    console.log('Type validatie voor:', formData.type);

    if (formData.type === 'vast_maand') {
      if (!formData.tarief || isNaN(Number(formData.tarief)) || Number(formData.tarief) <= 0) {
        console.log('Validatie gefaald: vast_maand tarief ongeldig');
        toaster.create({
          title: 'Validatiefout',
          description: 'Maandbedrag moet een geldig positief getal zijn',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      finalTarief = Number(formData.tarief);
    } else if (formData.type === 'uur' || formData.type === 'dag') {
      if (!formData.tarief || isNaN(Number(formData.tarief)) || Number(formData.tarief) <= 0) {
        console.log('Validatie gefaald: uur/dag tarief ongeldig');
        toaster.create({
          title: 'Validatiefout',
          description: 'Tarief moet een geldig positief getal zijn',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      finalTarief = Number(formData.tarief);
    } else if (formData.type === 'dagen_week') {
      if (formData.dagen.length === 0) {
        console.log('Validatie gefaald: geen dagen geselecteerd');
        toaster.create({
          title: 'Validatiefout',
          description: 'Selecteer minimaal één dag',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      if (!formData.uurtarief || isNaN(Number(formData.uurtarief)) || Number(formData.uurtarief) <= 0) {
        console.log('Validatie gefaald: uurtarief ongeldig voor dagen_week');
        toaster.create({
          title: 'Validatiefout',
          description: 'Uurtarief moet een geldig positief getal zijn',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      
      const urenPerDag: { [dag: string]: number } = {};
      for (const dag of formData.dagen) {
        const uren = formData.urenPerDag[dag];
        console.log(`Debug: dag ${dag}, uren input: "${uren}", parsed: ${Number(uren)}`);
        if (uren && !isNaN(Number(uren)) && Number(uren) > 0) {
          urenPerDag[dag] = Number(uren);
        }
      }

      configuratie = {
        dagen: formData.dagen,
        uurtarief: Number(formData.uurtarief),
        ...(Object.keys(urenPerDag).length > 0 && { uren_per_dag: urenPerDag })
      };
      finalTarief = Number(formData.uurtarief); // Voor display purposes
      console.log('dagen_week configuratie (gedetailleerd):', {
        dagen: formData.dagen,
        uurtarief: Number(formData.uurtarief),
        urenPerDag,
        finalConfiguratie: configuratie
      });
    } else if (formData.type === 'vrij_uren_week' || formData.type === 'vrij_uren_maand') {
      if (!formData.maxUren || isNaN(Number(formData.maxUren)) || Number(formData.maxUren) <= 0) {
        console.log('Validatie gefaald: maxUren ongeldig');
        toaster.create({
          title: 'Validatiefout',
          description: 'Maximum aantal uren moet een geldig positief getal zijn',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      if (!formData.vrijeUrenTarief || isNaN(Number(formData.vrijeUrenTarief)) || Number(formData.vrijeUrenTarief) <= 0) {
        console.log('Validatie gefaald: vrijeUrenTarief ongeldig');
        toaster.create({
          title: 'Validatiefout',
          description: 'Uurtarief moet een geldig positief getal zijn',
          status: 'error',
          duration: 3000,
        });
        return;
      }

      configuratie = {
        max_uren: Number(formData.maxUren),
        uurtarief: Number(formData.vrijeUrenTarief)
      };
      finalTarief = Number(formData.vrijeUrenTarief); // Voor display purposes
      console.log('vrije_uren configuratie:', configuratie);
    }

    try {
      const tariefData = {
        naam: formData.naam.trim(),
        type: formData.type,
        tarief: finalTarief,
        omschrijving: formData.omschrijving.trim() || undefined,
        opvangvorm_id: Number(formData.opvangvorm_id),
        configuratie,
      };

      console.log('API call data:', tariefData);

      if (selectedTarief) {
        console.log('Updating tarief with ID:', selectedTarief.id);
        await tarievenAPI.update(selectedTarief.id!, tariefData);
        toaster.create({
          title: 'Bijgewerkt',
          description: 'Tarief is succesvol bijgewerkt',
          status: 'success',
          duration: 3000,
        });
      } else {
        console.log('Creating new tarief');
        await tarievenAPI.create(tariefData);
        toaster.create({
          title: 'Aangemaakt',
          description: 'Tarief is succesvol aangemaakt',
          status: 'success',
          duration: 3000,
        });
      }
      
      console.log('API call successful, closing modal');
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('API call failed:', error);
      toaster.create({
        title: 'Fout',
        description: 'Er is een fout opgetreden',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarief) return;

    try {
      await tarievenAPI.delete(deleteTarief.id!);
      toaster.create({
        title: 'Verwijderd',
        description: 'Tarief is succesvol verwijderd',
        status: 'success',
        duration: 3000,
      });
      
      setShowDeleteDialog(false);
      setDeleteTarief(null);
      loadData();
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const openDeleteDialog = (tarief: Tarief) => {
    setDeleteTarief(tarief);
    setShowDeleteDialog(true);
  };

  const getOpvangvormNaam = (opvangvormId: number) => {
    const opvangvorm = opvangvormen.find(o => o.id === opvangvormId);
    return opvangvorm?.naam || 'Onbekend';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'uur': return 'Per uur';
      case 'dag': return 'Per dag';
      case 'vast_maand': return 'Vast per maand';
      case 'dagen_week': return 'Dagen per week';
      case 'vrij_uren_week': return 'Vrije uren per week';
      case 'vrij_uren_maand': return 'Vrije uren per maand';
      default: return type;
    }
  };

  const getTariefDisplay = (tarief: Tarief) => {
    if (tarief.type === 'vast_maand') {
      return `€${(tarief.tarief || 0).toFixed(2)}`;
    } else if (tarief.configuratie) {
      if (tarief.type === 'dagen_week') {
        const config = tarief.configuratie as DagenWeekConfiguratie;
        return `€${(config.uurtarief || 0).toFixed(2)}/uur`;
      } else if (tarief.type === 'vrij_uren_week' || tarief.type === 'vrij_uren_maand') {
        const config = tarief.configuratie as VrijUrenConfiguratie;
        return `€${(config.uurtarief || 0).toFixed(2)}/uur (max ${config.max_uren || 0}h)`;
      }
    }
    return `€${(tarief.tarief || 0).toFixed(2)}`;
  };

  const getConfigurationDetails = (tarief: Tarief) => {
    if (!tarief.configuratie) return '-';
    
    if (tarief.type === 'dagen_week') {
      const config = tarief.configuratie as DagenWeekConfiguratie;
      if (!config.dagen || !Array.isArray(config.dagen)) return '-';
      
      const dagenLabels = config.dagen.map(dag => {
        const dagLabel = weekDagen.find(d => d.key === dag)?.label.substring(0, 2) || dag;
        const uren = config.uren_per_dag?.[dag];
        return uren ? `${dagLabel}(${uren}h)` : dagLabel;
      });
      return dagenLabels.join(', ');
    } else if (tarief.type === 'vrij_uren_week') {
      const config = tarief.configuratie as VrijUrenConfiguratie;
      return `Max ${config.max_uren || 0} uren per week`;
    } else if (tarief.type === 'vrij_uren_maand') {
      const config = tarief.configuratie as VrijUrenConfiguratie;
      return `Max ${config.max_uren || 0} uren per maand`;
    }
    
    return '-';
  };

  // Statistics calculations
  const totalTarieven = tarieven.length;
  const uniekeOpvangvormen = Array.from(new Set(tarieven.map(t => t.opvangvorm_id))).length;
  const complexeTarieven = tarieven.filter(t => t.type === 'dagen_week' || t.type === 'vrij_uren_week' || t.type === 'vrij_uren_maand').length;

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
          <Text color="gray.600" fontSize="lg">Tarieven laden...</Text>
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
                <AttachMoneyIcon fontSize="large" style={{ color: '#2563eb' }} />
              </Box>
              <VStack align="start" gap="1">
                <Text fontSize="3xl" fontWeight="bold" letterSpacing="tight" color="gray.800">
                  Tarieven beheren
                </Text>
                <Text fontSize="lg" color="gray.600">
                  Beheer alle tariefstructuren voor uw opvangvormen
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
                    <TrendingUpIcon fontSize="small" style={{ color: '#4b5563' }} />
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
                {totalTarieven} Tarieven
              </Badge>

              <Button 
                colorPalette="blue" 
                size="sm"
                onClick={() => handleOpenModal()}
                px={4}
              >
                + Nieuw tarief
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Content */}
             {/* Main Content */}
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
                    TOTAAL TARIEVEN
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                    {totalTarieven}
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
                  <AttachMoneyIcon fontSize="large" />
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
                    OPVANGVORMEN
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                    {uniekeOpvangvormen}
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
                  <TrendingUpIcon fontSize="large" />
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
            borderTopColor="purple.500"
            transition="all 0.2s"
            _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
          >
            <Card.Body p={6}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text color="gray.500" fontSize="sm" fontWeight="medium" mb={1}>
                    COMPLEXE TARIEVEN
                  </Text>
                  <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                    {complexeTarieven}
                  </Text>
                </Box>
                <Box 
                  bg="purple.100" 
                  p={3} 
                  borderRadius="lg"
                  color="purple.600"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ScheduleIcon fontSize="large" />
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
                Alle tarieven
              </Text>
            </Card.Header>
            <Card.Body p={6}>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Naam</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Opvangvorm</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Type</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Tarief</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Omschrijving</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold">Configuratie</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" fontWeight="semibold" width="120px">Acties</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tarieven.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={7}>
                        <Box textAlign="center" py={8}>
                          <Text color="gray.500" fontSize="lg" mb={2}>
                            Geen tarieven gevonden
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Voeg uw eerste tarief toe om te beginnen
                          </Text>
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    tarieven.map((tarief) => (
                      <Table.Row key={tarief.id} _hover={{ bg: "gray.50" }}>
                        <Table.Cell>
                          <Text fontWeight="medium" color="gray.800">
                            {tarief.naam}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray.600">
                            {getOpvangvormNaam(tarief.opvangvorm_id)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge 
                            colorPalette="blue"
                            size="sm"
                            variant="subtle"
                          >
                            {getTypeLabel(tarief.type)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontWeight="medium" color="green.600">
                            {getTariefDisplay(tarief)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray.600">
                            {tarief.omschrijving || '-'}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text color="gray.600" fontSize="sm">
                            {getConfigurationDetails(tarief)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap={2}>
                            <IconButton
                              size="sm"
                              colorPalette="blue"
                              variant="ghost"
                              onClick={() => handleOpenModal(tarief)}
                              title="Bewerken"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="sm"
                              colorPalette="red"
                              variant="ghost"
                              onClick={() => openDeleteDialog(tarief)}
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
          p={4}
        >
          <Card.Root
            bg="white"
            maxW="600px"
            width="95%"
            maxH="90vh"
            shadow="xl"
            borderRadius="lg"
            overflow="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Card.Header bg="blue.50" px={6} py={4}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                {selectedTarief ? 'Tarief bewerken' : 'Nieuw tarief'}
              </Text>
            </Card.Header>
            
            {/* Scrollable Content */}
            <Box flex={1} overflowY="auto" p={6}>
              <Box mb={4}>
                <Text mb={2} color="gray.700" fontWeight="medium">Naam *</Text>
                <Input
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  placeholder="Naam van het tarief"
                  bg="white"
                  borderColor="gray.200"
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                />
              </Box>
              
              <Box mb={4}>
                <Text mb={2} color="gray.700" fontWeight="medium">Opvangvorm *</Text>
                <select
                  value={formData.opvangvorm_id}
                  onChange={(e) => setFormData({ ...formData, opvangvorm_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Selecteer opvangvorm</option>
                  {opvangvormen.map((opvangvorm) => (
                    <option key={opvangvorm.id} value={opvangvorm.id}>
                      {opvangvorm.naam}
                    </option>
                  ))}
                </select>
              </Box>
              
              <Box mb={4}>
                <Text mb={2} color="gray.700" fontWeight="medium">Type *</Text>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TariefType })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="uur">Per uur</option>
                  <option value="dag">Per dag</option>
                  <option value="vast_maand">Vast per maand</option>
                  <option value="dagen_week">Dagen per week</option>
                  <option value="vrij_uren_week">Vrije uren per week</option>
                  <option value="vrij_uren_maand">Vrije uren per maand</option>
                </select>
              </Box>
              
              {/* Tarief veld alleen voor eenvoudige types */}
              {(formData.type === 'uur' || formData.type === 'dag' || formData.type === 'vast_maand') && (
                <Box mb={4}>
                  <Text mb={2} color="gray.700" fontWeight="medium">Tarief (€) *</Text>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tarief}
                    onChange={(e) => setFormData({ ...formData, tarief: e.target.value })}
                    placeholder="0.00"
                    bg="white"
                    borderColor="gray.200"
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                  />
                </Box>
              )}
              
              {/* Dagen per week configuratie */}
              {formData.type === 'dagen_week' && (
                <>
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Dagen *</Text>
                    <Card.Root border="1px" borderColor="gray.200" p={3}>
                      <Card.Body>
                        {weekDagen.map((dag) => (
                          <Box key={dag.key} display="flex" alignItems="center" gap={3} mb={2}>
                            <Box minWidth="120px">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.dagen.includes(dag.key)}
                                  onChange={(e) => handleDagChange(dag.key, e.target.checked)}
                                />
                                <Text fontSize="sm" color="gray.700">{dag.label}</Text>
                              </label>
                            </Box>
                            {formData.dagen.includes(dag.key) && (
                              <Box display="flex" alignItems="center" gap={2}>
                                <Text fontSize="sm" minWidth="40px" color="gray.600">Uren:</Text>
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="24"
                                  width="80px"
                                  size="sm"
                                  value={formData.urenPerDag[dag.key] || ''}
                                  onChange={(e) => handleUrenPerDagChange(dag.key, e.target.value)}
                                  placeholder="8"
                                  bg="white"
                                />
                                <Text fontSize="xs" color="gray.500">uur</Text>
                              </Box>
                            )}
                          </Box>
                        ))}
                        <Text fontSize="xs" color="gray.600" mt={2}>
                          Tip: Laat uren leeg voor standaard opvangtijden
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.uurtarief}
                      onChange={(e) => setFormData({ ...formData, uurtarief: e.target.value })}
                      placeholder="0.00"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                </>
              )}
              
              {/* Vrije uren per week */}
              {formData.type === 'vrij_uren_week' && (
                <>
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Maximum aantal uren per week *</Text>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.maxUren}
                      onChange={(e) => setFormData({ ...formData, maxUren: e.target.value })}
                      placeholder="40"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.vrijeUrenTarief}
                      onChange={(e) => setFormData({ ...formData, vrijeUrenTarief: e.target.value })}
                      placeholder="0.00"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                </>
              )}
              
              {/* Vrije uren per maand */}
              {formData.type === 'vrij_uren_maand' && (
                <>
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Maximum aantal uren per maand *</Text>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.maxUren}
                      onChange={(e) => setFormData({ ...formData, maxUren: e.target.value })}
                      placeholder="160"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2} color="gray.700" fontWeight="medium">Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.vrijeUrenTarief}
                      onChange={(e) => setFormData({ ...formData, vrijeUrenTarief: e.target.value })}
                      placeholder="0.00"
                      bg="white"
                      borderColor="gray.200"
                      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
                    />
                  </Box>
                </>
              )}
              
              <Box>
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
            </Box>
            
            {/* Footer */}
            <Card.Footer p={6} bg="gray.50">
              <Flex gap={3} justify="flex-end">
                <Button variant="outline" onClick={handleCloseModal}>
                  Annuleren
                </Button>
                <Button colorPalette="blue" onClick={handleSubmit}>
                  {selectedTarief ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </Flex>
            </Card.Footer>
          </Card.Root>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && deleteTarief && (
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
                Tarief verwijderen
              </Text>
            </Card.Header>
            <Card.Body p={6}>
              <Text color="gray.600" mb={6}>
                Weet u zeker dat u "{deleteTarief.naam}" wilt verwijderen? 
                Deze actie kan niet ongedaan worden gemaakt.
              </Text>
              
              <Flex gap={3} justify="flex-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteTarief(null);
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

export default TarievenPage; 