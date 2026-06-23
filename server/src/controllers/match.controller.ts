import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Match from '../models/Match';
import Prediction from '../models/Prediction';
import User from '../models/User';
import PointHistory from '../models/PointHistory';
import { AuthRequest } from '../middleware/auth.middleware';

type MatchStatus = 'upcoming' | 'open' | 'closed' | 'completed';

const computeStatus = (match: {
  status: MatchStatus;
  predictionStart: Date;
  predictionEnd: Date;
}): MatchStatus => {
  if (match.status === 'completed') return 'completed';
  const now = new Date();
  if (now < new Date(match.predictionStart)) return 'upcoming';
  if (now <= new Date(match.predictionEnd)) return 'open';
  return 'closed';
};

export const getAllMatches = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const matches = await Match.find().sort({ matchNumber: 1 });

    // Sync status changes in bulk (skip completed ones)
    const updates: Promise<unknown>[] = [];
    const result = matches.map((match) => {
      const newStatus = computeStatus(match);
      if (newStatus !== match.status && match.status !== 'completed') {
        updates.push(
          Match.updateOne({ _id: match._id }, { status: newStatus })
        );
        match.status = newStatus;
      }
      return match;
    });

    await Promise.all(updates);
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

export const getMatchById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const match = await Match.findById(req.params['id']);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    res.json(match);
  } catch {
    res.status(500).json({ message: 'Error fetching match' });
  }
};

export const createMatchValidation = [
  body('matchNumber').isInt({ min: 1 }).withMessage('matchNumber must be a positive integer'),
  body('matchDate').isISO8601().withMessage('matchDate must be a valid date'),
  body('teamA.name').trim().notEmpty().withMessage('teamA.name is required').isLength({ max: 100 }),
  body('teamA.flag').trim().notEmpty().withMessage('teamA.flag is required').isLength({ max: 10 }),
  body('teamB.name').trim().notEmpty().withMessage('teamB.name is required').isLength({ max: 100 }),
  body('teamB.flag').trim().notEmpty().withMessage('teamB.flag is required').isLength({ max: 10 }),
  body('predictionStart').isISO8601().withMessage('predictionStart must be a valid date'),
  body('predictionEnd').isISO8601().withMessage('predictionEnd must be a valid date'),
];

export const createMatch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { matchNumber, matchDate, teamA, teamB, predictionStart, predictionEnd } =
      req.body as {
        matchNumber: number;
        matchDate: string;
        teamA: { name: string; flag: string };
        teamB: { name: string; flag: string };
        predictionStart: string;
        predictionEnd: string;
      };

    const existing = await Match.findOne({ matchNumber });
    if (existing) {
      res.status(400).json({ message: 'Match number already exists' });
      return;
    }

    if (new Date(predictionEnd) <= new Date(predictionStart)) {
      res.status(400).json({ message: 'Prediction end time must be after start time' });
      return;
    }

    const match = await Match.create({
      matchNumber,
      matchDate,
      teamA,
      teamB,
      predictionStart,
      predictionEnd,
    });

    res.status(201).json(match);
  } catch {
    res.status(500).json({ message: 'Error creating match' });
  }
};

const ALLOWED_MATCH_UPDATE_FIELDS = [
  'matchNumber', 'matchDate', 'teamA', 'teamB',
  'predictionStart', 'predictionEnd', 'status',
] as const;

export const updateMatch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_MATCH_UPDATE_FIELDS) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    const match = await Match.findByIdAndUpdate(
      req.params['id'],
      updates,
      { new: true, runValidators: true }
    );
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }
    res.json(match);
  } catch {
    res.status(500).json({ message: 'Error updating match' });
  }
};

export const deleteMatch = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const match = await Match.findById(req.params['id']);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    // Delete associated predictions
    await Prediction.deleteMany({ matchId: match._id });

    // Delete associated point history entries
    await PointHistory.deleteMany({ matchId: match._id });

    await Match.findByIdAndDelete(match._id);
    res.json({ message: 'Match deleted successfully' });
  } catch {
    res.status(500).json({ message: 'Error deleting match' });
  }
};

export const declareResult = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.isSuperAdmin && !req.user?.canChangeScores) {
      res.status(403).json({ message: 'You do not have permission to declare results' });
      return;
    }

    const { result } = req.body as { result: 'teamA' | 'teamB' | 'draw' };

    if (!['teamA', 'teamB', 'draw'].includes(result)) {
      res.status(400).json({ message: 'Invalid result value' });
      return;
    }

    const match = await Match.findById(req.params['id']);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    if (match.status === 'completed') {
      res.status(400).json({ message: 'Result already declared' });
      return;
    }

    match.result = result;
    match.status = 'completed';
    await match.save();

    // Fetch correct predictions sorted by submission time (earliest first = first pick gets bonus)
    const correctPredictions = await Prediction.find({
      matchId: match._id,
      choice: result,
    }).sort({ createdAt: 1 });

    // Award points sequentially to preserve order guarantees
    for (let index = 0; index < correctPredictions.length; index++) {
      const prediction = correctPredictions[index];
      // First correct predictor gets 2 pts, everyone else gets 1 pt
      const totalPoints = index === 0 ? 2 : 1;
      const isFirst = index === 0;

      prediction.isCorrect = true;
      prediction.pointsAwarded = totalPoints;
      await prediction.save();

      await User.findByIdAndUpdate(prediction.userId, {
        $inc: { points: totalPoints },
      });

      const note = isFirst ? ' (first correct pick — 2 pts)' : ' (1 pt)';
      await PointHistory.create({
        userId: prediction.userId,
        points: totalPoints,
        reason: `Correct prediction for Match ${match.matchNumber}: ${match.teamA.name} vs ${match.teamB.name}${note}`,
        addedByAdmin: false,
        matchId: match._id,
      });
    }

    // Mark incorrect predictions
    await Prediction.updateMany(
      { matchId: match._id, choice: { $ne: result } },
      { isCorrect: false, pointsAwarded: 0 }
    );

    res.json({
      message: 'Result declared and points awarded',
      match,
      correctCount: correctPredictions.length,
    });
  } catch (err) {
    console.error('declareResult error:', err);
    res.status(500).json({ message: 'Error declaring result' });
  }
};
