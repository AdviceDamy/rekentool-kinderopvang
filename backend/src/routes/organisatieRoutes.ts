import express from 'express';
import { 
  getAllOrganisaties,
  getOrganisatieBySlug, 
  createOrganisatie, 
  updateOrganisatie, 
  deleteOrganisatie,
  updateToeslagInstellingen,
  getWizardConfiguratie,
  updateWizardConfiguratie,
  getWizardConfiguratieBySlug
} from '../controllers/organisatieController';
import { authenticateToken, requireSuperuser } from '../middleware/auth';
import { organisatieContext, requireOrganisatie, enforceOrganisatieAccess } from '../middleware/organisatieContext';

const router = express.Router();

// Publieke routes voor organisatie info (via slug)
router.get('/public/:slug', organisatieContext, getOrganisatieBySlug);
router.get('/public/:slug/wizard-configuratie', organisatieContext, getWizardConfiguratieBySlug);

// Routes voor superusers
router.get('/', authenticateToken, requireSuperuser, getAllOrganisaties);
router.post('/', authenticateToken, requireSuperuser, createOrganisatie);
router.put('/:id', authenticateToken, requireSuperuser, updateOrganisatie);
router.put('/:id/toeslag-instellingen', authenticateToken, requireSuperuser, updateToeslagInstellingen);
router.get('/:id/wizard-configuratie', authenticateToken, getWizardConfiguratie);
router.put('/:id/wizard-configuratie', authenticateToken, updateWizardConfiguratie);
router.delete('/:id', authenticateToken, requireSuperuser, deleteOrganisatie);

export default router; 