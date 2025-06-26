import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Spinner,
  Badge,
  IconButton,
  createToaster,
  Grid,
  GridItem,
  Card,
  Table,
  Select
} from '@chakra-ui/react';
import { Edit, Trash2, Plus, Eye, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface ToeslagtabelData {
  year: number;
  max_hourly_rates: {
    dagopvang: number;
    bso: number;
    gastouder: number;
  };
  income_brackets: {
    min: number;
    max: number | null;
    perc_first_child: number;
    perc_other_children: number;
  }[];
}

interface Toeslagtabel {
  id: number;
  jaar: number;
  data: string;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

const ToeslagtabellenPage: React.FC = () => {
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTabel, setSelectedTabel] = useState<Toeslagtabel | null>(null);
  const [formData, setFormData] = useState({
    jaar: new Date().getFullYear() + 1,
    actief: true,
    data: {} as ToeslagtabelData,
  });
  const [jsonInput, setJsonInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'uurtarieven' | 'inkomensklassen'>('uurtarieven');
  
  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    loadToeslagtabellen();
  }, []);

  const loadToeslagtabellen = async () => {
    try {
      setLoading(true);
      const response = await api.get('/toeslagtabellen');
      if (response.data.success) {
        setToeslagtabellen(response.data.data);
      }
    } catch (error) {
      toaster.create({
        title: 'Fout bij laden',
        description: 'Kon toeslagtabellen niet laden',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTabel(null);
    setFormData({
      jaar: new Date().getFullYear() + 1,
      actief: true,
      data: {} as ToeslagtabelData,
    });
    setJsonInput('');
    setShowModal(true);
  };

  const handleEdit = (tabel: Toeslagtabel) => {
    setSelectedTabel(tabel);
    const parsedData = JSON.parse(tabel.data);
    setFormData({
      jaar: tabel.jaar,
      actief: tabel.actief,
      data: parsedData,
    });
    setJsonInput(JSON.stringify(parsedData, null, 2));
    setShowModal(true);
  };

  const handleView = (tabel: Toeslagtabel) => {
    setSelectedTabel(tabel);
    setShowViewModal(true);
  };

  const handleDelete = (tabel: Toeslagtabel) => {
    setSelectedTabel(tabel);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async () => {
    try {
      // Parse JSON input
      let parsedData: ToeslagtabelData;
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (e) {
        toaster.create({
          title: 'Ongeldige JSON',
          description: 'Controleer de JSON syntax',
          status: 'error',
          duration: 5000,
        });
        return;
      }

      if (selectedTabel) {
        // Update existing
        const response = await api.put(`/toeslagtabellen/${selectedTabel.jaar}`, {
          data: parsedData,
          actief: formData.actief,
        });
        
        if (response.data.success) {
          toaster.create({
            title: 'Toeslagtabel bijgewerkt',
            status: 'success',
            duration: 3000,
          });
          loadToeslagtabellen();
          setShowModal(false);
        }
      } else {
        // Create new
        const response = await api.post('/toeslagtabellen', {
          jaar: formData.jaar,
          data: parsedData,
        });
        
        if (response.data.success) {
          toaster.create({
            title: 'Toeslagtabel aangemaakt',
            status: 'success',
            duration: 3000,
          });
          loadToeslagtabellen();
          setShowModal(false);
        }
      }
    } catch (error: any) {
      toaster.create({
        title: 'Fout bij opslaan',
        description: error.response?.data?.error || 'Er is een fout opgetreden',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedTabel) return;

    try {
      const response = await api.delete(`/toeslagtabellen/${selectedTabel.jaar}`);
      if (response.data.success) {
        toaster.create({
          title: 'Toeslagtabel verwijderd',
          status: 'success',
          duration: 3000,
        });
        loadToeslagtabellen();
        setShowDeleteDialog(false);
      }
    } catch (error: any) {
      toaster.create({
        title: 'Fout bij verwijderen',
        description: error.response?.data?.error || 'Er is een fout opgetreden',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleImportTemplate = () => {
    const template: ToeslagtabelData = {
      year: new Date().getFullYear() + 1,
      max_hourly_rates: {
        dagopvang: 10.50,
        bso: 9.25,
        gastouder: 7.75,
      },
      income_brackets: [
        { min: 0, max: 25000, perc_first_child: 96.0, perc_other_children: 96.0 },
        { min: 25001, max: 50000, perc_first_child: 90.0, perc_other_children: 95.0 },
        { min: 50001, max: 75000, perc_first_child: 80.0, perc_other_children: 85.0 },
        { min: 75001, max: 100000, perc_first_child: 70.0, perc_other_children: 75.0 },
        { min: 100001, max: null, perc_first_child: 33.3, perc_other_children: 67.1 },
      ],
    };
    setJsonInput(JSON.stringify(template, null, 2));
  };

  const renderToeslagtabelData = (data: ToeslagtabelData) => {
    return (
      <Box>
        {/* Tabs */}
        <HStack mb={4} borderBottom="1px solid" borderColor="gray.200">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('uurtarieven')}
            borderBottom={activeTab === 'uurtarieven' ? '2px solid' : 'none'}
            borderColor="blue.500"
            borderRadius={0}
            pb={2}
          >
            Maximum Uurtarieven
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('inkomensklassen')}
            borderBottom={activeTab === 'inkomensklassen' ? '2px solid' : 'none'}
            borderColor="blue.500"
            borderRadius={0}
            pb={2}
          >
            Inkomensklassen ({data.income_brackets.length})
          </Button>
        </HStack>

        {/* Tab Content */}
        {activeTab === 'uurtarieven' ? (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Opvangvorm</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Max. Uurtarief</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Dagopvang (KDV)</Table.Cell>
                <Table.Cell textAlign="right">€ {data.max_hourly_rates.dagopvang.toFixed(2)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Buitenschoolse Opvang (BSO)</Table.Cell>
                <Table.Cell textAlign="right">€ {data.max_hourly_rates.bso.toFixed(2)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Gastouderopvang</Table.Cell>
                <Table.Cell textAlign="right">€ {data.max_hourly_rates.gastouder.toFixed(2)}</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        ) : (
          <Box maxH="400px" overflowY="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Van</Table.ColumnHeader>
                  <Table.ColumnHeader>Tot</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">1e Kind %</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Volgende %</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.income_brackets.map((bracket, idx) => (
                  <Table.Row key={idx}>
                    <Table.Cell>€ {bracket.min.toLocaleString()}</Table.Cell>
                    <Table.Cell>{bracket.max ? `€ ${bracket.max.toLocaleString()}` : 'en hoger'}</Table.Cell>
                    <Table.Cell textAlign="right">{bracket.perc_first_child}%</Table.Cell>
                    <Table.Cell textAlign="right">{bracket.perc_other_children}%</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justifyContent="space-between">
          <Box>
            <Text fontSize="2xl" fontWeight="bold">Toeslagtabellen Beheer</Text>
            <Text color="gray.600">Beheer kinderopvangtoeslag tabellen</Text>
          </Box>
          <Button 
            colorPalette="blue"
            onClick={handleCreate}
          >
            <HStack gap={2}>
              <Plus size={20} />
              <Text>Nieuwe Toeslagtabel</Text>
            </HStack>
          </Button>
        </HStack>

        {/* Alert */}
        <Card.Root p={4}>
          <HStack gap={3}>
            <AlertCircle size={20} color="#3182ce" />
            <Box>
              <Text fontWeight="bold">Let op:</Text>
              <Text fontSize="sm" color="gray.600">
                Toeslagtabellen bevatten de officiële percentages van de Belastingdienst. 
                Zorg ervoor dat de data correct is voordat u wijzigingen opslaat.
              </Text>
            </Box>
          </HStack>
        </Card.Root>

        {/* Tabellen lijst */}
        <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden">
          <Table.Root>
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader>Jaar</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Inkomensklassen</Table.ColumnHeader>
                <Table.ColumnHeader>Laatst bijgewerkt</Table.ColumnHeader>
                <Table.ColumnHeader>Acties</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {toeslagtabellen.map((tabel) => {
                const data = JSON.parse(tabel.data) as ToeslagtabelData;
                return (
                  <Table.Row key={tabel.id}>
                    <Table.Cell fontWeight="bold">{tabel.jaar}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={tabel.actief ? 'green' : 'gray'}>
                        {tabel.actief ? 'Actief' : 'Inactief'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{data.income_brackets.length} klassen</Table.Cell>
                    <Table.Cell>{new Date(tabel.updated_at).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(tabel)}
                        >
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(tabel)}
                        >
                          <Edit size={16} />
                        </IconButton>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => handleDelete(tabel)}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      </VStack>

      {/* Create/Edit Modal */}
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
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="lg"
            width="800px"
            maxWidth="95%"
            maxHeight="90vh"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="bold">
                {selectedTabel ? 'Toeslagtabel Bewerken' : 'Nieuwe Toeslagtabel'}
              </Text>
            </Box>
            
            {/* Scrollable content */}
            <Box flex={1} overflow="auto" p={6}>
              <VStack align="stretch" gap={4}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text mb={2} fontWeight="medium">Jaar</Text>
                    <Input
                      type="number"
                      value={formData.jaar}
                      onChange={(e) => setFormData({ ...formData, jaar: parseInt(e.target.value) })}
                      disabled={!!selectedTabel}
                    />
                  </GridItem>
                  <GridItem>
                    <Text mb={2} fontWeight="medium">Status</Text>
                    <Select
                      value={formData.actief ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, actief: e.target.value === 'true' })}
                    >
                      <option value="true">Actief</option>
                      <option value="false">Inactief</option>
                    </Select>
                  </GridItem>
                </Grid>

                <Box>
                  <HStack justifyContent="space-between" mb={2}>
                    <Text fontWeight="medium">Toeslagtabel Data (JSON)</Text>
                    <Button size="sm" onClick={handleImportTemplate}>
                      Importeer Template
                    </Button>
                  </HStack>
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={15}
                    fontFamily="monospace"
                    fontSize="sm"
                    placeholder="Plak hier de JSON data..."
                  />
                </Box>

                <Card.Root p={3}>
                  <HStack gap={2}>
                    <AlertCircle size={16} color="#eab308" />
                    <Text fontSize="sm" color="gray.700">
                      De JSON data moet exact de juiste structuur hebben met year, max_hourly_rates en income_brackets.
                    </Text>
                  </HStack>
                </Card.Root>
              </VStack>
            </Box>

            {/* Footer */}
            <Box p={6} borderTop="1px solid" borderColor="gray.200">
              <HStack justifyContent="flex-end" gap={3}>
                <Button variant="ghost" onClick={() => setShowModal(false)}>
                  Annuleren
                </Button>
                <Button colorPalette="blue" onClick={handleSubmit}>
                  {selectedTabel ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* View Modal */}
      {showViewModal && selectedTabel && (
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
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="lg"
            width="900px"
            maxWidth="95%"
            maxHeight="90vh"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="bold">
                Toeslagtabel {selectedTabel.jaar}
              </Text>
            </Box>
            
            {/* Content */}
            <Box flex={1} overflow="auto" p={6}>
              {renderToeslagtabelData(JSON.parse(selectedTabel.data))}
            </Box>

            {/* Footer */}
            <Box p={6} borderTop="1px solid" borderColor="gray.200">
              <HStack justifyContent="flex-end">
                <Button onClick={() => setShowViewModal(false)}>Sluiten</Button>
              </HStack>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
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
          <Box
            bg="white"
            borderRadius="md"
            boxShadow="lg"
            width="500px"
            maxWidth="95%"
            p={6}
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Toeslagtabel Verwijderen
            </Text>
            <Text mb={6}>
              Weet u zeker dat u de toeslagtabel voor {selectedTabel?.jaar} wilt verwijderen?
              Deze actie kan niet ongedaan gemaakt worden.
            </Text>
            <HStack justifyContent="flex-end" gap={3}>
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
                Annuleren
              </Button>
              <Button colorPalette="red" onClick={confirmDelete}>
                Verwijderen
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ToeslagtabellenPage;