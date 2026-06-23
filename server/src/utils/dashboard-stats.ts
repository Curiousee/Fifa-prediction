import User from '../models/User';
import Match from '../models/Match';
import Prediction from '../models/Prediction';

export interface DashboardStats {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  completedMatches: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [totalUsers, totalMatches, totalPredictions, completedMatches] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Match.countDocuments(),
      Prediction.countDocuments(),
      Match.countDocuments({ status: 'completed' }),
    ]);

  return { totalUsers, totalMatches, totalPredictions, completedMatches };
}
