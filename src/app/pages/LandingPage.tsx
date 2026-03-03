import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Users, Skull, User, Settings, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { api } from '../services/api';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [cursorVisible, setCursorVisible] = useState(true);
  const [stats, setStats] = useState({ playersOnline: 0, activeMatches: 0, avgWpm: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Fetch live stats
  useEffect(() => {
    api.getLiveStats()
      .then((res) => {
        if (res.data) {
          setStats(res.data);
        }
      })
      .catch(() => {
        // Fallback — keep zeros
      });
  }, []);

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-8 relative z-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <img src="/typehunt-logo.png" alt="TypeHunt" className="w-10 h-10 rounded-lg" />
          <h1 className="text-4xl text-white">
            TypeHunt<span style={{ opacity: cursorVisible ? 1 : 0 }}>|</span>
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-6"
          style={{ position: 'relative', zIndex: 50 }}
        >
          {isAuthenticated && user ? (
            <>
              <span className="text-white/80">Hey, {user.username}</span>
              <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-2 text-white hover:text-white/80 transition-colors cursor-pointer">
                <User size={18} />
                <span>Profile</span>
              </button>
              <button type="button" onClick={() => navigate('/settings')} className="flex items-center gap-2 text-white hover:text-white/80 transition-colors cursor-pointer">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button type="button" onClick={logout} className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors cursor-pointer">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => navigate('/settings')} className="flex items-center gap-2 text-white hover:text-white/80 transition-colors cursor-pointer">
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <button type="button" onClick={() => navigate('/auth')} className="flex items-center gap-2 text-white hover:text-white/80 transition-colors cursor-pointer">
                <LogIn size={18} />
                <span>Login</span>
              </button>
            </>
          )}
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-6xl mb-4 text-white">Hunt Words. Beat Time. Dominate Speed.</h2>
          <p className="text-2xl text-white/80">The ultimate typing challenge awaits</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-6 w-full max-w-md"
        >
          <TypeHuntButton
            onClick={() => navigate('/singleplayer')}
            variant="accent"
            size="lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Zap size={24} />
              <span className="text-xl">Singleplayer</span>
            </div>
          </TypeHuntButton>

          <TypeHuntButton
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/auth');
                return;
              }
              navigate('/multiplayer');
            }}
            variant="highlight"
            size="lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Users size={24} />
              <span className="text-xl">Multiplayer</span>
            </div>
          </TypeHuntButton>

          <TypeHuntButton
            onClick={() => navigate('/hardcore')}
            variant="primary"
            size="lg"
          >
            <div className="flex items-center justify-center gap-3">
              <Skull size={24} />
              <span className="text-xl">Hardcore Mode</span>
            </div>
          </TypeHuntButton>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <div>
            <div className="text-5xl text-white mb-2">{formatNumber(stats.playersOnline)}</div>
            <div className="text-white/70">Players</div>
          </div>
          <div>
            <div className="text-5xl text-white mb-2">{stats.activeMatches}</div>
            <div className="text-white/70">Active Matches</div>
          </div>
          <div>
            <div className="text-5xl text-white mb-2">{stats.avgWpm || '—'}</div>
            <div className="text-white/70">Avg WPM</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
