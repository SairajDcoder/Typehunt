# ⌨️ TypeHunt — Real-Time Multiplayer Typing Game

**TypeHunt** is a competitive typing game where players test their speed and accuracy across multiple game modes. Built with a modern React frontend and a scalable Node.js backend, it features real-time multiplayer races, MonkeyType-style inline typing, an Elo ranking system, and anti-cheat protection.

> Hunt Words. Beat Time. Dominate Speed.

---

## 🎮 Game Modes

### ⚡ Singleplayer
- Configurable word count (10 / 25 / 50 / 100)
- Toggle punctuation, numbers, and capitalization
- Real-time WPM and accuracy tracking
- Server-side result validation and stat saving

### 💀 Hardcore Mode
- **One mistake = Game Over** — instant fail on any wrong character
- Tracks personal best scores
- Flawless completion earns a trophy

### 👥 Multiplayer
- **Lobby System** — create or join rooms with a 6-character code
- **Real-time racing** — see opponent progress bars live
- **Lobby chat** — communicate with opponents before the race
- **Host controls** — configure word count, punctuation, numbers, caps
- **Ready system** — all players must be ready before starting
- **Elo ranking** — gain or lose rating based on race results

---

## 🧩 Key Features

| Feature | Description |
|---------|-------------|
| **MonkeyType-style typing** | Inline typing with per-character color coding (white = correct, red = wrong), animated cursor, no input box |
| **Real-time WebSocket engine** | Socket.IO powers countdown sync, live progress, and instant race results |
| **Anti-cheat** | Server-side WPM validation, keystroke timing analysis, paste detection |
| **Elo ranking system** | Multiplayer matches adjust player ratings; leaderboard tracks top players |
| **JWT authentication** | Secure login/register with token-based sessions |
| **Profile dashboard** | View total games, best WPM, avg accuracy, match history, progress chart |
| **Responsive design** | Glassmorphism UI with theme support (Blue Frost / Teal Ocean) |

---

## 🏗️ Tech Stack

### Frontend
- **React 19** + **TypeScript** — UI framework
- **Vite** — Build tool and dev server
- **React Router v7** — Client-side routing
- **Framer Motion** — Animations and transitions
- **MUI / Radix UI** — Component primitives
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Profile dashboard charts
- **Socket.IO Client** — Real-time WebSocket communication
- **Lucide React** — Icon library

### Backend
- **Node.js 20+** + **Express.js** — REST API server
- **Socket.IO** — Real-time bidirectional communication
- **PostgreSQL** — Persistent data storage (users, matches, rankings)
- **Prisma ORM** — Type-safe database access and migrations
- **Redis (ioredis)** — In-memory lobby state and game sessions
- **JSON Web Tokens (JWT)** — Authentication
- **Zod** — Request validation schemas
- **Winston** — Structured logging
- **Swagger / OpenAPI** — Auto-generated API docs at `/api/docs`
- **Express Rate Limit** — API abuse prevention

---

## 📁 Project Structure

```
Typehunt/
├── src/                          # Frontend source
│   ├── app/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── TypingArea.tsx    # MonkeyType-style inline typing engine
│   │   │   ├── TypeHuntButton.tsx
│   │   │   ├── TypeHuntCard.tsx
│   │   │   ├── TypeHuntModal.tsx
│   │   │   ├── TypeHuntToggle.tsx
│   │   │   └── TypeHuntBadge.tsx
│   │   ├── contexts/
│   │   │   ├── ThemeContext.tsx   # Theme state (Blue Frost / Teal Ocean)
│   │   │   └── AuthContext.tsx   # Auth state (JWT, user, login/logout)
│   │   ├── services/
│   │   │   ├── api.ts            # REST API client with JWT headers
│   │   │   └── socket.ts        # Socket.IO client wrapper
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AuthPage.tsx      # Login / Register
│   │   │   ├── GameModeSelection.tsx
│   │   │   ├── SingleplayerScreen.tsx
│   │   │   ├── HardcoreMode.tsx
│   │   │   ├── MultiplayerLobby.tsx
│   │   │   ├── MultiplayerRace.tsx
│   │   │   ├── ProfileDashboard.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── routes.tsx
│   │   └── App.tsx
│   └── main.tsx
│
├── server/                       # Backend source
│   ├── src/
│   │   ├── config/               # Environment, Redis, Logger, Swagger
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/            # Auth, validation, rate limiting, errors
│   │   ├── routes/               # REST API route definitions
│   │   ├── services/             # Business logic (auth, game, lobby, ranking, anticheat, words)
│   │   ├── sockets/              # Socket.IO event handlers (lobby, game)
│   │   ├── types/                # Shared TypeScript interfaces
│   │   ├── utils/                # Helpers (WPM calc, code gen, shuffle)
│   │   └── index.ts              # Server entry point
│   ├── prisma/
│   │   └── schema.prisma         # Database schema (User, GameResult, Lobby, Match, Ranking)
│   ├── words/
│   │   └── english.json          # 500+ word dictionary
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+
- **PostgreSQL** (local or cloud)
- **Redis** (local or cloud)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/typehunt.git
cd typehunt
```

