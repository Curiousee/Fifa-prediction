import { Router } from 'express';
import { getLeaderboard, getDailyLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/', getLeaderboard);
router.get('/daily', getDailyLeaderboard);

export default router;
