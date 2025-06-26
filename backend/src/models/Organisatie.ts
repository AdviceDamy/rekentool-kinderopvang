import db from '../utils/database';

export interface WizardConfiguratie {
  welkom: boolean;
  kinderen: boolean;
  opvangvorm: boolean;
  tarief: boolean;
  planning: boolean;
  resultaat: boolean;
  jaarplanning: boolean;
  vergelijking: boolean;
}

export interface Organisatie {
  id?: number;
  naam: string;
  email?: string;
  telefoon?: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  website?: string;
  slug: string;
  actief?: boolean;
  actief_toeslagjaar?: number | null;
  gemeente_toeslag_percentage?: number;
  gemeente_toeslag_actief?: boolean;
  standaard_inkomensklasse?: string | null; // JSON string met inkomensklasse data
  toeslag_automatisch_berekenen?: boolean;
  wizard_configuratie?: string | null; // JSON string van WizardConfiguratie
  created_at?: Date;
  updated_at?: Date;
}

export class OrganisatieModel {
  static async getAll(): Promise<Organisatie[]> {
    return await db('organisaties')
      .where({ actief: true })
      .orderBy('naam');
  }

  static async getById(id: number): Promise<Organisatie | undefined> {
    return await db('organisaties')
      .where({ id, actief: true })
      .first();
  }

  static async getBySlug(slug: string): Promise<Organisatie | undefined> {
    return await db('organisaties')
      .where({ slug, actief: true })
      .first();
  }

  static async create(organisatie: Omit<Organisatie, 'id' | 'created_at' | 'updated_at'>): Promise<Organisatie> {
    const [newOrganisatie] = await db('organisaties')
      .insert({
        ...organisatie,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    
    return newOrganisatie;
  }

  static async update(
    id: number, 
    updates: Partial<Omit<Organisatie, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Organisatie | undefined> {
    const [updatedOrganisatie] = await db('organisaties')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date()
      })
      .returning('*');
    
    return updatedOrganisatie;
  }

  static async delete(id: number): Promise<boolean> {
    const affected = await db('organisaties')
      .where({ id })
      .update({ 
        actief: false,
        updated_at: new Date()
      });
    
    return affected > 0;
  }

  /**
   * Update toeslag instellingen voor een organisatie
   */
  static async updateToeslagInstellingen(
    id: number,
    instellingen: {
      actief_toeslagjaar?: number | null;
      gemeente_toeslag_percentage?: number;
      gemeente_toeslag_actief?: boolean;
    }
  ): Promise<Organisatie | undefined> {
    return this.update(id, instellingen);
  }

  /**
   * Haal toeslag instellingen op voor een organisatie
   */
  static async getToeslagInstellingen(id: number): Promise<{
    actief_toeslagjaar: number | null;
    gemeente_toeslag_percentage: number;
    gemeente_toeslag_actief: boolean;
  } | null> {
    const organisatie = await db('organisaties')
      .select('actief_toeslagjaar', 'gemeente_toeslag_percentage', 'gemeente_toeslag_actief')
      .where({ id, actief: true })
      .first();

    if (!organisatie) {
      return null;
    }

    return {
      actief_toeslagjaar: organisatie.actief_toeslagjaar || null,
      gemeente_toeslag_percentage: organisatie.gemeente_toeslag_percentage || 0,
      gemeente_toeslag_actief: organisatie.gemeente_toeslag_actief || false
    };
  }

  /**
   * Update wizard configuratie voor een organisatie
   */
  static async updateWizardConfiguratie(
    id: number,
    configuratie: WizardConfiguratie
  ): Promise<Organisatie | undefined> {
    return this.update(id, {
      wizard_configuratie: JSON.stringify(configuratie)
    });
  }

  /**
   * Haal wizard configuratie op voor een organisatie
   */
  static async getWizardConfiguratie(id: number): Promise<WizardConfiguratie | null> {
    const organisatie = await db('organisaties')
      .select('wizard_configuratie')
      .where({ id, actief: true })
      .first();

    if (!organisatie) {
      return null;
    }

    // Gebruik standaard configuratie als er geen is ingesteld
    const standaardConfiguratie: WizardConfiguratie = {
      welkom: true,
      kinderen: true,
      opvangvorm: true,
      tarief: true,
      planning: true,
      resultaat: true,
      jaarplanning: true,
      vergelijking: true
    };

    if (!organisatie.wizard_configuratie) {
      return standaardConfiguratie;
    }

    try {
      return JSON.parse(organisatie.wizard_configuratie);
    } catch {
      return standaardConfiguratie;
    }
  }

  /**
   * Haal wizard configuratie op voor publieke routes (via slug)
   */
  static async getWizardConfiguratieBySlug(slug: string): Promise<WizardConfiguratie | null> {
    const organisatie = await this.getBySlug(slug);
    if (!organisatie?.id) {
      return null;
    }
    return this.getWizardConfiguratie(organisatie.id);
  }
} 