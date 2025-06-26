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