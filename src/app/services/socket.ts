import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Lobby events
  joinLobby(code: string): void {
    this.socket?.emit('lobby:join', { code });
  }

  leaveLobby(code: string): void {
    this.socket?.emit('lobby:leave', { code });
  }

  setReady(code: string, ready: boolean): void {
    this.socket?.emit('lobby:ready', { code, ready });
  }

  sendChat(code: string, message: string): void {
    this.socket?.emit('lobby:chat', { code, message });
  }

  kickPlayer(code: string, targetUserId: string): void {
    this.socket?.emit('lobby:kick', { code, targetUserId });
  }

  updateSettings(code: string, settings: any): void {
    this.socket?.emit('lobby:settings', { code, settings });
  }

  // Game events
  startGame(code: string): void {
    this.socket?.emit('game:start', { code });
  }

  sendProgress(data: {
    code: string;
    currentWordIndex: number;
    correctWords: number;
    totalKeystrokes: number;
    correctKeystrokes: number;
    keystrokeTimestamp?: number;
  }): void {
    this.socket?.emit('game:progress', data);
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }
}

export const socketService = new SocketService();
