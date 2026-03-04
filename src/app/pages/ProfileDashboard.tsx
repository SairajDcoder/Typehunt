import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Target, TrendingUp, LogIn, Type, Clock, PenTool, Skull, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { TypeHuntCard } from '../components/TypeHuntCard';
import { TypeHuntBadge } from '../components/TypeHuntBadge';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GameHistoryItem {
  id: string;
  mode: string;
  wpm: number;
  accuracy: number;
  timeTaken: number;
  createdAt: string;
  hardcore: boolean;
}

type StatsTab = 'all' | 'words' | 'time' | 'custom' | 'hardcore' | 'multiplayer';

const STATS_TABS: { id: StatsTab; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'words', label: 'Words', icon: Type },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'custom', label: 'Custom', icon: PenTool },
  { id: 'hardcore', label: 'Hardcore', icon: Skull },
  { id: 'multiplayer', label: 'Multi', icon: Users },
];

const ProfileDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const [rawStats, setRawStats] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [progressData, setProgressData] = useState<{ date: string; wpm: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatsTab>('all');

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.getStats(),
          api.getGameHistory(20),
        ]);

        const raw = statsRes.data;
        setRawStats(raw);

        // Compute the "all" aggregate
        const sp = raw?.singleplayer || {};
        const hc = raw?.hardcore || {};
        const mp = raw?.multiplayer || {};

        const totalGames = (sp.gamesPlayed || 0) + (hc.gamesPlayed || 0) + (mp.gamesPlayed || 0);
        const bestWpm = Math.max(sp.bestWpm || 0, hc.bestWpm || 0);

        let avgWpm = 0;
        let avgAccuracy = 0;
        const totalWithWpm = (sp.gamesPlayed || 0) + (hc.gamesPlayed || 0) + (mp.gamesPlayed || 0);
        if (totalWithWpm > 0) {
          avgWpm = (
            (sp.avgWpm || 0) * (sp.gamesPlayed || 0) +
            (hc.avgWpm || 0) * (hc.gamesPlayed || 0) +
            (mp.avgWpm || 0) * (mp.gamesPlayed || 0)
          ) / totalWithWpm;

          const totalWithAcc = (sp.gamesPlayed || 0) + (hc.gamesPlayed || 0);
          if (totalWithAcc > 0) {
            avgAccuracy = (
              (sp.avgAccuracy || 0) * (sp.gamesPlayed || 0) +
              (hc.avgAccuracy || 0) * (hc.gamesPlayed || 0)
            ) / totalWithAcc;
          }
        }

        setStats({
          totalGames,
          bestWpm: Math.round(bestWpm),
          avgWpm: Math.round(avgWpm),
          avgAccuracy: Math.round(avgAccuracy * 10) / 10,
          ranking: raw?.ranking,
        });

        setHistory(historyRes.data?.results || []);

        const recent = (historyRes.data?.results || []).slice(0, 7).reverse();
        setProgressData(
          recent.map((g: GameHistoryItem) => ({
            date: new Date(g.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
            wpm: g.wpm,
          }))
        );
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const getTabStats = () => {
    if (!rawStats) return { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };

    switch (activeTab) {
      case 'words':
        return rawStats.subModes?.words || { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
      case 'time':
        return rawStats.subModes?.time || { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
      case 'custom':
        return rawStats.subModes?.custom || { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
      case 'hardcore':
        return rawStats.hardcore || { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
      case 'multiplayer':
        return { ...rawStats.multiplayer, bestWpm: 0, avgAccuracy: 0 } || { gamesPlayed: 0, bestWpm: 0, avgWpm: 0, avgAccuracy: 0 };
      case 'all':
      default:
        return {
          gamesPlayed: stats?.totalGames || 0,
          bestWpm: stats?.bestWpm || 0,
          avgWpm: stats?.avgWpm || 0,
          avgAccuracy: stats?.avgAccuracy || 0,
        };
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
        }}
      >
        <div className="text-center">
          <h1 className="text-4xl text-white mb-4">Log in to view your profile</h1>
          <TypeHuntButton onClick={() => navigate('/auth')} variant="accent" size="lg">
            <div className="flex items-center gap-2">
              <LogIn size={20} />
              Login / Sign Up
            </div>
          </TypeHuntButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
        }}
      >
        <div className="text-2xl text-white">Loading profile...</div>
      </div>
    );
  }

  const getRankFromElo = (elo: number): 'Bronze' | 'Silver' | 'Gold' | 'Diamond' => {
    if (elo >= 2000) return 'Diamond';
    if (elo >= 1500) return 'Gold';
    if (elo >= 1200) return 'Silver';
    return 'Bronze';
  };

  const formatDate = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const tabStats = getTabStats();

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white mb-8 hover:opacity-80 transition-opacity cursor-pointer"
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
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-4xl text-white mb-2">{user?.username}</h1>
                  <p className="text-white/70">
                    Member since {new Date(user?.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <TypeHuntBadge rank={getRankFromElo(stats?.ranking?.elo || 1000)} />
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Mode Stats Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            {STATS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: activeTab === tab.id ? colors.accent : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Total Games</span>
              </div>
              <div className="text-4xl text-white">{tabStats.gamesPlayed || 0}</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Best WPM</span>
              </div>
              <div className="text-4xl text-white">{Math.round(tabStats.bestWpm || 0)}</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <Target size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Avg Accuracy</span>
              </div>
              <div className="text-4xl text-white">{Math.round(tabStats.avgAccuracy || 0)}%</div>
            </TypeHuntCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <TypeHuntCard glassmorphism>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} color={colors.accent} />
                <span className="text-white/70 text-sm">Avg WPM</span>
              </div>
              <div className="text-4xl text-white">{Math.round(tabStats.avgWpm || 0)}</div>
            </TypeHuntCard>
          </motion.div>
        </div>

        {/* Progress Chart */}
        {progressData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <TypeHuntCard glassmorphism>
              <h2 className="text-2xl text-white mb-6">Recent Progress</h2>
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
        )}

        {/* Match History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TypeHuntCard glassmorphism>
            <h2 className="text-2xl text-white mb-6">Match History</h2>
            {history.length === 0 ? (
              <p className="text-white/60 text-center py-8">No games played yet. Start typing!</p>
            ) : (
              <div className="space-y-3">
                {history.map((match, index) => (
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
                          {match.hardcore
                            ? '💀'
                            : match.mode === 'MULTIPLAYER'
                            ? '👥'
                            : '⚡'}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {match.hardcore ? 'Hardcore' : match.mode === 'MULTIPLAYER' ? 'Multiplayer' : 'Singleplayer'}
                        </div>
                        <div className="text-white/60 text-sm">{formatDate(match.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-white text-lg">{match.wpm}</div>
                        <div className="text-white/60 text-xs">WPM</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white text-lg">{Math.round(match.accuracy)}%</div>
                        <div className="text-white/60 text-xs">Accuracy</div>
                      </div>
                      {match.hardcore && match.accuracy === 100 && (
                        <div className="text-green-400 text-sm font-semibold">✓ Perfect</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TypeHuntCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
