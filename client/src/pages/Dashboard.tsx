import React, { useEffect, useState, useCallback } from 'react';
import { Swords } from 'lucide-react';
import { matchAPI, predictionAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SearchInput from '../components/ui/SearchInput';
import MatchCard from '../components/match/MatchCard';
import { usePredictions } from '../hooks/usePredictions';
import type { Match, Prediction } from '../types';
import toast from 'react-hot-toast';

type FilterStatus = 'all' | 'open' | 'upcoming' | 'closed' | 'completed';

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const { setMyPredictions, predictingId, handlePredict, getPredictionForMatch } = usePredictions();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [competitionFilter, setCompetitionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        matchAPI.getAll(),
        predictionAPI.getMy(),
      ]);
      setMatches(mRes.data as Match[]);
      setMyPredictions(pRes.data as Prediction[]);
    } catch {
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const competitionOptions = Array.from(
    new Set(matches.map((m) => m.competition || 'International'))
  ).sort();

  const filtered = matches
    .filter((m) => filter === 'all' || m.status === filter)
    .filter((m) => {
      const competition = m.competition || 'International';
      return competitionFilter === 'all' || competition === competitionFilter;
    })
    .filter((m) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        m.teamA.name.toLowerCase().includes(q) ||
        m.teamB.name.toLowerCase().includes(q) ||
        (m.competition || 'International').toLowerCase().includes(q)
      );
    });

  const statusCounts: Record<FilterStatus, number> = {
    all: matches.length,
    open: matches.filter((m) => m.status === 'open').length,
    upcoming: matches.filter((m) => m.status === 'upcoming').length,
    closed: matches.filter((m) => m.status === 'closed').length,
    completed: matches.filter((m) => m.status === 'completed').length,
  };

  const filterOptions: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: '🟢 Open' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'closed', label: 'Closed' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Swords size={28} className="text-green-400" />
            All Matches
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {matches.length} total fixtures across the football season
          </p>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search teams or competitions..." />
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {filterOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === key
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600'
            }`}
          >
            {label}
            {statusCounts[key] > 0 && (
              <span
                className={`ml-1.5 text-xs ${
                  filter === key ? 'text-green-100' : 'text-gray-500'
                }`}
              >
                ({statusCounts[key]})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Competitions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCompetitionFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              competitionFilter === 'all'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600'
            }`}
          >
            All
          </button>
          {competitionOptions.map((option) => (
            <button
              key={option}
              onClick={() => setCompetitionFilter(option)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                competitionFilter === option
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading fixtures..." />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Swords size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No matches found</p>
          {(search || competitionFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setCompetitionFilter('all');
              }}
              className="text-green-400 text-sm mt-2 hover:text-green-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((match) => (
            <MatchCard
              key={match._id}
              match={match}
              userChoice={getPredictionForMatch(match._id)}
              onPredict={match.status === 'open' ? handlePredict : undefined}
              isPredicting={predictingId === match._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;
