import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Globe } from 'lucide-react';

interface ESPNTeam {
  displayName: string;
  abbreviation: string;
  logo?: string;
}

interface ESPNCompetitor {
  team: ESPNTeam;
  score: string;
  winner?: boolean;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: { state: string; description: string; completed: boolean };
    displayClock?: string;
  };
  competitions: Array<{ competitors: ESPNCompetitor[] }>;
}

interface ESPNResponse {
  events?: ESPNEvent[];
}

const COMPETITIONS = [
  { code: 'eng.1', name: 'Premier League' },
  { code: 'esp.1', name: 'La Liga' },
  { code: 'ita.1', name: 'Serie A' },
  { code: 'ger.1', name: 'Bundesliga' },
  { code: 'fra.1', name: 'Ligue 1' },
  { code: 'uefa.champions', name: 'Champions League' },
];

const FootballResults: React.FC = () => {
  const [events, setEvents] = useState<Array<ESPNEvent & { competitionName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMatches = async () => {
      const today = new Date();
      const future = new Date(today);
      future.setDate(future.getDate() + 7);
      const fmt = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');

      const results = await Promise.allSettled(
        COMPETITIONS.map(async ({ code, name }) => {
          const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${code}/scoreboard?dates=${fmt(today)}-${fmt(future)}&limit=30`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Scoreboard request failed: ${response.status}`);
          const data = (await response.json()) as ESPNResponse;
          return (data.events ?? []).map((event) => ({ ...event, competitionName: name }));
        })
      );

      if (cancelled) return;
      const successful = results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value : []
      );
      setEvents(successful.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setError(successful.length === 0);
      setLoading(false);
    };

    fetchMatches().catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const live = events.filter((event) => event.status.type.state === 'in');
  const upcoming = events
    .filter((event) => event.status.type.state === 'pre')
    .slice(0, 5);
  const completed = events
    .filter((event) => event.status.type.state === 'post')
    .slice(-5)
    .reverse();

  const renderMatch = (event: ESPNEvent & { competitionName: string }) => {
    const [home, away] = event.competitions?.[0]?.competitors ?? [];
    if (!home || !away) return null;
    const state = event.status.type.state;

    return (
      <div key={`${event.competitionName}-${event.id}`} className="py-2 border-b border-gray-800 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {home.team.logo && <img src={home.team.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
            <span className={`text-sm font-medium truncate ${home.winner ? 'text-white' : 'text-gray-400'}`}>{home.team.abbreviation}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 text-center">
            {state === 'post' || state === 'in' ? (
              <>
                <span className={`text-sm font-bold w-4 text-right ${home.winner ? 'text-white' : 'text-gray-400'}`}>{home.score}</span>
                <span className="text-gray-600 text-xs">-</span>
                <span className={`text-sm font-bold w-4 text-left ${away.winner ? 'text-white' : 'text-gray-400'}`}>{away.score}</span>
                {state === 'in' && <span className="text-xs text-green-400 animate-pulse ml-1">{event.status.displayClock ?? 'LIVE'}</span>}
              </>
            ) : (
              <span className="text-xs text-gray-500">{format(new Date(event.date), 'HH:mm')}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            <span className={`text-sm font-medium truncate text-right ${away.winner ? 'text-white' : 'text-gray-400'}`}>{away.team.abbreviation}</span>
            {away.team.logo && <img src={away.team.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />}
          </div>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">{event.competitionName} · {format(new Date(event.date), 'EEE, MMM d')}</p>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe size={16} className="text-green-400" /> Football across the leagues
        </h2>
        <span className="text-xs text-gray-500">via ESPN</span>
      </div>
      {loading && <p className="text-center py-6 text-gray-500 text-sm">Loading league fixtures...</p>}
      {!loading && error && <p className="text-center py-6 text-gray-500 text-sm">Live league data is unavailable right now. Your community fixtures are still available.</p>}
      {!loading && !error && (
        <div className="space-y-4">
          {live.length > 0 && <section><p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">Live</p>{live.map(renderMatch)}</section>}
          {upcoming.length > 0 && <section><p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">Coming up</p>{upcoming.map(renderMatch)}</section>}
          {completed.length > 0 && <section><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent results</p>{completed.map(renderMatch)}</section>}
          {events.length === 0 && <p className="text-center py-4 text-gray-500 text-sm">No major league fixtures in this window.</p>}
        </div>
      )}
    </div>
  );
};

export default FootballResults;