### 2. Install frontend dependencies
```bash
npm install
```

### 3. Install backend dependencies
```bash
cd server
npm install
```

### 4. Configure environment
```bash
cp .env.example .env
```

Edit `server/.env` and set:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/typehunt
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
```

### 5. Set up the database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start the backend
```bash
npm run dev
# → API running at http://localhost:3001
# → Swagger docs at http://localhost:3001/api/docs
```

### 7. Start the frontend (new terminal)
```bash
cd ..
npm run dev
# → App running at http://localhost:5173
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, receive JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/auth/stats` | Get aggregated game stats |
| `GET` | `/api/game/words` | Generate random word set |
| `POST` | `/api/game/submit` | Submit singleplayer result |
| `POST` | `/api/game/hardcore/submit` | Submit hardcore result |
| `GET` | `/api/game/history` | Get match history |
| `POST` | `/api/lobby/create` | Create multiplayer lobby |
| `GET` | `/api/lobby/:code` | Get lobby info |
| `POST` | `/api/lobby/:code/join` | Join a lobby |
| `GET` | `/api/leaderboard` | Global leaderboard |

Full interactive docs available at **`/api/docs`** (Swagger UI).

---

## 📡 WebSocket Events

### Lobby Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `lobby:join` | Client → Server | Join a lobby room |
| `lobby:leave` | Client → Server | Leave a lobby |
| `lobby:ready` | Client → Server | Toggle ready state |
| `lobby:chat` | Client → Server | Send chat message |
| `lobby:playerJoined` | Server → Client | Player joined notification |
| `lobby:playerLeft` | Server → Client | Player left notification |
| `lobby:chatMessage` | Server → Client | New chat message |

### Game Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `game:start` | Client → Server | Host starts the game |
| `game:countdown` | Server → Client | Countdown tick (3, 2, 1) |
| `game:started` | Server → Client | Game started with word set |
| `game:progress` | Client → Server | Player typing progress |
| `game:progressUpdate` | Server → Client | All players' progress |
| `game:playerFinished` | Server → Client | A player completed the race |
| `game:ended` | Server → Client | Final results with Elo changes |

---

## 🗄️ Database Schema

```
User ──── GameResult (1:N)     Singleplayer/Hardcore results
  │
  ├──── Ranking (1:1)          Elo rating + wins/losses
  │
  └──── MatchParticipant (N:M) Multiplayer match participation
              │
         MultiplayerMatch      Match metadata + winner
              │
           Lobby               Room state + settings
```

---

## 🎨 Themes

TypeHunt ships with two built-in themes, switchable from the Settings page:

| Theme | Primary | Accent |
|-------|---------|--------|
| **Blue Frost** | `#355872` | `#9CD5FF` |
| **Teal Ocean** | `#005461` | `#249E94` |

---

## 🛡️ Anti-Cheat System

- **WPM cap** — Rejects submissions above 250 WPM
- **Keystroke timing** — Detects inhuman typing intervals
- **Server-side recalculation** — WPM/accuracy computed server-side from timestamps
- **Paste detection** — Flags bulk input patterns

---

## 📜 License

This project is for educational and hackathon purposes.