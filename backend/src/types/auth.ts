import { Request } from 'express';
import { JWTPayload } from './index';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    organisatie_id: number;
  };
} 