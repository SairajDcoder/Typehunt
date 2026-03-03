import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Palette, Volume2, Keyboard, BookOpen, Globe } from 'lucide-react';
import { useTheme, THEME_LIST } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { TypeHuntCard } from '../components/TypeHuntCard';
import { TypeHuntToggle } from '../components/TypeHuntToggle';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme, colors } = useTheme();
  const {
    soundEnabled, setSoundEnabled,
    keyboardSound, setKeyboardSound,
    wordCategory, setWordCategory,
    language, setLanguage,
  } = useSettings();

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEME_LIST.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-5 rounded-xl cursor-pointer transition-all ${
                    theme === t.id ? 'ring-4 scale-[1.02]' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: t.colors.primaryDark,
                    // @ts-ignore
                    '--tw-ring-color': t.colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg text-white mb-2">{t.name}</h3>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full border border-white/20" style={{ backgroundColor: t.colors.primaryDark }} />
                        <div className="w-7 h-7 rounded-full border border-white/20" style={{ backgroundColor: t.colors.primaryMid }} />
                        <div className="w-7 h-7 rounded-full border border-white/20" style={{ backgroundColor: t.colors.accent }} />
                        <div className="w-7 h-7 rounded-full border border-white/20" style={{ backgroundColor: t.colors.highlightAccent }} />
                      </div>
                    </div>
                    {theme === t.id && (
                      <div className="text-2xl text-white">✓</div>
                    )}
                  </div>
                </div>
              ))}
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
              {([
                { id: 'pop-click', label: 'Pop Click', desc: 'Short snappy pop' },
                { id: 'retro-beep', label: 'Retro Beep', desc: 'Dual-tone retro sound' },
                { id: 'soft-tap', label: 'Soft Tap', desc: 'Gentle noise tap' },
                { id: 'silent', label: 'Silent', desc: 'No sound' },
              ] as const).map((sound) => (
                <div
                  key={sound.id}
                  onClick={() => setKeyboardSound(sound.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    keyboardSound === sound.id ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: keyboardSound === sound.id ? `${colors.accent}30` : 'rgba(255, 255, 255, 0.1)',
                    // @ts-ignore
                    '--tw-ring-color': colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white block">{sound.label}</span>
                      <span className="text-white/50 text-sm">{sound.desc}</span>
                    </div>
                    {keyboardSound === sound.id && (
                      <div className="text-xl" style={{ color: colors.accent }}>✓</div>
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
              {([
                { id: 'common', label: 'Common', desc: 'Everyday words' },
                { id: 'advanced', label: 'Advanced', desc: 'SAT/GRE vocabulary' },
                { id: 'programming', label: 'Programming', desc: 'Code keywords' },
                { id: 'quotes', label: 'Quotes', desc: 'Famous quotes' },
              ] as const).map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setWordCategory(cat.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    wordCategory === cat.id ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: wordCategory === cat.id ? `${colors.accent}30` : 'rgba(255, 255, 255, 0.1)',
                    // @ts-ignore
                    '--tw-ring-color': colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white block">{cat.label}</span>
                      <span className="text-white/50 text-sm">{cat.desc}</span>
                    </div>
                    {wordCategory === cat.id && (
                      <div className="text-xl" style={{ color: colors.accent }}>✓</div>
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
              {([
                { id: 'english', label: 'English', flag: '🇺🇸' },
              ] as const).map((lang) => (
                <div
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    language === lang.id ? 'ring-2' : 'hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: language === lang.id ? `${colors.accent}30` : 'rgba(255, 255, 255, 0.1)',
                    // @ts-ignore
                    '--tw-ring-color': colors.accent,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">{lang.flag} {lang.label}</span>
                    {language === lang.id && (
                      <div className="text-xl" style={{ color: colors.accent }}>✓</div>
                    )}
                  </div>
                </div>
              ))}
              <div
                className="p-4 rounded-lg opacity-50 cursor-not-allowed"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <span className="text-white/50">🌍 More coming soon</span>
              </div>
            </div>
          </TypeHuntCard>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
