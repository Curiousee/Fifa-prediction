import { Request, Response } from 'express';
import { getLeaderboard, getDailyLeaderboard } from '../../controllers/leaderboard.controller';
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

describe('leaderboard.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getLeaderboard', () => {
    it('returns ranked leaderboard with last prediction timestamps', async () => {
      const fakeUsers = [
        { _id: 'u1', name: 'Alice', email: 'a@x.com', points: 20, joinedDate: new Date() },
        { _id: 'u2', name: 'Bob', email: 'b@x.com', points: 10, joinedDate: new Date() },
      ];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(fakeUsers),
          }),
        }),
      });
      (Prediction.aggregate as jest.Mock).mockResolvedValue([
        { _id: 'u1', lastPredictionAt: new Date('2024-06-01') },
      ]);

      const req = {} as Request;
      const res = mockRes();

      await getLeaderboard(req, res);

      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].lastPredictionAt).toEqual(new Date('2024-06-01'));
      expect(result[1].rank).toBe(2);
      expect(result[1].lastPredictionAt).toBeNull();
    });

    it('returns 500 on error', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB')),
          }),
        }),
      });

      const req = {} as Request;
      const res = mockRes();

      await getLeaderboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDailyLeaderboard', () => {
    it('returns available dates when no date query param', async () => {
      const fakeRows = [{ _id: '2024-06-20' }, { _id: '2024-06-19' }];
      (Match.aggregate as jest.Mock).mockResolvedValue(fakeRows);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await getDailyLeaderboard(req, res);

      expect(res.json).toHaveBeenCalledWith({ dates: ['2024-06-20', '2024-06-19'] });
    });

    it('returns empty array when no matches on requested date', async () => {
      (Match.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([]),
      });

      const req = { query: { date: '2024-06-15' } } as unknown as Request;
      const res = mockRes();

      await getDailyLeaderboard(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns daily leaderboard for a specific date', async () => {
      const fakeMatches = [{ _id: 'm1' }, { _id: 'm2' }];
      (Match.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeMatches),
      });

      const aggResults = [
        { _id: 'u1', points: 3, correctPicks: 2 },
        { _id: 'u2', points: 1, correctPicks: 1 },
      ];
      (Prediction.aggregate as jest.Mock).mockResolvedValue(aggResults);

      const fakeUserDocs = [
        { _id: { toString: () => 'u1' }, name: 'Alice', email: 'a@x.com' },
        { _id: { toString: () => 'u2' }, name: 'Bob', email: 'b@x.com' },
      ];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUserDocs),
      });

      const req = { query: { date: '2024-06-20' } } as unknown as Request;
      const res = mockRes();

      await getDailyLeaderboard(req, res);

      const result = (res.json as jest.Mock).mock.calls[0][0];
      expect(result).toHaveLength(2);
      expect(result[0].rank).toBe(1);
      expect(result[0].name).toBe('Alice');
      expect(result[0].points).toBe(3);
    });

    it('returns empty array when no correct predictions on that date', async () => {
      (Match.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: 'm1' }]),
      });
      (Prediction.aggregate as jest.Mock).mockResolvedValue([]);

      const req = { query: { date: '2024-06-20' } } as unknown as Request;
      const res = mockRes();

      await getDailyLeaderboard(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('returns 500 on error', async () => {
      (Match.aggregate as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await getDailyLeaderboard(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
