import { Request, Response, NextFunction } from 'express';
import { OrganisatieModel } from '../models/Organisatie';

export interface OrganisatieRequest extends Request {
  organisatie?: {
    id: number;
    slug: string;
    naam: string;
  };
}

/**
 * Middleware om organisatie context te identificeren
 * Kijkt naar 'org' query parameter of 'X-Organisation-Slug' header
 */
export const organisatieContext = async (
  req: OrganisatieRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Probeer slug te vinden in query parameter of header
    const slug = req.query.org as string || req.headers['x-organisation-slug'] as string;
    
    if (slug) {
      const organisatie = await OrganisatieModel.getBySlug(slug);
      
      if (organisatie) {
        req.organisatie = {
          id: organisatie.id!,
          slug: organisatie.slug,
          naam: organisatie.naam
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Fout bij organisatie context bepaling:', error);
    next();
  }
};

/**
 * Middleware die vereist dat er een organisatie context is
 */
export const requireOrganisatie = (
  req: OrganisatieRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.organisatie) {
    res.status(400).json({
      error: 'Organisatie niet gevonden. Geef een geldige organisatie slug op via ?org=slug'
    });
    return;
  }
  
  next();
};

/**
 * Middleware voor data-isolatie: zorgt dat queries gefilterd worden op organisatie
 */
export const enforceOrganisatieAccess = (
  req: OrganisatieRequest,
  res: Response,
  next: NextFunction
): void => {
  // Voor ingelogde gebruikers: check of ze toegang hebben tot de gevraagde organisatie
  if (req.user && req.organisatie) {
    // Superusers hebben toegang tot alle organisaties
    if (req.user.role === 'superuser') {
      next();
      return;
    }
    
    // Organisatie beheerders alleen tot hun eigen organisatie
    if (req.user.role === 'organisatie_beheerder') {
      if (req.user.organisatieId !== req.organisatie.id) {
        res.status(403).json({
          error: 'Geen toegang tot deze organisatie'
        });
        return;
      }
    }
  }
  
  next();
}; 