import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypeHuntToggle } from '../components/TypeHuntToggle';
import { TypeHuntModal } from '../components/TypeHuntModal';

const SingleplayerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [wordCount, setWordCount] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [capitalization, setCapitalization] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [serverResult, setServerResult] = useState<any>(null);
  const [keystrokeTimestamps, setKeystrokeTimestamps] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWords();
  }, [wordCount, punctuation, numbers, capitalization]);

  useEffect(() => {
    if (startTime && !isFinished) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeElapsed(elapsed);
        
        const minutes = elapsed / 60;
        const wordsTyped = currentWordIndex;
        setWpm(minutes > 0 ? Math.round(wordsTyped / minutes) : 0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isFinished, currentWordIndex]);

  const generateWords = async () => {
    try {
      const res = await api.getWords({ count: wordCount, punctuation, numbers, caps: capitalization });
      setWords(res.data.words);
    } catch {
      // Fallback to local generation if API unavailable
      const fallback = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
        'through', 'forest', 'with', 'great', 'speed', 'while', 'avoiding', 'all', 'obstacles',
        'that', 'come', 'its', 'way', 'during', 'this', 'amazing', 'adventure'];
      const generated = [];
      for (let i = 0; i < wordCount; i++) {
        generated.push(fallback[Math.floor(Math.random() * fallback.length)]);
      }
      setWords(generated);
    }
    resetGame();
  };

  const resetGame = () => {
    setCurrentWordIndex(0);
    setTypedWords([]);
    setInput('');
    setStartTime(null);
    setTimeElapsed(0);
    setCorrectChars(0);
    setTotalChars(0);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    setServerResult(null);
    setKeystrokeTimestamps([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Record keystroke timestamp
    setKeystrokeTimestamps((prev) => [...prev, Date.now()]);

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const currentWord = words[currentWordIndex];
      
      // Track typed words for server submission
      setTypedWords((prev) => [...prev, typedWord]);

      // Count correct characters
      const correctCount = typedWord.split('').filter((char, i) => char === currentWord[i]).length;
      setCorrectChars(prev => prev + correctCount);
      setTotalChars(prev => prev + currentWord.length);
      
      const newTotalChars = totalChars + currentWord.length;
      const newCorrectChars = correctChars + correctCount;
      setAccuracy(newTotalChars > 0 ? Math.round((newCorrectChars / newTotalChars) * 100) : 100);
      
      if (currentWordIndex === words.length - 1) {
        const finalTypedWords = [...typedWords, typedWord];
        setIsFinished(true);
        submitResult(finalTypedWords);
      } else {
        setCurrentWordIndex(prev => prev + 1);
      }
      setInput('');
    } else {
      setInput(value);
    }
  };

  const submitResult = async (finalTypedWords: string[]) => {
    if (!isAuthenticated || !startTime) return;

    try {
      const res = await api.submitSingleplayer({
        wordSet: words,
        typedWords: finalTypedWords,
        startTime,
        endTime: Date.now(),
        keystrokeTimestamps,
      });
      setServerResult(res.data);
    } catch (err) {
      console.error('Failed to submit result:', err);
    }
  };

  const progress = (currentWordIndex / words.length) * 100;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
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

      {/* Stats Bar */}
      <div className="flex justify-center gap-8 mb-8">
        <div className="text-center">
          <div className="text-4xl text-white">{Math.floor(timeElapsed)}s</div>
          <div className="text-white/70 text-sm">Time</div>
        </div>
        <div className="text-center">
          <div className="text-4xl text-white">{serverResult ? serverResult.wpm : wpm}</div>
          <div className="text-white/70 text-sm">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-4xl text-white">{serverResult ? serverResult.accuracy + '%' : accuracy + '%'}</div>
          <div className="text-white/70 text-sm">Accuracy</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full"
            style={{ backgroundColor: colors.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Typing Area */}
      <div className="max-w-4xl mx-auto mb-8">
        <div
          className="p-8 rounded-2xl shadow-2xl"
          style={{ backgroundColor: colors.primaryMid }}
        >
          <div className="mb-6 text-2xl text-white/80 leading-relaxed font-mono flex flex-wrap gap-2">
            {words.map((word, index) => (
              <span
                key={index}
                className={
                  index === currentWordIndex
                    ? 'text-white underline'
                    : index < currentWordIndex
                    ? 'text-white/40'
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
              border: `2px solid ${colors.accent}`,
            }}
            placeholder="Start typing..."
            disabled={isFinished}
            autoFocus
          />
        </div>
      </div>

      {/* Settings */}
      <div className="max-w-4xl mx-auto">
        <div
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <h3 className="text-white text-xl mb-4">Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-white text-sm mb-2 block">Word Count</label>
              <select
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full p-2 rounded-lg"
                style={{ backgroundColor: colors.primaryMid, color: 'white' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-end">
              <TypeHuntToggle
                checked={punctuation}
                onChange={setPunctuation}
                label="Punctuation"
              />
            </div>
            <div className="flex items-end">
              <TypeHuntToggle
                checked={numbers}
                onChange={setNumbers}
                label="Numbers"
              />
            </div>
            <div className="flex items-end">
              <TypeHuntToggle
                checked={capitalization}
                onChange={setCapitalization}
                label="Capitals"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <TypeHuntModal
        isOpen={isFinished}
        onClose={() => {
          setIsFinished(false);
          generateWords();
        }}
        title="Results"
      >
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>WPM:</span>
            <span className="text-2xl">{serverResult?.wpm ?? wpm}</span>
          </div>
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className="text-2xl">{serverResult?.accuracy ?? accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="text-2xl">{serverResult?.timeTaken ? Math.floor(serverResult.timeTaken) : Math.floor(timeElapsed)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Words:</span>
            <span className="text-2xl">{words.length}</span>
          </div>
          {serverResult && (
            <div className="text-sm text-green-400 text-center mt-2">
              ✓ Result saved to your profile
            </div>
          )}
          {!isAuthenticated && (
            <div className="text-sm text-yellow-400 text-center mt-2">
              Log in to save your results
            </div>
          )}
          <TypeHuntButton
            onClick={() => {
              setIsFinished(false);
              generateWords();
            }}
            variant="accent"
            size="lg"
            className="w-full mt-4"
          >
            Try Again
          </TypeHuntButton>
        </div>
      </TypeHuntModal>
    </div>
  );
};

export default SingleplayerScreen;
