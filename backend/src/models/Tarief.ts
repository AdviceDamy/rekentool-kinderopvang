import db from '../utils/database';

export type TariefType = 'uur' | 'dag' | 'vast_maand' | 'dagen_week' | 'vrij_uren_week' | 'vrij_uren_maand';

export interface DagenWeekConfiguratie {
  dagen: string[]; // ['ma', 'di', 'wo', 'do', 'vr']
  uurtarief: number;
  uren_per_dag?: { [dag: string]: number }; // Optioneel: specifieke uren per dag
}

export interface VrijUrenConfiguratie {
  max_uren: number;
  uurtarief: number;
}

export type TariefConfiguratie = DagenWeekConfiguratie | VrijUrenConfiguratie;

export interface Tarief {
  id?: number;
  naam: string;
  type: TariefType;
  tarief: number; // Voor vast_maand type, anders wordt uurtarief uit configuratie gebruikt
  omschrijving?: string;
  opvangvorm_id: number;
  organisatie_id: number;
  configuratie?: TariefConfiguratie;
  actief?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class TariefModel {
  static async getAll(organisatieId: number): Promise<Tarief[]> {
    const results = await db('tarieven')
      .where({ organisatie_id: organisatieId, actief: true })
      .orderBy('naam');
    
    return results.map(result => {
      if (result.configuratie && typeof result.configuratie === 'string') {
        try {
          result.configuratie = JSON.parse(result.configuratie);
        } catch (error) {
          console.error('Failed to parse configuratie JSON:', error);
          result.configuratie = undefined;
        }
      }
      return result;
    });
  }

  static async getByOpvangvorm(opvangvormId: number, organisatieId: number): Promise<Tarief[]> {
    const results = await db('tarieven')
      .where({ 
        opvangvorm_id: opvangvormId, 
        organisatie_id: organisatieId, 
        actief: true 
      })
      .orderBy('naam');
    
    return results.map(result => {
      if (result.configuratie && typeof result.configuratie === 'string') {
        try {
          result.configuratie = JSON.parse(result.configuratie);
        } catch (error) {
          console.error('Failed to parse configuratie JSON:', error);
          result.configuratie = undefined;
        }
      }
      return result;
    });
  }

  static async getById(id: number, organisatieId: number): Promise<Tarief | undefined> {
    const result = await db('tarieven')
      .where({ id, organisatie_id: organisatieId, actief: true })
      .first();
    
    if (result && result.configuratie && typeof result.configuratie === 'string') {
      try {
        result.configuratie = JSON.parse(result.configuratie);
      } catch (error) {
        console.error('Failed to parse configuratie JSON:', error);
        result.configuratie = undefined;
      }
    }
    
    return result;
  }

  static async create(tarief: Omit<Tarief, 'id' | 'created_at' | 'updated_at'>): Promise<Tarief> {
    const [id] = await db('tarieven').insert(tarief);
    return this.getById(id, tarief.organisatie_id) as Promise<Tarief>;
  }

  static async update(
    id: number,
    organisatieId: number,
    updates: Partial<Omit<Tarief, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>>
  ): Promise<Tarief | undefined> {
    console.log('TariefModel.update called with:', { id, organisatieId, updates });
    
    // Als configuratie een object is, zorg dat het JSON string wordt voor SQLite
    const processedUpdates: any = { ...updates };
    if (processedUpdates.configuratie !== undefined) {
      console.log('Processing configuratie:', processedUpdates.configuratie);
      if (processedUpdates.configuratie === null) {
        processedUpdates.configuratie = null;
      } else {
        processedUpdates.configuratie = JSON.stringify(processedUpdates.configuratie);
      }
      console.log('Processed configuratie for database:', processedUpdates.configuratie);
    }
    
    await db('tarieven')
      .where({ id, organisatie_id: organisatieId })
      .update({ ...processedUpdates, updated_at: new Date() });
    
    console.log('Database update completed');
    const result = await this.getById(id, organisatieId);
    console.log('Retrieved updated tarief:', result);
    return result;
  }

  static async delete(id: number, organisatieId: number): Promise<boolean> {
    const result = await db('tarieven')
      .where({ id, organisatie_id: organisatieId })
      .update({ actief: false, updated_at: new Date() });
    
    return result > 0;
  }
} 