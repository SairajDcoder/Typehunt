import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Play, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TypeHuntButton } from '../components/TypeHuntButton';
import { TypeHuntCard } from '../components/TypeHuntCard';

interface Player {
  id: string;
  name: string;
  ready: boolean;
  isHost: boolean;
}

const MultiplayerLobby: React.FC = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [lobbyCode, setLobbyCode] = useState('');
  const [inLobby, setInLobby] = useState(false);
  const [currentLobbyCode] = useState('GAME' + Math.random().toString(36).substring(7).toUpperCase());
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'You', ready: false, isHost: true },
    { id: '2', name: 'Player 2', ready: true, isHost: false },
    { id: '3', name: 'Player 3', ready: false, isHost: false },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { player: 'Player 2', message: 'Ready to race!' },
    { player: 'You', message: 'Let\'s go!' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const createLobby = () => {
    setInLobby(true);
  };

  const joinLobby = () => {
    if (lobbyCode.trim()) {
      setInLobby(true);
    }
  };

  const copyLobbyCode = () => {
    navigator.clipboard.writeText(currentLobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = (playerId: string) => {
    setPlayers(players.map(p => 
      p.id === playerId ? { ...p, ready: !p.ready } : p
    ));
  };

  const startGame = () => {
    navigate(`/multiplayer/race/${currentLobbyCode}`);
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { player: 'You', message: chatInput }]);
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
                className="flex-1 p-3 rounded-lg"
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

  return (
    <div
      className="min-h-screen p-8"
      style={{
        background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`,
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setInLobby(false)}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          Leave Lobby
        </button>
        <div className="flex items-center gap-3">
          <div className="text-white text-xl font-mono">{currentLobbyCode}</div>
          <button
            onClick={copyLobbyCode}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
      </div>

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
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: colors.accent }}
                    >
                      {player.name[0]}
                    </div>
                    <div>
                      <div className="text-white">
                        {player.name}
                        {player.isHost && (
                          <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                            HOST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {player.id === '1' ? (
                      <TypeHuntButton
                        onClick={() => toggleReady(player.id)}
                        variant={player.ready ? 'accent' : 'ghost'}
                        size="sm"
                      >
                        {player.ready ? 'Ready' : 'Not Ready'}
                      </TypeHuntButton>
                    ) : (
                      <span className={`text-sm ${player.ready ? 'text-green-400' : 'text-white/60'}`}>
                        {player.ready ? '✓ Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Host Controls */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="text-white text-lg mb-3">Host Settings</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                >
                  <option>25 words</option>
                  <option>50 words</option>
                  <option>100 words</option>
                </select>
                <select
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
                >
                  <option>Normal Mode</option>
                  <option>Hard Mode</option>
                </select>
              </div>
            </div>

            <TypeHuntButton
              onClick={startGame}
              variant="highlight"
              size="lg"
              className="w-full mt-6"
            >
              <div className="flex items-center justify-center gap-2">
                <Play size={20} />
                Start Game
              </div>
            </TypeHuntButton>
          </TypeHuntCard>
        </div>

        {/* Chat Sidebar */}
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
                  <div className="text-sm font-semibold text-white/90">{msg.player}</div>
                  <div className="text-white/70">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
