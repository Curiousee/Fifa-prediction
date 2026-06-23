import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Trophy,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  ChevronRight,
  Swords,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { matchAPI, predictionAPI, leaderboardAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import MatchCard from '../components/match/MatchCard';
import FifaResults from '../components/FifaResults';
import type { Match, Prediction, LeaderboardEntry, PredictionChoice } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [predictingId, setPredictingId] = useState<string | null>(null);

  const myRank = leaderboard.find((e) => e.id === user?.id)?.rank;

  const loadData = useCallback(async () => {
    try {
      const [matchRes, predRes, lbRes] = await Promise.all([
        matchAPI.getAll(),
        predictionAPI.getMy(),
        leaderboardAPI.get(),
      ]);
      setMatches(matchRes.data as Match[]);
      setMyPredictions(predRes.data as Prediction[]);
      setLeaderboard(lbRes.data as LeaderboardEntry[]);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePredict = async (matchId: string, choice: PredictionChoice) => {
    setPredictingId(matchId);
    try {
      await predictionAPI.submit({ matchId, choice });
      toast.success('Prediction submitted! ⚽');
      // Refresh predictions
      const res = await predictionAPI.getMy();
      setMyPredictions(res.data as Prediction[]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to submit prediction';
      toast.error(msg);
    } finally {
      setPredictingId(null);
    }
  };

  const getPredictionForMatch = (matchId: string): PredictionChoice | null => {
    const pred = myPredictions.find(
      (p) =>
        (typeof p.matchId === 'string' ? p.matchId : (p.matchId as Match)._id) ===
        matchId
    );
    return pred ? pred.choice : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  const openMatches = matches.filter((m) => m.status === 'open');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const upcomingMatches = matches.filter(
    (m) =>
      m.status !== 'completed' &&
      format(new Date(m.matchDate), 'yyyy-MM-dd') === todayStr
  );
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const correctPredictions = myPredictions.filter((p) => p.isCorrect === true).length;

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-black text-white">
          Welcome back, {user?.name?.split(' ')[0]}! ⚽
        </h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s your prediction overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Points',
            value: user?.points?.toLocaleString() ?? '0',
            icon: Trophy,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
          },
          {
            label: 'Leaderboard Rank',
            value: myRank ? `#${myRank}` : '—',
            icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
          },
          {
            label: 'Predictions Made',
            value: String(myPredictions.length),
            icon: Target,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
          },
          {
            label: 'Correct Picks',
            value: String(correctPredictions),
            icon: CheckCircle2,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20',
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`card border ${border} animate-fade-in`}
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-gray-400 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — matches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Matches */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" />
                Active Predictions
              </h2>
              <Link
                to="/matches"
                className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {openMatches.length === 0 ? (
              <div className="card py-10 text-center">
                <Clock size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No active predictions right now</p>
                <p className="text-gray-500 text-sm mt-1">
                  Check back when matches open
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {openMatches.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    userChoice={getPredictionForMatch(match._id)}
                    onPredict={handlePredict}
                    isPredicting={predictingId === match._id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcomingMatches.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Swords size={18} className="text-blue-400" />
                Upcoming Matches
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    showPollLink={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — leaderboard preview & recent */}
        <div className="space-y-6">
          {/* Mini leaderboard */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                Top Predictors
              </h2>
              <Link
                to="/leaderboard"
                className="text-xs text-green-400 hover:text-green-300"
              >
                Full table →
              </Link>
            </div>

            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry) => {
                const isMe = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isMe ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-gray-500 w-5">
                        #{entry.rank}
                      </span>
                      <span className={`text-sm font-medium truncate max-w-[120px] ${isMe ? 'text-green-400' : 'text-white'}`}>
                        {entry.name}
                        {isMe && <span className="ml-1 text-xs">(you)</span>}
                      </span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm flex-shrink-0">
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FIFA Live Results */}
          <FifaResults />

          {/* Recent correct predictions */}
          {completedMatches.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" />
                Recent Results
              </h2>
              <div className="space-y-2">
                {completedMatches.slice(-4).reverse().map((match) => {
                  const myPred = getPredictionForMatch(match._id);
                  const isCorrect = myPred && match.result ? myPred === match.result : null;
                  return (
                    <div key={match._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm text-white font-medium">
                          {match.teamA.flag} vs {match.teamB.flag}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(match.matchDate), 'MMM d')}
                        </p>
                      </div>
                      {isCorrect !== null && (
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            isCorrect
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {isCorrect ? '✅ +pts' : '❌ 0'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
