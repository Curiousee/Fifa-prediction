import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Trophy,
  Target,
  CheckCircle2,
  Plus,
  ChevronRight,
  Swords,
} from 'lucide-react';
import { adminAPI, matchAPI } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { SUPER_ADMIN_EMAIL } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCardGrid from '../../components/ui/StatCard';
import { getMatchResultLabel } from '../../utils/match-result';
import type { AdminStats, Match } from '../../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
  const { user: me } = useAuth();
  const canDeclareResults = me?.email === SUPER_ADMIN_EMAIL || me?.canChangeScores;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [declaringId, setDeclaringId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, matchRes] = await Promise.all([
          adminAPI.getStats(),
          matchAPI.getAll(),
        ]);
        setStats(statsRes.data as AdminStats);
        setMatches(matchRes.data as Match[]);
      } catch {
        toast.error('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleDeclareResult = async (matchId: string, result: string) => {
    setDeclaringId(matchId);
    try {
      await matchAPI.declareResult(matchId, result);
      toast.success('Result declared & points awarded! 🏆');
      const res = await matchAPI.getAll();
      setMatches(res.data as Match[]);
    } catch {
      toast.error('Failed to declare result');
    } finally {
      setDeclaringId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  const pendingMatches = matches.filter(
    (m) => m.status === 'closed' || m.status === 'open'
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Shield size={28} className="text-green-400" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage matches, users, and points</p>
        </div>
        <Link to="/admin/create-match" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          New Match
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <StatCardGrid
          items={[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Total Matches', value: stats.totalMatches, icon: Swords, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Predictions Made', value: stats.totalPredictions, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Completed Matches', value: stats.completedMatches, icon: CheckCircle2, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ]}
        />
      )}

      {/* Quick Nav */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            to: '/admin/create-match',
            icon: Plus,
            label: 'Create Match',
            desc: 'Add a new prediction match',
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            to: '/admin/users',
            icon: Users,
            label: 'Manage Users',
            desc: 'View all participants',
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            to: '/admin/points',
            icon: Trophy,
            label: 'Adjust Points',
            desc: 'Manual point adjustments',
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
          },
        ].map(({ to, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card-hover flex items-center gap-4"
          >
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white">{label}</div>
              <div className="text-gray-400 text-sm truncate">{desc}</div>
            </div>
            <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Declare Results — only for roshan or users with score access */}
      {!canDeclareResults && (
        <div className="card mb-6 border border-yellow-500/20 bg-yellow-500/5 text-center py-6">
          <p className="text-yellow-400 text-sm font-semibold">🔒 Score declaration is restricted to authorized users only.</p>
        </div>
      )}
      <div className={`card ${!canDeclareResults ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-yellow-400" />
          Declare Match Results
        </h2>

        {pendingMatches.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No matches awaiting results</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMatches.map((match) => (
              <div
                key={match._id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-500">Match #{match.matchNumber}</span>
                      <span className={match.status === 'open' ? 'badge-open' : 'badge-closed'}>
                        {match.status}
                      </span>
                    </div>
                    <div className="font-bold text-white">
                      {match.teamA.flag} {match.teamA.name} vs {match.teamB.flag} {match.teamB.name}
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">
                      {format(new Date(match.matchDate), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDeclareResult(match._id, 'teamA')}
                      disabled={declaringId === match._id}
                      className="px-3 py-1.5 bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {match.teamA.flag} {match.teamA.name} Win
                    </button>
                    <button
                      onClick={() => handleDeclareResult(match._id, 'draw')}
                      disabled={declaringId === match._id}
                      className="px-3 py-1.5 bg-yellow-600/20 border border-yellow-600/40 hover:bg-yellow-600/30 text-yellow-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      🤝 Draw
                    </button>
                    <button
                      onClick={() => handleDeclareResult(match._id, 'teamB')}
                      disabled={declaringId === match._id}
                      className="px-3 py-1.5 bg-green-600/20 border border-green-600/40 hover:bg-green-600/30 text-green-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {match.teamB.flag} {match.teamB.name} Win
                    </button>
                  </div>
                </div>

                {declaringId === match._id && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Awarding points...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All matches list */}
      <div className="card mt-6">
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Swords size={20} className="text-green-400" />
          All Matches
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="text-left py-2 pr-4">#</th>
                <th className="text-left py-2 pr-4">Match</th>
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Status</th>
                <th className="text-left py-2">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {matches.map((match) => (
                <tr key={match._id} className="hover:bg-gray-800/30">
                  <td className="py-3 pr-4 text-gray-500 font-mono">{match.matchNumber}</td>
                  <td className="py-3 pr-4 font-medium text-white">
                    {match.teamA.flag} {match.teamA.name} vs {match.teamB.flag} {match.teamB.name}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
                    {format(new Date(match.matchDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`badge-${match.status}`}>{match.status}</span>
                  </td>
                  <td className="py-3 text-gray-300 text-xs">
                    {getMatchResultLabel(match) ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
