import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Volume2, Keyboard, BookOpen, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntCard } from '../components/TypeHuntCard';
import { TypeHuntToggle } from '../components/TypeHuntToggle';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, colors } = useTheme();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keyboardSound, setKeyboardSound] = useState('mechanical');
  const [wordCategory, setWordCategory] = useState('common');
  const [language, setLanguage] = useState('english');

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
        Settings
      </motion.h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-3 mb-6">
              <Palette size={28} color="white" />
              <h2 className="text-2xl text-white">Theme</h2>
            </div>
            <div className="space-y-4">
              <div
                onClick={() => setTheme('blue-frost')}
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  theme === 'blue-frost' ? 'ring-4' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: '#355872',
                  ringColor: '#9CD5FF',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-white mb-2">Blue Frost</h3>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#355872' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#7AAACE' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#9CD5FF' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#F7F8F0' }} />
                    </div>
                  </div>
                  {theme === 'blue-frost' && (
                    <div className="text-3xl">✓</div>
                  )}
                </div>
              </div>

              <div
                onClick={() => setTheme('teal-ocean')}
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  theme === 'teal-ocean' ? 'ring-4' : 'hover:scale-105'
                }`}
                style={{
                  backgroundColor: '#005461',
                  ringColor: '#3BC1A8',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl text-white mb-2">Teal Ocean</h3>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#005461' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#0C7779' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#249E94' }} />
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#3BC1A8' }} />
                    </div>
                  </div>
                  {theme === 'teal-ocean' && (
                    <div className="text-3xl">✓</div>
                  )}
                </div>
              </div>
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Sound Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-3 mb-6">
              <Volume2 size={28} color="white" />
              <h2 className="text-2xl text-white">Sound</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <span className="text-white">Sound Effects</span>
                <TypeHuntToggle checked={soundEnabled} onChange={setSoundEnabled} />
              </div>
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Keyboard Sound Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-3 mb-6">
              <Keyboard size={28} color="white" />
              <h2 className="text-2xl text-white">Keyboard Sound</h2>
            </div>
            <div className="space-y-3">
              {['mechanical', 'typewriter', 'silent'].map((sound) => (
                <div
                  key={sound}
                  onClick={() => setKeyboardSound(sound)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    keyboardSound === sound ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    ringColor: colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize">{sound}</span>
                    {keyboardSound === sound && (
                      <div className="text-xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Word Category Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={28} color="white" />
              <h2 className="text-2xl text-white">Word Category</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['common', 'advanced', 'programming', 'quotes'].map((category) => (
                <div
                  key={category}
                  onClick={() => setWordCategory(category)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    wordCategory === category ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    ringColor: colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize">{category}</span>
                    {wordCategory === category && (
                      <div className="text-xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TypeHuntCard>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-3 mb-6">
              <Globe size={28} color="white" />
              <h2 className="text-2xl text-white">Language</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['english', 'spanish', 'french', 'german', 'japanese', 'chinese'].map((lang) => (
                <div
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    language === lang ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    ringColor: colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize">{lang}</span>
                    {language === lang && (
                      <div className="text-xl">✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TypeHuntCard>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
