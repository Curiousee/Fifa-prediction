import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, TrendingUp, Star, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { leaderboardAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { LeaderboardEntry, DailyLeaderboardEntry } from '../types';

const MEDALS = ['🥇', '🥈', '🥉'];
type Tab = 'overall' | 'daily';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();

  // Overall
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [overallLoading, setOverallLoading] = useState(true);

  // Daily
  const [tab, setTab] = useState<Tab>('overall');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dailyEntries, setDailyEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [datesLoading, setDatesLoading] = useState(false);
  const [tz, setTz] = useState<'ist' | 'utc'>('ist');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await leaderboardAPI.get();
        setEntries(res.data as LeaderboardEntry[]);
      } finally {
        setOverallLoading(false);
      }
    };
    load();
  }, []);

  // Load available dates when Daily tab first opened
  useEffect(() => {
    if (tab !== 'daily' || availableDates.length > 0) return;
    const load = async () => {
      setDatesLoading(true);
      try {
        const res = await leaderboardAPI.getDates();
        const dates: string[] = (res.data as { dates: string[] }).dates;
        setAvailableDates(dates);
        if (dates.length > 0) setSelectedDate(dates[0]);
      } finally {
        setDatesLoading(false);
      }
    };
    load();
  }, [tab, availableDates.length]);

  const loadDaily = useCallback(async (date: string) => {
    if (!date) return;
    setDailyLoading(true);
    setDailyEntries([]);
    try {
      const res = await leaderboardAPI.getDaily(date);
      setDailyEntries(res.data as DailyLeaderboardEntry[]);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'daily' && selectedDate) loadDaily(selectedDate);
  }, [tab, selectedDate, loadDaily]);

  const formatPickTime = (dateStr: string) => {
    const utcMs = new Date(dateStr).getTime();
    const offsetMs = tz === 'ist' ? 5.5 * 60 * 60 * 1000 : 0;
    const d = new Date(utcMs + offsetMs);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const hh = d.getUTCHours().toString().padStart(2, '0');
    const mm = d.getUTCMinutes().toString().padStart(2, '0');
    const ss = d.getUTCSeconds().toString().padStart(2, '0');
    return months[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + hh + ':' + mm + ':' + ss;
  };

  const myEntry = user ? entries.find((e) => e.id === user.id) : null;

  return (
    <div className="page-container max-w-3xl">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/15 rounded-2xl mb-4">
          <Trophy size={32} className="text-yellow-400" />
        </div>
        <h1 className="section-title mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top predictors ranked by points</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-900 p-1 rounded-xl border border-gray-800">
        <button
          onClick={() => setTab('overall')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'overall'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Overall
        </button>
        <button
          onClick={() => setTab('daily')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'daily'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Calendar size={13} />
          Daily
        </button>
      </div>

      {/* ── OVERALL TAB ── */}
      {tab === 'overall' && (
        <>
          {user && myEntry && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/30 rounded-full flex items-center justify-center font-black text-green-400">
                  #{myEntry.rank}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Your Position</p>
                  <p className="text-gray-400 text-xs">{myEntry.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-400 font-black text-lg">
                <Star size={16} />
                {myEntry.points.toLocaleString()} pts
              </div>
            </div>
          )}

          {!user && (
            <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-2xl text-center">
              <p className="text-gray-400 text-sm">
                <Link to="/login" className="text-green-400 font-semibold hover:text-green-300">Sign in</Link>{' '}
                to see your rank highlighted
              </p>
            </div>
          )}

          {overallLoading ? (
            <LoadingSpinner size="lg" text="Loading leaderboard..." />
          ) : entries.length === 0 ? (
            <div className="card text-center py-16">
              <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No rankings yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.length >= 3 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[1, 0, 2].map((idx) => {
                    const entry = entries[idx];
                    if (!entry) return null;
                    const isMe = entry.id === user?.id;
                    const podiumHeight = idx === 0 ? 'h-28' : idx === 1 ? 'h-36' : 'h-24';
                    return (
                      <div
                        key={entry.id}
                        className={`flex flex-col items-center justify-end ${podiumHeight} bg-gray-900 border-2 ${
                          isMe ? 'border-green-500' : 'border-gray-700'
                        } rounded-2xl pb-3 px-2 transition-all`}
                      >
                        <span className="text-2xl">{MEDALS[entry.rank - 1]}</span>
                        <div className="font-bold text-white text-xs text-center truncate w-full px-1 mt-1">
                          {entry.name}
                        </div>
                        <div className="text-yellow-400 font-black text-sm">{entry.points.toLocaleString()}</div>
                        <div className="text-gray-500 text-xs">pts</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Rank &amp; Player</span>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setTz((t) => t === 'ist' ? 'utc' : 'ist')}
                      className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 hover:border-blue-500/50 hover:text-blue-400 transition-all"
                      title="Toggle timezone"
                    >
                      Last Pick <span className="ml-1 text-blue-400">{tz.toUpperCase()}</span>
                    </button>
                    <span>Points</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-800/60">
                  {entries.map((entry) => {
                    const isMe = entry.id === user?.id;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                          isMe ? 'bg-green-500/8 border-l-2 border-green-500' : 'hover:bg-white/3'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                            entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.rank === 2 ? 'bg-gray-400/20 text-gray-300'
                            : entry.rank === 3 ? 'bg-orange-700/20 text-orange-400'
                            : 'bg-gray-800 text-gray-400'
                          }`}>
                            {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm ${isMe ? 'text-green-400' : 'text-white'}`}>
                                {entry.name}
                              </span>
                              {isMe && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">You</span>
                              )}
                            </div>
                            {entry.lastPredictionAt && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                                <Clock size={10} />
                                <span>{formatPickTime(entry.lastPredictionAt)} {tz.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6">

                          <div className="flex items-center gap-1.5">
                            <Medal size={13} className="text-yellow-500" />
                            <span className="font-black text-white text-sm">{entry.points.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DAILY TAB ── */}
      {tab === 'daily' && (
        <div className="space-y-4">
          {datesLoading ? (
            <LoadingSpinner size="md" text="Loading available days..." />
          ) : availableDates.length === 0 ? (
            <div className="card text-center py-16">
              <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No match days yet.</p>
            </div>
          ) : (
            <>
              {/* Date selector */}
              <div className="flex flex-wrap gap-2">
                {availableDates.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedDate === d
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {format(new Date(d + 'T12:00:00Z'), 'MMM d, yyyy')}
                  </button>
                ))}
              </div>

              {/* Daily ranking */}
              {dailyLoading ? (
                <LoadingSpinner size="md" text="Loading daily rankings..." />
              ) : dailyEntries.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-400 text-sm">No correct predictions scored for this day yet.</p>
                </div>
              ) : (
                <div className="card p-0 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rank &amp; Player</span>
                    <div className="flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span className="hidden sm:block">Correct Picks</span>
                      <span>Day Pts</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-800/60">
                    {dailyEntries.map((entry) => {
                      const isMe = entry.id === user?.id;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                            isMe ? 'bg-green-500/8 border-l-2 border-green-500' : 'hover:bg-white/3'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                              entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400'
                              : entry.rank === 2 ? 'bg-gray-400/20 text-gray-300'
                              : entry.rank === 3 ? 'bg-orange-700/20 text-orange-400'
                              : 'bg-gray-800 text-gray-400'
                            }`}>
                              {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm ${isMe ? 'text-green-400' : 'text-white'}`}>
                                {entry.name}
                              </span>
                              {isMe && (
                                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">You</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                              <CheckCircle2 size={11} className="text-green-500" />
                              {entry.correctPicks} correct
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Medal size={13} className="text-yellow-500" />
                              <span className="font-black text-white text-sm">{entry.points}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
