import { Router } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  adjustPoints,
  getUserPointHistory,
  deleteUser,
  updateUserRole,
  updateScoreAccess,
  updateSuperAdminAccess,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/points/adjust', adjustPoints);
router.get('/points/history/:userId', getUserPointHistory);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/role', updateUserRole);
router.patch('/users/:userId/score-access', updateScoreAccess);
router.patch('/users/:userId/full-access', updateSuperAdminAccess);

export default router;
