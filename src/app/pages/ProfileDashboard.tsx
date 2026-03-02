import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Target, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntCard } from '../components/TypeHuntCard';
import { TypeHuntBadge } from '../components/TypeHuntBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProfileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const stats = {
    totalGames: 247,
    bestWPM: 128,
    avgWPM: 95,
    avgAccuracy: 96.5,
    rank: 'Diamond' as const,
    totalTime: '42h 15m',
  };

  const matchHistory = [
    { id: 1, mode: 'Singleplayer', wpm: 102, accuracy: 98, date: '2 hours ago' },
    { id: 2, mode: 'Multiplayer', wpm: 95, accuracy: 94, date: '5 hours ago', position: 2 },
    { id: 3, mode: 'Hardcore', wpm: 88, accuracy: 100, date: '1 day ago', completed: true },
    { id: 4, mode: 'Singleplayer', wpm: 110, accuracy: 97, date: '1 day ago' },
    { id: 5, mode: 'Multiplayer', wpm: 98, accuracy: 95, date: '2 days ago', position: 1 },
  ];

  const progressData = [
    { date: 'Mon', wpm: 85 },
    { date: 'Tue', wpm: 88 },
    { date: 'Wed', wpm: 92 },
    { date: 'Thu', wpm: 89 },
    { date: 'Fri', wpm: 95 },
    { date: 'Sat', wpm: 98 },
    { date: 'Sun', wpm: 102 },
  ];

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white mb-8 hover:opacity-80 transition-opacity"
      >
        <ArrowLeft size={20} />
        Back to Home
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl"
                  style={{ backgroundColor: colors.accent }}
                >
                  U
                </div>
                <div>
                  <h1 className="text-4xl text-white mb-2">Username</h1>
                  <p className="text-white/70">Member since March 2026</p>
                </div>
              </div>
              <TypeHuntBadge rank={stats.rank} />
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Total Games</span>
              </div>
              <div className="text-4xl text-white">{stats.totalGames}</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Best WPM</span>
              </div>
              <div className="text-4xl text-white">{stats.bestWPM}</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <Target size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Avg Accuracy</span>
              </div>
              <div className="text-4xl text-white">{stats.avgAccuracy}%</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Avg WPM</span>
              </div>
              <div className="text-4xl text-white">{stats.avgWPM}</div>
            </TypeHuntCard>
          </motion.div>
        </div>

        {/* Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <TypeHuntCard glassmorphism>
            <h2 className="text-2xl text-white mb-6">Weekly Progress</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#ffffff" />
                <YAxis stroke="#ffffff" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.primaryMid,
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wpm"
                  stroke={colors.accent}
                  strokeWidth={3}
                  dot={{ fill: colors.accent, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TypeHuntCard>
        </motion.div>

        {/* Match History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TypeHuntCard glassmorphism>
            <h2 className="text-2xl text-white mb-6">Match History</h2>
            <div className="space-y-3">
              {matchHistory.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: colors.accent }}
                    >
                      <span className="text-2xl">
                        {match.mode === 'Singleplayer' ? '⚡' : match.mode === 'Multiplayer' ? '👥' : '💀'}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{match.mode}</div>
                      <div className="text-white/60 text-sm">{match.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-white text-lg">{match.wpm}</div>
                      <div className="text-white/60 text-xs">WPM</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white text-lg">{match.accuracy}%</div>
                      <div className="text-white/60 text-xs">Accuracy</div>
                    </div>
                    {match.position && (
                      <div
                        className="px-3 py-1 rounded-full text-white"
                        style={{
                          backgroundColor:
                            match.position === 1
                              ? '#FFD700'
                              : match.position === 2
                              ? '#C0C0C0'
                              : '#CD7F32',
                        }}
                      >
                        #{match.position}
                      </div>
                    )}
                    {match.completed && (
                      <div className="text-green-400 text-sm font-semibold">✓ Perfect</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </TypeHuntCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
