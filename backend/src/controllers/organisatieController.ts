import { Request, Response } from 'express';
import { OrganisatieModel, Organisatie } from '../models/Organisatie';
import { UserModel } from '../models/User';
import { UserRole } from '../types';
import { OrganisatieRequest } from '../middleware/organisatieContext';
import bcrypt from 'bcryptjs';

export const getOrganisaties = async (req: Request, res: Response): Promise<void> => {
  try {
    const organisaties = await OrganisatieModel.getAll();
    res.json(organisaties);
  } catch (error) {
    console.error('Get organisaties error:', error);
    res.status(500).json({ error: 'Fout bij het ophalen van organisaties' });
  }
};

export const getOrganisatie = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const organisatie = await OrganisatieModel.getById(parseInt(id));
    
    if (!organisatie) {
      res.status(404).json({ error: 'Organisatie niet gevonden' });
      return;
    }
    
    res.json(organisatie);
  } catch (error) {
    console.error('Get organisatie error:', error);
    res.status(500).json({ error: 'Fout bij het ophalen van organisatie' });
  }
};

export const getOrganisatieBySlug = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const organisatie = await OrganisatieModel.getBySlug(slug);
    
    if (!organisatie) {
      res.status(404).json({
        success: false,
        error: 'Organisatie niet gevonden'
      });
      return;
    }
    
    res.json({
      success: true,
      data: organisatie
    });
  } catch (error) {
    console.error('Fout bij ophalen organisatie:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen organisatie'
    });
  }
};

export const createOrganisatie = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const {
      naam,
      email,
      telefoon,
      adres,
      postcode,
      plaats,
      website,
      slug,
      beheerderEmail,
      beheerderWachtwoord
    } = req.body;

    // Validatie
    if (!naam || !slug || !beheerderEmail || !beheerderWachtwoord) {
      res.status(400).json({
        success: false,
        error: 'Naam, slug, beheerder email en wachtwoord zijn verplicht'
      });
      return;
    }

    // Check of slug al bestaat
    const bestaandeOrganisatie = await OrganisatieModel.getBySlug(slug);
    if (bestaandeOrganisatie) {
      res.status(400).json({
        success: false,
        error: 'Een organisatie met deze slug bestaat al'
      });
      return;
    }

    // Check of email al bestaat
    const bestaandeUser = await UserModel.findByEmail(beheerderEmail);
    if (bestaandeUser) {
      res.status(400).json({
        success: false,
        error: 'Een gebruiker met dit email adres bestaat al'
      });
      return;
    }

    // Organisatie aanmaken
    const nieuweOrganisatie = await OrganisatieModel.create({
      naam,
      email,
      telefoon,
      adres,
      postcode,
      plaats,
      website,
      slug,
      actief: true
    });

    // Beheerder account aanmaken
    const nieuweBeheerder = await UserModel.create({
      email: beheerderEmail,
      password: beheerderWachtwoord,
      role: UserRole.ORGANISATIE_BEHEERDER,
      organisatie_id: nieuweOrganisatie.id!
    });

    res.status(201).json({
      success: true,
      data: {
        organisatie: nieuweOrganisatie,
        beheerder: {
          id: nieuweBeheerder.id,
          email: nieuweBeheerder.email,
          role: nieuweBeheerder.role
        }
      },
      message: 'Organisatie en beheerder succesvol aangemaakt'
    });
  } catch (error) {
    console.error('Fout bij aanmaken organisatie:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij aanmaken organisatie'
    });
  }
};

export const updateOrganisatie = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verwijder velden die niet bijgewerkt mogen worden
    delete updates.id;
    delete updates.created_at;
    delete updates.updated_at;

    // Check of nieuwe slug al bestaat (als slug wordt gewijzigd)
    if (updates.slug) {
      const bestaandeOrganisatie = await OrganisatieModel.getBySlug(updates.slug);
      if (bestaandeOrganisatie && bestaandeOrganisatie.id !== parseInt(id)) {
        res.status(400).json({
          success: false,
          error: 'Een organisatie met deze slug bestaat al'
        });
        return;
      }
    }

    const bijgewerkteOrganisatie = await OrganisatieModel.update(parseInt(id), updates);
    
    if (!bijgewerkteOrganisatie) {
      res.status(404).json({
        success: false,
        error: 'Organisatie niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      data: bijgewerkteOrganisatie,
      message: 'Organisatie succesvol bijgewerkt'
    });
  } catch (error) {
    console.error('Fout bij bijwerken organisatie:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij bijwerken organisatie'
    });
  }
};

export const deleteOrganisatie = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const success = await OrganisatieModel.delete(parseInt(id));
    
    if (!success) {
      res.status(404).json({
        success: false,
        error: 'Organisatie niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Organisatie succesvol gedeactiveerd'
    });
  } catch (error) {
    console.error('Fout bij deactiveren organisatie:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij deactiveren organisatie'
    });
  }
};

/**
 * Alle organisaties ophalen (alleen voor superusers)
 */
export const getAllOrganisaties = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const organisaties = await OrganisatieModel.getAll();
    
    res.json({
      success: true,
      data: organisaties
    });
  } catch (error) {
    console.error('Fout bij ophalen organisaties:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen organisaties'
    });
  }
};

/**
 * Toeslag instellingen bijwerken voor organisatie (superuser only)
 */
export const updateToeslagInstellingen = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'superuser') {
      res.status(403).json({
        success: false,
        error: 'Alleen superusers kunnen toeslag instellingen bijwerken'
      });
      return;
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldig organisatie ID'
      });
      return;
    }

    const {
      actief_toeslagjaar,
      gemeente_toeslag_percentage,
      gemeente_toeslag_actief,
      standaard_inkomensklasse,
      toeslag_automatisch_berekenen
    } = req.body;

    const updates: any = {};
    
    if (actief_toeslagjaar !== undefined) {
      updates.actief_toeslagjaar = actief_toeslagjaar;
    }
    
    if (gemeente_toeslag_percentage !== undefined) {
      updates.gemeente_toeslag_percentage = gemeente_toeslag_percentage;
    }
    
    if (gemeente_toeslag_actief !== undefined) {
      updates.gemeente_toeslag_actief = gemeente_toeslag_actief;
    }
    
    if (standaard_inkomensklasse !== undefined) {
      updates.standaard_inkomensklasse = standaard_inkomensklasse;
    }
    
    if (toeslag_automatisch_berekenen !== undefined) {
      updates.toeslag_automatisch_berekenen = toeslag_automatisch_berekenen;
    }

    const updatedOrganisatie = await OrganisatieModel.update(id, updates);
    if (!updatedOrganisatie) {
      res.status(404).json({
        success: false,
        error: 'Organisatie niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedOrganisatie,
      message: 'Toeslag instellingen succesvol bijgewerkt'
    });
  } catch (error) {
    console.error('Error updating toeslag instellingen:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij bijwerken toeslag instellingen'
    });
  }
}; 