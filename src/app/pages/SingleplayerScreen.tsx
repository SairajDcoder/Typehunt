import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Type, Clock, Leaf, PenTool } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { api } from '../services/api';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypeHuntToggle } from '../components/TypeHuntToggle';
import { TypeHuntModal } from '../components/TypeHuntModal';
import { TypingArea } from '../components/TypingArea';

type GameMode = 'words' | 'time' | 'zen' | 'custom';

const MODE_CONFIG = [
  { id: 'words' as GameMode, label: 'Words', icon: Type, description: 'Type a fixed number of words' },
  { id: 'time' as GameMode, label: 'Time', icon: Clock, description: 'Type as many words in a time limit' },
  { id: 'zen' as GameMode, label: 'Zen', icon: Leaf, description: 'Free typing, no scoring' },
  { id: 'custom' as GameMode, label: 'Custom', icon: PenTool, description: 'Type your own text' },
];

const SingleplayerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { wordCategory } = useSettings();

  // Mode state
  const [gameMode, setGameMode] = useState<GameMode>('words');

  // Settings
  const [wordCount, setWordCount] = useState(25);
  const [timeLimit, setTimeLimit] = useState(30); // seconds for time mode
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [capitalization, setCapitalization] = useState(false);
  const [customText, setCustomText] = useState('');

  // Game state
  const [words, setWords] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isFinished, setIsFinished] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [typingKey, setTypingKey] = useState(0);
  const [customReady, setCustomReady] = useState(false);

  // Generate words on mode/settings change
  useEffect(() => {
    if (gameMode === 'custom') {
      setCustomReady(false);
      setWords([]);
      return;
    }
    generateWords();
  }, [wordCount, punctuation, numbers, capitalization, gameMode, timeLimit]);

  // Timer logic
  useEffect(() => {
    if (startTime && !isFinished) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setTimeElapsed(elapsed);

        if (gameMode === 'time') {
          const remaining = Math.max(0, timeLimit - elapsed);
          setTimeRemaining(remaining);
          if (remaining <= 0) {
            // Time's up — auto finish
            handleTimeUp();
            return;
          }
        }

        const minutes = elapsed / 60;
        setWpm(minutes > 0 ? Math.round(currentWordIndex / minutes) : 0);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, isFinished, currentWordIndex, gameMode, timeLimit]);

  const generateWords = async () => {
    const count = gameMode === 'time' ? 200 : gameMode === 'zen' ? 100 : wordCount;
    try {
      const res = await api.getWords({ count, punctuation, numbers, caps: capitalization, category: wordCategory });
      setWords(res.data.words);
    } catch {
      const fallback = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'runs',
        'through', 'forest', 'with', 'great', 'speed', 'while', 'avoiding', 'all', 'obstacles',
        'that', 'come', 'its', 'way', 'during', 'this', 'amazing', 'adventure'];
      const generated = [];
      for (let i = 0; i < count; i++) {
        generated.push(fallback[Math.floor(Math.random() * fallback.length)]);
      }
      setWords(generated);
    }
    resetGame();
  };

  const loadCustomText = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const customWords = trimmed.split(/\s+/);
    setWords(customWords);
    setCustomReady(true);
    resetGame();
  };

  const resetGame = () => {
    setStartTime(null);
    setTimeElapsed(0);
    setTimeRemaining(gameMode === 'time' ? timeLimit : 0);
    setWpm(0);
    setAccuracy(100);
    setIsFinished(false);
    setServerResult(null);
    setCurrentWordIndex(0);
    setTypingKey((prev) => prev + 1);
  };

  const handleStart = () => {
    setStartTime(Date.now());
    if (gameMode === 'time') {
      setTimeRemaining(timeLimit);
    }
  };

  const handleProgress = (data: any) => {
    setCurrentWordIndex(data.currentWordIndex);
    const total = data.totalChars;
    const correct = data.correctChars;
    setAccuracy(total > 0 ? Math.round((correct / total) * 100) : 100);
  };

  const timeUpRef = useRef(false);
  const handleTimeUp = () => {
    if (timeUpRef.current) return;
    timeUpRef.current = true;
    // Trigger the same finish flow with what's been typed so far
    setIsFinished(true);
    const endTime = Date.now();
    const elapsed = startTime ? (endTime - startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const finalWpm = minutes > 0 ? Math.round(currentWordIndex / minutes) : 0;
    setWpm(finalWpm);

    if (isAuthenticated && startTime) {
      api.submitSingleplayer({
        wordSet: words.slice(0, currentWordIndex),
        typedWords: words.slice(0, currentWordIndex), // approximate
        startTime,
        endTime,
        subMode: 'time',
      }).then(res => setServerResult(res.data)).catch(() => {});
    }
  };

  const handleFinish = async (data: any) => {
    if (gameMode === 'zen') {
      // Zen mode: just show stats but don't save
      setIsFinished(true);
      const endTime = Date.now();
      const elapsed = startTime ? (endTime - startTime) / 1000 : 0;
      const minutes = elapsed / 60;
      setWpm(minutes > 0 ? Math.round(data.correctWords / minutes) : 0);
      const total = data.totalChars;
      const correct = data.correctChars;
      setAccuracy(total > 0 ? Math.round((correct / total) * 100) : 100);
      return;
    }

    setIsFinished(true);
    const total = data.totalChars;
    const correct = data.correctChars;
    const finalAccuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
    setAccuracy(finalAccuracy);

    const endTime = Date.now();
    const elapsed = startTime ? (endTime - startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const finalWpm = minutes > 0 ? Math.round(data.correctWords / minutes) : 0;
    setWpm(finalWpm);

    if (isAuthenticated && startTime) {
      try {
        const res = await api.submitSingleplayer({
          wordSet: words,
          typedWords: data.typedWords,
          startTime,
          endTime,
          keystrokeTimestamps: data.keystrokeTimestamps,
          subMode: gameMode,
        });
        setServerResult(res.data);
      } catch (err) {
        console.error('Failed to submit result:', err);
      }
    }
  };

  const handleRestart = () => {
    timeUpRef.current = false;
    if (gameMode === 'custom' && customReady) {
      resetGame();
    } else {
      generateWords();
    }
  };

  const progress = gameMode === 'time'
    ? (timeRemaining / timeLimit) * 100
    : (currentWordIndex / (words.length || 1)) * 100;

  const showTypingArea = gameMode !== 'custom' || customReady;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity cursor-pointer">
          <ArrowLeft size={20} /> Back
        </button>
        <button type="button" onClick={handleRestart} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity cursor-pointer">
          <RotateCcw size={20} /> Restart
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
          {MODE_CONFIG.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setGameMode(mode.id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: gameMode === mode.id ? colors.accent : 'transparent',
                color: gameMode === mode.id ? '#fff' : 'rgba(255,255,255,0.6)',
              }}
            >
              <mode.icon size={16} />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-center gap-8 mb-6">
        {gameMode === 'time' ? (
          <>
            <div className="text-center">
              <div className="text-4xl text-white" style={{ color: timeRemaining < 5 ? '#ff4444' : 'white' }}>
                {Math.ceil(startTime ? timeRemaining : timeLimit)}s
              </div>
              <div className="text-white/70 text-sm">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-white">{serverResult ? serverResult.wpm : wpm}</div>
              <div className="text-white/70 text-sm">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-white">{currentWordIndex}</div>
              <div className="text-white/70 text-sm">Words</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-white">{accuracy}%</div>
              <div className="text-white/70 text-sm">Accuracy</div>
            </div>
          </>
        ) : gameMode === 'zen' ? (
          <>
            <div className="text-center">
              <div className="text-4xl text-white">{Math.floor(timeElapsed)}s</div>
              <div className="text-white/70 text-sm">Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-white">{wpm}</div>
              <div className="text-white/70 text-sm">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-4xl text-white/50">✿</div>
              <div className="text-white/70 text-sm">Relax</div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Progress Bar */}
      {gameMode !== 'zen' && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: colors.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${gameMode === 'time' ? progress : progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Typing Area */}
      {showTypingArea && words.length > 0 ? (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="p-8 rounded-2xl shadow-2xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <TypingArea
              key={typingKey}
              words={words}
              disabled={isFinished}
              onStart={handleStart}
              onProgress={handleProgress}
              onFinish={handleFinish}
              onRestart={handleRestart}
              accentColor={colors.accent}
            />
          </div>
        </div>
      ) : gameMode === 'custom' && !customReady ? (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="p-8 rounded-2xl shadow-2xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <h3 className="text-white text-lg mb-4">Paste your text below</h3>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type or paste your custom text here..."
              className="w-full h-40 p-4 rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                focusRingColor: colors.accent,
              }}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-white/60 text-sm">
                {customText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              <TypeHuntButton
                onClick={loadCustomText}
                variant="accent"
                size="md"
                disabled={!customText.trim()}
              >
                Start Typing
              </TypeHuntButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mode-specific Settings */}
      <div className="max-w-4xl mx-auto">
        <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <h3 className="text-white text-xl mb-4">Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gameMode === 'words' && (
              <div>
                <label className="text-white text-sm mb-2 block">Word Count</label>
                <select value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} className="w-full p-2 rounded-lg" style={{ backgroundColor: colors.primaryMid, color: 'white' }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
            {gameMode === 'time' && (
              <div>
                <label className="text-white text-sm mb-2 block">Time Limit</label>
                <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full p-2 rounded-lg" style={{ backgroundColor: colors.primaryMid, color: 'white' }}>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                  <option value={60}>60s</option>
                  <option value={120}>120s</option>
                </select>
              </div>
            )}
            {(gameMode === 'words' || gameMode === 'time' || gameMode === 'zen') && (
              <>
                <div className="flex items-end"><TypeHuntToggle checked={punctuation} onChange={setPunctuation} label="Punctuation" /></div>
                <div className="flex items-end"><TypeHuntToggle checked={numbers} onChange={setNumbers} label="Numbers" /></div>
                <div className="flex items-end"><TypeHuntToggle checked={capitalization} onChange={setCapitalization} label="Capitals" /></div>
              </>
            )}
            {gameMode === 'custom' && customReady && (
              <div>
                <TypeHuntButton onClick={() => { setCustomReady(false); setWords([]); }} variant="primary" size="sm">
                  Change Text
                </TypeHuntButton>
              </div>
            )}
            {gameMode === 'zen' && (
              <div className="col-span-full text-white/50 text-sm italic">
                Just type and relax. No stats are saved.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Modal */}
      <TypeHuntModal isOpen={isFinished} onClose={() => { setIsFinished(false); handleRestart(); }} title="Results">
        <div className="space-y-4">
          <div className="flex justify-between"><span>WPM:</span><span className="text-2xl">{serverResult?.wpm ?? wpm}</span></div>
          <div className="flex justify-between"><span>Accuracy:</span><span className="text-2xl">{serverResult?.accuracy ?? accuracy}%</span></div>
          <div className="flex justify-between"><span>Time:</span><span className="text-2xl">{serverResult?.timeTaken ? Math.floor(serverResult.timeTaken) : Math.floor(timeElapsed)}s</span></div>
          <div className="flex justify-between"><span>Words:</span><span className="text-2xl">{gameMode === 'time' ? currentWordIndex : words.length}</span></div>
          <div className="flex justify-between"><span>Mode:</span><span className="text-lg capitalize" style={{ color: colors.accent }}>{gameMode}</span></div>
          {serverResult && <div className="text-sm text-green-400 text-center mt-2">✓ Result saved to your profile</div>}
          {gameMode === 'zen' && <div className="text-sm text-white/50 text-center mt-2">Zen mode — stats not saved</div>}
          {!isAuthenticated && gameMode !== 'zen' && <div className="text-sm text-yellow-400 text-center mt-2">Log in to save your results</div>}
          <TypeHuntButton onClick={() => { setIsFinished(false); handleRestart(); }} variant="accent" size="lg" className="w-full mt-4">Try Again</TypeHuntButton>
        </div>
      </TypeHuntModal>
    </div>
  );
};

export default SingleplayerScreen;
