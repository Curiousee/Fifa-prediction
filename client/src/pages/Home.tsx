import React from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Target,
  Zap,
  ChevronRight,
  Star,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-green-950/20 to-gray-950 pt-20 pb-28">
        {/* Field grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,166,80,0.6) 0px, rgba(0,166,80,0.6) 1px, transparent 1px, transparent 64px),
              repeating-linear-gradient(90deg, rgba(0,166,80,0.6) 0px, rgba(0,166,80,0.6) 1px, transparent 1px, transparent 64px)
            `,
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(22,163,74,0.18),transparent)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-green-400 text-sm font-semibold mb-8">
            <Star size={13} />
            FIFA World Cup 2026 Official Prediction Contest
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
            <span className="text-white">Predict.</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
              Compete.
            </span>
            <br />
            <span className="text-white">Win!</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the ultimate World Cup prediction contest. Pick match winners
            before kickoff — the first correct pick earns 2 points, everyone
            else who gets it right earns 1 point!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="btn-primary text-base py-3.5 px-8 inline-flex items-center justify-center gap-2"
              >
                Go to Dashboard <ChevronRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-base py-3.5 px-8 inline-flex items-center justify-center gap-2"
                >
                  Join the Contest Free <ChevronRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary text-base py-3.5 px-8">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>



      {/* ── How It Works ── */}
      <section className="py-20 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg">
              Three simple steps to become a prediction champion
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create Account',
                description:
                  'Register for free and join hundreds of football fans competing to predict the most matches correctly.',
                icon: Users,
                gradient: 'from-blue-600 to-blue-400',
              },
              {
                step: '02',
                title: 'Predict Matches',
                description:
                  'Pick the winner (Team A, Draw, or Team B) before each match closes. Earlier predictions earn bonus points!',
                icon: Target,
                gradient: 'from-green-600 to-green-400',
              },
              {
                step: '03',
                title: 'Earn Points & Rank',
                description:
                  'The first person to get it right earns 2 points. Everyone else who gets it right earns 1 point. Wrong predictions earn 0.',
                icon: TrendingUp,
                gradient: 'from-yellow-600 to-yellow-400',
              },
            ].map(({ step, title, description, icon: Icon, gradient }) => (
              <div key={step} className="card relative overflow-hidden group">
                <div className="absolute top-4 right-4 text-7xl font-black text-gray-800/80 select-none">
                  {step}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scoring System ── */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-green-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-3">
            Scoring System
          </h2>
          <p className="text-gray-400 text-lg mb-12">
            Simple and fair — first correct pick wins the bonus!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              {
                label: '🥇 First Correct',
                value: '2 pts',
                desc: 'First person to predict correctly',
                borderColor: 'border-yellow-500/60',
                textColor: 'text-yellow-400',
              },
              {
                label: '✅ Others Correct',
                value: '1 pt',
                desc: 'Any other correct prediction',
                borderColor: 'border-green-500/50',
                textColor: 'text-green-400',
              },
              {
                label: '❌ Wrong',
                value: '0 pts',
                desc: 'Incorrect prediction',
                borderColor: 'border-gray-700',
                textColor: 'text-gray-500',
              },
            ].map(({ label, value, desc, borderColor, textColor }) => (
              <div
                key={label}
                className={`bg-gray-900 border-2 ${borderColor} rounded-2xl p-6 transition-transform hover:scale-105`}
              >
                <div className={`text-4xl font-black ${textColor} mb-2`}>
                  {value}
                </div>
                <div className="text-sm font-bold text-gray-200 mb-1">
                  {label}
                </div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">
              Everything You Need
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '📊',
                title: 'Live Poll Results',
                desc: 'See how the community voted after submitting your prediction — beautiful pie charts included.',
              },
              {
                icon: '🏆',
                title: 'Live Leaderboard',
                desc: 'Track your rank in real-time as results come in. Compete against all participants.',
              },
              {
                icon: '⚡',
                title: 'First Pick Bonus',
                desc: 'Be the first to predict correctly and earn 2 points. All other correct predictions earn 1 point.',
              },
              {
                icon: '📱',
                title: 'Mobile Friendly',
                desc: 'Fully responsive design optimized for phones, tablets, and desktops.',
              },
              {
                icon: '🔒',
                title: 'Secure & Fair',
                desc: 'JWT authentication, server-enforced deadlines, and one prediction per match per user.',
              },
              {
                icon: '🛡️',
                title: 'Admin Controls',
                desc: 'Admins can create matches, declare results, and manage points with full audit trail.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="p-5 bg-gray-950 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-white mb-1.5">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-green-950/40 via-gray-950 to-gray-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-yellow-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-5xl font-black text-white mb-4">
            Ready to Predict?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            The tournament is live. Don't miss your chance to predict today's
            matches and climb the leaderboard!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-base py-4 px-10 inline-flex items-center justify-center gap-2"
                >
                  Start Predicting Now <ChevronRight size={18} />
                </Link>
                <Link to="/leaderboard" className="btn-secondary text-base py-4 px-8 inline-flex items-center gap-2">
                  <Clock size={16} /> View Leaderboard
                </Link>
              </>
            ) : (
              <Link
                to="/matches"
                className="btn-primary text-base py-4 px-10 inline-flex items-center justify-center gap-2"
              >
                View Active Matches <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>⚽ WC Predict — FIFA World Cup 2026 Prediction Contest</p>
          <p className="mt-1 text-gray-600">Built with React, Node.js & MongoDB</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
