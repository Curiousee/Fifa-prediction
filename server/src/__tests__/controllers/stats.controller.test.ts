import { Request, Response } from 'express';
import { getDashboardStats, getPublicStats } from '../../controllers/stats.controller';
import User from '../../models/User';
import Match from '../../models/Match';
import Prediction from '../../models/Prediction';

jest.mock('../../models/User');
jest.mock('../../models/Match');
jest.mock('../../models/Prediction');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('stats.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDashboardStats', () => {
    it('returns aggregated stats', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(15);
      (Match.countDocuments as jest.Mock).mockResolvedValueOnce(8).mockResolvedValueOnce(4);
      (Prediction.countDocuments as jest.Mock).mockResolvedValue(30);

      const req = {} as Request;
      const res = mockRes();

      await getDashboardStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalUsers: 15,
        totalMatches: 8,
        totalPredictions: 30,
        completedMatches: 4,
      });
    });

    it('returns 500 on error', async () => {
      (User.countDocuments as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = {} as Request;
      const res = mockRes();

      await getDashboardStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPublicStats', () => {
    it('returns public stats including unique countries', async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(20);
      (Match.countDocuments as jest.Mock).mockResolvedValue(10);
      (Prediction.countDocuments as jest.Mock)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(25);

      const fakeMatches = [
        { teamA: { name: 'Brazil' }, teamB: { name: 'France' } },
        { teamA: { name: 'Brazil' }, teamB: { name: 'Germany' } },
        { teamA: { name: 'Argentina' }, teamB: { name: 'France' } },
      ];
      (Match.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeMatches),
      });

      const req = {} as Request;
      const res = mockRes();

      await getPublicStats(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalUsers: 20,
        totalMatches: 10,
        totalPredictions: 50,
        correctPredictions: 25,
        totalCountries: 4, // Brazil, France, Germany, Argentina
      });
    });

    it('returns 500 on error', async () => {
      (User.countDocuments as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = {} as Request;
      const res = mockRes();

      await getPublicStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
