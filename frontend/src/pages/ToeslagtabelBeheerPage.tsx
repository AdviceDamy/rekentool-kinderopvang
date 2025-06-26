import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Input,
  VStack,
  HStack,
  Badge,
  IconButton,
  createToaster,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableColumnHeader,
} from '@chakra-ui/react';
import {
  AlertRoot,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { Edit, Trash2, Upload, Download, Eye } from 'lucide-react';

interface Toeslagtabel {
  id: number;
  jaar: number;
  data: any;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

interface InkomensKlasse {
  min: number;
  max: number | null;
  perc_first_child: number;
  perc_other_children: number;
}

interface ToeslagtabelData {
  year: number;
  income_brackets: InkomensKlasse[];
  max_hourly_rates: {
    dagopvang: number;
    bso: number;
    gastouder: number;
  };
}

const ToeslagtabelBeheerPage: React.FC = () => {
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTabel, setEditingTabel] = useState<Toeslagtabel | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ToeslagtabelData>({
    year: new Date().getFullYear(),
    income_brackets: [
      { min: 0, max: 23000, perc_first_child: 96, perc_other_children: 96 },
      { min: 23001, max: 53000, perc_first_child: 83, perc_other_children: 83 },
      { min: 53001, max: 75000, perc_first_child: 50, perc_other_children: 50 },
      { min: 75001, max: null, perc_first_child: 0, perc_other_children: 0 }
    ],
    max_hourly_rates: {
      dagopvang: 10.25,
      bso: 9.12,
      gastouder: 7.53
    }
  });

  const toaster = createToaster({
    placement: 'top-right',
  });

  useEffect(() => {
    loadToeslagtabellen();
  }, []);

  const loadToeslagtabellen = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/toeslagtabellen`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setToeslagtabellen(result.data);
        }
      }
    } catch (error) {
      toaster.create({
        title: 'Fout bij laden',
        description: 'Kon toeslagtabellen niet laden',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTabel = (tabel: Toeslagtabel) => {
    setEditingTabel(tabel);
    try {
      const data = JSON.parse(tabel.data);
      setFormData(data);
    } catch {
      // Fallback naar default data
      setFormData({
        year: tabel.jaar,
        income_brackets: [
          { min: 0, max: 23000, perc_first_child: 96, perc_other_children: 96 },
        ],
        max_hourly_rates: {
          dagopvang: 10.25,
          bso: 9.12,
          gastouder: 7.53
        }
      });
    }
    setShowModal(true);
  };

  const handleNewTabel = () => {
    setEditingTabel(null);
    setFormData({
      year: new Date().getFullYear(),
      income_brackets: [
        { min: 0, max: 23000, perc_first_child: 96, perc_other_children: 96 },
        { min: 23001, max: 53000, perc_first_child: 83, perc_other_children: 83 },
        { min: 53001, max: 75000, perc_first_child: 50, perc_other_children: 50 },
        { min: 75001, max: null, perc_first_child: 0, perc_other_children: 0 }
      ],
      max_hourly_rates: {
        dagopvang: 10.25,
        bso: 9.12,
        gastouder: 7.53
      }
    });
    setShowModal(true);
  };

  const handleSaveTabel = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      const token = localStorage.getItem('token');

      const url = editingTabel 
        ? `${apiUrl}/api/toeslagtabellen/${editingTabel.jaar}`
        : `${apiUrl}/api/toeslagtabellen`;
      
      const method = editingTabel ? 'PUT' : 'POST';

      const body = editingTabel 
        ? { data: formData, actief: true }
        : { jaar: formData.year, data: formData };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toaster.create({
            title: 'Succes',
            description: editingTabel ? 'Toeslagtabel bijgewerkt' : 'Toeslagtabel aangemaakt',
            status: 'success',
            duration: 3000,
          });
          setShowModal(false);
          loadToeslagtabellen();
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error('Fout bij opslaan');
      }
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Kon toeslagtabel niet opslaan',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteTabel = async (jaar: number) => {
    if (!window.confirm('Weet je zeker dat je deze toeslagtabel wilt verwijderen?')) {
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/toeslagtabellen/${jaar}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toaster.create({
          title: 'Succes',
          description: 'Toeslagtabel verwijderd',
          status: 'success',
          duration: 3000,
        });
        loadToeslagtabellen();
      }
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: 'Kon toeslagtabel niet verwijderen',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.json')) {
      setUploadError('Alleen JSON bestanden zijn toegestaan');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validatie
      if (!data.year || !data.income_brackets || !data.max_hourly_rates) {
        setUploadError('Ongeldig bestandsformat. Vereiste velden: year, income_brackets, max_hourly_rates');
        return;
      }

      setFormData(data);
      setUploadError(null);
      setShowUploadModal(false);
      setShowModal(true);
      
      toaster.create({
        title: 'Bestand geladen',
        description: 'Toeslagtabel data is ingeladen. Controleer de gegevens voordat je opslaat.',
        status: 'info',
        duration: 3000,
      });
    } catch (error) {
      setUploadError('Fout bij lezen van bestand. Controleer of het een geldig JSON bestand is.');
    }
  };

  const updateInkomensKlasse = (index: number, field: keyof InkomensKlasse, value: any) => {
    const newBrackets = [...formData.income_brackets];
    newBrackets[index] = { ...newBrackets[index], [field]: value };
    setFormData({ ...formData, income_brackets: newBrackets });
  };

  const addInkomensKlasse = () => {
    const newBrackets = [...formData.income_brackets];
    newBrackets.push({ min: 0, max: null, perc_first_child: 0, perc_other_children: 0 });
    setFormData({ ...formData, income_brackets: newBrackets });
  };

  const removeInkomensKlasse = (index: number) => {
    const newBrackets = formData.income_brackets.filter((_, i) => i !== index);
    setFormData({ ...formData, income_brackets: newBrackets });
  };

  const exportTabel = (tabel: Toeslagtabel) => {
    try {
      const data = JSON.parse(tabel.data);
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `toeslagtabel_${tabel.jaar}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      toaster.create({
        title: 'Fout',
        description: 'Kon toeslagtabel niet exporteren',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Toeslagtabellen laden...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <HStack justifyContent="space-between" mb={4}>
            <Text fontSize="2xl" fontWeight="bold">
              🏛️ Toeslagtabel Beheer
            </Text>
            <HStack gap={2}>
              <Button
                leftIcon={<Upload size={16} />}
                onClick={() => setShowUploadModal(true)}
                colorScheme="blue"
                variant="outline"
              >
                Upload JSON
              </Button>
              <Button
                leftIcon={<Text fontSize="xl">➕</Text>}
                onClick={handleNewTabel}
                colorScheme="green"
              >
                Nieuwe Toeslagtabel
              </Button>
            </HStack>
          </HStack>

          {toeslagtabellen.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>Geen toeslagtabellen!</AlertTitle>
              <AlertDescription>
                Er zijn nog geen toeslagtabellen aangemaakt. Maak er een aan om te beginnen.
              </AlertDescription>
            </Alert>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Jaar</Th>
                  <Th>Status</Th>
                  <Th>Inkomensklassen</Th>
                  <Th>Max Tarieven</Th>
                  <Th>Laatst Bijgewerkt</Th>
                  <Th>Acties</Th>
                </Tr>
              </Thead>
              <Tbody>
                {toeslagtabellen.map((tabel) => {
                  let parsedData: ToeslagtabelData | null = null;
                  try {
                    parsedData = JSON.parse(tabel.data);
                  } catch {}

                  return (
                    <Tr key={tabel.jaar}>
                      <Td>
                        <Text fontWeight="bold">{tabel.jaar}</Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={tabel.actief ? 'green' : 'gray'}>
                          {tabel.actief ? 'Actief' : 'Inactief'}
                        </Badge>
                      </Td>
                      <Td>
                        {parsedData ? `${parsedData.income_brackets.length} klassen` : 'Onbekend'}
                      </Td>
                      <Td>
                        {parsedData ? (
                          <VStack align="start" gap={0} fontSize="sm">
                            <Text>KDV: €{parsedData.max_hourly_rates.dagopvang}</Text>
                            <Text>BSO: €{parsedData.max_hourly_rates.bso}</Text>
                            <Text>Gastouder: €{parsedData.max_hourly_rates.gastouder}</Text>
                          </VStack>
                        ) : 'Onbekend'}
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(tabel.updated_at).toLocaleDateString('nl-NL')}
                        </Text>
                      </Td>
                      <Td>
                        <HStack gap={2}>
                          <IconButton
                            aria-label="Bewerken"
                            icon={<Edit size={16} />}
                            size="sm"
                            onClick={() => handleEditTabel(tabel)}
                          />
                          <IconButton
                            aria-label="Exporteren"
                            icon={<Download size={16} />}
                            size="sm"
                            onClick={() => exportTabel(tabel)}
                          />
                          <IconButton
                            aria-label="Verwijderen"
                            icon={<Trash2 size={16} />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleDeleteTabel(tabel.jaar)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Toeslagtabel Uploaden</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap={4} align="stretch">
              <Text>
                Upload een JSON bestand met toeslagtabel data. Het bestand moet de volgende structuur hebben:
              </Text>
              <Box bg="gray.50" p={3} borderRadius="md" fontSize="sm">
                <Text fontFamily="mono">
                  {`{
  "year": 2024,
  "income_brackets": [...],
  "max_hourly_rates": {...}
}`}
                </Text>
              </Box>
              
              <Input
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e.target.files)}
                display="none"
                id="file-upload"
              />
              <Button
                as="label"
                htmlFor="file-upload"
                variant="outline"
                cursor="pointer"
              >
                <Upload size={16} />
                Bestand Selecteren
              </Button>

              {uploadError && (
                <Alert status="error">
                  <AlertIcon />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowUploadModal(false)}>Sluiten</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit/Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>
            {editingTabel ? `Toeslagtabel ${editingTabel.jaar} Bewerken` : 'Nieuwe Toeslagtabel'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap={6} align="stretch">
              {/* Jaar */}
              <Box>
                <Text mb={2} fontWeight="medium">Jaar</Text>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2024 })}
                  disabled={!!editingTabel}
                />
              </Box>

              {/* Max Hourly Rates */}
              <Box>
                <Text mb={4} fontWeight="medium" fontSize="lg">Maximum Uurtarieven</Text>
                <HStack gap={4}>
                  <Box>
                    <Text mb={2}>Dagopvang (KDV)</Text>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_hourly_rates.dagopvang}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_hourly_rates: {
                          ...formData.max_hourly_rates,
                          dagopvang: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </Box>
                  <Box>
                    <Text mb={2}>Buitenschoolse opvang (BSO)</Text>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_hourly_rates.bso}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_hourly_rates: {
                          ...formData.max_hourly_rates,
                          bso: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </Box>
                  <Box>
                    <Text mb={2}>Gastouderopvang</Text>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_hourly_rates.gastouder}
                      onChange={(e) => setFormData({
                        ...formData,
                        max_hourly_rates: {
                          ...formData.max_hourly_rates,
                          gastouder: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </Box>
                </HStack>
              </Box>

              {/* Income Brackets */}
              <Box>
                <HStack justifyContent="space-between" mb={4}>
                  <Text fontWeight="medium" fontSize="lg">Inkomensklassen</Text>
                  <Button size="sm" onClick={addInkomensKlasse}>
                    ➕ Klasse Toevoegen
                  </Button>
                </HStack>

                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Min Inkomen</Th>
                      <Th>Max Inkomen</Th>
                      <Th>% Eerste Kind</Th>
                      <Th>% Volgende Kinderen</Th>
                      <Th>Acties</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formData.income_brackets.map((bracket, index) => (
                      <Tr key={index}>
                        <Td>
                          <Input
                            type="number"
                            value={bracket.min}
                            onChange={(e) => updateInkomensKlasse(index, 'min', parseInt(e.target.value) || 0)}
                          />
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            value={bracket.max || ''}
                            placeholder="Geen maximum"
                            onChange={(e) => updateInkomensKlasse(index, 'max', e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            value={bracket.perc_first_child}
                            onChange={(e) => updateInkomensKlasse(index, 'perc_first_child', parseInt(e.target.value) || 0)}
                          />
                        </Td>
                        <Td>
                          <Input
                            type="number"
                            value={bracket.perc_other_children}
                            onChange={(e) => updateInkomensKlasse(index, 'perc_other_children', parseInt(e.target.value) || 0)}
                          />
                        </Td>
                        <Td>
                          <IconButton
                            aria-label="Verwijderen"
                            icon={<Trash2 size={16} />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeInkomensKlasse(index)}
                            isDisabled={formData.income_brackets.length <= 1}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack gap={3}>
              <Button onClick={() => setShowModal(false)}>Annuleren</Button>
              <Button colorScheme="blue" onClick={handleSaveTabel}>
                {editingTabel ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ToeslagtabelBeheerPage; 