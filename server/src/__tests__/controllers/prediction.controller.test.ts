import { Request, Response } from 'express';
import { submitPrediction, getPollResults, getUserPredictions } from '../../controllers/prediction.controller';
import Match from '../../models/Match';
import Prediction from '../../models/Prediction';
import { AuthRequest } from '../../middleware/auth.middleware';

jest.mock('../../models/Match');
jest.mock('../../models/Prediction');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('prediction.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submitPrediction', () => {
    it('returns 400 for invalid choice', async () => {
      const req = {
        body: { matchId: 'm1', choice: 'invalid' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid prediction choice' });
    });

    it('returns 404 when match is not found', async () => {
      (Match.findById as jest.Mock).mockResolvedValue(null);

      const req = {
        body: { matchId: 'missing', choice: 'teamA' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 when predictions are not open', async () => {
      const futureStart = new Date(Date.now() + 3600000);
      const futureEnd = new Date(Date.now() + 7200000);
      (Match.findById as jest.Mock).mockResolvedValue({
        status: 'upcoming',
        predictionStart: futureStart,
        predictionEnd: futureEnd,
      });

      const req = {
        body: { matchId: 'm1', choice: 'teamA' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Predictions are not open for this match' });
    });

    it('returns 400 when user already submitted a prediction', async () => {
      const pastStart = new Date(Date.now() - 3600000);
      const futureEnd = new Date(Date.now() + 3600000);
      (Match.findById as jest.Mock).mockResolvedValue({
        status: 'open',
        predictionStart: pastStart,
        predictionEnd: futureEnd,
      });
      (Prediction.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      const req = {
        body: { matchId: 'm1', choice: 'teamA' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already submitted a prediction for this match',
      });
    });

    it('creates prediction and returns 201', async () => {
      const pastStart = new Date(Date.now() - 3600000);
      const futureEnd = new Date(Date.now() + 3600000);
      (Match.findById as jest.Mock).mockResolvedValue({
        status: 'open',
        predictionStart: pastStart,
        predictionEnd: futureEnd,
      });
      (Prediction.findOne as jest.Mock).mockResolvedValue(null);
      const created = { _id: 'p1', userId: 'u1', matchId: 'm1', choice: 'teamA' };
      (Prediction.create as jest.Mock).mockResolvedValue(created);

      const req = {
        body: { matchId: 'm1', choice: 'teamA' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(Prediction.create).toHaveBeenCalledWith({ userId: 'u1', matchId: 'm1', choice: 'teamA' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 500 on unexpected error', async () => {
      (Match.findById as jest.Mock).mockRejectedValue(new Error('DB'));

      const req = {
        body: { matchId: 'm1', choice: 'teamA' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await submitPrediction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPollResults', () => {
    it('returns 404 when match is not found', async () => {
      (Match.findById as jest.Mock).mockResolvedValue(null);

      const req = { params: { matchId: 'missing' } } as unknown as Request;
      const res = mockRes();

      await getPollResults(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when match is still open', async () => {
      (Match.findById as jest.Mock).mockResolvedValue({ status: 'open' });

      const req = { params: { matchId: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getPollResults(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 when match is upcoming', async () => {
      (Match.findById as jest.Mock).mockResolvedValue({ status: 'upcoming' });

      const req = { params: { matchId: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getPollResults(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns poll results with percentages for closed/completed match', async () => {
      (Match.findById as jest.Mock).mockResolvedValue({
        status: 'closed',
        teamA: { name: 'Brazil' },
        teamB: { name: 'France' },
      });
      const fakePredictions = [
        { choice: 'teamA' },
        { choice: 'teamA' },
        { choice: 'teamB' },
        { choice: 'draw' },
      ];
      (Prediction.find as jest.Mock).mockResolvedValue(fakePredictions);

      const req = { params: { matchId: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getPollResults(req, res);

      const call = (res.json as jest.Mock).mock.calls[0][0];
      expect(call.total).toBe(4);
      expect(call.results).toHaveLength(3);
      expect(call.results[0].count).toBe(2); // teamA
      expect(call.results[0].percentage).toBe(50);
      expect(call.results[1].count).toBe(1); // draw
      expect(call.results[2].count).toBe(1); // teamB
    });

    it('returns 0 percentages when no predictions exist', async () => {
      (Match.findById as jest.Mock).mockResolvedValue({
        status: 'completed',
        teamA: { name: 'A' },
        teamB: { name: 'B' },
      });
      (Prediction.find as jest.Mock).mockResolvedValue([]);

      const req = { params: { matchId: 'm1' } } as unknown as Request;
      const res = mockRes();

      await getPollResults(req, res);

      const call = (res.json as jest.Mock).mock.calls[0][0];
      expect(call.total).toBe(0);
      expect(call.results[0].percentage).toBe(0);
    });
  });

  describe('getUserPredictions', () => {
    it('returns user predictions', async () => {
      const fakePreds = [{ _id: 'p1' }];
      (Prediction.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(fakePreds),
        }),
      });

      const req = { user: { id: 'u1' } } as AuthRequest;
      const res = mockRes();

      await getUserPredictions(req, res);

      expect(res.json).toHaveBeenCalledWith(fakePreds);
    });

    it('returns 500 on error', async () => {
      (Prediction.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('DB')),
        }),
      });

      const req = { user: { id: 'u1' } } as AuthRequest;
      const res = mockRes();

      await getUserPredictions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
