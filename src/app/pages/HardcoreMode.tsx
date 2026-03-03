import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Skull } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../services/api';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypingArea } from '../components/TypingArea';

const HardcoreMode: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { wordCategory } = useSettings();
  const [words, setWords] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [typingKey, setTypingKey] = useState(0);

  useEffect(() => {
    generateWords();
  }, []);

  useEffect(() => {
    if (startTime && !isFinished && !gameOver) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeElapsed(elapsed);
        const minutes = elapsed / 60;
        setWpm(minutes > 0 ? Math.round(currentWordIndex / minutes) : 0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isFinished, gameOver, currentWordIndex]);

  const generateWords = async () => {
    try {
      const res = await api.getWords({ count: 50, category: wordCategory });
      setWords(res.data.words);
    } catch {
      const fallback = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
        'through', 'forest', 'with', 'great', 'speed', 'while', 'avoiding', 'all', 'obstacles',
        'that', 'come', 'its', 'way', 'during', 'this', 'amazing', 'adventure', 'in', 'nature'];
      const generated = [];
      for (let i = 0; i < 50; i++) generated.push(fallback[Math.floor(Math.random() * fallback.length)]);
      setWords(generated);
    }
    resetGame();
  };

  const resetGame = () => {
    setStartTime(null);
    setTimeElapsed(0);
    setWpm(0);
    setCurrentWordIndex(0);
    setIsFinished(false);
    setGameOver(false);
    setServerResult(null);
    setTypingKey((prev) => prev + 1);
  };

  const handleStart = () => {
    setStartTime(Date.now());
  };

  const handleProgress = (data: any) => {
    setCurrentWordIndex(data.currentWordIndex);
  };

  const handleMistake = () => {
    setGameOver(true);
  };

  const handleFinish = async (data: any) => {
    setIsFinished(true);
    const endTime = Date.now();
    const elapsed = startTime ? (endTime - startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    setWpm(minutes > 0 ? Math.round(data.correctWords / minutes) : 0);

    if (isAuthenticated && startTime) {
      try {
        const res = await api.submitHardcore({
          wordSet: words,
          typedWords: data.typedWords,
          startTime,
          endTime,
        });
        setServerResult(res.data);
      } catch (err) {
        console.error('Failed to submit hardcore result:', err);
      }
    }
  };

  const progress = (currentWordIndex / words.length) * 100;
  const hardcoreDark = colors.primaryDark === '#355872' ? '#1a2c39' : '#002830';

  return (
    <div
      className="min-h-screen p-8 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${hardcoreDark} 0%, ${colors.primaryDark} 100%)` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.1) 0%, transparent 70%)' }} />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft size={20} /> Back
          </button>
          <button onClick={generateWords} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <RotateCcw size={20} /> Restart
          </button>
        </div>

        {/* Hardcore Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Skull size={48} color="#dc2626" />
            <h1 className="text-6xl text-white">HARDCORE MODE</h1>
            <Skull size={48} color="#dc2626" />
          </div>
          <p className="text-2xl text-red-400">One mistake = Game Over</p>
        </motion.div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl text-white">{Math.floor(timeElapsed)}s</div>
            <div className="text-white/70 text-sm">Time</div>
          </div>
          <div className="text-center">
            <div className="text-4xl text-white">{wpm}</div>
            <div className="text-white/70 text-sm">WPM</div>
          </div>
          <div className="text-center">
            <div className="text-4xl text-white">{currentWordIndex}/{words.length}</div>
            <div className="text-white/70 text-sm">Progress</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div className="h-full" style={{ backgroundColor: '#dc2626' }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* MonkeyType Typing Area */}
        {!gameOver && !isFinished && (
          <div className="max-w-4xl mx-auto">
            <div
              className="p-8 rounded-2xl shadow-2xl border-2"
              style={{ backgroundColor: `${colors.primaryDark}80`, borderColor: '#dc2626' }}
            >
              <TypingArea
                key={typingKey}
                words={words}
                hardcoreMode
                onStart={handleStart}
                onProgress={handleProgress}
                onFinish={handleFinish}
                onMistake={handleMistake}
                accentColor="#dc2626"
              />
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <div className="p-12 rounded-3xl border-4" style={{ backgroundColor: colors.primaryDark, borderColor: '#dc2626' }}>
              <Skull size={100} color="#dc2626" className="mx-auto mb-6" />
              <h2 className="text-6xl text-red-500 mb-4">GAME OVER</h2>
              <p className="text-2xl text-white/80 mb-6">You made a mistake!</p>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xl text-white"><span>Words Completed:</span><span>{currentWordIndex}</span></div>
                <div className="flex justify-between text-xl text-white"><span>WPM:</span><span>{wpm}</span></div>
                <div className="flex justify-between text-xl text-white"><span>Time:</span><span>{Math.floor(timeElapsed)}s</span></div>
              </div>
              <TypeHuntButton onClick={generateWords} variant="primary" size="lg" className="w-full">Try Again</TypeHuntButton>
            </div>
          </motion.div>
        )}

        {/* Success */}
        {isFinished && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <div className="p-12 rounded-3xl border-4" style={{ backgroundColor: colors.primaryDark, borderColor: colors.accent }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', duration: 0.8 }}>
                <div className="text-8xl mb-6">🏆</div>
              </motion.div>
              <h2 className="text-6xl text-green-400 mb-4">FLAWLESS!</h2>
              <p className="text-2xl text-white/80 mb-6">Perfect run with no mistakes!</p>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xl text-white"><span>WPM:</span><span>{serverResult?.wpm ?? wpm}</span></div>
                <div className="flex justify-between text-xl text-white"><span>Time:</span><span>{serverResult?.timeTaken ? Math.floor(serverResult.timeTaken) : Math.floor(timeElapsed)}s</span></div>
              </div>
              {serverResult && <div className="text-sm text-green-400 mb-4">✓ Result saved</div>}
              <TypeHuntButton onClick={generateWords} variant="accent" size="lg" className="w-full">Play Again</TypeHuntButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HardcoreMode;
