import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Match from '../models/Match';
import Prediction from '../models/Prediction';

export const getLeaderboard = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name email points joinedDate')
      .sort({ points: -1, joinedDate: 1 })
      .limit(200);

    // Get each user's latest prediction timestamp in one query
    const userIds = users.map(u => u._id as mongoose.Types.ObjectId);
    const latestPredictions = await Prediction.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$userId', lastPredictionAt: { $first: '$createdAt' } } },
    ]);

    const lastPredMap = new Map<string, Date>(
      latestPredictions.map(p => [p._id.toString(), p.lastPredictionAt])
    );

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      joinedDate: user.joinedDate,
      lastPredictionAt: lastPredMap.get(user._id.toString()) ?? null,
    }));

    res.json(leaderboard);
  } catch {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

// Returns available match-creation dates, or ranked list for a specific date
export const getDailyLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      // Return unique dates on which matches were created (for the date picker)
      const rows = await Match.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          },
        },
        { $sort: { _id: -1 } },
      ]);
      res.json({ dates: rows.map((r) => r._id as string) });
      return;
    }

    // Build UTC day window for the requested date string (YYYY-MM-DD)
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    // Find matches created on that day
    const matches = await Match.find({ createdAt: { $gte: start, $lte: end } }).select('_id');
    if (matches.length === 0) {
      res.json([]);
      return;
    }

    const matchIds = matches.map((m) => m._id as mongoose.Types.ObjectId);

    // Sum pointsAwarded per user across those matches
    const results = await Prediction.aggregate([
      { $match: { matchId: { $in: matchIds }, isCorrect: true, pointsAwarded: { $gt: 0 } } },
      {
        $group: {
          _id: '$userId',
          points: { $sum: '$pointsAwarded' },
          correctPicks: { $sum: 1 },
        },
      },
      { $sort: { points: -1 } },
    ]);

    if (results.length === 0) {
      res.json([]);
      return;
    }

    const userIds = results.map((r) => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email');
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const leaderboard = results.map((r, index) => {
      const u = userMap.get(r._id.toString());
      return {
        rank: index + 1,
        id: r._id,
        name: u?.name ?? 'Unknown',
        email: u?.email ?? '',
        points: r.points,
        correctPicks: r.correctPicks,
      };
    });

    res.json(leaderboard);
  } catch {
    res.status(500).json({ message: 'Error fetching daily leaderboard' });
  }
};
