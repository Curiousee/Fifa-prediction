import { Router } from 'express';
import {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  declareResult,
} from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.get('/', getAllMatches);
router.get('/:id', getMatchById);
router.post('/', authenticate, requireAdmin, createMatch);
router.put('/:id', authenticate, requireAdmin, updateMatch);
router.post('/:id/result', authenticate, requireAdmin, declareResult);

export default router;
