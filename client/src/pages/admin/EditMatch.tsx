import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Info } from 'lucide-react';
import { matchAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { flagFor } from '../../utils/flagUtils';
import type { Match } from '../../types';

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

const EditMatch: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

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

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await matchAPI.getById(id!);
        const match = res.data as Match;
        setForm({
          matchNumber: String(match.matchNumber),
          matchDate: toLocalDatetime(match.matchDate),
          teamAName: match.teamA.name,
          teamAFlag: match.teamA.flag,
          teamBName: match.teamB.name,
          teamBFlag: match.teamB.flag,
          predictionStart: toLocalDatetime(match.predictionStart),
          predictionEnd: toLocalDatetime(match.predictionEnd),
        });
      } catch {
        toast.error('Failed to load match');
        navigate('/admin');
      } finally {
        setIsFetching(false);
      }
    };
    fetchMatch();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(form.predictionEnd) <= new Date(form.predictionStart)) {
      toast.error('Prediction end time must be after start time');
      return;
    }

    setIsLoading(true);
    try {
      await matchAPI.update(id!, {
        matchNumber: parseInt(form.matchNumber, 10),
        matchDate: new Date(form.matchDate).toISOString(),
        teamA: { name: form.teamAName.trim(), flag: form.teamAFlag.trim() },
        teamB: { name: form.teamBName.trim(), flag: form.teamBFlag.trim() },
        predictionStart: new Date(form.predictionStart).toISOString(),
        predictionEnd: new Date(form.predictionEnd).toISOString(),
      });

      toast.success(`Match ${form.matchNumber} updated successfully!`);
      navigate('/admin');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to update match';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading match..." />
      </div>
    );
  }

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
          <Save size={28} className="text-blue-400" />
          Edit Match #{form.matchNumber}
        </h1>
        <p className="text-gray-400 mt-1">
          Update match details, teams, or prediction window.
        </p>
      </div>

      <div className="card animate-fade-in">
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
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        teamAName: name,
                        teamAFlag: flagFor(name) || f.teamAFlag,
                      }));
                    }}
                    placeholder="e.g. Brazil"
                    className="input-field"
                    required
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="teamAFlag">
                    Flag Emoji
                    <span className="text-gray-500 font-normal ml-1">(auto-filled from name)</span>
                  </label>
                  <input
                    id="teamAFlag"
                    type="text"
                    value={form.teamAFlag}
                    onChange={(e) => set('teamAFlag', e.target.value)}
                    placeholder="🏳️"
                    className="input-field text-2xl"
                    required
                  />
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
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((f) => ({
                        ...f,
                        teamBName: name,
                        teamBFlag: flagFor(name) || f.teamBFlag,
                      }));
                    }}
                    placeholder="e.g. Germany"
                    className="input-field"
                    required
                    maxLength={60}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="teamBFlag">
                    Flag Emoji
                    <span className="text-gray-500 font-normal ml-1">(auto-filled from name)</span>
                  </label>
                  <input
                    id="teamBFlag"
                    type="text"
                    value={form.teamBFlag}
                    onChange={(e) => set('teamBFlag', e.target.value)}
                    placeholder="🏳️"
                    className="input-field text-2xl"
                    required
                  />
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
            <div className="p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
              <p className="text-blue-400 text-sm font-semibold mb-2">
                Prediction options (auto-updated on save):
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>&bull; {form.teamAFlag} {form.teamAName} Win</li>
                <li>&bull; {'🤝'} Draw</li>
                <li>&bull; {form.teamBFlag} {form.teamBName} Win</li>
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
              {isLoading ? 'Saving...' : <><Save size={16} />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMatch;
