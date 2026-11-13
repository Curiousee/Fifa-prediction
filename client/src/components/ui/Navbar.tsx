import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Target,
  Zap,
  ChevronRight,
  Star,
  Clock,
  TrendingUp,
  Trophy,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';

const featuredCompetitions = [
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Internationals',
  'World Cup qualifiers',
];

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-green-950/20 to-gray-950 pt-20 pb-28">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,166,80,0.6) 0px, rgba(0,166,80,0.6) 1px, transparent 1px, transparent 64px),
              repeating-linear-gradient(90deg, rgba(0,166,80,0.6) 0px, rgba(0,166,80,0.6) 1px, transparent 1px, transparent 64px)
            `,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(22,163,74,0.18),transparent)]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-1.5 text-green-400 text-sm font-semibold mb-8">
            <Star size={13} />
            Community football predictions all year round
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
            <span className="text-white">Predict.</span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-yellow-400 bg-clip-text text-transparent">
              Compete.
            </span>
            <br />
            <span className="text-white">Win.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Follow the biggest football matches across Europe and international football. Pick winners,
            track the community, and climb the leaderboard through the season.
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
                  Join the Community <ChevronRight size={18} />
                </Link>
                <Link to="/login" className="btn-secondary text-base py-3.5 px-8">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-white mb-3">Featured competitions</h2>
            <p className="text-gray-400 text-lg">Built for the full season, not just one tournament.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCompetitions.map((competition) => (
              <div key={competition} className="card-hover flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <Trophy size={18} className="text-green-400" />
                  </div>
                  <span className="font-semibold text-white">{competition}</span>
                </div>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">How it works</h2>
            <p className="text-gray-400 text-lg">Three quick steps to join the football prediction community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create your account',
                description: 'Join a free football community and track your picks across the season.',
                icon: Users,
                gradient: 'from-blue-600 to-blue-400',
              },
              {
                step: '02',
                title: 'Predict match results',
                description: 'Pick winners across league fixtures, title races, and international clashes.',
                icon: Target,
                gradient: 'from-green-600 to-green-400',
              },
              {
                step: '03',
                title: 'Climb the leaderboard',
                description: 'Compare your score with the community and keep building momentum every matchday.',
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

      <section className="py-20 bg-gradient-to-b from-gray-950 to-green-950/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-white mb-3">Scoring system</h2>
          <p className="text-gray-400 text-lg mb-12">Simple, competitive, and built for bragging rights every weekend.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              {
                label: '🥇 First correct',
                value: '2 pts',
                desc: 'Earliest correct pick earns the bonus',
                borderColor: 'border-yellow-500/60',
                textColor: 'text-yellow-400',
              },
              {
                label: '✅ Correct',
                value: '1 pt',
                desc: 'Any other correct answer counts too',
                borderColor: 'border-green-500/50',
                textColor: 'text-green-400',
              },
              {
                label: '❌ Wrong',
                value: '0 pts',
                desc: 'No points for a miss',
                borderColor: 'border-gray-700',
                textColor: 'text-gray-500',
              },
            ].map(({ label, value, desc, borderColor, textColor }) => (
              <div
                key={label}
                className={`bg-gray-900 border-2 ${borderColor} rounded-2xl p-6 transition-transform hover:scale-105`}
              >
                <div className={`text-4xl font-black ${textColor} mb-2`}>{value}</div>
                <div className="text-sm font-bold text-gray-200 mb-1">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-white mb-3">Everything you need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: '📊',
                title: 'Community predictions',
                desc: 'See how supporters are voting before kickoff and compare your instincts.',
              },
              {
                icon: '🏆',
                title: 'Live leaderboard',
                desc: 'Track your ranking and keep pushing up the table across each matchday.',
              },
              {
                icon: '⚡',
                title: 'Featured fixtures',
                desc: 'Follow the biggest matches through league weekends and international windows.',
              },
              {
                icon: '📱',
                title: 'Built for fans',
                desc: 'Mobile-friendly experience for quick predictions before kick-off.',
              },
              {
                icon: '🔒',
                title: 'Fair and secure',
                desc: 'JWT auth, transparent scoring, and one prediction per match per user.',
              },
              {
                icon: '🌍',
                title: 'Year-round coverage',
                desc: 'A platform designed for league action, Europe, and national-team fixtures.',
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

      <section className="py-24 bg-gradient-to-br from-green-950/40 via-gray-950 to-gray-950">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-yellow-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-5xl font-black text-white mb-4">Ready to predict?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join the football community, track the fixtures you care about, and turn every big match into a new chance to win.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-base py-4 px-10 inline-flex items-center justify-center gap-2"
                >
                  Start predicting now <ChevronRight size={18} />
                </Link>
                <Link to="/leaderboard" className="btn-secondary text-base py-4 px-8 inline-flex items-center gap-2">
                  <Clock size={16} /> View leaderboard
                </Link>
              </>
            ) : (
              <Link
                to="/matches"
                className="btn-primary text-base py-4 px-10 inline-flex items-center justify-center gap-2"
              >
                View active matches <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>⚽ FootyPredict — football predictions for every matchday</p>
          <p className="mt-1 text-gray-600">Built with React, Node.js & MongoDB</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
