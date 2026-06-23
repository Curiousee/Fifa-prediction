import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Trophy, Plus, Minus, Clock, Search } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import type { User, PointHistory } from '../../types';

const ManagePoints: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<(User & { _id: string })[]>([]);
  const [selectedUser, setSelectedUser] = useState<(User & { _id: string }) | null>(null);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [form, setForm] = useState({ points: '', reason: '', isAdd: true });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getUsers();
        const userList = res.data as (User & { _id: string })[];
        setUsers(userList);

        // Pre-select user from query params
        const preUserId = searchParams.get('userId');
        if (preUserId) {
          const preUser = userList.find((u) => u._id === preUserId);
          if (preUser) handleSelectUser(preUser);
        }
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectUser = async (user: User & { _id: string }) => {
    setSelectedUser(user);
    setIsHistoryLoading(true);
    try {
      const res = await adminAPI.getPointHistory(user._id);
      setHistory(res.data as PointHistory[]);
    } catch {
      toast.error('Failed to load point history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const pts = parseInt(form.points, 10);
    if (isNaN(pts) || pts <= 0) {
      toast.error('Enter a valid positive number of points');
      return;
    }

    const finalPoints = form.isAdd ? pts : -pts;

    setIsSubmitting(true);
    try {
      await adminAPI.adjustPoints({
        userId: selectedUser._id,
        points: finalPoints,
        reason: form.reason.trim(),
      });

      toast.success(
        `${form.isAdd ? 'Added' : 'Removed'} ${pts} points for ${selectedUser.name}`
      );

      // Refresh
      const [usersRes, histRes] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getPointHistory(selectedUser._id),
      ]);
      const updatedUsers = usersRes.data as (User & { _id: string })[];
      setUsers(updatedUsers);
      setHistory(histRes.data as PointHistory[]);
      const updated = updatedUsers.find((u) => u._id === selectedUser._id);
      if (updated) setSelectedUser(updated);
      setForm({ points: '', reason: '', isAdd: true });
    } catch {
      toast.error('Failed to adjust points');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="page-container">
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Admin
      </Link>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-2">
          <Trophy size={28} className="text-yellow-400" />
          Manual Point Adjustment
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Search for a user, then add or remove points with a reason (e.g., migrating from Google Forms)
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Search size={16} className="text-gray-400" />
              Select User
            </h2>

            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="input-field pl-9 text-sm py-2.5"
              />
            </div>

            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedUser?._id === user._id
                        ? 'bg-green-500/15 border border-green-500/30'
                        : 'hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${selectedUser?._id === user._id ? 'text-green-400' : 'text-white'}`}>
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm flex-shrink-0 ml-2">
                      {user.points.toLocaleString()} pts
                    </span>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center py-6 text-gray-500 text-sm">No users found</p>
                )}
              </div>
            )}
          </div>

          {/* Adjustment Form */}
          {selectedUser && (
            <div className="card animate-fade-in">
              <h2 className="font-bold text-white mb-1">
                Adjust Points for{' '}
                <span className="text-green-400">{selectedUser.name}</span>
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Current balance:{' '}
                <strong className="text-yellow-400">
                  {selectedUser.points.toLocaleString()} pts
                </strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Add / Remove Toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isAdd: true }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      form.isAdd
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Plus size={14} />
                    Add Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isAdd: false }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      !form.isAdd
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <Minus size={14} />
                    Remove Points
                  </button>
                </div>

                <div>
                  <label className="label" htmlFor="pts">
                    Number of Points *
                  </label>
                  <input
                    id="pts"
                    type="number"
                    min={1}
                    value={form.points}
                    onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                    placeholder="e.g. 50"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label" htmlFor="reason">
                    Reason / Comment *
                  </label>
                  <textarea
                    id="reason"
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. Previous Google Form predictions added"
                    className="input-field resize-none"
                    rows={3}
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.reason.length}/500 characters
                  </p>
                </div>

                {/* Common reasons */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Quick reasons:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Previous Google Form predictions added',
                      'Bonus for participation',
                      'Contest correction',
                      'Admin adjustment',
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, reason: r }))}
                        className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-300 border border-gray-700 transition-all"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    form.isAdd ? 'btn-primary' : 'btn-danger'
                  } disabled:opacity-50`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : `${form.isAdd ? 'Add' : 'Remove'} ${form.points || '?'} Points`}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Point History */}
        <div className="card">
          <h2 className="font-bold text-white mb-4 flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            Point History
            {selectedUser && (
              <span className="text-gray-500 font-normal text-sm">
                — {selectedUser.name}
              </span>
            )}
          </h2>

          {!selectedUser ? (
            <div className="text-center py-12">
              <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Select a user to view their point history
              </p>
            </div>
          ) : isHistoryLoading ? (
            <LoadingSpinner size="sm" />
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">No point history yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item._id}
                  className={`flex gap-3 p-3 rounded-xl border ${
                    item.points >= 0
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.points >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {item.points >= 0 ? (
                      <Plus size={14} className="text-green-400" />
                    ) : (
                      <Minus size={14} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-white font-medium leading-tight">
                        {item.reason}
                      </p>
                      <span
                        className={`font-black text-sm flex-shrink-0 ${
                          item.points >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {item.points >= 0 ? '+' : ''}
                        {item.points}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {item.addedByAdmin && (
                        <span className="text-xs bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePoints;
