import { Request, Response } from 'express';
import { ToeslagService, ToeslagBerekeningInput } from '../services/toeslagService';
import { OrganisatieModel } from '../models/Organisatie';

/**
 * Bereken kinderopvangtoeslag
 */
export const berekenToeslag = async (req: Request, res: Response): Promise<void> => {
  try {
    const input: ToeslagBerekeningInput = req.body;

    // Validatie
    if (!input.organisatieId || !input.actief_toeslagjaar || !input.gezinsinkomen || !input.kinderen || input.kinderen.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Ontbrekende verplichte velden'
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