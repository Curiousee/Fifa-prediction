import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Users, Trophy } from 'lucide-react';
import { predictionAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Match, PollResult } from '../types';

interface PollData {
  match: Match;
  total: number;
  results: PollResult[];
}

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6'];

const PollResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PollData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await predictionAPI.getPollResults(id);
        setData(res.data as PollData);
      } catch {
        setError('Failed to load poll results.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (isLoading) return <LoadingSpinner size="lg" text="Loading poll results..." />;

  if (error || !data) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-red-400">{error || 'Match not found.'}</p>
        <Link to="/matches" className="btn-secondary mt-4 inline-block">
          Back to Matches
        </Link>
      </div>
    );
  }

  const { match, total, results } = data;

  const chartData = results.map((r) => ({
    name: r.label,
    value: r.count,
    percentage: r.percentage,
  }));

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; payload: { percentage: number } }[];
  }) => {
    if (active && payload && payload.length > 0) {
      const item = payload[0];
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
          <p className="text-white font-bold text-sm">{item.name}</p>
          <p className="text-green-400 text-sm">
            {item.payload.percentage}% ({item.value} votes)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container max-w-3xl">
      {/* Back */}
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Matches
      </Link>

      {/* Match Header */}
      <div className="card mb-6 text-center animate-fade-in">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
          Match #{match.matchNumber} — Community Poll
        </p>

        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl mb-2">{match.teamA.flag}</div>
            <div className="font-bold text-white text-lg">{match.teamA.name}</div>
          </div>
          <div className="text-gray-500 font-black text-2xl">VS</div>
          <div className="text-center">
            <div className="text-5xl mb-2">{match.teamB.flag}</div>
            <div className="font-bold text-white text-lg">{match.teamB.name}</div>
          </div>
        </div>

        {match.result && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/25 rounded-xl">
            <Trophy size={15} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              Final Result:{' '}
              {match.result === 'teamA'
                ? `${match.teamA.flag} ${match.teamA.name} Win`
                : match.result === 'teamB'
                ? `${match.teamB.flag} ${match.teamB.name} Win`
                : 'Draw'}
            </span>
          </div>
        )}
      </div>

      {/* Total Responses */}
      <div className="flex items-center justify-center gap-2 mb-6 text-gray-400">
        <Users size={16} />
        <span className="text-sm font-medium">
          {total} {total === 1 ? 'response' : 'responses'}
        </span>
      </div>

      {total === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400">No predictions submitted yet.</p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="card mb-6 animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-6 text-center">
              Prediction Distribution
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, percentage }) =>
                      `${name}: ${percentage}%`
                    }
                    labelLine={{ stroke: '#6b7280' }}
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-gray-300 text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar breakdown */}
          <div className="card animate-fade-in">
            <h2 className="text-lg font-bold text-white mb-5">
              Breakdown
            </h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={result.choice}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">
                      {result.label}
                    </span>
                    <span className="text-sm font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                      {result.percentage}%{' '}
                      <span className="text-gray-500 font-normal">
                        ({result.count})
                      </span>
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${result.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  {match.result && (
                    <div className="mt-1">
                      {result.choice === match.result ? (
                        <span className="text-xs text-green-400">✅ Correct answer</span>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PollResultPage;
