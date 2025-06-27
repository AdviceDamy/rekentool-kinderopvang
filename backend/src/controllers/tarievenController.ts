import { Request, Response } from 'express';
import { TariefModel, Tarief, TariefType } from '../models/Tarief';
import { OrganisatieRequest } from '../middleware/organisatieContext';

export const getTarieven = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const tarieven = await TariefModel.getAll(organisatieId);
    res.json({
      success: true,
      data: tarieven
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Fout bij het ophalen van tarieven' 
    });
  }
};

export const getTarievenPubliek = async (req: OrganisatieRequest, res: Response): Promise<void> => {
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
    
    const tarieven = await TariefModel.getAll(organisatieId);
    res.json({
      success: true,
      data: tarieven
    });
  } catch (error) {
    console.error('Get tarieven publiek error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Fout bij het ophalen van tarieven' 
    });
  }
};

export const getTarievenByOpvangvorm = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { opvangvormId } = req.params;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const tarieven = await TariefModel.getByOpvangvorm(parseInt(opvangvormId), organisatieId);
    res.json(tarieven);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het ophalen van tarieven' });
  }
};

export const getTarief = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const tarief = await TariefModel.getById(parseInt(id), organisatieId);
    
    if (!tarief) {
      res.status(404).json({ error: 'Tarief niet gevonden' });
      return;
    }
    
    res.json(tarief);
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het ophalen van tarief' });
  }
};

export const createTarief = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { naam, type, tarief, omschrijving, opvangvorm_id, configuratie } = req.body;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    if (!naam || !type || !opvangvorm_id) {
      res.status(400).json({ 
        error: 'Naam, type en opvangvorm zijn verplicht' 
      });
      return;
    }
    
    const validTypes: TariefType[] = ['uur', 'dag', 'vast_maand', 'dagen_week', 'vrij_uren_week', 'vrij_uren_maand'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ 
        error: `Type moet één van de volgende zijn: ${validTypes.join(', ')}` 
      });
      return;
    }
    
    // Validatie afhankelijk van type
    if (['uur', 'dag', 'vast_maand'].includes(type) && (!tarief || tarief <= 0)) {
      res.status(400).json({ 
        error: 'Tarief moet groter dan 0 zijn voor dit type' 
      });
      return;
    }
    
    if (['dagen_week', 'vrij_uren_week', 'vrij_uren_maand'].includes(type) && !configuratie) {
      res.status(400).json({ 
        error: 'Configuratie is verplicht voor dit type' 
      });
      return;
    }
    
    const tariefData: Omit<Tarief, 'id' | 'created_at' | 'updated_at'> = {
      naam,
      type,
      tarief: tarief ? parseFloat(tarief) : 0,
      omschrijving,
      opvangvorm_id: parseInt(opvangvorm_id),
      organisatie_id: organisatieId,
      configuratie,
      actief: true
    };
    
    const nieuwTarief = await TariefModel.create(tariefData);
    res.status(201).json(nieuwTarief);
  } catch (error) {
    console.error('Create tarief error:', error);
    res.status(500).json({ error: 'Fout bij het aanmaken van tarief' });
  }
};

export const updateTarief = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { naam, type, tarief, omschrijving, opvangvorm_id, configuratie } = req.body;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    console.log('updateTarief called with:', { id, body: req.body, organisatieId });
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    if (!naam || !type || !opvangvorm_id) {
      res.status(400).json({ 
        error: 'Naam, type en opvangvorm zijn verplicht' 
      });
      return;
    }
    
    const validTypes: TariefType[] = ['uur', 'dag', 'vast_maand', 'dagen_week', 'vrij_uren_week', 'vrij_uren_maand'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ 
        error: `Type moet één van de volgende zijn: ${validTypes.join(', ')}` 
      });
      return;
    }
    
    // Validatie afhankelijk van type
    if (['uur', 'dag', 'vast_maand'].includes(type) && (!tarief || tarief <= 0)) {
      res.status(400).json({ 
        error: 'Tarief moet groter dan 0 zijn voor dit type' 
      });
      return;
    }
    
    if (['dagen_week', 'vrij_uren_week', 'vrij_uren_maand'].includes(type) && !configuratie) {
      res.status(400).json({ 
        error: 'Configuratie is verplicht voor dit type' 
      });
      return;
    }
    
    const tariefUpdate = {
      naam,
      type,
      tarief: tarief ? parseFloat(tarief) : 0,
      omschrijving,
      opvangvorm_id: parseInt(opvangvorm_id),
      configuratie
    };
    
    console.log('Updating tarief with data:', tariefUpdate);
    
    const bijgewerktTarief = await TariefModel.update(
      parseInt(id),
      organisatieId,
      tariefUpdate
    );
    
    if (!bijgewerktTarief) {
      res.status(404).json({ error: 'Tarief niet gevonden' });
      return;
    }
    
    console.log('Update successful:', bijgewerktTarief);
    res.json(bijgewerktTarief);
  } catch (error) {
    console.error('Update tarief error:', error);
    res.status(500).json({ error: 'Fout bij het bijwerken van tarief' });
  }
};

export const deleteTarief = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organisatieId = req.organisatie?.id || req.user?.organisatieId;
    
    if (!organisatieId) {
      res.status(400).json({ error: 'Organisatie ID ontbreekt' });
      return;
    }
    
    const success = await TariefModel.delete(parseInt(id), organisatieId);
    
    if (!success) {
      res.status(404).json({ error: 'Tarief niet gevonden' });
      return;
    }
    
    res.json({ message: 'Tarief succesvol verwijderd' });
  } catch (error) {
    res.status(500).json({ error: 'Fout bij het verwijderen van tarief' });
  }
}; 