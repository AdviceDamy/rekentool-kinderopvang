import db from '../utils/database';
import { User, UserWithoutPassword, UserRole, Organisatie } from '../types';
import bcrypt from 'bcryptjs';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where({ email }).first();
    return user || null;
  }

  static async findById(id: number): Promise<UserWithoutPassword | null> {
    const user = await db('users')
      .select('id', 'email', 'role', 'organisatie_id', 'created_at', 'updated_at')
      .where({ id })
      .first();
    return user || null;
  }

  static async create(userData: {
    email: string;
    password: string;
    role: UserRole;
    organisatie_id?: number;
  }): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const [id] = await db('users').insert({
      ...userData,
      password: hashedPassword,
    });

    const newUser = await this.findById(id);
    if (!newUser) {
      throw new Error('Failed to create user');
    }
    
    return newUser;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getUserWithOrganisation(userId: number) {
    const result = await db('users')
      .select(
        'users.id',
        'users.email',
        'users.role',
        'users.organisatie_id',
        'users.created_at',
        'users.updated_at',
        'organisaties.naam as organisatie_naam',
        'organisaties.email as organisatie_email',
        'organisaties.telefoon as organisatie_telefoon',
        'organisaties.adres as organisatie_adres',
        'organisaties.postcode as organisatie_postcode',
        'organisaties.plaats as organisatie_plaats',
        'organisaties.website as organisatie_website',
        'organisaties.actief as organisatie_actief',
        'organisaties.created_at as organisatie_created_at',
        'organisaties.updated_at as organisatie_updated_at'
      )
      .leftJoin('organisaties', 'users.organisatie_id', 'organisaties.id')
      .where('users.id', userId)
      .first();

    if (!result) return null;

    const { 
      organisatie_naam, 
      organisatie_email, 
      organisatie_telefoon,
      organisatie_adres,
      organisatie_postcode,
      organisatie_plaats,
      organisatie_website,
      organisatie_actief,
      organisatie_created_at,
      organisatie_updated_at,
      ...user 
    } = result;
    
    return {
      user,
      organisatie: organisatie_naam ? {
        id: user.organisatie_id,
        naam: organisatie_naam,
        email: organisatie_email,
        telefoon: organisatie_telefoon,
        adres: organisatie_adres,
        postcode: organisatie_postcode,
        plaats: organisatie_plaats,
        website: organisatie_website,
        actief: organisatie_actief,
        created_at: organisatie_created_at,
        updated_at: organisatie_updated_at
      } as Organisatie : null
    };
  }
} 