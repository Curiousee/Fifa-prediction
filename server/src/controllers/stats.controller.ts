import { Request, Response } from 'express';
import User from '../models/User';
import Match from '../models/Match';
import Prediction from '../models/Prediction';

export const getDashboardStats = async (
  _req: Request,
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

export const getPublicStats = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [totalUsers, totalMatches, totalPredictions, correctPredictions] =
      await Promise.all([
        User.countDocuments({ role: 'user' }),
        Match.countDocuments(),
        Prediction.countDocuments(),
        Prediction.countDocuments({ isCorrect: true }),
      ]);

    // Get unique countries from matches
    const matches = await Match.find().select('teamA teamB');
    const countriesSet = new Set<string>();
    matches.forEach((match) => {
      countriesSet.add(match.teamA.name);
      countriesSet.add(match.teamB.name);
    });

    res.json({
      totalUsers,
      totalMatches,
      totalPredictions,
      correctPredictions,
      totalCountries: countriesSet.size,
    });
  } catch (error) {
    console.error('getPublicStats error:', error);
    res.status(500).json({ message: 'Error fetching public stats' });
  }
};
