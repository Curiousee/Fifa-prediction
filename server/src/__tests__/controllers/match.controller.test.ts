import { Request, Response } from 'express';
import {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  declareResult,
} from '../../controllers/match.controller';
import Match from '../../models/Match';
import Prediction from '../../models/Prediction';
import User from '../../models/User';
import PointHistory from '../../models/PointHistory';
import { AuthRequest } from '../../middleware/auth.middleware';

jest.mock('../../models/Match');
jest.mock('../../models/Prediction');
jest.mock('../../models/User');
jest.mock('../../models/PointHistory');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('match.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAllMatches', () => {
    it('returns all matches sorted by matchNumber', async () => {
      const fakeMatches = [
        {
          _id: 'm1',
          matchNumber: 1,
          status: 'open',
          predictionStart: new Date('2020-01-01'),
          predictionEnd: new Date('2030-01-01'),
        },
      ];
      (Match.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(fakeMatches) });

      const req = {} as Request;
      const res = mockRes();

      await getAllMatches(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeMatches);
    });

    it('updates status from upcoming to open when prediction window opens', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 60000);
      const futureDate = new Date(now.getTime() + 3600000);

      const fakeMatch = {
        _id: 'm1',
        matchNumber: 1,
        status: 'upcoming',
        predictionStart: pastDate,
        predictionEnd: futureDate,
      };
      (Match.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([fakeMatch]) });
      (Match.updateOne as jest.Mock).mockResolvedValue({});

      const req = {} as Request;
      const res = mockRes();

      await getAllMatches(req, res);

      expect(Match.updateOne).toHaveBeenCalledWith({ _id: 'm1' }, { status: 'open' });
      expect(fakeMatch.status).toBe('open');
    });

    it('does not update status for completed matches', async () => {
      const fakeMatch = {
        _id: 'm2',
        matchNumber: 2,
        status: 'completed',
        predictionStart: new Date('2020-01-01'),
        predictionEnd: new Date('2020-01-02'),
      };
      (Match.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue([fakeMatch]) });

      const req = {} as Request;
      const res = mockRes();

      await getAllMatches(req, res);

      expect(Match.updateOne).not.toHaveBeenCalled();
    });

    it('returns 500 on error', async () => {
      (Match.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error('DB')) });

      const req = {} as Request;
      const res = mockRes();

      await getAllMatches(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMatchById', () => {
    it('returns the match when found', async () => {
      const fakeMatch = { _id: 'm1', matchNumber: 1 };
      (Match.findById as jest.Mock).mockResolvedValue(fakeMatch);

      const req = { params: { id: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getMatchById(req, res);

      expect(res.json).toHaveBeenCalledWith(fakeMatch);
    });

    it('returns 404 when match is not found', async () => {
      (Match.findById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: 'missing' } } as unknown as Request;
      const res = mockRes();

      await getMatchById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 500 on error', async () => {
      (Match.findById as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = { params: { id: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getMatchById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createMatch', () => {
    const validBody = {
      matchNumber: 1,
      matchDate: '2025-07-01',
      teamA: { name: 'Brazil', flag: '🇧🇷' },
      teamB: { name: 'France', flag: '🇫🇷' },
      predictionStart: '2025-06-30T00:00:00Z',
      predictionEnd: '2025-07-01T00:00:00Z',
    };

    it('returns 400 when match number already exists', async () => {
      (Match.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      const req = { body: validBody, user: { id: 'a1', role: 'admin' } } as unknown as AuthRequest;
      const res = mockRes();

      await createMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Match number already exists' });
    });

    it('returns 400 when predictionEnd is before predictionStart', async () => {
      (Match.findOne as jest.Mock).mockResolvedValue(null);

      const body = { ...validBody, predictionEnd: '2025-06-29T00:00:00Z' };
      const req = { body, user: { id: 'a1' } } as unknown as AuthRequest;
      const res = mockRes();

      await createMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Prediction end time must be after start time' });
    });

    it('creates match and returns 201', async () => {
      (Match.findOne as jest.Mock).mockResolvedValue(null);
      const created = { _id: 'newm', ...validBody };
      (Match.create as jest.Mock).mockResolvedValue(created);

      const req = { body: validBody, user: { id: 'a1' } } as unknown as AuthRequest;
      const res = mockRes();

      await createMatch(req, res);

      expect(Match.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 500 on error', async () => {
      (Match.findOne as jest.Mock).mockResolvedValue(null);
      (Match.create as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = { body: validBody, user: { id: 'a1' } } as unknown as AuthRequest;
      const res = mockRes();

      await createMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateMatch', () => {
    it('updates and returns the match', async () => {
      const updated = { _id: 'm1', matchNumber: 1 };
      (Match.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

      const req = { params: { id: 'm1' }, body: { matchNumber: 1 } } as unknown as AuthRequest;
      const res = mockRes();

      await updateMatch(req, res);

      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it('returns 404 when match is not found', async () => {
      (Match.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: 'missing' }, body: {} } as unknown as AuthRequest;
      const res = mockRes();

      await updateMatch(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('declareResult', () => {
    it('returns 403 when user has no permission', async () => {
      const req = {
        params: { id: 'm1' },
        body: { result: 'teamA' },
        user: { id: 'u1', isSuperAdmin: false, canChangeScores: false },
      } as unknown as AuthRequest;
      const res = mockRes();

      await declareResult(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 for invalid result value', async () => {
      const req = {
        params: { id: 'm1' },
        body: { result: 'invalid' },
        user: { id: 'u1', isSuperAdmin: true, canChangeScores: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await declareResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid result value' });
    });

    it('returns 404 when match is not found', async () => {
      (Match.findById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: 'missing' },
        body: { result: 'teamA' },
        user: { id: 'u1', isSuperAdmin: true, canChangeScores: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await declareResult(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when match is already completed', async () => {
      (Match.findById as jest.Mock).mockResolvedValue({ status: 'completed' });

      const req = {
        params: { id: 'm1' },
        body: { result: 'teamA' },
        user: { id: 'u1', isSuperAdmin: true, canChangeScores: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await declareResult(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Result already declared' });
    });

    it('declares result, awards points, and marks incorrect predictions', async () => {
      const fakeMatch = {
        _id: 'm1',
        matchNumber: 1,
        teamA: { name: 'Brazil' },
        teamB: { name: 'France' },
        status: 'closed',
        result: null as string | null,
        save: jest.fn(),
      };
      (Match.findById as jest.Mock).mockResolvedValue(fakeMatch);

      const fakePredictions = [
        { userId: 'u1', isCorrect: null as boolean | null, pointsAwarded: 0, save: jest.fn() },
        { userId: 'u2', isCorrect: null as boolean | null, pointsAwarded: 0, save: jest.fn() },
      ];
      (Prediction.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockResolvedValue(fakePredictions) });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      (PointHistory.create as jest.Mock).mockResolvedValue({});
      (Prediction.updateMany as jest.Mock).mockResolvedValue({});

      const req = {
        params: { id: 'm1' },
        body: { result: 'teamA' },
        user: { id: 'admin1', isSuperAdmin: true, canChangeScores: true },
      } as unknown as AuthRequest;
      const res = mockRes();

      await declareResult(req, res);

      expect(fakeMatch.result).toBe('teamA');
      expect(fakeMatch.status).toBe('completed');
      expect(fakeMatch.save).toHaveBeenCalled();

      // First predictor gets 2 pts, second gets 1 pt
      expect(fakePredictions[0].pointsAwarded).toBe(2);
      expect(fakePredictions[0].isCorrect).toBe(true);
      expect(fakePredictions[1].pointsAwarded).toBe(1);
      expect(fakePredictions[1].isCorrect).toBe(true);

      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(2);
      expect(PointHistory.create).toHaveBeenCalledTimes(2);
      expect(Prediction.updateMany).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Result declared and points awarded', correctCount: 2 })
      );
    });
  });
});
