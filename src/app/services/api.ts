const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('typehunt-token');
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const token = this.getToken();

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  }

  // Auth
  async register(email: string, username: string, password: string) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: { email, username, password },
    });
  }

  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async googleAuth(idToken: string) {
    return this.request<any>('/auth/google', {
      method: 'POST',
      body: { idToken },
    });
  }

  async getProfile() {
    return this.request<any>('/auth/me');
  }

  async getStats() {
    return this.request<any>('/auth/stats');
  }

  // Game
  async getWords(options: { count?: number; punctuation?: boolean; numbers?: boolean; caps?: boolean; category?: string } = {}) {
    const params = new URLSearchParams();
    if (options.count) params.set('count', String(options.count));
    if (options.punctuation) params.set('punctuation', 'true');
    if (options.numbers) params.set('numbers', 'true');
    if (options.caps) params.set('caps', 'true');
    if (options.category) params.set('category', options.category);
    return this.request<any>(`/game/words?${params.toString()}`);
  }

  async getLiveStats() {
    return this.request<any>('/game/stats');
  }

  async submitSingleplayer(data: {
    wordSet: string[];
    typedWords: string[];
    startTime: number;
    endTime: number;
    keystrokeTimestamps?: number[];
  }) {
    return this.request<any>('/game/submit', {
      method: 'POST',
      body: data,
    });
  }

  async submitHardcore(data: {
    wordSet: string[];
    typedWords: string[];
    startTime: number;
    endTime: number;
  }) {
    return this.request<any>('/game/hardcore/submit', {
      method: 'POST',
      body: data,
    });
  }

  async getHardcoreHighscores(limit = 20) {
    return this.request<any>(`/game/hardcore/highscores?limit=${limit}`);
  }

  async getGameHistory(limit = 20, offset = 0) {
    return this.request<any>(`/game/history?limit=${limit}&offset=${offset}`);
  }

  // Lobby
  async createLobby(settings?: any, playerLimit?: number) {
    return this.request<any>('/lobby/create', {
      method: 'POST',
      body: { settings, playerLimit },
    });
  }

  async getLobbyInfo(code: string) {
    return this.request<any>(`/lobby/${code}`);
  }

  async joinLobby(code: string) {
    return this.request<any>(`/lobby/${code}/join`, { method: 'POST' });
  }

  async updateLobbySettings(code: string, settings: any) {
    return this.request<any>(`/lobby/${code}/settings`, {
      method: 'PUT',
      body: settings,
    });
  }

  // Leaderboard
  async getLeaderboard(limit = 50, offset = 0) {
    return this.request<any>(`/leaderboard?limit=${limit}&offset=${offset}`);
  }

  async getTopPlayers() {
    return this.request<any>('/leaderboard/top');
  }

  async getMyRank() {
    return this.request<any>('/leaderboard/me');
  }
}

export const api = new ApiClient(API_BASE_URL);
