import express from 'express';
import { 
  getAllOrganisaties,
  getOrganisatieBySlug, 
  createOrganisatie, 
  updateOrganisatie, 
  deleteOrganisatie 
} from '../controllers/organisatieController';
import { authenticateToken, requireSuperuser } from '../middleware/auth';
import { organisatieContext, requireOrganisatie, enforceOrganisatieAccess } from '../middleware/organisatieContext';

const router = express.Router();

// Publieke routes voor organisatie info (via slug)
router.get('/public/:slug', organisatieContext, getOrganisatieBySlug);

// Routes voor superusers
router.get('/', authenticateToken, requireSuperuser, getAllOrganisaties);
router.post('/', authenticateToken, requireSuperuser, createOrganisatie);
router.put('/:id', authenticateToken, requireSuperuser, updateOrganisatie);
router.delete('/:id', authenticateToken, requireSuperuser, deleteOrganisatie);

export default router; 