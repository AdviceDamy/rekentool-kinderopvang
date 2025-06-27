import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  Input,
  VStack,
  HStack,
  Badge,
  createToaster,
} from '@chakra-ui/react';

interface Toeslagtabel {
  id: number;
  jaar: number;
  data: any;
  actief: boolean;
  created_at: string;
  updated_at: string;
}

interface ToeslagtabelData {
  year: number;
  income_brackets: Array<{
    min: number;
    max: number | null;
    perc_first_child: number;
    perc_other_children: number;
  }>;
  max_hourly_rates: {
    dagopvang: number;
    bso: number;
    gastouder: number;
  };
}

const ToeslagtabelBeheerPage: React.FC = () => {
  const [toeslagtabellen, setToeslagtabellen] = useState<Toeslagtabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTabel, setEditingTabel] = useState<Toeslagtabel | null>(null);
  
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
    setShowForm(true);
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
    setShowForm(true);
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
          setShowForm(false);
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

  const exportToJSON = (tabel: Toeslagtabel) => {
    try {
      let exportData;
      
      try {
        // Probeer de data als JSON te parsen
        const parsedData = JSON.parse(tabel.data);
        exportData = {
          jaar: tabel.jaar,
          actief: tabel.actief,
          ...parsedData
        };
      } catch {
        // Als parsing faalt, export de ruwe data
        exportData = {
          jaar: tabel.jaar,
          actief: tabel.actief,
          data: tabel.data
        };
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `toeslagtabel-${tabel.jaar}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toaster.create({
        title: 'Export gelukt',
        description: `Toeslagtabel ${tabel.jaar} geëxporteerd naar JSON`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Export fout',
        description: 'Kon toeslagtabel niet exporteren naar JSON',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const exportAllToJSON = () => {
    try {
      const exportData = toeslagtabellen.map(tabel => {
        try {
          const parsedData = JSON.parse(tabel.data);
          return {
            jaar: tabel.jaar,
            actief: tabel.actief,
            created_at: tabel.created_at,
            updated_at: tabel.updated_at,
            ...parsedData
          };
        } catch {
          return {
            jaar: tabel.jaar,
            actief: tabel.actief,
            created_at: tabel.created_at,
            updated_at: tabel.updated_at,
            data: tabel.data
          };
        }
      });

      const jsonString = JSON.stringify({
        export_date: new Date().toISOString(),
        tabellen: exportData
      }, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `alle-toeslagtabellen-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toaster.create({
        title: 'Export gelukt',
        description: `${toeslagtabellen.length} toeslagtabellen geëxporteerd naar JSON`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: 'Export fout',
        description: 'Kon toeslagtabellen niet exporteren naar JSON',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Check of het een enkele tabel of meerdere tabellen betreft
      if (importedData.tabellen && Array.isArray(importedData.tabellen)) {
        // Multiple tables import
        let successCount = 0;
        let errorCount = 0;

        for (const tabelData of importedData.tabellen) {
          try {
            await importSingleTable(tabelData);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Fout bij importeren tabel ${tabelData.jaar}:`, error);
          }
        }

        toaster.create({
          title: 'Import voltooid',
          description: `${successCount} tabellen geïmporteerd, ${errorCount} fouten`,
          status: successCount > 0 ? 'success' : 'error',
          duration: 5000,
        });
      } else {
        // Single table import
        await importSingleTable(importedData);
        toaster.create({
          title: 'Import gelukt',
          description: `Toeslagtabel ${importedData.jaar} geïmporteerd`,
          status: 'success',
          duration: 3000,
        });
      }

      loadToeslagtabellen();
    } catch (error) {
      toaster.create({
        title: 'Import fout',
        description: 'Ongeldig JSON bestand of fout bij importeren',
        status: 'error',
        duration: 5000,
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const importSingleTable = async (tabelData: any) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5007';
    const token = localStorage.getItem('token');

    // Validate required fields
    if (!tabelData.jaar || typeof tabelData.jaar !== 'number') {
      throw new Error('Ongeldig jaartal in JSON data');
    }

    // Prepare data for API
    let dataToSend;
    if (tabelData.data && typeof tabelData.data === 'string') {
      // Data is already a JSON string
      dataToSend = {
        jaar: tabelData.jaar,
        data: JSON.parse(tabelData.data),
        actief: tabelData.actief || false
      };
    } else {
      // Extract the table structure from the imported data
      const { jaar, actief, created_at, updated_at, ...tableStructure } = tabelData;
      dataToSend = {
        jaar: jaar,
        data: tableStructure,
        actief: actief || false
      };
    }

    // Check if table already exists and ask for confirmation
    const existingTable = toeslagtabellen.find(t => t.jaar === tabelData.jaar);
    if (existingTable) {
      const confirmed = window.confirm(
        `Toeslagtabel voor jaar ${tabelData.jaar} bestaat al. Wilt u deze overschrijven?`
      );
      if (!confirmed) {
        throw new Error(`Import geannuleerd voor jaar ${tabelData.jaar}`);
      }
    }

    const method = existingTable ? 'PUT' : 'POST';
    const url = existingTable 
      ? `${apiUrl}/api/toeslagtabellen/${tabelData.jaar}`
      : `${apiUrl}/api/toeslagtabellen`;

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Onbekende fout bij opslaan');
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Text>Toeslagtabellen laden...</Text>
      </Box>
    );
  }

  if (showForm) {
    return (
      <Box p={6}>
        <VStack align="stretch" gap={6}>
          <HStack justifyContent="space-between">
            <Text fontSize="2xl" fontWeight="bold">
              {editingTabel ? 'Toeslagtabel Bewerken' : 'Nieuwe Toeslagtabel'}
            </Text>
            <Button onClick={() => setShowForm(false)}>Terug</Button>
          </HStack>

          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <VStack gap={6} align="stretch">
              <Box bg="green.50" p={3} borderRadius="md" border="1px solid" borderColor="green.200">
                <Text fontSize="sm" color="green.800">
                  💾 <strong>JSON Export/Import:</strong> U kunt deze toeslagtabel exporteren naar JSON om hem te gebruiken voor andere jaren. 
                  Gebruik "Preview JSON" om de huidige waarden te exporteren of "Export JSON" om de opgeslagen versie te downloaden.
                </Text>
              </Box>

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
                <VStack gap={4}>
                  <HStack gap={4} w="full">
                    <Box flex={1}>
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
                    <Box flex={1}>
                      <Text mb={2}>BSO</Text>
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
                    <Box flex={1}>
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
                </VStack>
              </Box>

              {/* Income Brackets */}
              <Box>
                <Text fontWeight="medium" fontSize="lg" mb={4}>Inkomensklassen</Text>
                <VStack gap={4}>
                  {formData.income_brackets.map((bracket, index) => (
                    <HStack key={index} gap={4} w="full">
                      <Box flex={1}>
                        <Text mb={1} fontSize="sm">Min inkomen</Text>
                        <Input
                          type="number"
                          value={bracket.min}
                          onChange={(e) => {
                            const newBrackets = [...formData.income_brackets];
                            newBrackets[index] = { ...newBrackets[index], min: parseInt(e.target.value) || 0 };
                            setFormData({ ...formData, income_brackets: newBrackets });
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Text mb={1} fontSize="sm">Max inkomen</Text>
                        <Input
                          type="number"
                          value={bracket.max || ''}
                          placeholder="Geen maximum"
                          onChange={(e) => {
                            const newBrackets = [...formData.income_brackets];
                            newBrackets[index] = { 
                              ...newBrackets[index], 
                              max: e.target.value ? parseInt(e.target.value) : null 
                            };
                            setFormData({ ...formData, income_brackets: newBrackets });
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Text mb={1} fontSize="sm">% Eerste kind</Text>
                        <Input
                          type="number"
                          value={bracket.perc_first_child}
                          onChange={(e) => {
                            const newBrackets = [...formData.income_brackets];
                            newBrackets[index] = { 
                              ...newBrackets[index], 
                              perc_first_child: parseInt(e.target.value) || 0 
                            };
                            setFormData({ ...formData, income_brackets: newBrackets });
                          }}
                        />
                      </Box>
                      <Box flex={1}>
                        <Text mb={1} fontSize="sm">% Volgende kinderen</Text>
                        <Input
                          type="number"
                          value={bracket.perc_other_children}
                          onChange={(e) => {
                            const newBrackets = [...formData.income_brackets];
                            newBrackets[index] = { 
                              ...newBrackets[index], 
                              perc_other_children: parseInt(e.target.value) || 0 
                            };
                            setFormData({ ...formData, income_brackets: newBrackets });
                          }}
                        />
                      </Box>
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={() => {
                          const newBrackets = formData.income_brackets.filter((_, i) => i !== index);
                          setFormData({ ...formData, income_brackets: newBrackets });
                        }}
                        disabled={formData.income_brackets.length <= 1}
                      >
                        ✕
                      </Button>
                    </HStack>
                  ))}
                  
                  <Button
                    onClick={() => {
                      const newBrackets = [...formData.income_brackets];
                      newBrackets.push({ min: 0, max: null, perc_first_child: 0, perc_other_children: 0 });
                      setFormData({ ...formData, income_brackets: newBrackets });
                    }}
                    size="sm"
                  >
                    ➕ Klasse Toevoegen
                  </Button>
                </VStack>
              </Box>

              <HStack gap={3}>
                <Button onClick={() => setShowForm(false)}>Annuleren</Button>
                {editingTabel && (
                  <Button 
                    colorScheme="cyan" 
                    variant="outline"
                    onClick={() => exportToJSON(editingTabel)}
                  >
                    📤 Export JSON
                  </Button>
                )}
                <Button
                  colorScheme="purple"
                  variant="outline"
                  onClick={() => {
                    const previewData = {
                      jaar: formData.year,
                      actief: true,
                      data: JSON.stringify(formData),
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    exportToJSON(previewData as Toeslagtabel);
                  }}
                >
                  📥 Preview JSON
                </Button>
                <Button colorScheme="blue" onClick={handleSaveTabel}>
                  {editingTabel ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </VStack>
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
            <HStack gap={3}>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
                id="json-import-input"
              />
              <Button
                onClick={() => document.getElementById('json-import-input')?.click()}
                colorScheme="blue"
                variant="outline"
              >
                📁 Import JSON
              </Button>
              {toeslagtabellen.length > 0 && (
                <Button
                  onClick={exportAllToJSON}
                  colorScheme="purple"
                  variant="outline"
                >
                  📥 Export Alle Tabellen
                </Button>
              )}
              <Button
                onClick={handleNewTabel}
                colorScheme="green"
              >
                ➕ Nieuwe Toeslagtabel
              </Button>
            </HStack>
          </HStack>

          {toeslagtabellen.length > 0 && (
            <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200" mb={4}>
              <Text fontSize="sm" color="blue.800">
                💡 <strong>JSON Export/Import:</strong> Exporteer toeslagtabellen naar JSON voor backup of om ze aan te passen voor andere jaren. 
                Je kunt einzelne tabellen of alle tabellen tegelijk exporteren en importeren.
              </Text>
            </Box>
          )}

          {toeslagtabellen.length === 0 ? (
            <Box bg="blue.50" p={4} borderRadius="md" border="1px solid" borderColor="blue.200">
              <Text fontWeight="bold" color="blue.800" mb={2}>Geen toeslagtabellen!</Text>
              <Text color="blue.700">
                Er zijn nog geen toeslagtabellen aangemaakt. Maak er een aan om te beginnen.
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              {toeslagtabellen.map((tabel) => {
                let parsedData: ToeslagtabelData | null = null;
                try {
                  parsedData = JSON.parse(tabel.data);
                } catch {}

                return (
                  <Box key={tabel.jaar} bg="white" p={4} borderRadius="lg" shadow="sm" border="1px solid" borderColor="gray.200">
                    <HStack justifyContent="space-between" align="start">
                      <VStack align="start" gap={2}>
                        <HStack gap={3}>
                          <Text fontSize="xl" fontWeight="bold">Jaar {tabel.jaar}</Text>
                          <Badge colorScheme={tabel.actief ? 'green' : 'gray'}>
                            {tabel.actief ? 'Actief' : 'Inactief'}
                          </Badge>
                        </HStack>
                        
                        <HStack gap={6} fontSize="sm" color="gray.600">
                          <Text>
                            <strong>Inkomensklassen:</strong> {parsedData ? parsedData.income_brackets.length : 'Onbekend'}
                          </Text>
                          <Text>
                            <strong>Laatst bijgewerkt:</strong> {new Date(tabel.updated_at).toLocaleDateString('nl-NL')}
                          </Text>
                        </HStack>

                        {parsedData && (
                          <HStack gap={4} fontSize="sm">
                            <Text>KDV: €{parsedData.max_hourly_rates.dagopvang}</Text>
                            <Text>BSO: €{parsedData.max_hourly_rates.bso}</Text>
                            <Text>Gastouder: €{parsedData.max_hourly_rates.gastouder}</Text>
                          </HStack>
                        )}
                      </VStack>

                      <HStack gap={2}>
                        <Button
                          size="sm"
                          colorScheme="cyan"
                          variant="outline"
                          onClick={() => exportToJSON(tabel)}
                        >
                          📤 JSON
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEditTabel(tabel)}
                        >
                          Bewerken
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteTabel(tabel.jaar)}
                        >
                          Verwijderen
                        </Button>
                      </HStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default ToeslagtabelBeheerPage; 