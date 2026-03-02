import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypeHuntToggle } from '../components/TypeHuntToggle';
import { TypeHuntModal } from '../components/TypeHuntModal';

const SAMPLE_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
  'through', 'forest', 'with', 'great', 'speed', 'while', 'avoiding', 'all', 'obstacles',
  'that', 'come', 'its', 'way', 'during', 'this', 'amazing', 'adventure'
];

const SingleplayerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [wordCount, setWordCount] = useState(25);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [capitalization, setCapitalization] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWords();
  }, [wordCount, punctuation, numbers, capitalization]);

  useEffect(() => {
    if (startTime && !isFinished) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeElapsed(elapsed);
        
        // Calculate WPM
        const minutes = elapsed / 60;
        const wordsTyped = currentWordIndex;
        setWpm(minutes > 0 ? Math.round(wordsTyped / minutes) : 0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isFinished, currentWordIndex]);

  const generateWords = () => {
    let generatedWords = [];
    for (let i = 0; i < wordCount; i++) {
      let word = SAMPLE_WORDS[Math.floor(Math.random() * SAMPLE_WORDS.length)];
      
      if (capitalization && Math.random() > 0.5) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      
      if (numbers && Math.random() > 0.7) {
        word = word + Math.floor(Math.random() * 10);
      }
      
      if (punctuation && i < wordCount - 1 && Math.random() > 0.7) {
        const punctuationMarks = [',', '.', '!', '?'];
        word = word + punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
      }
      
      generatedWords.push(word);
    }
    setWords(generatedWords);
    resetGame();
  };

  const resetGame = () => {
    setCurrentWordIndex(0);
    setInput('');
    setStartTime(null);
    setTimeElapsed(0);
    setCorrectChars(0);
    setTotalChars(0);
    setIsFinished(false);
    setWpm(0);
    setAccuracy(100);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const currentWord = words[currentWordIndex];
      
      // Count correct characters
      const correctCount = typedWord.split('').filter((char, i) => char === currentWord[i]).length;
      setCorrectChars(prev => prev + correctCount);
      setTotalChars(prev => prev + currentWord.length);
      
      // Calculate accuracy
      const newTotalChars = totalChars + currentWord.length;
      const newCorrectChars = correctChars + correctCount;
      setAccuracy(newTotalChars > 0 ? Math.round((newCorrectChars / newTotalChars) * 100) : 100);
      
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
          <div className="text-4xl text-white">{wpm}</div>
          <div className="text-white/70 text-sm">WPM</div>
        </div>
        <div className="text-center">
          <div className="text-4xl text-white">{accuracy}%</div>
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
            <span className="text-2xl">{wpm}</span>
          </div>
          <div className="flex justify-between">
            <span>Accuracy:</span>
            <span className="text-2xl">{accuracy}%</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="text-2xl">{Math.floor(timeElapsed)}s</span>
          </div>
          <div className="flex justify-between">
            <span>Words:</span>
            <span className="text-2xl">{words.length}</span>
          </div>
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
