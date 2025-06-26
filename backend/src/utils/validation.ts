import { Request, Response, NextFunction } from 'express';
import { ToeslagBerekeningInput, KindInput } from '../services/toeslagService';

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationResult {
  constructor(
    public isValid: boolean,
    public errors: ValidationError[] = []
  ) {}

  static success(): ValidationResult {
    return new ValidationResult(true);
  }

  static failure(errors: ValidationError[]): ValidationResult {
    return new ValidationResult(false, errors);
  }
}

export class ToeslagValidator {
  /**
   * Valideer toeslagberekening input
   */
  static validateToeslagInput(input: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Organisatie ID
    if (!input.organisatieId || typeof input.organisatieId !== 'number') {
      errors.push({
        field: 'organisatieId',
        message: 'Organisatie ID is verplicht en moet een nummer zijn'
      });
    }

    // Toeslagjaar
    if (!input.actief_toeslagjaar || typeof input.actief_toeslagjaar !== 'number') {
      errors.push({
        field: 'actief_toeslagjaar',
        message: 'Toeslagjaar is verplicht en moet een nummer zijn'
      });
    } else if (input.actief_toeslagjaar < 2020 || input.actief_toeslagjaar > 2030) {
      errors.push({
        field: 'actief_toeslagjaar',
        message: 'Toeslagjaar moet tussen 2020 en 2030 liggen'
      });
    }

    // Gezinsinkomen
    if (input.gezinsinkomen === undefined || typeof input.gezinsinkomen !== 'number') {
      errors.push({
        field: 'gezinsinkomen',
        message: 'Gezinsinkomen is verplicht en moet een nummer zijn'
      });
    } else if (input.gezinsinkomen < 0) {
      errors.push({
        field: 'gezinsinkomen',
        message: 'Gezinsinkomen kan niet negatief zijn'
      });
    } else if (input.gezinsinkomen > 1000000) {
      errors.push({
        field: 'gezinsinkomen',
        message: 'Gezinsinkomen lijkt onrealistisch hoog'
      });
    }

    // Gemeentelijke toeslag
    if (input.gemeente_toeslag_percentage !== undefined) {
      if (typeof input.gemeente_toeslag_percentage !== 'number') {
        errors.push({
          field: 'gemeente_toeslag_percentage',
          message: 'Gemeente toeslag percentage moet een nummer zijn'
        });
      } else if (input.gemeente_toeslag_percentage < 0 || input.gemeente_toeslag_percentage > 100) {
        errors.push({
          field: 'gemeente_toeslag_percentage',
          message: 'Gemeente toeslag percentage moet tussen 0 en 100 liggen'
        });
      }
    }

    if (input.gemeente_toeslag_actief !== undefined && typeof input.gemeente_toeslag_actief !== 'boolean') {
      errors.push({
        field: 'gemeente_toeslag_actief',
        message: 'Gemeente toeslag actief moet een boolean zijn'
      });
    }

    // Kinderen
    if (!input.kinderen || !Array.isArray(input.kinderen)) {
      errors.push({
        field: 'kinderen',
        message: 'Kinderen moet een array zijn'
      });
    } else if (input.kinderen.length === 0) {
      errors.push({
        field: 'kinderen',
        message: 'Er moet minimaal 1 kind opgegeven worden'
      });
    } else if (input.kinderen.length > 10) {
      errors.push({
        field: 'kinderen',
        message: 'Maximum 10 kinderen per berekening'
      });
    } else {
      // Valideer elk kind
      input.kinderen.forEach((kind: any, index: number) => {
        const kindErrors = this.validateKind(kind, index);
        errors.push(...kindErrors);
      });
    }

    return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
  }

