import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Info, Zap, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { matchAPI } from '../../services/api';
import toast from 'react-hot-toast';

const COMMON_FLAGS = [
  '🇧🇷', '🇩🇪', '🇫🇷', '🇦🇷', '🇪🇸', '🇵🇹', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇳🇱',
  '🇮🇹', '🇧🇪', '🇺🇸', '🇲🇽', '🇯🇵', '🇰🇷', '🇸🇦', '🇦🇺',
  '🇨🇦', '🇲🇦', '🇸🇳', '🇬🇭', '🇨🇲', '🇹🇳', '🇪🇨', '🇺🇾',
  '🇨🇷', '🇵🇱', '🇨🇭', '🇩🇰', '🇿🇦', '🇵🇭', '🇮🇷', '🇳🇿',
];

// Country name / abbreviation → flag emoji
const FLAG_MAP: Record<string, string> = {
  Brazil: '🇧🇷', Germany: '🇩🇪', France: '🇫🇷', Argentina: '🇦🇷',
  Spain: '🇪🇸', Portugal: '🇵🇹', England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Netherlands: '🇳🇱',
  Italy: '🇮🇹', Belgium: '🇧🇪', USA: '🇺🇸', 'United States': '🇺🇸',
  Mexico: '🇲🇽', Japan: '🇯🇵', 'South Korea': '🇰🇷', 'Saudi Arabia': '🇸🇦',
  Australia: '🇦🇺', Canada: '🇨🇦', Morocco: '🇲🇦', Senegal: '🇸🇳',
  Ghana: '🇬🇭', Cameroon: '🇨🇲', Tunisia: '🇹🇳', Ecuador: '🇪🇨',
  Uruguay: '🇺🇾', 'Costa Rica': '🇨🇷', Poland: '🇵🇱', Switzerland: '🇨🇭',
  Denmark: '🇩🇰', 'South Africa': '🇿🇦', Iran: '🇮🇷', 'New Zealand': '🇳🇿',
  Egypt: '🇪🇬', 'Cabo Verde': '🇨🇻', Sweden: '🇸🇪', Croatia: '🇭🇷',
  Serbia: '🇷🇸', Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Ukraine: '🇺🇦',
  Colombia: '🇨🇴', Chile: '🇨🇱', Paraguay: '🇵🇾', Bolivia: '🇧🇴',
  Peru: '🇵🇪', Venezuela: '🇻🇪', Panama: '🇵🇦', Honduras: '🇭🇳',
  'El Salvador': '🇸🇻', Jamaica: '🇯🇲', Cuba: '🇨🇺', Haiti: '🇭🇹',
  Nigeria: '🇳🇬', Algeria: '🇩🇿', Ivory: '🇨🇮', "Côte d'Ivoire": '🇨🇮',
  'DR Congo': '🇨🇩', Zambia: '🇿🇲', Angola: '🇦🇴', Kenya: '🇰🇪',
  Iraq: '🇮🇶', Norway: '🇳🇴', Slovakia: '🇸🇰', Czechia: '🇨🇿',
  Austria: '🇦🇹', Hungary: '🇭🇺', Romania: '🇷🇴', Greece: '🇬🇷',
  Turkey: '🇹🇷', Russia: '🇷🇺', China: '🇨🇳', India: '🇮🇳',
  Thailand: '🇹🇭', Indonesia: '🇮🇩', Philippines: '🇵🇭', Qatar: '🇶🇦',
  UAE: '🇦🇪', 'United Arab Emirates': '🇦🇪', Bahrain: '🇧🇭', Kuwait: '🇰🇼',
  Albania: '🇦🇱', Finland: '🇫🇮', Iceland: '🇮🇸', Ireland: '🇮🇪',
};

const flagFor = (name: string): string =>
  FLAG_MAP[name] ??
  Object.entries(FLAG_MAP).find(([k]) => name.toLowerCase().includes(k.toLowerCase()))?.[1] ??
  '🏳️';

interface ESPNCompetitor {
  team: { displayName: string; abbreviation: string; logo?: string };
  homeAway: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  competitions: Array<{ competitors: ESPNCompetitor[]; venue?: { fullName: string } }>;
  season?: { slug: string };
}

interface FormState {
  matchNumber: string;
  matchDate: string;
  teamAName: string;
  teamAFlag: string;
  teamBName: string;
  teamBFlag: string;
  predictionStart: string;
  predictionEnd: string;
}

