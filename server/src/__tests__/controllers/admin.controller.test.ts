import { Response } from 'express';
import {
  getDashboardStats,
  getAllUsers,
  adjustPoints,
  getUserPointHistory,
  deleteUser,
  updateUserRole,
  updateSuperAdminAccess,
  updateScoreAccess,
} from '../../controllers/admin.controller';
import User from '../../models/User';
import Match from '../../models/Match';
import Prediction from '../../models/Prediction';
import PointHistory from '../../models/PointHistory';
import { AuthRequest } from '../../middleware/auth.middleware';

jest.mock('../../models/User');
jest.mock('../../models/Match');
jest.mock('../../models/Prediction');
jest.mock('../../models/PointHistory');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('admin.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDashboardStats', () => {
    it('returns aggregated stats', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(10);
      (Match.countDocuments as jest.Mock).mockResolvedValueOnce(5).mockResolvedValueOnce(3);
      (Prediction.countDocuments as jest.Mock).mockResolvedValue(20);

      const req = {} as AuthRequest;
      const res = mockRes();

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalUsers: 10,
        totalMatches: 5,
        totalPredictions: 20,
        completedMatches: 3,
      });
    });

    it('returns 500 on error', async () => {
      (User.countDocuments as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = {} as AuthRequest;
      const res = mockRes();

      await getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllUsers', () => {
    it('returns users sorted by points', async () => {
      const fakeUsers = [{ name: 'A', points: 10 }];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(fakeUsers),
        }),
      });

      const req = {} as AuthRequest;
      const res = mockRes();

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeUsers);
    });
  });

  describe('adjustPoints', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = { body: { userId: '', points: undefined, reason: '' }, user: { id: 'admin1' } } as unknown as AuthRequest;
      const res = mockRes();

      await adjustPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when points is not an integer', async () => {
      const req = {
        body: { userId: 'u1', points: 1.5, reason: 'test' },
        user: { id: 'admin1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await adjustPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Points must be an integer' });
    });

    it('returns 404 when user is not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const req = {
        body: { userId: 'missing', points: 5, reason: 'bonus' },
        user: { id: 'admin1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await adjustPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('adjusts points and creates point history', async () => {
      const fakeUser = { _id: 'u1', name: 'Alice', points: 10, save: jest.fn() };
      (User.findById as jest.Mock).mockResolvedValue(fakeUser);
      (PointHistory.create as jest.Mock).mockResolvedValue({});

      const req = {
        body: { userId: 'u1', points: 5, reason: 'Manual bonus' },
        user: { id: 'admin1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await adjustPoints(req, res);

      expect(fakeUser.points).toBe(15);
      expect(fakeUser.save).toHaveBeenCalled();
      expect(PointHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', points: 5, reason: 'Manual bonus', addedByAdmin: true })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Points adjusted successfully' })
      );
    });

    it('clamps points to 0 when deducting more than current', async () => {
      const fakeUser = { _id: 'u1', name: 'Bob', points: 3, save: jest.fn() };
      (User.findById as jest.Mock).mockResolvedValue(fakeUser);
      (PointHistory.create as jest.Mock).mockResolvedValue({});

      const req = {
        body: { userId: 'u1', points: -10, reason: 'penalty' },
        user: { id: 'admin1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await adjustPoints(req, res);

      expect(fakeUser.points).toBe(0);
    });
  });

  describe('getUserPointHistory', () => {
    it('returns point history for a user', async () => {
      const fakeHistory = [{ points: 5, reason: 'test' }];
      (PointHistory.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(fakeHistory),
          }),
        }),
      });

      const req = { params: { userId: 'u1' } } as unknown as AuthRequest;
      const res = mockRes();

      await getUserPointHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeHistory);
    });
  });

  describe('deleteUser', () => {
    it('returns 404 when user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const req = { params: { userId: 'missing' } } as unknown as AuthRequest;
      const res = mockRes();

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when trying to delete an admin', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ role: 'admin' });

      const req = { params: { userId: 'a1' } } as unknown as AuthRequest;
      const res = mockRes();

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete an admin account' });
    });

    it('deletes user, predictions, and point history', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ role: 'user' });
      (Prediction.deleteMany as jest.Mock).mockResolvedValue({});
      (PointHistory.deleteMany as jest.Mock).mockResolvedValue({});
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({});

      const req = { params: { userId: 'u1' } } as unknown as AuthRequest;
      const res = mockRes();

      await deleteUser(req, res);

      expect(Prediction.deleteMany).toHaveBeenCalledWith({ userId: 'u1' });
      expect(PointHistory.deleteMany).toHaveBeenCalledWith({ userId: 'u1' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });
  });

  describe('updateUserRole', () => {
    it('returns 403 when user is not super admin', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { role: 'admin' },
        user: { id: 'a1', isSuperAdmin: false },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 for invalid role', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { role: 'moderator' },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 403 when trying to change own role', async () => {
      const req = {
        params: { userId: 'a1' },
        body: { role: 'user' },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Cannot change your own role' });
    });

    it('updates user role successfully', async () => {
      const updatedUser = { _id: 'u1', name: 'Alice', role: 'admin' };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const req = {
        params: { userId: 'u1' },
        body: { role: 'admin' },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateUserRole(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Role updated successfully' })
      );
    });

    it('returns 404 when target user not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { userId: 'missing' },
        body: { role: 'admin' },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateSuperAdminAccess', () => {
    it('returns 403 when requester is not the roshan email', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { isSuperAdmin: true },
        user: { id: 'a1', email: 'other@test.com' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateSuperAdminAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when isSuperAdmin is not a boolean', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { isSuperAdmin: 'yes' },
        user: { id: 'a1', email: 'mahamood.roshan@tcs.com' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateSuperAdminAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when trying to change own super admin status', async () => {
      const req = {
        params: { userId: 'a1' },
        body: { isSuperAdmin: false },
        user: { id: 'a1', email: 'mahamood.roshan@tcs.com' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateSuperAdminAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('grants super admin access successfully', async () => {
      const updatedUser = { _id: 'u1', isSuperAdmin: true };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const req = {
        params: { userId: 'u1' },
        body: { isSuperAdmin: true },
        user: { id: 'a1', email: 'mahamood.roshan@tcs.com' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateSuperAdminAccess(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { isSuperAdmin: true, role: 'admin', canChangeScores: true },
        { new: true, select: '-password' }
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Full access updated' })
      );
    });

    it('revokes super admin access without setting role/scores', async () => {
      const updatedUser = { _id: 'u1', isSuperAdmin: false };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const req = {
        params: { userId: 'u1' },
        body: { isSuperAdmin: false },
        user: { id: 'a1', email: 'mahamood.roshan@tcs.com' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateSuperAdminAccess(req, res);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { isSuperAdmin: false },
        { new: true, select: '-password' }
      );
    });
  });

  describe('updateScoreAccess', () => {
    it('returns 403 when user is not super admin', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { canChangeScores: true },
        user: { id: 'a1', isSuperAdmin: false },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateScoreAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when canChangeScores is not boolean', async () => {
      const req = {
        params: { userId: 'u1' },
        body: { canChangeScores: 'yes' },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateScoreAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('updates score access successfully', async () => {
      const updatedUser = { _id: 'u1', canChangeScores: true };
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const req = {
        params: { userId: 'u1' },
        body: { canChangeScores: true },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateScoreAccess(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Score access updated' })
      );
    });

    it('returns 404 when user not found', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { userId: 'missing' },
        body: { canChangeScores: true },
        user: { id: 'a1', isSuperAdmin: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await updateScoreAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
