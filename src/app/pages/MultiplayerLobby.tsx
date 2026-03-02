import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Play, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypeHuntCard } from '../components/TypeHuntCard';
import { TypeHuntToggle } from '../components/TypeHuntToggle';

interface Player {
  userId: string;
  username: string;
  isReady: boolean;
  isHost: boolean;
  avatarUrl?: string;
}

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { user, isAuthenticated, token } = useAuth();
  const [lobbyCode, setLobbyCode] = useState('');
  const [inLobby, setInLobby] = useState(false);
  const [currentLobbyCode, setCurrentLobbyCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  // Settings
  const [wordCount, setWordCount] = useState(30);
  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);
  const [caps, setCaps] = useState(false);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    }
    return () => {
      if (currentLobbyCode) {
        socketService.leaveLobby(currentLobbyCode);
      }
    };
  }, [isAuthenticated, token]);

  // Socket event listeners
  useEffect(() => {
    if (!inLobby) return;

    const handlePlayerJoined = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { players: Player[]; newHostId?: string }) => {
      setPlayers(data.players);
      if (data.newHostId === user?.id) {
        setIsHost(true);
      }
    };

    const handlePlayerReady = (data: { players: Player[] }) => {
      setPlayers(data.players);
    };

    const handleChat = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const handleSettingsUpdated = (data: { settings: any }) => {
      const s = data.settings;
      setWordCount(s.wordCount || 30);
      setPunctuation(s.punctuation || false);
      setNumbers(s.numbers || false);
      setCaps(s.capitalization || false);
    };

    const handlePlayerKicked = (data: { kickedUserId: string; players: Player[] }) => {
      if (data.kickedUserId === user?.id) {
        setInLobby(false);
        setError('You were kicked from the lobby');
      } else {
        setPlayers(data.players);
      }
    };

    const handleCountdown = () => {
      // Game is starting, navigate to race page immediately
      navigate(`/multiplayer/race/${currentLobbyCode}`);
    };

    const handleGameStarted = () => {
      // Also navigate when game:started fires (fallback)
      navigate(`/multiplayer/race/${currentLobbyCode}`);
    };

    const handleLobbyClosed = () => {
      setInLobby(false);
      setError('Lobby was closed');
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
    };

    socketService.on('lobby:playerJoined', handlePlayerJoined);
    socketService.on('lobby:playerLeft', handlePlayerLeft);
    socketService.on('lobby:playerReady', handlePlayerReady);
    socketService.on('lobby:chatMessage', handleChat);
    socketService.on('lobby:settingsUpdated', handleSettingsUpdated);
    socketService.on('lobby:playerKicked', handlePlayerKicked);
    socketService.on('lobby:closed', handleLobbyClosed);
    socketService.on('lobby:error', handleError);
    socketService.on('game:countdown', handleCountdown);
    socketService.on('game:started', handleGameStarted);

    return () => {
      socketService.off('lobby:playerJoined', handlePlayerJoined);
      socketService.off('lobby:playerLeft', handlePlayerLeft);
      socketService.off('lobby:playerReady', handlePlayerReady);
      socketService.off('lobby:chatMessage', handleChat);
      socketService.off('lobby:settingsUpdated', handleSettingsUpdated);
      socketService.off('lobby:playerKicked', handlePlayerKicked);
      socketService.off('lobby:closed', handleLobbyClosed);
      socketService.off('lobby:error', handleError);
      socketService.off('game:countdown', handleCountdown);
      socketService.off('game:started', handleGameStarted);
    };
  }, [inLobby, currentLobbyCode, user?.id, navigate]);

  const createLobby = async () => {
    setError('');
    try {
      const res = await api.createLobby(
        { wordCount, punctuation, numbers, capitalization: caps },
        8
      );
      const code = res.data.code;
      setCurrentLobbyCode(code);
      setIsHost(true);
      setInLobby(true);
      socketService.joinLobby(code);
    } catch (err: any) {
      setError(err.message || 'Failed to create lobby');
    }
  };

  const joinLobby = async () => {
    if (!lobbyCode.trim()) return;
    setError('');
    try {
      await api.joinLobby(lobbyCode.toUpperCase());
      setCurrentLobbyCode(lobbyCode.toUpperCase());
      setIsHost(false);
      setInLobby(true);
      socketService.joinLobby(lobbyCode.toUpperCase());
    } catch (err: any) {
      setError(err.message || 'Failed to join lobby');
    }
  };

  const leaveLobby = () => {
    socketService.leaveLobby(currentLobbyCode);
    setInLobby(false);
    setPlayers([]);
    setChatMessages([]);
    setCurrentLobbyCode('');
  };

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(currentLobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    const me = players.find((p) => p.userId === user?.id);
    socketService.setReady(currentLobbyCode, !me?.isReady);
  };

  const startGame = () => {
    // Update settings before starting
    socketService.updateSettings(currentLobbyCode, {
      wordCount, punctuation, numbers, capitalization: caps,
    });
    socketService.startGame(currentLobbyCode);
    // Navigate immediately so race page is mounted before countdown events
    navigate(`/multiplayer/race/${currentLobbyCode}`);
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      socketService.sendChat(currentLobbyCode, chatInput);
      setChatInput('');
    }
  };

  if (!inLobby) {
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
          Back
        </button>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl text-white text-center mb-12"
        >
          Multiplayer
        </motion.h1>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-3 rounded-lg text-center"
            style={{ backgroundColor: 'rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          <TypeHuntCard glassmorphism>
            <h2 className="text-2xl text-white mb-4">Create Lobby</h2>
            <p className="text-white/80 mb-4">Host a new game and invite your friends</p>
            <TypeHuntButton onClick={createLobby} variant="accent" size="lg" className="w-full">
              Create New Lobby
            </TypeHuntButton>
          </TypeHuntCard>

          <TypeHuntCard glassmorphism>
            <h2 className="text-2xl text-white mb-4">Join Lobby</h2>
            <p className="text-white/80 mb-4">Enter a lobby code to join an existing game</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                placeholder="Enter lobby code"
                maxLength={6}
                className="flex-1 p-3 rounded-lg font-mono text-lg tracking-widest"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: `2px solid ${colors.accent}`,
                }}
              />
              <TypeHuntButton onClick={joinLobby} variant="highlight" size="md">
                Join
              </TypeHuntButton>
            </div>
          </TypeHuntCard>
        </div>
      </div>
    );
  }

  const allReady = players.filter((p) => !p.isHost).every((p) => p.isReady);
  const canStart = isHost && allReady && players.length >= 2;

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={leaveLobby}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          Leave Lobby
        </button>
        <div className="flex items-center gap-3">
          <div className="text-white text-xl font-mono tracking-widest">{currentLobbyCode}</div>
          <button
            onClick={copyLobbyCode}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mb-4 p-3 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.3)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Players List */}
        <div className="lg:col-span-2">
          <TypeHuntCard glassmorphism>
            <div className="flex items-center gap-2 mb-6">
              <Users size={24} color="white" />
              <h2 className="text-2xl text-white">Players ({players.length})</h2>
            </div>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.userId}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {player.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white">
                        {player.username}
                        {player.userId === user?.id && <span className="text-white/50 ml-1">(you)</span>}
                        {player.isHost && (
                          <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                            HOST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {player.userId === user?.id ? (
                      <TypeHuntButton
                        onClick={toggleReady}
                        variant={player.isReady ? 'accent' : 'ghost'}
                        size="sm"
                      >
                        {player.isReady ? 'Ready' : 'Not Ready'}
                      </TypeHuntButton>
                    ) : (
                      <span className={`text-sm ${player.isReady ? 'text-green-400' : 'text-white/60'}`}>
                        {player.isReady ? '✓ Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Host Settings */}
            {isHost && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <h3 className="text-white text-lg mb-3">Game Settings</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-white/70 text-sm block mb-1">Word Count</label>
                    <select
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      className="w-full p-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                    >
                      <option value={25}>25 words</option>
                      <option value={50}>50 words</option>
                      <option value={100}>100 words</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <TypeHuntToggle checked={punctuation} onChange={setPunctuation} label="Punctuation" />
                  </div>
                  <div className="flex items-end">
                    <TypeHuntToggle checked={numbers} onChange={setNumbers} label="Numbers" />
                  </div>
                  <div className="flex items-end">
                    <TypeHuntToggle checked={caps} onChange={setCaps} label="Capitals" />
                  </div>
                </div>
              </div>
            )}

            <TypeHuntButton
              onClick={startGame}
              variant="highlight"
              size="lg"
              className="w-full mt-6"
              disabled={!canStart}
            >
              <div className="flex items-center justify-center gap-2">
                <Play size={20} />
                {!isHost
                  ? 'Waiting for host...'
                  : !allReady
                  ? 'Waiting for players...'
                  : players.length < 2
                  ? 'Need 2+ players'
                  : 'Start Game'}
              </div>
            </TypeHuntButton>
          </TypeHuntCard>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <TypeHuntCard glassmorphism className="h-[600px] flex flex-col">
            <h2 className="text-2xl text-white mb-4">Chat</h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className="p-2 rounded"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="text-sm font-semibold text-white/90">{msg.username}</div>
                  <div className="text-white/70">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-2 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: `2px solid ${colors.accent}`,
                }}
              />
              <TypeHuntButton onClick={sendMessage} variant="accent" size="sm">
                Send
              </TypeHuntButton>
            </div>
          </TypeHuntCard>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerLobby;
