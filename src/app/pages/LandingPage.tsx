import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Users, Skull, User, Settings, LogIn, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { TypeHuntButton } from '../components/TypeHuntButton';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <h1 className="text-4xl text-white">
            TypeHunt<span style={{ opacity: cursorVisible ? 1 : 0 }}>|</span>
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-4 items-center"
        >
          {isAuthenticated ? (
            <>
              <span className="text-white/80 text-sm">
                Hey, <strong>{user?.username}</strong>
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <User size={20} />
                Profile
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="px-6 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Settings size={20} />
                Settings
              </button>
              <button
                onClick={logout}
                className="px-6 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <LogOut size={20} />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              style={{ border: `1px solid ${colors.accent}` }}
            >
              <LogIn size={20} />
              Login / Sign Up
            </button>
          )}
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
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

        {/* Live Stats Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <div>
            <div className="text-5xl text-white mb-2">2.4K</div>
            <div className="text-white/70">Players Online</div>
          </div>
          <div>
            <div className="text-5xl text-white mb-2">156</div>
            <div className="text-white/70">Active Matches</div>
          </div>
          <div>
            <div className="text-5xl text-white mb-2">98</div>
            <div className="text-white/70">Avg WPM</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
