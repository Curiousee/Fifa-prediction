import { Request, Response } from 'express';
import Prediction from '../models/Prediction';
import Match from '../models/Match';
import { AuthRequest } from '../middleware/auth.middleware';

export const submitPrediction = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { matchId, choice } = req.body as {
      matchId: string;
      choice: 'teamA' | 'teamB' | 'draw';
    };
    const userId = req.user?.id;

    if (!['teamA', 'teamB', 'draw'].includes(choice)) {
      res.status(400).json({ message: 'Invalid prediction choice' });
      return;
    }

    const match = await Match.findById(matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    const now = new Date();
    if (
      match.status !== 'open' ||
      now < new Date(match.predictionStart) ||
      now > new Date(match.predictionEnd)
    ) {
      res.status(400).json({ message: 'Predictions are not open for this match' });
      return;
    }

    const existing = await Prediction.findOne({ userId, matchId });
    if (existing) {
      res.status(400).json({ message: 'You have already submitted a prediction for this match' });
      return;
    }

    const prediction = await Prediction.create({ userId, matchId, choice });

    res.status(201).json({
      message: 'Prediction recorded successfully!',
      prediction,
    });
  } catch {
    res.status(500).json({ message: 'Error submitting prediction' });
  }
};

export const getPollResults = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    if (match.status === 'open' || match.status === 'upcoming') {
      res.status(403).json({ message: 'Poll results are not available until the prediction window closes' });
      return;
    }

    const predictions = await Prediction.find({ matchId });
    const total = predictions.length;

    const counts = { teamA: 0, teamB: 0, draw: 0 };
    predictions.forEach((p) => {
      if (p.choice === 'teamA') counts.teamA++;
      else if (p.choice === 'teamB') counts.teamB++;
      else if (p.choice === 'draw') counts.draw++;
    });

    const pct = (n: number) =>
      total > 0 ? Math.round((n / total) * 1000) / 10 : 0;

    const results = [
      {
        label: `${match.teamA.name} Win`,
        choice: 'teamA',
        count: counts.teamA,
        percentage: pct(counts.teamA),
      },
      {
        label: 'Draw',
        choice: 'draw',
        count: counts.draw,
        percentage: pct(counts.draw),
      },
      {
        label: `${match.teamB.name} Win`,
        choice: 'teamB',
        count: counts.teamB,
        percentage: pct(counts.teamB),
      },
    ];

    res.json({ match, total, results });
  } catch {
    res.status(500).json({ message: 'Error fetching poll results' });
  }
};

export const getUserPredictions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const predictions = await Prediction.find({ userId: req.user?.id })
      .populate('matchId')
      .sort({ createdAt: -1 });

    res.json(predictions);
  } catch {
    res.status(500).json({ message: 'Error fetching predictions' });
  }
};
