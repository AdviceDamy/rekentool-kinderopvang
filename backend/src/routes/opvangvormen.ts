import express from 'express';
import {
  getOpvangvormen,
  getOpvangvorm,
  createOpvangvorm,
  updateOpvangvorm,
  deleteOpvangvorm,
  getOpvangvormenPubliek
} from '../controllers/opvangvormenController';
import { authenticateToken, requireOrganisatieBeheerder } from '../middleware/auth';
import { organisatieContext, requireOrganisatie } from '../middleware/organisatieContext';

const router = express.Router();

// Publieke routes - geen authenticatie vereist, maar wel organisatie context
router.get('/', organisatieContext, requireOrganisatie, getOpvangvormenPubliek);

// Legacy publieke route (behouden voor backwards compatibility)
router.get('/publiek/:organisatieId', getOpvangvormenPubliek);

// Beveiligde routes vereisen authenticatie en organisatie beheerder rol
router.use(authenticateToken);
router.use(requireOrganisatieBeheerder);

// GET /api/opvangvormen/beheer - Alle opvangvormen van de organisatie (voor beheerders)
router.get('/beheer', getOpvangvormen);

// GET /api/opvangvormen/beheer/:id - Specifieke opvangvorm (voor beheerders)
router.get('/beheer/:id', getOpvangvorm);

// POST /api/opvangvormen - Nieuwe opvangvorm aanmaken
router.post('/', createOpvangvorm);

// PUT /api/opvangvormen/:id - Opvangvorm bijwerken
router.put('/:id', updateOpvangvorm);

// DELETE /api/opvangvormen/:id - Opvangvorm verwijderen (soft delete)
router.delete('/:id', deleteOpvangvorm);

export default router; 