import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { socketService } from '../services/socket';
import { TypeHuntButton } from '../components/TypeHuntButton';

interface RacePlayer {
  userId: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  position?: number;
}

const MultiplayerRace: React.FC = () => {
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [input, setInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [players, setPlayers] = useState<RacePlayer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Listen for countdown from server
    const handleCountdown = (data: { count: number }) => {
      setCountdown(data.count);
    };

    // Listen for game start (after countdown finishes, server sends words)
    const handleGameStarted = (data: { words: string[]; players: any[]; startTime: number }) => {
      setCountdown(null);
      setWords(data.words);
      setRaceStarted(true);
      setPlayers(
        data.players.map((p: any) => ({
          userId: p.userId,
          username: p.username,
          progress: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
        }))
      );
      // Focus input after state updates
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    // Live progress updates from other players
    const handleProgressUpdate = (data: { players: any[] }) => {
      setPlayers((prev) =>
        prev.map((p) => {
          const update = data.players.find((u: any) => u.userId === p.userId);
          return update
            ? { ...p, progress: update.progress, wpm: update.wpm, accuracy: update.accuracy, finished: update.finished }
            : p;
        })
      );
    };

    // A player finished
    const handlePlayerFinished = (data: { userId: string; wpm: number; accuracy: number }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === data.userId
            ? { ...p, finished: true, wpm: data.wpm, accuracy: data.accuracy }
            : p
        )
      );
    };

    // Game ended — show results
    const handleGameEnded = (data: { results: any[]; winnerUsername: string }) => {
      setRaceFinished(true);
      setPlayers(
        data.results.map((r: any) => ({
          userId: r.userId,
          username: r.username,
          progress: r.progress,
          wpm: r.wpm,
          accuracy: r.accuracy,
          finished: r.finished,
          position: r.position,
        }))
      );
    };

    // A player disconnected
    const handlePlayerDisconnected = (data: { userId: string }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.userId === data.userId ? { ...p, finished: true, wpm: 0 } : p
        )
      );
    };

    socketService.on('game:countdown', handleCountdown);
    socketService.on('game:started', handleGameStarted);
    socketService.on('game:progressUpdate', handleProgressUpdate);
    socketService.on('game:playerFinished', handlePlayerFinished);
    socketService.on('game:ended', handleGameEnded);
    socketService.on('game:playerDisconnected', handlePlayerDisconnected);

    return () => {
      socketService.off('game:countdown', handleCountdown);
      socketService.off('game:started', handleGameStarted);
      socketService.off('game:progressUpdate', handleProgressUpdate);
      socketService.off('game:playerFinished', handlePlayerFinished);
      socketService.off('game:ended', handleGameEnded);
      socketService.off('game:playerDisconnected', handlePlayerDisconnected);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!raceStarted || raceFinished) return;

    const value = e.target.value;
    const newTotalKeystrokes = totalKeystrokes + 1;
    setTotalKeystrokes(newTotalKeystrokes);

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      const currentWord = words[currentWordIndex];

      const isCorrect = typedWord === currentWord;
      const newCorrectWords = correctWords + (isCorrect ? 1 : 0);
      const newCorrectKeystrokes = correctKeystrokes + (isCorrect ? currentWord.length : 0);
      const newIndex = currentWordIndex + 1;

      setCorrectWords(newCorrectWords);
      setCorrectKeystrokes(newCorrectKeystrokes);
      setCurrentWordIndex(newIndex);

      // Send progress to server
      socketService.sendProgress({
        code: lobbyId!,
        currentWordIndex: newIndex,
        correctWords: newCorrectWords,
        totalKeystrokes: newTotalKeystrokes,
        correctKeystrokes: newCorrectKeystrokes,
      });

      setInput('');
    } else {
      setInput(value);
    }
  };

  const winner = players
    .filter((p) => p.position)
    .sort((a, b) => (a.position || 99) - (b.position || 99))[0];

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-9xl text-white font-bold"
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting state (before countdown starts) */}
      {!raceStarted && countdown === null && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-3xl text-white mb-4">Waiting for game to start...</div>
            <div className="text-white/60">The host is starting the game</div>
          </motion.div>
        </div>
      )}

      {/* Race Progress Bars */}
      {(raceStarted || raceFinished) && (
        <div className="max-w-6xl mx-auto mb-8">
          <h1 className="text-3xl text-white mb-6 text-center">
            {raceFinished ? 'Race Complete!' : 'Race in Progress'}
          </h1>
          <div className="space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                    style={{
                      backgroundColor:
                        player.userId === user?.id
                          ? colors.highlightAccent || colors.accent
                          : colors.primaryMid,
                    }}
                  >
                    {player.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white">
                    {player.username}
                    {player.userId === user?.id && ' (you)'}
                  </span>
                  <span className="text-white/60 text-sm ml-auto">{player.wpm} WPM</span>
                </div>
                <div className="relative w-full h-12 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full flex items-center justify-end pr-2"
                    style={{
                      backgroundColor:
                        player.userId === user?.id
                          ? colors.highlightAccent || colors.accent
                          : colors.accent,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${player.progress}%` }}
                    transition={{ duration: 0.3 }}
                  >
                    {player.finished && <Trophy size={24} color="white" />}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Typing Area */}
      {raceStarted && !raceFinished && words.length > 0 && (
        <div className="max-w-4xl mx-auto">
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
                  <Trophy
                    size={80}
                    color={colors.highlightAccent || colors.accent}
                    className="mx-auto mb-4"
                  />
                </motion.div>
                <h2 className="text-5xl text-white mb-2">Race Complete!</h2>
                {winner && (
                  <p className="text-2xl text-white/80">
                    {winner.username} wins with {winner.wpm} WPM!
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-8">
                {players
                  .sort((a, b) => (a.position || 99) - (b.position || 99))
                  .map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{
                        backgroundColor:
                          player.position === 1
                            ? `${colors.highlightAccent || colors.accent}40`
                            : 'rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {player.position === 1 && <Medal size={24} color="#FFD700" />}
                        {player.position === 2 && <Medal size={24} color="#C0C0C0" />}
                        {player.position === 3 && <Medal size={24} color="#CD7F32" />}
                        <span className="text-white text-xl">
                          {player.position}. {player.username}
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