const toLocalDatetime = (isoString: string): string => {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CreateMatch: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [upcomingESPN, setUpcomingESPN] = useState<ESPNEvent[]>([]);
  const [espnLoading, setEspnLoading] = useState(true);
  const [selectedESPNId, setSelectedESPNId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    matchNumber: '',
    matchDate: '',
    teamAName: '',
    teamAFlag: '',
    teamBName: '',
    teamBFlag: '',
    predictionStart: '',
    predictionEnd: '',
  });

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Fetch upcoming FIFA matches from ESPN
  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const today = new Date();
        const future = new Date(today);
        future.setDate(future.getDate() + 14);
        const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmt(today)}-${fmt(future)}&limit=40`;
        const res = await fetch(url);
        const json = await res.json();
        const events: ESPNEvent[] = (json.events || []).filter(
          (e: ESPNEvent) => e.competitions?.[0]?.competitors?.length === 2
        );
        setUpcomingESPN(events);
      } catch {
        // silently fail — admin can still use manual form
      } finally {
        setEspnLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  const handleSelectESPN = (event: ESPNEvent) => {
    setSelectedESPNId(event.id);
    const comp = event.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === 'home') ?? comp.competitors[0];
    const away = comp.competitors.find(c => c.homeAway === 'away') ?? comp.competitors[1];

    const matchDateLocal = toLocalDatetime(event.date);
    // Default prediction window: opens now, closes 5 min before kickoff
    const kickoff = new Date(event.date);
    const closesAt = new Date(kickoff.getTime() - 5 * 60 * 1000);
    const opensAt = new Date();

    setForm(f => ({
      ...f,
      teamAName: home.team.displayName,
      teamAFlag: flagFor(home.team.displayName),
      teamBName: away.team.displayName,
      teamBFlag: flagFor(away.team.displayName),
      matchDate: matchDateLocal,
      predictionStart: toLocalDatetime(opensAt.toISOString()),
      predictionEnd: toLocalDatetime(closesAt.toISOString()),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(form.predictionEnd) <= new Date(form.predictionStart)) {
      toast.error('Prediction end time must be after start time');
      return;
    }

    setIsLoading(true);
    try {
      await matchAPI.create({
        matchNumber: parseInt(form.matchNumber, 10),
        matchDate: new Date(form.matchDate).toISOString(),
        teamA: { name: form.teamAName.trim(), flag: form.teamAFlag.trim() },
        teamB: { name: form.teamBName.trim(), flag: form.teamBFlag.trim() },
        predictionStart: new Date(form.predictionStart).toISOString(),
        predictionEnd: new Date(form.predictionEnd).toISOString(),
      });

      toast.success(`Match ${form.matchNumber} created! Prediction options auto-generated.`);
      navigate('/admin');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to create match';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Admin
      </Link>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <Plus size={28} className="text-green-400" />
          Create New Match
        </h1>
        <p className="text-gray-400 mt-1">
          Pick an upcoming FIFA match or fill in the details manually.
        </p>
      </div>

      {/* ── ESPN Upcoming Matches ─────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" />
          Upcoming FIFA World Cup 2026 Matches
        </h2>

        {espnLoading && (
          <p className="text-gray-500 text-sm py-4">Loading upcoming matches...</p>
        )}

        {!espnLoading && upcomingESPN.length === 0 && (
          <p className="text-gray-500 text-sm py-4">
            No upcoming matches found — use the manual form below.
          </p>
        )}

        {!espnLoading && upcomingESPN.length > 0 && (() => {
          // Group by local date, show max 2 days
          const byDate: Record<string, ESPNEvent[]> = {};
          upcomingESPN.forEach((event) => {
            const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
            if (!byDate[dateKey]) byDate[dateKey] = [];
            byDate[dateKey].push(event);
          });
          const datesToShow = Object.keys(byDate).sort().slice(0, 2);

          return (
            <div className="space-y-5">
              {datesToShow.map((dateKey) => (
                <div key={dateKey}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={11} />
                    {format(new Date(dateKey), 'EEEE, MMM d, yyyy')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {byDate[dateKey].map((event) => {
                      const comp = event.competitions[0];
                      const home = comp.competitors.find(c => c.homeAway === 'home') ?? comp.competitors[0];
                      const away = comp.competitors.find(c => c.homeAway === 'away') ?? comp.competitors[1];
                      const isSelected = selectedESPNId === event.id;

                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => handleSelectESPN(event)}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/40'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
                          }`}
                        >
                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                            <Calendar size={11} />
                            {format(new Date(event.date), 'HH:mm')}
                            {isSelected && (
                              <span className="ml-auto text-green-400 font-semibold">Selected ✓</span>
                            )}
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {home.team.logo ? (
                                <img src={home.team.logo} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                              ) : (
                                <span className="text-2xl flex-shrink-0">{flagFor(home.team.displayName)}</span>
                              )}
                              <span className="text-sm font-semibold text-white truncate">
                                {home.team.displayName}
                              </span>
                            </div>

                            <span className="text-xs font-black text-gray-500 flex-shrink-0">VS</span>

                            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                              <span className="text-sm font-semibold text-white truncate text-right">
                                {away.team.displayName}
                              </span>
                              {away.team.logo ? (
                                <img src={away.team.logo} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                              ) : (
                                <span className="text-2xl flex-shrink-0">{flagFor(away.team.displayName)}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* ── Manual Form ──────────────────────────────────────── */}
      <div className="card animate-fade-in">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          {selectedESPNId ? '✏️ Review & Confirm Details' : '✏️ Manual Entry'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Match Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="matchNumber">Match Number *</label>
                <input
                  id="matchNumber"
                  type="number"
                  min={1}
                  value={form.matchNumber}
                  onChange={(e) => set('matchNumber', e.target.value)}
                  placeholder="e.g. 1"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="matchDate">Match Date & Time *</label>
                <input
                  id="matchDate"
                  type="datetime-local"
                  value={form.matchDate}
                  onChange={(e) => set('matchDate', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>

          {/* Teams */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Teams
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Team A */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Team A (Home)</p>
                <div>
                  <label className="label" htmlFor="teamAName">Team Name *</label>
                  <input
                    id="teamAName"
                    type="text"
                    value={form.teamAName}
                    onChange={(e) => set('teamAName', e.target.value)}
                    placeholder="e.g. Brazil"
                    className="input-field"
                    required
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="teamAFlag">Flag Emoji *</label>
                  <input
                    id="teamAFlag"
                    type="text"
                    value={form.teamAFlag}
                    onChange={(e) => set('teamAFlag', e.target.value)}
                    placeholder="🇧🇷"
                    className="input-field text-2xl"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_FLAGS.slice(0, 8).map((flag) => (
                    <button key={flag} type="button" onClick={() => set('teamAFlag', flag)}
                      className="text-xl hover:scale-125 transition-transform">{flag}</button>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider">Team B (Away)</p>
                <div>
                  <label className="label" htmlFor="teamBName">Team Name *</label>
                  <input
                    id="teamBName"
                    type="text"
                    value={form.teamBName}
                    onChange={(e) => set('teamBName', e.target.value)}
                    placeholder="e.g. Germany"
                    className="input-field"
                    required
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="teamBFlag">Flag Emoji *</label>
                  <input
                    id="teamBFlag"
                    type="text"
                    value={form.teamBFlag}
                    onChange={(e) => set('teamBFlag', e.target.value)}
                    placeholder="🇩🇪"
                    className="input-field text-2xl"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_FLAGS.slice(8, 16).map((flag) => (
                    <button key={flag} type="button" onClick={() => set('teamBFlag', flag)}
                      className="text-xl hover:scale-125 transition-transform">{flag}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            {(form.teamAName || form.teamBName) && (
              <div className="mt-4 p-4 bg-gray-800/60 rounded-xl text-center border border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl">{form.teamAFlag || '🏳️'}</div>
                    <div className="text-white font-bold text-sm mt-1">{form.teamAName || 'Team A'}</div>
                  </div>
                  <span className="text-gray-500 font-black">VS</span>
                  <div className="text-center">
                    <div className="text-3xl">{form.teamBFlag || '🏳️'}</div>
                    <div className="text-white font-bold text-sm mt-1">{form.teamBName || 'Team B'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prediction Window */}
          <div>
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
              Prediction Window
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="predictionStart">Opens At *</label>
                <input
                  id="predictionStart"
                  type="datetime-local"
                  value={form.predictionStart}
                  onChange={(e) => set('predictionStart', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="predictionEnd">Closes At *</label>
                <input
                  id="predictionEnd"
                  type="datetime-local"
                  value={form.predictionEnd}
                  onChange={(e) => set('predictionEnd', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              <span>
                The prediction window determines when users can submit their picks.
                Status updates automatically based on these times.
              </span>
            </div>
          </div>

          {/* Auto-generated options notice */}
          {form.teamAName && form.teamBName && (
            <div className="p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
              <p className="text-green-400 text-sm font-semibold mb-2">
                ✅ Auto-generated prediction options:
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• {form.teamAFlag} {form.teamAName} Win</li>
                <li>• 🤝 Draw</li>
                <li>• {form.teamBFlag} {form.teamBName} Win</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link to="/admin" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating...' : <><Plus size={16} />Create Match</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMatch;
