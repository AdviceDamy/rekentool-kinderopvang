import { Response, Request } from 'express';
import { ToeslagtabelModel, ToeslagtabelData } from '../models/Toeslagtabel';
import { OrganisatieRequest } from '../middleware/organisatieContext';

/**
 * Alle toeslagtabellen ophalen (superuser only)
 */
export const getAllToeslagtabellen = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const toeslagtabellen = await ToeslagtabelModel.getAll();
    
    res.json({
      success: true,
      data: toeslagtabellen
    });
  } catch (error) {
    console.error('Fout bij ophalen toeslagtabellen:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen toeslagtabellen'
    });
  }
};

/**
 * Specifieke toeslagtabel ophalen
 */
export const getToeslagtabel = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldig jaar'
      });
      return;
    }

    const toeslagtabel = await ToeslagtabelModel.getByJaar(jaar);
    if (!toeslagtabel) {
      res.status(404).json({
        success: false,
        error: 'Toeslagtabel niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      data: toeslagtabel
    });
  } catch (error) {
    console.error('Fout bij ophalen toeslagtabel:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen toeslagtabel'
    });
  }
};

/**
 * Beschikbare jaren ophalen (voor dropdown in frontend) - PUBLIEKE ROUTE
 */
export const getBeschikbareJaren = async (req: Request, res: Response): Promise<void> => {
  try {
    const jaren = await ToeslagtabelModel.getAllJaren();
    
    res.json({
      success: true,
      data: jaren
    });
  } catch (error) {
    console.error('Fout bij ophalen jaren:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen jaren'
    });
  }
};

/**
 * Inkomensklassen van specifieke toeslagtabel ophalen - PUBLIEKE ROUTE
 */
export const getInkomensklassen = async (req: Request, res: Response): Promise<void> => {
  try {
    const jaar = parseInt(req.params.jaar);
    if (isNaN(jaar)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldig jaar'
      });
      return;
    }

    const toeslagtabel = await ToeslagtabelModel.getByJaar(jaar);
    if (!toeslagtabel) {
      res.status(404).json({
        success: false,
        error: 'Toeslagtabel niet gevonden'
      });
      return;
    }

    const data = ToeslagtabelModel.parseData(toeslagtabel.data);
    
    // Format inkomensklassen voor frontend dropdown
    const inkomensklassen = data.income_brackets.map((bracket, index) => ({
      id: index,
      min: bracket.min,
      max: bracket.max,
      label: bracket.max 
        ? `€ ${bracket.min.toLocaleString()} - € ${bracket.max.toLocaleString()}`
        : `€ ${bracket.min.toLocaleString()} en hoger`,
      perc_first_child: bracket.perc_first_child,
      perc_other_children: bracket.perc_other_children
    }));

    res.json({
      success: true,
      data: {
        jaar: data.year,
        inkomensklassen,
        max_hourly_rates: data.max_hourly_rates
      }
    });
  } catch (error) {
    console.error('Fout bij ophalen inkomensklassen:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij ophalen inkomensklassen'
    });
  }
};

/**
 * Nieuwe toeslagtabel aanmaken (superuser only)
 */
export const createToeslagtabel = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const { jaar, data } = req.body;

    // Validatie
    if (!jaar || !data) {
      res.status(400).json({
        success: false,
        error: 'Jaar en data zijn verplicht'
      });
      return;
    }

    // Valideer JSON data structuur
    if (!ToeslagtabelModel.validateData(data)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldige toeslagtabel data structuur'
      });
      return;
    }

    // Check of jaar al bestaat
    const bestaandeTabel = await ToeslagtabelModel.getByJaar(jaar);
    if (bestaandeTabel) {
      res.status(400).json({
        success: false,
        error: 'Een toeslagtabel voor dit jaar bestaat al'
      });
      return;
    }

    // Maak nieuwe toeslagtabel
    const nieuweToeslagtabel = await ToeslagtabelModel.create({
      jaar,
      data: JSON.stringify(data),
      actief: true
    });

    res.status(201).json({
      success: true,
      data: nieuweToeslagtabel,
      message: 'Toeslagtabel succesvol aangemaakt'
    });
  } catch (error) {
    console.error('Fout bij aanmaken toeslagtabel:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij aanmaken toeslagtabel'
    });
  }
};

/**
 * Toeslagtabel bijwerken (superuser only)
 */
export const updateToeslagtabel = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const jaar = parseInt(req.params.jaar);
    const { data, actief } = req.body;

    if (isNaN(jaar)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldig jaar'
      });
      return;
    }

    const updates: any = {};
    
    if (data !== undefined) {
      if (!ToeslagtabelModel.validateData(data)) {
        res.status(400).json({
          success: false,
          error: 'Ongeldige toeslagtabel data structuur'
        });
        return;
      }
      updates.data = JSON.stringify(data);
    }

    if (actief !== undefined) {
      updates.actief = actief;
    }

    const bijgewerkteTabel = await ToeslagtabelModel.update(jaar, updates);
    
    if (!bijgewerkteTabel) {
      res.status(404).json({
        success: false,
        error: 'Toeslagtabel niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      data: bijgewerkteTabel,
      message: 'Toeslagtabel succesvol bijgewerkt'
    });
  } catch (error) {
    console.error('Fout bij bijwerken toeslagtabel:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij bijwerken toeslagtabel'
    });
  }
};

/**
 * Toeslagtabel verwijderen (superuser only)
 */
export const deleteToeslagtabel = async (req: OrganisatieRequest, res: Response): Promise<void> => {
  try {
    const jaar = parseInt(req.params.jaar);
    
    if (isNaN(jaar)) {
      res.status(400).json({
        success: false,
        error: 'Ongeldig jaar'
      });
      return;
    }

    const verwijderd = await ToeslagtabelModel.delete(jaar);
    
    if (!verwijderd) {
      res.status(404).json({
        success: false,
        error: 'Toeslagtabel niet gevonden'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Toeslagtabel succesvol verwijderd'
    });
  } catch (error) {
    console.error('Fout bij verwijderen toeslagtabel:', error);
    res.status(500).json({
      success: false,
      error: 'Fout bij verwijderen toeslagtabel'
    });
  }
}; 