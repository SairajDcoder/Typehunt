import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Skull } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntButton } from '../components/TypeHuntButton';

const SAMPLE_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
  'through', 'forest', 'with', 'great', 'speed', 'while', 'avoiding', 'all', 'obstacles',
  'that', 'come', 'its', 'way', 'during', 'this', 'amazing', 'adventure', 'in', 'nature'
];

const HardcoreMode: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWords();
  }, []);

  useEffect(() => {
    if (startTime && !isFinished && !gameOver) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeElapsed(elapsed);
        
        const minutes = elapsed / 60;
        const wordsTyped = currentWordIndex;
        setWpm(minutes > 0 ? Math.round(wordsTyped / minutes) : 0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isFinished, gameOver, currentWordIndex]);

  const generateWords = () => {
    let generatedWords = [];
    for (let i = 0; i < 50; i++) {
      generatedWords.push(SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)]);
    }
    setWords(generatedWords);
    resetGame();
  };

  const resetGame = () => {
    setCurrentWordIndex(0);
    setInput('');
    setStartTime(null);
    setTimeElapsed(0);
    setWpm(0);
    setIsFinished(false);
    setGameOver(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Check for mistakes on every keystroke
    const currentWord = words[currentWordIndex];
    const typedPart = value.trim();
    
    // If what they've typed so far doesn't match the beginning of the current word - GAME OVER
    if (!currentWord.startsWith(typedPart) && typedPart.length > 0) {
      setGameOver(true);
      return;
    }

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const currentWord = words[currentWordIndex];
      
      // Must be exact match
      if (typedWord !== currentWord) {
        setGameOver(true);
        return;
      }
      
      if (currentWordIndex === words.length - 1) {
        setIsFinished(true);
      } else {
        setCurrentWordIndex(prev => prev + 1);
      }
      setInput('');
    } else {
      setInput(value);
    }
  };

  const progress = (currentWordIndex / words.length) * 100;

  // Darker shade of primary dark for hardcore mode
  const hardcoreDark = colors.primaryDark === '#355872' ? '#1a2c39' : '#002830';

  return (
    <div
      className="min-h-screen p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${hardcoreDark} 0%, ${colors.primaryDark} 100%)`,
      }}
    >
      {/* Red danger overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <button
            onClick={generateWords}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <RotateCcw size={20} />
            Restart
          </button>
        </div>

        {/* Hardcore Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Skull size={48} color="#dc2626" />
            <h1 className="text-6xl text-white">HARDCORE MODE</h1>
            <Skull size={48} color="#dc2626" />
          </div>
          <p className="text-2xl text-red-400">One mistake = Game Over</p>
        </motion.div>

        {/* Stats Bar */}
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
            <motion.div
              className="h-full"
              style={{ backgroundColor: '#dc2626' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Typing Area */}
        {!gameOver && !isFinished && (
          <div className="max-w-4xl mx-auto">
            <div
              className="p-8 rounded-2xl shadow-2xl border-2"
              style={{ 
                backgroundColor: `${colors.primaryDark}80`,
                borderColor: '#dc2626',
              }}
            >
              <div className="mb-6 text-2xl text-white/80 leading-relaxed font-mono flex flex-wrap gap-2">
                {words.map((word, index) => (
                  <span
                    key={index}
                    className={
                      index === currentWordIndex
                        ? 'text-white underline'
                        : index < currentWordIndex
                        ? 'text-green-400'
                        : 'text-white/60'
                    }
                  >
                    {word}
                  </span>
                ))}
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                className="w-full p-4 text-xl rounded-lg font-mono outline-none"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '2px solid #dc2626',
                }}
                placeholder="Type here... No mistakes allowed!"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div
              className="p-12 rounded-3xl border-4"
              style={{ 
                backgroundColor: colors.primaryDark,
                borderColor: '#dc2626',
              }}
            >
              <Skull size={100} color="#dc2626" className="mx-auto mb-6" />
              <h2 className="text-6xl text-red-500 mb-4">GAME OVER</h2>
              <p className="text-2xl text-white/80 mb-6">You made a mistake!</p>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xl text-white">
                  <span>Words Completed:</span>
                  <span>{currentWordIndex}</span>
                </div>
                <div className="flex justify-between text-xl text-white">
                  <span>WPM:</span>
                  <span>{wpm}</span>
                </div>
                <div className="flex justify-between text-xl text-white">
                  <span>Time:</span>
                  <span>{Math.floor(timeElapsed)}s</span>
                </div>
              </div>
              <TypeHuntButton
                onClick={generateWords}
                variant="primary"
                size="lg"
                className="w-full"
              >
                Try Again
              </TypeHuntButton>
            </div>
          </motion.div>
        )}

        {/* Success Screen */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div
              className="p-12 rounded-3xl border-4"
              style={{ 
                backgroundColor: colors.primaryDark,
                borderColor: colors.accent,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: 'spring', duration: 0.8 }}
              >
                <div className="text-8xl mb-6">🏆</div>
              </motion.div>
              <h2 className="text-6xl text-green-400 mb-4">FLAWLESS!</h2>
              <p className="text-2xl text-white/80 mb-6">Perfect run with no mistakes!</p>
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xl text-white">
                  <span>WPM:</span>
                  <span>{wpm}</span>
                </div>
                <div className="flex justify-between text-xl text-white">
                  <span>Time:</span>
                  <span>{Math.floor(timeElapsed)}s</span>
                </div>
              </div>
              <TypeHuntButton
                onClick={generateWords}
                variant="accent"
                size="lg"
                className="w-full"
              >
                Play Again
              </TypeHuntButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HardcoreMode;
