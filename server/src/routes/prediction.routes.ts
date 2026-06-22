import { Router } from 'express';
import {
  submitPrediction,
  getPollResults,
  getUserPredictions,
} from '../controllers/prediction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, submitPrediction);
router.get('/my', authenticate, getUserPredictions);
router.get('/poll/:matchId', getPollResults);

export default router;
