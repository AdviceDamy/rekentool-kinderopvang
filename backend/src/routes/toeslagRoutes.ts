import { Router } from 'express';
import { berekenToeslag } from '../controllers/toeslagController';
import { getBeschikbareJaren, getInkomensklassen } from '../controllers/toeslagtabelController';

const router = Router();

// Publieke routes (geen authenticatie vereist)
router.post('/bereken', berekenToeslag);
router.get('/jaren', getBeschikbareJaren);
router.get('/:jaar/inkomensklassen', getInkomensklassen);

export default router; 