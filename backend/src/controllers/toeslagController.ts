import { Request, Response } from 'express';
import { ToeslagService, ToeslagBerekeningInput } from '../services/toeslagService';
import { OrganisatieModel } from '../models/Organisatie';
import { ToeslagValidator } from '../utils/validation';

/**
 * Bereken kinderopvangtoeslag
 */
export const berekenToeslag = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: ToeslagBerekeningInput = req.body;

    // Gebruik de nieuwe validator
    const validation = ToeslagValidator.validateToeslagInput(input);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Validatie fouten',
        details: validation.errors
      });
      return;
    }

    // Controleer of organisatie bestaat
    const organisatie = await OrganisatieModel.getById(input.organisatieId);
    if (!organisatie) {
      res.status(404).json({
        success: false,
        error: 'Organisatie niet gevonden'
      });
      return;
    }

    // Bereken toeslag
    const resultaat = await ToeslagService.berekenToeslag(input);

    res.json({
      success: true,
      data: resultaat
    });

  } catch (error) {
    console.error('Fout bij toeslagberekening:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Fout bij toeslagberekening'
    });
  }
}; 