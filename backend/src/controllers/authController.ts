import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../models/User';
import { LoginRequest, LoginResponse, JWTPayload, ApiResponse } from '../types';

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Geldig e-mailadres is vereist'),
  body('password').isLength({ min: 6 }).withMessage('Wachtwoord moet minimaal 6 karakters zijn')
];

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validatiefout',
        data: errors.array()
      } as ApiResponse<any>);
      return;
    }

    const { email, password }: LoginRequest = req.body;

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Ongeldige inloggegevens'
      } as ApiResponse<null>);
      return;
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Ongeldige inloggegevens'
      } as ApiResponse<null>);
      return;
    }

    // Create JWT payload
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organisatieId: user.organisatie_id
    };

    // Sign JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '24h'
    });

    // Get user with organisation data
    const userWithOrg = await UserModel.getUserWithOrganisation(user.id);

    const response: LoginResponse = {
      token,
      user: userWithOrg?.user || {
        id: user.id,
        email: user.email,
        role: user.role,
        organisatie_id: user.organisatie_id,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      organisatie: userWithOrg?.organisatie || undefined
    };

    res.json({
      success: true,
      data: response,
      message: 'Login succesvol'
    } as ApiResponse<LoginResponse>);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Er is een serverfout opgetreden'
    } as ApiResponse<null>);
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Niet ingelogd'
      } as ApiResponse<null>);
      return;
    }

    const userWithOrg = await UserModel.getUserWithOrganisation(req.user.userId);
    
    if (!userWithOrg) {
      res.status(404).json({
        success: false,
        error: 'Gebruiker niet gevonden'
      } as ApiResponse<null>);
      return;
    }

    res.json({
      success: true,
      data: {
        user: userWithOrg.user,
        organisatie: userWithOrg.organisatie
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Er is een serverfout opgetreden'
    } as ApiResponse<null>);
  }
}; 