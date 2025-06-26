import { Request, Response } from 'express';
import { OpvangvormModel, Opvangvorm } from '../models/Opvangvorm';
import { OrganisatieRequest } from '../middleware/organisatieContext';

export const getOpvangvormen = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    // Bij impersonation gebruiken we req.organisatie, anders req.user.organisatieId
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const opvangvormen = await OpvangvormModel.getAll(organisatieId);
    res.json({
      success: true,
      data: opvangvormen
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Fout bij het ophalen van opvangvormen' 
    });
  }
};

export const getOpvangvormenPubliek = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    let organisatieId: number;
    
    // Probeer organisatie ID te krijgen uit context (nieuwe manier) of params (legacy)
    if (req.organisatie) {
      organisatieId = req.organisatie.id;
    } else if (req.params.organisatieId) {
      organisatieId = parseInt(req.params.organisatieId);
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Organisatie niet gevonden' 
      });
      return;
    }
    
    const opvangvormen = await OpvangvormModel.getAll(organisatieId);
    res.json({
      success: true,
      data: opvangvormen
    });
  } catch (error) {
    console.error('Get opvangvormen publiek error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Fout bij het ophalen van opvangvormen' 
    });
  }
};

export const getOpvangvorm = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const opvangvorm = await OpvangvormModel.getById(parseInt(id), organisatieId);
    
    if (!opvangvorm) {
      res.status(404).json({ error: 'Opvangvorm niet gevonden' });
      return;
    }
    
    res.json(opvangvorm);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het ophalen van opvangvorm' });
  }
};

export const createOpvangvorm = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { naam, omschrijving } = req.body;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    if (!naam) {
      res.status(400).json({ error: 'Naam is verplicht' });
      return;
    }
    
    const opvangvormData: Omit<Opvangvorm, 'id' | 'created_at' | 'updated_at'> = {
      naam,
      omschrijving,
      organisatie_id: organisatieId,
      actief: true
    };
    
    const opvangvorm = await OpvangvormModel.create(opvangvormData);
    res.status(201).json(opvangvorm);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het aanmaken van opvangvorm' });
  }
};

export const updateOpvangvorm = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { naam, omschrijving } = req.body;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    if (!naam) {
      res.status(400).json({ error: 'Naam is verplicht' });
      return;
    }
    
    const opvangvorm = await OpvangvormModel.update(
      parseInt(id),
      organisatieId,
      { naam, omschrijving }
    );
    
    if (!opvangvorm) {
      res.status(404).json({ error: 'Opvangvorm niet gevonden' });
      return;
    }
    
    res.json(opvangvorm);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het bijwerken van opvangvorm' });
  }
};

export const deleteOpvangvorm = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const success = await OpvangvormModel.delete(parseInt(id), organisatieId);
    
    if (!success) {
      res.status(404).json({ error: 'Opvangvorm niet gevonden' });
      return;
    }
    
    res.json({ message: 'Opvangvorm succesvol verwijderd' });
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het verwijderen van opvangvorm' });
  }
}; 