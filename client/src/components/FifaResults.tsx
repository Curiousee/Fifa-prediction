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

const FifaResults: React.FC = () => {
  const [events, setEvents] = useState<ESPNEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const today = new Date();
        const start = new Date('2026-06-11');
        const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmt(start)}-${fmt(today)}&limit=50`;

        const res = await fetch(url);
        const json = await res.json();
        const all: ESPNEvent[] = json.events || [];
        all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEvents(all);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const completed = events.filter(e => e.status.type.state === 'post');
  const live = events.filter(e => e.status.type.state === 'in');
  const upcoming = events.filter(e => e.status.type.state === 'pre').slice(0, 3);

  const renderMatch = (event: ESPNEvent) => {
    const [home, away] = event.competitions?.[0]?.competitors ?? [];
    if (!home || !away) return null;
    const state = event.status.type.state;

    return (
      <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 gap-2">
        {/* Home */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {home.team.logo && (
            <img src={home.team.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
          )}
          <span className={`text-sm font-medium truncate ${home.winner ? 'text-white' : 'text-gray-400'}`}>
            {home.team.abbreviation}
          </span>
        </div>

        {/* Score / time */}
        <div className="flex items-center gap-1 flex-shrink-0 text-center">
          {state === 'post' || state === 'in' ? (
            <>
              <span className={`text-sm font-bold w-4 text-right ${home.winner ? 'text-white' : 'text-gray-400'}`}>
                {home.score}
              </span>
              <span className="text-gray-600 text-xs">-</span>
              <span className={`text-sm font-bold w-4 text-left ${away.winner ? 'text-white' : 'text-gray-400'}`}>
                {away.score}
              </span>
              {state === 'in' && (
                <span className="text-xs text-green-400 animate-pulse ml-1">
                  {event.status.displayClock ?? 'LIVE'}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500 w-14 text-center">
              {format(new Date(event.date), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span className={`text-sm font-medium truncate text-right ${away.winner ? 'text-white' : 'text-gray-400'}`}>
            {away.team.abbreviation}
          </span>
          {away.team.logo && (
            <img src={away.team.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe size={16} className="text-green-400" />
          FIFA World Cup 2026
        </h2>
        <span className="text-xs text-gray-500">via ESPN</span>
      </div>

      {loading && (
        <p className="text-center py-6 text-gray-500 text-sm">Loading results...</p>
      )}

      {error && (
        <p className="text-center py-6 text-gray-500 text-sm">
          Could not load results. Check your connection.
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-center py-6 text-gray-500 text-sm">No matches found.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-4">
          {live.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                Live
              </p>
              {live.map(renderMatch)}
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">Upcoming</p>
              {upcoming.map(e => (
                <div key={e.id}>
                  <p className="text-xs text-gray-500 mb-0.5">
                    {format(new Date(e.date), 'MMM d, HH:mm')}
                  </p>
                  {renderMatch(e)}
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent Results</p>
              {completed.slice(0, 8).map(renderMatch)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FifaResults;
