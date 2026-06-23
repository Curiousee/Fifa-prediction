import { Response } from 'express';
import User from '../models/User';
import Prediction from '../models/Prediction';
import PointHistory from '../models/PointHistory';
import Match from '../models/Match';
import { AuthRequest } from '../middleware/auth.middleware';
import { fetchDashboardStats } from '../utils/dashboard-stats';

export const getDashboardStats = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [totalUsers, totalMatches, totalPredictions, completedMatches] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Match.countDocuments(),
        Prediction.countDocuments(),
        Match.countDocuments({ status: 'completed' }),
      ]);

    res.json({ totalUsers, totalMatches, totalPredictions, completedMatches });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

export const getAllUsers = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ points: -1 });
    res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

export const adjustPoints = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, points, reason } = req.body as {
      userId: string;
      points: number;
      reason: string;
    };

    if (!userId || points === undefined || !reason?.trim()) {
      res.status(400).json({ message: 'userId, points, and reason are required' });
      return;
    }

    if (typeof points !== 'number' || !Number.isInteger(points)) {
      res.status(400).json({ message: 'Points must be an integer' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.points = Math.max(0, user.points + points);
    await user.save();

    await PointHistory.create({
      userId,
      points,
      reason: reason.trim(),
      addedByAdmin: true,
      adminId: req.user?.id,
    });

    res.json({
      message: 'Points adjusted successfully',
      user: { id: user._id, name: user.name, points: user.points },
    });
  } catch (error) {
    console.error('adjustPoints error:', error);
    res.status(500).json({ message: 'Error adjusting points' });
  }
};

export const getUserPointHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const history = await PointHistory.find({ userId })
      .sort({ createdAt: -1 })
      .populate('matchId', 'matchNumber teamA teamB')
      .limit(100);

    res.json(history);
  } catch (error) {
    console.error('getUserPointHistory error:', error);
    res.status(500).json({ message: 'Error fetching point history' });
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(403).json({ message: 'Cannot delete an admin account' });
      return;
    }

    await Prediction.deleteMany({ userId });
    await PointHistory.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.isSuperAdmin) {
      res.status(403).json({ message: 'Only the super admin can change user roles' });
      return;
    }

    const { userId } = req.params;
    const { role } = req.body as { role: string };

    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({ message: 'Role must be either admin or user' });
      return;
    }

    if (userId === req.user?.id) {
      res.status(403).json({ message: 'Cannot change your own role' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Role updated successfully', user });
  } catch (error) {
    console.error('updateUserRole error:', error);
    res.status(500).json({ message: 'Error updating role' });
  }
};

export const updateSuperAdminAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Only the original roshan account can grant full super-admin access
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || '';
    if (!superAdminEmail || req.user?.email !== superAdminEmail) {
      res.status(403).json({ message: 'Only the super admin can grant full access' });
      return;
    }

    const { userId } = req.params;
    const { isSuperAdmin } = req.body as { isSuperAdmin: boolean };

    if (typeof isSuperAdmin !== 'boolean') {
      res.status(400).json({ message: 'isSuperAdmin must be a boolean' });
      return;
    }

    if (userId === req.user?.id) {
      res.status(400).json({ message: 'Cannot change your own super-admin status' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isSuperAdmin, ...(isSuperAdmin ? { role: 'admin', canChangeScores: true } : {}) },
      { new: true, select: '-password' }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Full access updated', user });
  } catch (error) {
    console.error('updateSuperAdminAccess error:', error);
    res.status(500).json({ message: 'Error updating full access' });
  }
};

export const updateScoreAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.isSuperAdmin) {
      res.status(403).json({ message: 'Only the super admin can grant score-change access' });
      return;
    }

    const { userId } = req.params;
    const { canChangeScores } = req.body as { canChangeScores: boolean };

    if (typeof canChangeScores !== 'boolean') {
      res.status(400).json({ message: 'canChangeScores must be a boolean' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { canChangeScores },
      { new: true, select: '-password' }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'Score access updated', user });
  } catch (error) {
    console.error('updateScoreAccess error:', error);
    res.status(500).json({ message: 'Error updating score access' });
  }
};
