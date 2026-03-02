import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Zap, Users, Skull, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntCard } from '../components/TypeHuntCard';

const GameModeSelection: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const modes = [
    {
      title: 'Singleplayer',
      description: 'Test your speed and accuracy solo',
      icon: Zap,
      path: '/singleplayer',
    },
    {
      title: 'Multiplayer',
      description: 'Race against players worldwide',
      icon: Users,
      path: '/multiplayer',
    },
    {
      title: 'Hardcore',
      description: 'One mistake and you restart',
      icon: Skull,
      path: '/hardcore',
    },
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

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl text-white text-center mb-12"
      >
        Choose Your Mode
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {modes.map((mode, index) => (
          <motion.div
            key={mode.path}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TypeHuntCard
              onClick={() => navigate(mode.path)}
              hoverable
              glassmorphism
            >
              <div className="text-center">
                <mode.icon size={64} color="#ffffff" className="mx-auto mb-4" />
                <h2 className="text-3xl text-white mb-3">{mode.title}</h2>
                <p className="text-white/80">{mode.description}</p>
              </div>
            </TypeHuntCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GameModeSelection;
