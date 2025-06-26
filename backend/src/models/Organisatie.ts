import db from '../utils/database';

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
} 