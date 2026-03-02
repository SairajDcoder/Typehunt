import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntButton } from '../components/TypeHuntButton';

interface RacePlayer {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  finished: boolean;
  position?: number;
}

const SAMPLE_TEXT = "the quick brown fox jumps over the lazy dog and runs through the forest with great speed while avoiding all obstacles that come its way during this amazing adventure".split(' ');

const MultiplayerRace: React.FC = () => {
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(3);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [input, setInput] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [players, setPlayers] = useState<RacePlayer[]>([
    { id: '1', name: 'You', progress: 0, wpm: 0, finished: false },
    { id: '2', name: 'Player 2', progress: 0, wpm: 0, finished: false },
    { id: '3', name: 'Player 3', progress: 0, wpm: 0, finished: false },
  ]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          setRaceStarted(true);
          setStartTime(Date.now());
          inputRef.current?.focus();
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Simulate other players progress
  useEffect(() => {
    if (!raceStarted || raceFinished) return;

    const interval = setInterval(() => {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === '1') return p; // Don't simulate for current player
          
          const newProgress = Math.min(p.progress + Math.random() * 3, 100);
          const finished = newProgress >= 100;
          
          return {
            ...p,
            progress: newProgress,
            wpm: Math.floor(60 + Math.random() * 40),
            finished,
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, [raceStarted, raceFinished]);

  // Check if race is finished
  useEffect(() => {
    const allFinished = players.every(p => p.finished);
    if (allFinished && raceStarted && !raceFinished) {
      setRaceFinished(true);
      
      // Assign positions
      const sortedPlayers = [...players].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return b.progress - a.progress;
      });
      
      setPlayers(sortedPlayers.map((p, i) => ({ ...p, position: i + 1 })));
    }
  }, [players, raceStarted, raceFinished]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!raceStarted || raceFinished) return;
    
    const value = e.target.value;

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const currentWord = SAMPLE_TEXT[currentWordIndex];
      
      if (typedWord === currentWord) {
        const newIndex = currentWordIndex + 1;
        setCurrentWordIndex(newIndex);
        
        const progress = (newIndex / SAMPLE_TEXT.length) * 100;
        const elapsed = startTime ? (Date.now() - startTime) / 1000 / 60 : 1;
        const wpm = Math.round(newIndex / elapsed);
        
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === '1'
              ? { ...p, progress, wpm, finished: progress >= 100 }
              : p
          )
        );
        
        if (newIndex >= SAMPLE_TEXT.length) {
          // Player finished!
        }
      }
      setInput('');
    } else {
      setInput(value);
    }
  };

  const currentPlayer = players.find(p => p.id === '1');
  const winner = players.find(p => p.position === 1);

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      {/* Countdown */}
      <AnimatePresence>
        {countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-9xl text-white"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Race Progress */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl text-white mb-6 text-center">Race in Progress</h1>
        <div className="space-y-4">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ 
                    backgroundColor: player.id === '1' 
                      ? colors.highlightAccent || colors.accent 
                      : colors.primaryMid 
                  }}
                >
                  {player.name[0]}
                </div>
                <span className="text-white">{player.name}</span>
                <span className="text-white/60 text-sm ml-auto">{player.wpm} WPM</span>
              </div>
              <div className="relative w-full h-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full flex items-center justify-end pr-2"
                  style={{
                    backgroundColor: player.id === '1' && player.progress === Math.max(...players.map(p => p.progress))
                      ? colors.highlightAccent || colors.accent
                      : colors.accent,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${player.progress}%` }}
                  transition={{ duration: 0.3 }}
                >
                  {player.finished && (
                    <Trophy size={24} color="white" />
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Typing Area */}
      {raceStarted && !raceFinished && (
        <div className="max-w-4xl mx-auto">
          <div
            className="p-8 rounded-2xl shadow-2xl"
            style={{ backgroundColor: colors.primaryMid }}
          >
            <div className="mb-6 text-2xl text-white/80 leading-relaxed font-mono flex flex-wrap gap-2">
              {SAMPLE_TEXT.map((word, index) => (
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
              placeholder="Type here..."
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Victory Screen */}
      <AnimatePresence>
        {raceFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="p-12 rounded-3xl shadow-2xl max-w-2xl w-full"
              style={{ backgroundColor: colors.primaryMid }}
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <Trophy size={80} color={colors.highlightAccent || colors.accent} className="mx-auto mb-4" />
                </motion.div>
                <h2 className="text-5xl text-white mb-2">Race Complete!</h2>
                <p className="text-2xl text-white/80">
                  {winner?.name} wins with {winner?.wpm} WPM!
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {players
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{
                        backgroundColor: player.position === 1
                          ? `${colors.highlightAccent || colors.accent}40`
                          : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {player.position === 1 && <Medal size={24} color="#FFD700" />}
                        {player.position === 2 && <Medal size={24} color="#C0C0C0" />}
                        {player.position === 3 && <Medal size={24} color="#CD7F32" />}
                        <span className="text-white text-xl">
                          {player.position}. {player.name}
                        </span>
                      </div>
                      <span className="text-white text-xl">{player.wpm} WPM</span>
                    </div>
                  ))}
              </div>

              <div className="flex gap-4">
                <TypeHuntButton
                  onClick={() => navigate('/multiplayer')}
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                >
                  New Race
                </TypeHuntButton>
                <TypeHuntButton
                  onClick={() => navigate('/')}
                  variant="accent"
                  size="lg"
                  className="flex-1"
                >
                  Home
                </TypeHuntButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiplayerRace;
