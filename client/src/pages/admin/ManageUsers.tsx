import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Trophy, Calendar, Search, Trash2, ShieldCheck, ShieldOff, ClipboardEdit, Star } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { format } from 'date-fns';
import type { User } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../types';
import toast from 'react-hot-toast';

const ManageUsers: React.FC = () => {
  const { user: me } = useAuth();
  const isSuperAdmin = me?.email === SUPER_ADMIN_EMAIL;
  const isOriginalRoshan = me?.email === SUPER_ADMIN_EMAIL;
  const [users, setUsers] = useState<(User & { _id: string; joinedDate: string; role: string; canChangeScores: boolean; isSuperAdmin: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    setActionLoading(userId + '-delete');
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch {
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setActionLoading(userId + '-role');
    try {
      await adminAPI.updateUserRole(userId, newRole as 'admin' | 'user');
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      alert('Only the super admin can change roles');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFullAccessToggle = async (userId: string, current: boolean) => {
    const next = !current;
    if (!window.confirm(`${next ? 'Grant FULL super-admin access' : 'Revoke full access'} for this user?`)) return;
    setActionLoading(userId + '-full');
    try {
      await adminAPI.updateFullAccess(userId, next);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isSuperAdmin: next, canChangeScores: next, role: next ? 'admin' : u.role } : u))
      );
    } catch {
      alert('Failed to update full access');
    } finally {
      setActionLoading(null);
    }
  };

  const handleScoreAccessToggle = async (userId: string, current: boolean) => {
    const next = !current;
    if (!window.confirm(`${next ? 'Grant' : 'Revoke'} score-change access for this user?`)) return;
    setActionLoading(userId + '-score');
    try {
      await adminAPI.updateScoreAccess(userId, next);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, canChangeScores: next } : u))
      );
    } catch {
      alert('Failed to update score access');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminAPI.getUsers();
        setUsers(res.data as (User & { _id: string; joinedDate: string; role: string })[]);
      } catch {
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="section-title flex items-center gap-2">
            <Users size={28} className="text-blue-400" />
            Manage Users
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {users.length} registered participants
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm py-2.5"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading users..." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Rank</th>
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-yellow-400" />
                      Points
                    </div>
                  </th>
                  <th className="text-left px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Joined
                    </div>
                  </th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Score Access</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => (
                    <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 font-bold">#{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Trophy size={13} />
                          {user.points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {user.joinedDate
                          ? format(new Date(user.joinedDate), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                          {user.isSuperAdmin && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                              ★ Full
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.canChangeScores ? (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                            ✓ Scorer
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/admin/points?userId=${user._id}&userName=${encodeURIComponent(user.name)}`}
                            className="text-xs text-green-400 hover:text-green-300 font-semibold transition-colors"
                          >
                            Adjust Points →
                          </Link>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRoleToggle(user._id, user.role)}
                              disabled={actionLoading === user._id + '-role'}
                              title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                              className="text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors"
                            >
                              {user.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleScoreAccessToggle(user._id, user.canChangeScores)}
                              disabled={actionLoading === user._id + '-score'}
                              title={user.canChangeScores ? 'Revoke score access' : 'Grant score access'}
                              className={`disabled:opacity-40 transition-colors ${user.canChangeScores ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-500 hover:text-yellow-400'}`}
                            >
                              <ClipboardEdit size={15} />
                            </button>
                          )}
                          {isOriginalRoshan && (
                            <button
                              onClick={() => handleFullAccessToggle(user._id, user.isSuperAdmin)}
                              disabled={actionLoading === user._id + '-full'}
                              title={user.isSuperAdmin ? 'Revoke full access' : 'Grant full access (same as roshan)'}
                              className={`disabled:opacity-40 transition-colors ${user.isSuperAdmin ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-green-400'}`}
                            >
                              <Star size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={actionLoading === user._id + '-delete'}
                            title="Delete user"
                            className="text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
