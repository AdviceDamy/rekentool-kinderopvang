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
import { Opvangvorm } from '../types';
import { opvangvormenAPI } from '../services/api';

const OpvangvormenPage: React.FC = () => {
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

  return (
    <Box p={6}>
      <Box mb={6} display="flex" justifyContent="space-between" alignItems="center">
        <Text fontSize="2xl" fontWeight="bold">
          Opvangvormen beheren
        </Text>
        <Button colorPalette="blue" onClick={() => handleOpenModal()}>
          + Nieuwe opvangvorm
        </Button>
      </Box>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Naam</Table.ColumnHeader>
            <Table.ColumnHeader>Omschrijving</Table.ColumnHeader>
            <Table.ColumnHeader>Status</Table.ColumnHeader>
            <Table.ColumnHeader width="120px">Acties</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={4} textAlign="center">Laden...</Table.Cell>
            </Table.Row>
          ) : opvangvormen.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={4} textAlign="center">Geen opvangvormen gevonden</Table.Cell>
            </Table.Row>
          ) : (
            opvangvormen.map((opvangvorm) => (
              <Table.Row key={opvangvorm.id}>
                <Table.Cell>{opvangvorm.naam}</Table.Cell>
                <Table.Cell>{opvangvorm.omschrijving || '-'}</Table.Cell>
                <Table.Cell>
                  <Text color={opvangvorm.actief ? 'green.500' : 'red.500'}>
                    {opvangvorm.actief ? 'Actief' : 'Inactief'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Box display="flex" gap={2}>
                    <IconButton
                      size="sm"
                      colorPalette="blue"
                      variant="ghost"
                      onClick={() => handleOpenModal(opvangvorm)}
                    >
                      ✏️
                    </IconButton>
                    <IconButton
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => openDeleteDialog(opvangvorm)}
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
        >
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            boxShadow="lg"
            width="500px"
            maxWidth="90%"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              {selectedOpvangvorm ? 'Opvangvorm bewerken' : 'Nieuwe opvangvorm'}
            </Text>
            
            <Box mb={4}>
              <Text mb={2}>Naam *</Text>
              <Input
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="Naam van de opvangvorm"
              />
            </Box>
            
            <Box mb={6}>
              <Text mb={2}>Omschrijving</Text>
              <Textarea
                value={formData.omschrijving}
                onChange={(e) => setFormData({ ...formData, omschrijving: e.target.value })}
                placeholder="Optionele omschrijving"
                rows={3}
              />
            </Box>
            
            <Box display="flex" gap={3} justifyContent="flex-end">
              <Button variant="outline" onClick={handleCloseModal}>
                Annuleren
              </Button>
              <Button colorPalette="blue" onClick={handleSubmit}>
                {selectedOpvangvorm ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Delete dialog */}
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
          <Box
            bg="white"
            p={6}
            borderRadius="md"
            boxShadow="lg"
            width="400px"
            maxWidth="90%"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Opvangvorm verwijderen
            </Text>
            
            <Text mb={6}>
              Weet u zeker dat u "{deleteOpvangvorm.naam}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </Text>
            
            <Box display="flex" gap={3} justifyContent="flex-end">
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
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default OpvangvormenPage; 