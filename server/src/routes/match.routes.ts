import { Router } from 'express';
import {
  getAllMatches,
  getMatchById,
  createMatch,
  createMatchValidation,
  updateMatch,
  declareResult,
} from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.get('/', getAllMatches);
router.get('/:id', getMatchById);
router.post('/', authenticate, requireAdmin, createMatchValidation, createMatch);
router.put('/:id', authenticate, requireAdmin, updateMatch);
router.post('/:id/result', authenticate, requireAdmin, declareResult);

export default router;
