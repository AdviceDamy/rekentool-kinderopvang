import db from '../utils/database';

export interface Opvangvorm {
  id?: number;
  naam: string;
  omschrijving?: string;
  organisatie_id: number;
  actief?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class OpvangvormModel {
  static async getAll(organisatieId: number): Promise<Opvangvorm[]> {
    return db('opvangvormen')
      .where({ organisatie_id: organisatieId, actief: true })
      .orderBy('naam');
  }

  static async getById(id: number, organisatieId: number): Promise<Opvangvorm | undefined> {
    return db('opvangvormen')
      .where({ id, organisatie_id: organisatieId, actief: true })
      .first();
  }

  static async create(opvangvorm: Omit<Opvangvorm, 'id' | 'created_at' | 'updated_at'>): Promise<Opvangvorm> {
    const [id] = await db('opvangvormen').insert(opvangvorm);
    return this.getById(id, opvangvorm.organisatie_id) as Promise<Opvangvorm>;
  }

  static async update(
    id: number,
    organisatieId: number,
    updates: Partial<Omit<Opvangvorm, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>>
  ): Promise<Opvangvorm | undefined> {
    await db('opvangvormen')
      .where({ id, organisatie_id: organisatieId })
      .update({ ...updates, updated_at: new Date() });
    
    return this.getById(id, organisatieId);
  }

  static async delete(id: number, organisatieId: number): Promise<boolean> {
    const result = await db('opvangvormen')
      .where({ id, organisatie_id: organisatieId })
      .update({ actief: false, updated_at: new Date() });
    
    return result > 0;
  }
} 