import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Trophy, TrendingUp, Target, CheckCircle2, Clock, ChevronRight, Swords, Globe } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { matchAPI, predictionAPI, leaderboardAPI } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCardGrid from '../components/ui/StatCard';
import MatchCard from '../components/match/MatchCard';
import FootballResults from '../components/FifaResults';
import { usePredictions } from '../hooks/usePredictions';
import type { Match, Prediction, LeaderboardEntry } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const { myPredictions, setMyPredictions, predictingId, handlePredict, getPredictionForMatch } = usePredictions();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const myRank = leaderboard.find((entry) => entry.id === user?.id)?.rank;

  const loadData = useCallback(async () => {
    try {
      const [matchRes, predictionRes, leaderboardRes] = await Promise.all([
        matchAPI.getAll(), predictionAPI.getMy(), leaderboardAPI.get(),
      ]);
      setMatches(matchRes.data as Match[]);
      setMyPredictions(predictionRes.data as Prediction[]);
      setLeaderboard(leaderboardRes.data as LeaderboardEntry[]);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [setMyPredictions]);

  useEffect(() => { void loadData(); }, [loadData]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading your dashboard..." /></div>;

  const openMatches = matches.filter((match) => match.status === 'open');
  const upcomingMatches = matches.filter((match) => match.status === 'upcoming').slice(0, 4);
  const completedMatches = matches.filter((match) => match.status === 'completed').slice(-4).reverse();
  const correctPredictions = myPredictions.filter((prediction) => prediction.isCorrect === true).length;
  const competitions = Array.from(new Set(matches.map((match) => match.competition || 'International'))).slice(0, 6);

  return (
    <div className="page-container">
      <header className="mb-8 animate-fade-in">
        <p className="text-green-400 text-sm font-semibold uppercase tracking-wider">Your season, your picks</p>
        <h1 className="text-3xl font-black text-white mt-1">Welcome back, {user?.name?.split(' ')[0]}! ⚽</h1>
        <p className="text-gray-400 mt-1">Follow the fixtures and keep your community streak going.</p>
      </header>

      <StatCardGrid items={[
        { label: 'Total Points', value: user?.points?.toLocaleString() ?? '0', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
        { label: 'Leaderboard Rank', value: myRank ? `#${myRank}` : '—', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
        { label: 'Predictions Made', value: String(myPredictions.length), icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'Correct Picks', value: String(correctPredictions), icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
      ]} />

      <section className="card mt-6 mb-6">
        <div className="flex items-center gap-2 mb-3"><Globe size={17} className="text-green-400" /><h2 className="text-lg font-bold text-white">Competitions on your board</h2></div>
        {competitions.length ? <div className="flex flex-wrap gap-2">{competitions.map((competition) => <Link key={competition} to="/matches" className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300 hover:bg-green-500/20">{competition}</Link>)}</div> : <p className="text-sm text-gray-500">Featured competitions will appear here as fixtures are added.</p>}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white flex items-center gap-2"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />Open for predictions</h2><Link to="/matches" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">All fixtures <ChevronRight size={14} /></Link></div>
            {openMatches.length ? <div className="grid sm:grid-cols-2 gap-4">{openMatches.slice(0, 4).map((match) => <MatchCard key={match._id} match={match} userChoice={getPredictionForMatch(match._id)} onPredict={handlePredict} isPredicting={predictingId === match._id} />)}</div> : <div className="card py-10 text-center"><Clock size={30} className="text-gray-600 mx-auto mb-3" /><p className="text-gray-300 font-medium">No fixtures are open right now</p><p className="text-gray-500 text-sm mt-1">Browse upcoming fixtures or check back before kick-off.</p><Link to="/matches" className="inline-flex mt-4 text-green-400 text-sm">Browse fixtures <ChevronRight size={14} /></Link></div>}
          </section>
          {upcomingMatches.length > 0 && <section><h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Swords size={18} className="text-blue-400" />Coming up next</h2><div className="grid sm:grid-cols-2 gap-4">{upcomingMatches.map((match) => <MatchCard key={match._id} match={match} showPollLink={false} />)}</div></section>}
        </div>

        <aside className="space-y-6">
          <section className="card"><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-white flex items-center gap-2"><Trophy size={16} className="text-yellow-400" />Community leaders</h2><Link to="/leaderboard" className="text-xs text-green-400">Full table →</Link></div>{leaderboard.length ? <div className="space-y-2">{leaderboard.slice(0, 5).map((entry) => <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${entry.id === user?.id ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800/50'}`}><span className="text-sm text-white truncate">#{entry.rank} {entry.name}{entry.id === user?.id ? ' (you)' : ''}</span><span className="text-yellow-400 font-bold text-sm">{entry.points.toLocaleString()}</span></div>)}</div> : <p className="text-sm text-gray-500">The leaderboard will grow as the community makes predictions.</p>}</section>
          <FootballResults />
          {completedMatches.length > 0 && <section className="card"><h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><CheckCircle2 size={16} className="text-green-400" />Recent results</h2>{completedMatches.map((match) => { const choice = getPredictionForMatch(match._id); const correct = choice && match.result ? choice === match.result : null; return <div key={match._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"><div><p className="text-sm text-white">{match.teamA.name} vs {match.teamB.name}</p><p className="text-xs text-gray-500">{match.competition || 'International'} · {format(new Date(match.matchDate), 'MMM d')}</p></div>{correct !== null && <span className={`text-xs font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>{correct ? 'Correct' : 'Missed'}</span>}</div>; })}</section>}
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
