import db from '../utils/database';

export interface ToeslagtabelData {
  year: number;
  max_hourly_rates: {
    dagopvang: number;
    bso: number;
    gastouder: number;
  };
  income_brackets: {
    min: number;
    max: number | null;
    perc_first_child: number;
    perc_other_children: number;
  }[];
}

export interface Toeslagtabel {
  id?: number;
  jaar: number;
  data: string; // JSON string
  actief: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ToeslagtabelModel {
  private static table = 'toeslagtabellen';

  static async create(toeslagtabel: Omit<Toeslagtabel, 'id' | 'created_at' | 'updated_at'>): Promise<Toeslagtabel> {
    const [created] = await db(this.table)
      .insert(toeslagtabel)
      .returning('*');
    return created;
  }

  static async getByJaar(jaar: number): Promise<Toeslagtabel | null> {
    const result = await db(this.table)
      .where({ jaar })
      .first();
    return result || null;
  }

  static async getActief(): Promise<Toeslagtabel | null> {
    const result = await db(this.table)
      .where({ actief: true })
      .orderBy('jaar', 'desc')
      .first();
    return result || null;
  }

  static async getAll(): Promise<Toeslagtabel[]> {
    return db(this.table)
      .orderBy('jaar', 'desc');
  }

  static async getAllJaren(): Promise<number[]> {
    const results = await db(this.table)
      .select('jaar')
      .where({ actief: true })
      .orderBy('jaar', 'desc');
    return results.map((r: any) => r.jaar);
  }

  static async update(jaar: number, updates: Partial<Omit<Toeslagtabel, 'id' | 'jaar' | 'created_at' | 'updated_at'>>): Promise<Toeslagtabel | null> {
    const [updated] = await db(this.table)
      .where({ jaar })
      .update(updates)
      .returning('*');
    return updated || null;
  }

  static async delete(jaar: number): Promise<boolean> {
    const deleted = await db(this.table)
      .where({ jaar })
      .del();
    return deleted > 0;
  }

  static async setActief(jaar: number, actief: boolean = true): Promise<boolean> {
    const updated = await db(this.table)
      .where({ jaar })
      .update({ actief });
    return updated > 0;
  }

  // Utility methode om JSON data te parsen
  static parseData(dataString: string): ToeslagtabelData {
    try {
      return JSON.parse(dataString);
    } catch (error) {
      throw new Error('Ongeldige JSON data in toeslagtabel');
    }
  }

  // Utility methode om JSON data te valideren
  static validateData(data: any): data is ToeslagtabelData {
    return (
      data &&
      typeof data.year === 'number' &&
      data.max_hourly_rates &&
      typeof data.max_hourly_rates.dagopvang === 'number' &&
      typeof data.max_hourly_rates.bso === 'number' &&
      typeof data.max_hourly_rates.gastouder === 'number' &&
      Array.isArray(data.income_brackets) &&
      data.income_brackets.every((bracket: any) => 
        typeof bracket.min === 'number' &&
        (bracket.max === null || typeof bracket.max === 'number') &&
        typeof bracket.perc_first_child === 'number' &&
        typeof bracket.perc_other_children === 'number'
      )
    );
  }
} 