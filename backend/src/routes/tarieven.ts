import express from 'express';
import {
  getTarieven,
  getTarievenByOpvangvorm,
  getTarief,
  createTarief,
  updateTarief,
  deleteTarief,
  getTarievenPubliek
} from '../controllers/tarievenController';
import { authenticateToken, requireOrganisatieBeheerder } from '../middleware/auth';
import { organisatieContext, requireOrganisatie } from '../middleware/organisatieContext';

const router = express.Router();

// Publieke routes - geen authenticatie vereist, maar wel organisatie context
router.get('/', organisatieContext, requireOrganisatie, getTarievenPubliek);

// Legacy publieke route (behouden voor backwards compatibility)
router.get('/publiek/:organisatieId', getTarievenPubliek);

// Beveiligde routes vereisen authenticatie en organisatie beheerder rol
router.use(authenticateToken);
router.use(requireOrganisatieBeheerder);

// GET /api/tarieven/beheer - Alle tarieven van de organisatie (voor beheerders)
router.get('/beheer', getTarieven);

// GET /api/tarieven/beheer/opvangvorm/:opvangvormId - Tarieven voor specifieke opvangvorm (voor beheerders)
router.get('/beheer/opvangvorm/:opvangvormId', getTarievenByOpvangvorm);

// GET /api/tarieven/beheer/:id - Specifiek tarief (voor beheerders)
router.get('/beheer/:id', getTarief);

// POST /api/tarieven - Nieuw tarief aanmaken
router.post('/', createTarief);

// PUT /api/tarieven/:id - Tarief bijwerken
router.put('/:id', updateTarief);

// DELETE /api/tarieven/:id - Tarief verwijderen (soft delete)
router.delete('/:id', deleteTarief);

export default router; 