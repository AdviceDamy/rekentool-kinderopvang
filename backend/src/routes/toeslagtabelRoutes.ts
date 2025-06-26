import { Router } from 'express';
import { authenticateToken, requireSuperuser } from '../middleware/auth';
import {
  getAllToeslagtabellen,
  getToeslagtabel,
  getBeschikbareJaren,
  getInkomensklassen,
  createToeslagtabel,
  updateToeslagtabel,
  deleteToeslagtabel
} from '../controllers/toeslagtabelController';

const router = Router();

// Alle routes vereisen superuser rechten
router.use(authenticateToken);
router.use(requireSuperuser);

// CRUD routes voor toeslagtabellen
router.get('/', getAllToeslagtabellen);
router.get('/jaren', getBeschikbareJaren);
router.get('/:jaar', getToeslagtabel);
router.get('/:jaar/inkomensklassen', getInkomensklassen);
router.post('/', createToeslagtabel);
router.put('/:jaar', updateToeslagtabel);
router.delete('/:jaar', deleteToeslagtabel);

export default router; 