  /**
   * Valideer individueel kind
   */
  private static validateKind(kind: any, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `kinderen[${index}]`;

    // Opvangvorm
    if (!kind.opvangvorm) {
      errors.push({
        field: `${prefix}.opvangvorm`,
        message: 'Opvangvorm is verplicht'
      });
    } else if (!['dagopvang', 'bso', 'gastouder'].includes(kind.opvangvorm)) {
      errors.push({
        field: `${prefix}.opvangvorm`,
        message: 'Opvangvorm moet dagopvang, bso of gastouder zijn'
      });
    }

    // Uren per maand
    if (kind.uren_per_maand === undefined || typeof kind.uren_per_maand !== 'number') {
      errors.push({
        field: `${prefix}.uren_per_maand`,
        message: 'Uren per maand is verplicht en moet een nummer zijn'
      });
    } else if (kind.uren_per_maand <= 0) {
      errors.push({
        field: `${prefix}.uren_per_maand`,
        message: 'Uren per maand moet groter dan 0 zijn'
      });
    } else if (kind.uren_per_maand > 300) {
      errors.push({
        field: `${prefix}.uren_per_maand`,
        message: 'Uren per maand kan niet meer dan 300 zijn'
      });
    }

    // Uurtarief
    if (kind.uurtarief === undefined || typeof kind.uurtarief !== 'number') {
      errors.push({
        field: `${prefix}.uurtarief`,
        message: 'Uurtarief is verplicht en moet een nummer zijn'
      });
    } else if (kind.uurtarief <= 0) {
      errors.push({
        field: `${prefix}.uurtarief`,
        message: 'Uurtarief moet groter dan 0 zijn'
      });
    } else if (kind.uurtarief > 50) {
      errors.push({
        field: `${prefix}.uurtarief`,
        message: 'Uurtarief lijkt onrealistisch hoog (max €50/uur)'
      });
    }

    return errors;
  }

  /**
   * Valideer toeslagtabel data
   */
  static validateToeslagtabelData(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'data',
        message: 'Data moet een object zijn'
      });
      return ValidationResult.failure(errors);
    }

    // Year
    if (!data.year || typeof data.year !== 'number') {
      errors.push({
        field: 'year',
        message: 'Jaar is verplicht en moet een nummer zijn'
      });
    }

    // Max hourly rates
    if (!data.max_hourly_rates || typeof data.max_hourly_rates !== 'object') {
      errors.push({
        field: 'max_hourly_rates',
        message: 'Maximum uurtarieven zijn verplicht'
      });
    } else {
      ['dagopvang', 'bso', 'gastouder'].forEach(type => {
        if (typeof data.max_hourly_rates[type] !== 'number' || data.max_hourly_rates[type] <= 0) {
          errors.push({
            field: `max_hourly_rates.${type}`,
            message: `Maximum uurtarief voor ${type} moet een positief nummer zijn`
          });
        }
      });
    }

    // Income brackets
    if (!data.income_brackets || !Array.isArray(data.income_brackets)) {
      errors.push({
        field: 'income_brackets',
        message: 'Inkomensklassen moeten een array zijn'
      });
    } else if (data.income_brackets.length === 0) {
      errors.push({
        field: 'income_brackets',
        message: 'Er moet minimaal 1 inkomensklasse zijn'
      });
    } else {
      data.income_brackets.forEach((bracket: any, index: number) => {
        if (typeof bracket.min !== 'number' || bracket.min < 0) {
          errors.push({
            field: `income_brackets[${index}].min`,
            message: 'Minimum inkomen moet een niet-negatief nummer zijn'
          });
        }
        if (bracket.max !== null && (typeof bracket.max !== 'number' || bracket.max <= bracket.min)) {
          errors.push({
            field: `income_brackets[${index}].max`,
            message: 'Maximum inkomen moet null zijn of groter dan minimum'
          });
        }
        if (typeof bracket.perc_first_child !== 'number' || bracket.perc_first_child < 0 || bracket.perc_first_child > 100) {
          errors.push({
            field: `income_brackets[${index}].perc_first_child`,
            message: 'Percentage eerste kind moet tussen 0 en 100 liggen'
          });
        }
        if (typeof bracket.perc_other_children !== 'number' || bracket.perc_other_children < 0 || bracket.perc_other_children > 100) {
          errors.push({
            field: `income_brackets[${index}].perc_other_children`,
            message: 'Percentage volgende kinderen moet tussen 0 en 100 liggen'
          });
        }
      });
    }

    return errors.length > 0 ? ValidationResult.failure(errors) : ValidationResult.success();
  }
}

/**
 * Express middleware voor validatie
 */
export const validateToeslagBerekening = (req: Request, res: Response, next: NextFunction) => {
  const validation = ToeslagValidator.validateToeslagInput(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Validatie fouten',
      details: validation.errors
    });
  }
  
  next();
};