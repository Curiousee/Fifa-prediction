import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, Menu, X, LogOut, User, BarChart2, Home, Shield, Swords, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path));

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/matches', label: 'Matches', icon: Swords },
    { to: '/leaderboard', label: 'Leaderboard', icon: BarChart2 },
    { to: '/community', label: 'Community', icon: MessageSquare },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Admin Panel', icon: Shield },
  ];

  const navLinks = user
    ? [...userLinks, ...(user.role === 'admin' ? adminLinks : [])]
    : [];

  return (
    <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-black text-xl"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg shadow-green-900/50">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent tracking-tight">
              WC Predict
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive(to)
                    ? 'bg-green-600/20 text-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-lg">
                  <Trophy size={13} className="text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">
                    {user.points.toLocaleString()} pts
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg">
                  <User size={13} className="text-gray-400" />
                  <span className="text-sm text-gray-300 max-w-[120px] truncate">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-150 text-sm"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/8 transition-all"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  Join Contest
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800 px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(to)
                  ? 'bg-green-600/20 text-green-400'
                  : 'text-gray-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}

          <div className="border-t border-gray-800 pt-3 mt-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 text-yellow-400 text-sm font-semibold">
                  <Trophy size={14} />
                  {user.points.toLocaleString()} points
                </div>
                <div className="px-4 py-1 text-gray-400 text-sm truncate">
                  {user.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-gray-300 hover:text-white rounded-xl hover:bg-white/8 text-sm transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center btn-primary text-sm py-2.5"
                >
                  Join Contest
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

