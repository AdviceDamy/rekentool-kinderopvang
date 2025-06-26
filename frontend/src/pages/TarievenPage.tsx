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
} from '@chakra-ui/react';
import { Opvangvorm, Tarief, TariefType, DagenWeekConfiguratie, VrijUrenConfiguratie } from '../types';
import { opvangvormenAPI, tarievenAPI } from '../services/api';

const TarievenPage: React.FC = () => {
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

  return (
    <Box p={6}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold">
          Tarieven beheren
        </Text>
        <Button colorPalette="blue" onClick={() => handleOpenModal()}>
          + Nieuw tarief
        </Button>
      </Box>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Naam</Table.ColumnHeader>
            <Table.ColumnHeader>Opvangvorm</Table.ColumnHeader>
            <Table.ColumnHeader>Type</Table.ColumnHeader>
            <Table.ColumnHeader>Tarief</Table.ColumnHeader>
            <Table.ColumnHeader>Omschrijving</Table.ColumnHeader>
            <Table.ColumnHeader>Configuratie</Table.ColumnHeader>
            <Table.ColumnHeader width="120px">Acties</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={7} textAlign="center">Laden...</Table.Cell>
            </Table.Row>
          ) : tarieven.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7} textAlign="center">Geen tarieven gevonden</Table.Cell>
            </Table.Row>
          ) : (
            tarieven.map((tarief) => (
              <Table.Row key={tarief.id}>
                <Table.Cell>{tarief.naam}</Table.Cell>
                <Table.Cell>{getOpvangvormNaam(tarief.opvangvorm_id)}</Table.Cell>
                <Table.Cell>{getTypeLabel(tarief.type)}</Table.Cell>
                <Table.Cell>{getTariefDisplay(tarief)}</Table.Cell>
                <Table.Cell>{tarief.omschrijving || '-'}</Table.Cell>
                <Table.Cell>{getConfigurationDetails(tarief)}</Table.Cell>
                <Table.Cell>
                  <Box display="flex" gap={2}>
                    <IconButton
                      size="sm"
                      colorPalette="blue"
                      variant="ghost"
                      onClick={() => handleOpenModal(tarief)}
                    >
                      ✏️
                    </IconButton>
                    <IconButton
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => openDeleteDialog(tarief)}
                    >
                      🗑️
                    </IconButton>
                  </Box>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      {/* Modal voor toevoegen/bewerken */}
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
            width="600px"
            maxWidth="95%"
            maxHeight="90vh"
            display="flex"
            flexDirection="column"
          >
            {/* Header - vast bovenaan */}
            <Box p={6} borderBottom="1px solid" borderColor="gray.200">
              <Text fontSize="lg" fontWeight="bold">
                {selectedTarief ? 'Tarief bewerken' : 'Nieuw tarief'}
              </Text>
            </Box>
            
            {/* Scrollable content */}
            <Box flex={1} overflowY="auto" p={6}>
              <Box mb={4}>
                <Text mb={2}>Naam *</Text>
                <Input
                  value={formData.naam}
                  onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                  placeholder="Naam van het tarief"
                />
              </Box>
              
              <Box mb={4}>
                <Text mb={2}>Opvangvorm *</Text>
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
                <Text mb={2}>Type *</Text>
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
                  <Text mb={2}>Tarief (€) *</Text>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tarief}
                    onChange={(e) => setFormData({ ...formData, tarief: e.target.value })}
                    placeholder="0.00"
                  />
                </Box>
              )}
              
              {/* Dagen per week configuratie */}
              {formData.type === 'dagen_week' && (
                <>
                  <Box mb={4}>
                    <Text mb={2}>Dagen *</Text>
                    <Box display="flex" flexDirection="column" gap={2} p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
                      {weekDagen.map((dag) => (
                        <Box key={dag.key} display="flex" alignItems="center" gap={3}>
                          <Box minWidth="120px">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={formData.dagen.includes(dag.key)}
                                onChange={(e) => handleDagChange(dag.key, e.target.checked)}
                                style={{ marginRight: '8px' }}
                              />
                              <Text fontSize="sm">{dag.label}</Text>
                            </label>
                          </Box>
                          {formData.dagen.includes(dag.key) && (
                            <Box display="flex" alignItems="center" gap={2}>
                              <Text fontSize="sm" minWidth="40px">Uren:</Text>
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
                              />
                              <Text fontSize="xs" color="gray.500">uur</Text>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Tip: Laat uren leeg voor standaard opvangtijden
                    </Text>
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2}>Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.uurtarief}
                      onChange={(e) => setFormData({ ...formData, uurtarief: e.target.value })}
                      placeholder="0.00"
                    />
                  </Box>
                </>
              )}
              
              {/* Vrije uren per week */}
              {formData.type === 'vrij_uren_week' && (
                <>
                  <Box mb={4}>
                    <Text mb={2}>Maximum aantal uren per week *</Text>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.maxUren}
                      onChange={(e) => setFormData({ ...formData, maxUren: e.target.value })}
                      placeholder="40"
                    />
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2}>Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.vrijeUrenTarief}
                      onChange={(e) => setFormData({ ...formData, vrijeUrenTarief: e.target.value })}
                      placeholder="0.00"
                    />
                  </Box>
                </>
              )}
              
              {/* Vrije uren per maand */}
              {formData.type === 'vrij_uren_maand' && (
                <>
                  <Box mb={4}>
                    <Text mb={2}>Maximum aantal uren per maand *</Text>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.maxUren}
                      onChange={(e) => setFormData({ ...formData, maxUren: e.target.value })}
                      placeholder="160"
                    />
                  </Box>
                  
                  <Box mb={4}>
                    <Text mb={2}>Uurtarief (€) *</Text>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.vrijeUrenTarief}
                      onChange={(e) => setFormData({ ...formData, vrijeUrenTarief: e.target.value })}
                      placeholder="0.00"
                    />
                  </Box>
                </>
              )}
              
              <Box>
                <Text mb={2}>Omschrijving</Text>
                <Textarea
                  value={formData.omschrijving}
                  onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                  placeholder="Optionele omschrijving"
                  rows={3}
                />
              </Box>
            </Box>
            
            {/* Footer - vast onderaan */}
            <Box p={6} borderTop="1px solid" borderColor="gray.200">
              <Box display="flex" gap={3} justifyContent="flex-end">
                <Button variant="outline" onClick={handleCloseModal}>
                  Annuleren
                </Button>
                <Button colorPalette="blue" onClick={handleSubmit}>
                  {selectedTarief ? 'Bijwerken' : 'Aanmaken'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete dialog */}
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
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            boxShadow="lg"
            width="400px"
            maxWidth="90%"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Tarief verwijderen
            </Text>
            
            <Text mb={6}>
              Weet u zeker dat u "{deleteTarief.naam}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </Text>
            
            <Box display="flex" gap={3} justifyContent="flex-end">
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
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TarievenPage; 