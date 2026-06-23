import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Trophy, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import type { Match, PredictionChoice } from '../../types';
import MatchComments from '../MatchComments';

interface MatchCardProps {
  match: Match;
  userChoice?: PredictionChoice | null;
  onPredict?: (matchId: string, choice: PredictionChoice) => void;
  isPredicting?: boolean;
  showPollLink?: boolean;
  showComments?: boolean;
}

const statusConfig = {
  upcoming: { label: 'Upcoming', className: 'badge-upcoming' },
  open: { label: '\u{1F7E2} Open', className: 'badge-open' },
  closed: { label: 'Closed', className: 'badge-closed' },
  completed: { label: 'Completed', className: 'badge-completed' },
};

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  userChoice,
  onPredict,
  isPredicting = false,
  showPollLink = true,
  showComments = true,
}) => {
  const statusCfg = statusConfig[match.status];

  const getResultLabel = () => {
    if (!match.result) return null;
    if (match.result === 'teamA') return `${match.teamA.flag} ${match.teamA.name} Win`;
    if (match.result === 'teamB') return `${match.teamB.flag} ${match.teamB.name} Win`;
    return 'Draw';
  };

  const isCorrect =
    userChoice && match.result ? userChoice === match.result : null;

  const choiceOptions: { choice: PredictionChoice; label: string }[] = [
    {
      choice: 'teamA',
      label: `${match.teamA.flag} ${match.teamA.name} Win`,
    },
    { choice: 'draw', label: 'ðŸ¤ Draw' },
    {
      choice: 'teamB',
      label: `${match.teamB.flag} ${match.teamB.name} Win`,
    },
  ];

  return (
    <div className="card-hover animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Match #{match.matchNumber}
        </span>
        <span className={statusCfg.className}>{statusCfg.label}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 py-4">
        {/* Team A */}
        <div className="flex-1 text-center">
          <div className="text-4xl mb-2">{match.teamA.flag}</div>
          <div className="font-bold text-white text-sm sm:text-base leading-tight">
            {match.teamA.name}
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-sm text-gray-400">
            VS
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={11} />
            {format(new Date(match.matchDate), 'MMM d')}
          </div>
        </div>

        {/* Team B */}
        <div className="flex-1 text-center">
          <div className="text-4xl mb-2">{match.teamB.flag}</div>
          <div className="font-bold text-white text-sm sm:text-base leading-tight">
            {match.teamB.name}
          </div>
        </div>
      </div>

      {/* Result Banner */}
      {match.status === 'completed' && match.result && (
        <div className="mb-4 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy size={15} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm">
              Result: {getResultLabel()}
            </span>
          </div>
          {userChoice && (
            <div
              className={`mt-1 text-xs font-semibold ${
                isCorrect ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {isCorrect ? 'âœ… Correct prediction!' : 'âŒ Incorrect prediction'}
            </div>
          )}
        </div>
      )}

      {/* Prediction Section */}
      {match.status === 'open' && !userChoice && onPredict && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">
            Choose your prediction
          </p>
          <div className="flex flex-col gap-2">
            {choiceOptions.map(({ choice, label }) => (
              <button
                key={choice}
                onClick={() => onPredict(match._id, choice)}
                disabled={isPredicting}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 hover:border-green-500/60 hover:bg-green-500/10 hover:text-white transition-all text-sm font-medium disabled:opacity-50 active:scale-98"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already Predicted */}
      {userChoice && match.status !== 'completed' && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/25 rounded-xl">
          <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
          <span className="text-green-400 text-sm font-medium">
            Your prediction:{' '}
            {choiceOptions.find((o) => o.choice === userChoice)?.label}
          </span>
        </div>
      )}

      {/* Closed */}
      {match.status === 'closed' && !userChoice && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <Lock size={15} className="text-gray-500 flex-shrink-0" />
          <span className="text-gray-500 text-sm">Predictions closed</span>
        </div>
      )}

      {/* Prediction Timing Info */}
      {match.status === 'upcoming' && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/25 rounded-xl">
          <Clock size={15} className="text-blue-400 flex-shrink-0" />
          <span className="text-blue-400 text-sm">
            Opens {format(new Date(match.predictionStart), 'MMM d, h:mm a')}
          </span>
        </div>
      )}

      {match.status === 'open' && (
        <div className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500">
          <Clock size={11} />
          Closes {format(new Date(match.predictionEnd), 'MMM d, h:mm a')}
        </div>
      )}

      {/* Match Discussion */}
      {showComments && (
        <MatchComments
          matchId={match._id}
          matchLabel={`${match.teamA.flag} ${match.teamA.name} vs ${match.teamB.flag} ${match.teamB.name}`}
        />
      )}

      {/* Poll Link */}
      {showPollLink && (match.status === 'closed' || match.status === 'completed') && (
        <Link
          to={`/matches/${match._id}/poll`}
          className="mt-3 flex items-center justify-center gap-1.5 text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
        >
          View community predictions <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
};

export default MatchCard;


