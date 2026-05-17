# 🎰 Jokris99 — Premium Casino Platform

> Virtual coins only. Not real gambling.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + TailwindCSS + Zustand + Recharts |
| Backend | Node.js + Express + Socket.IO |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Cache/Realtime | Redis + Socket.IO |

---

## Prerequisites

- Node.js 18+
- PostgreSQL (Neon account at [neon.tech](https://neon.tech))
- Redis (local or [Upstash](https://upstash.com))

---

## Setup

### 1. Clone & enter project

```bash
cd Casino
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://user:pass@your-neon-host/casino?sslmode=require"
REDIS_URL="redis://localhost:6379"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

Push schema to Neon:

```bash
npx prisma db push
```

Generate Prisma client:

```bash
npx prisma generate
```

Seed 20 dummy players:

```bash
npm run db:seed
```

Start backend:

```bash
npm run dev
```

Backend runs on → `http://localhost:3001`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on → `http://localhost:5173`

---

## Pages

| Route | Page |
|---|---|
| `/` | Home — hero, leaderboard preview, player select |
| `/casino` | Casino — slot machine, spin, RTP meter |
| `/leaderboard` | Leaderboard — realtime rankings |
| `/analytics` | Analytics — charts, session stats |
| `/admin` | Admin — debug tools, RTP control, Redis |

---

## API Endpoints

```
GET    /api/player              — all players
GET    /api/player/:id          — single player
GET    /api/player/:id/history  — round history
GET    /api/player/:id/stats    — full stats

POST   /api/game/spin           — { playerId, betAmount }
POST   /api/game/start-session  — { playerId }
POST   /api/game/end-session    — { playerId, sessionId }

GET    /api/rtp/:playerId       — RTP profile
POST   /api/rtp/reset/:playerId — reset RTP

GET    /api/leaderboard?metric= — profit | highestWin | mostActive

POST   /api/admin/simulate-spins      — { playerId, count }
GET    /api/admin/system-stats
POST   /api/admin/force-win-streak    — { playerId, streakLength }
POST   /api/admin/force-lose-streak   — { playerId, streakLength }
GET    /api/admin/inspect-redis
```

---

## Socket.IO Events

```
leaderboard:update   — top players array
player:spin          — { playerId, outcome, betAmount }
player:win           — full result object
player:lose          — full result object
player:balance       — { playerId, newBalance }
player:streak        — { type, count }
system:onlineCount   — { count }
system:bigWin        — { username, payout, multiplier }
feed:recentWins      — recent wins array
```

---

## Dynamic RTP Engine

Base win rate: **45%**

Modifiers applied in order:
1. **Losing streak** → win rate increases up to +12%
2. **Winning streak** → win rate decreases up to -12%
3. **Session fatigue** → longer sessions = worse odds
4. **Pity system** → guaranteed win after 15 consecutive losses
5. **Sympathy** → near-bankrupt players get +15–25% boost
6. **Onboarding** → new players get +12% for first 10 rounds

Win rate is clamped between **15%** and **75%**.

---

## Redis Keys

| Key | Type | Usage |
|---|---|---|
| `leaderboard:profit` | Sorted Set | Top profit rankings |
| `leaderboard:highestWin` | Sorted Set | Biggest single win |
| `leaderboard:mostActive` | Sorted Set | Total rounds played |
| `session:{id}` | String | Active player session |
| `rtp:{id}` | String | Cached RTP profile |
| `cooldown:{id}` | String | Spin cooldown (1.5s) |
| `online:players` | Set | Connected player IDs |
| `feed:wins` | List | Recent win feed |
| `feed:streaks` | Sorted Set | Hot streaks |


# 🎰 Jokris99 — Premium Virtual Casino Platform

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🎰 **Adaptive RTP Engine** | Win rate dihitung dinamis — streak, session fatigue, pity system, sympathy modifier, volatility |
| 🏆 **Realtime Leaderboard** | Update otomatis via Socket.io — ranking profit, biggest win, most active |
| 📊 **Analytics Dashboard** | Grafik balance history, bet vs payout, RTP history, session summary per player |
| 👥 **User Management** | Register, login, guest (auto-delete on logout), ban/unban, hapus akun dengan cascade |
| ⚡ **Redis Caching** | Session, cooldown, leaderboard, win feed, hot streak — semua disimpan di Redis |
| 🔐 **Admin Panel** | PIN-protected: simulate spins, force streak, inspect Redis, manage users |
| 🎮 **6 Game Types** | Slots, Roulette, Coin Flip, Dice Roll, Crash, Card Draw |
| 📱 **Responsive** | Desktop & mobile dengan hamburger menu dan adaptive layout |

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **Vite 8** — UI framework & build tool
- **Tailwind CSS 4** — Utility-first styling
- **Zustand** — State management (auth, player, game, leaderboard, system)
- **Framer Motion** — Animasi
- **Recharts** — Grafik analytics
- **Socket.io Client** — Realtime events
- **Axios** — HTTP client dengan JWT interceptor

### Backend
- **Node.js** + **Express.js** — REST API server
- **Socket.io** — WebSocket server
- **Prisma ORM** — Database abstraction layer
- **ioredis** — Redis client
- **bcryptjs** — Password hashing
- **jsonwebtoken** — JWT authentication
- **express-rate-limit** — Rate limiting

### Database & Infrastructure
- **PostgreSQL** (Neon) — Database utama
- **Redis** — Caching & realtime data
- **Prisma** — Schema & migrations

---

## 🏗 Arsitektur Sistem

```
┌─────────────────┐         HTTP / WebSocket          ┌──────────────────┐
│   CLIENT        │ ────────────────────────────────► │   BACKEND        │
│                 │                                    │                  │
│  React 19       │ ◄──────────────────────────────── │  Express.js      │
│  Zustand        │      REST API + Socket.io          │  Socket.io       │
│  Socket.io      │                                    │  RTP Engine      │
│  Recharts       │                                    │  Redis Service   │
└─────────────────┘                                    └────────┬─────────┘
                                                                │
                                              ┌─────────────────┴──────────────┐
                                              │                                │
                                     ┌────────▼────────┐             ┌────────▼────────┐
                                     │  PostgreSQL      │             │     Redis        │
                                     │                  │             │                  │
                                     │  User            │             │  Leaderboard     │
                                     │  Player          │             │  (Sorted Set)    │
                                     │  GameSession     │             │  Session Cache   │
                                     │  GameRound       │             │  Win Feed (List) │
                                     │  RTPProfile      │             │  Cooldown (TTL)  │
                                     └──────────────────┘             └──────────────────┘
```

---

## 🗄 Database Schema (ERD)

```
USER ──────────────── PLAYER ──────────────── RTPProfile
(1)                    (1)                        (1)
 │                      │
 │                    (1:N)──────── GameSession ─── GameRound
 │                    (1:N)──────────────────────── GameRound
```

### Model Detail

<details>
<summary><strong>User</strong></summary>

| Field | Type | Keterangan |
|---|---|---|
| `id` | UUID PK | Primary key |
| `username` | String UNIQUE | Username unik |
| `email` | String UNIQUE | Email unik |
| `passwordHash` | String | Hash bcrypt (10 rounds) |
| `isBanned` | Boolean | Status ban (default: false) |
| `bannedAt` | DateTime? | Waktu di-ban |
| `guestAccount` | Boolean | Akun guest (auto-delete on logout) |
| `createdAt` | DateTime | Waktu registrasi |

</details>

<details>
<summary><strong>Player</strong></summary>

| Field | Type | Keterangan |
|---|---|---|
| `id` | UUID PK | Primary key |
| `userId` | UUID FK | Relasi ke User (1:1) |
| `username` | String UNIQUE | Username player |
| `balance` | Float | Saldo saat ini |
| `level` | Int | Level player |
| `totalWins` | Int | Total menang |
| `totalLosses` | Int | Total kalah |
| `totalProfit` | Float | Net profit |
| `totalBetAmount` | Float | Total taruhan |
| `highestSingleWin` | Float | Kemenangan terbesar |

</details>

<details>
<summary><strong>RTPProfile</strong></summary>

| Field | Type | Keterangan |
|---|---|---|
| `playerId` | UUID FK | Relasi ke Player (1:1) |
| `currentWinRate` | Float | Win rate saat ini |
| `winModifier` | Float | Modifier tambahan (admin override) |
| `losingStreak` | Int | Streak kalah beruntun |
| `winningStreak` | Int | Streak menang beruntun |
| `sessionFatigue` | Float | Fatigue sesi (0–0.1) |
| `pityCounter` | Int | Counter pity (force win di 15) |
| `volatilityLevel` | Float | Level volatilitas (0.8/1.0/1.3) |

</details>

<details>
<summary><strong>GameSession & GameRound</strong></summary>

`GameSession` — Satu sesi bermain per player, berisi summary statistik sesi.

`GameRound` — Setiap spin tersimpan: `betAmount`, `payout`, `outcome`, `winRateUsed`, `streakBefore/After`.

</details>

---

## 🎲 RTP Engine

Win rate dihitung secara dinamis setiap spin menggunakan 7 modifier:

```
Base Win Rate: 45%
      │
      ├── + Losing Streak Bonus    (+3% / +7% / +12% pada threshold 3/6/10)
      ├── - Winning Streak Penalty (-3% / -7% / -12% pada threshold 3/5/8)
      ├── - Session Fatigue        (-0.2% per ronde, max -10%)
      ├── + Pity System            (boost mulai ≥70% threshold, force win di ronde ke-15)
      ├── + Sympathy Modifier      (+15% jika saldo <15%, +25% jika saldo <5%)
      ├── × Volatility Multiplier  (×0.8 low / ×1.0 medium / ×1.3 high)
      └── + Win Modifier           (admin override, tersimpan di RTPProfile)
                │
                ▼
        Diklem: 15% – 75%
```

---

## 📁 Struktur Proyek

```
FinalProjectSistemBasisData/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 5 model database
│   │   ├── seed.js                # Seed 20 player dummy
│   │   └── cleanupGuests.js       # Hapus semua akun guest
│   └── src/
│       ├── config/
│       │   ├── prisma.js          # Prisma client singleton
│       │   └── redis.js           # Redis client (ioredis)
│       ├── controllers/
│       │   ├── adminController.js # Ban/unban/delete + tools
│       │   ├── gameController.js  # Spin, start/end session
│       │   ├── playerController.js
│       │   ├── rtpController.js
│       │   └── leaderboardController.js
│       ├── routes/
│       │   ├── authRoutes.js      # Register/login/guest/delete-self
│       │   ├── adminRoutes.js     # Ban/unban/delete/tools
│       │   ├── gameRoutes.js
│       │   ├── playerRoutes.js
│       │   ├── rtpRoutes.js
│       │   └── leaderboardRoutes.js
│       ├── services/
│       │   ├── rtpEngine.js       # Dynamic win rate calculator
│       │   ├── gameService.js     # processSpin orchestrator
│       │   └── redisService.js    # Semua operasi Redis
│       ├── sockets/
│       │   └── socketHandler.js   # Socket.io event handlers
│       ├── middleware/
│       │   └── index.js           # Rate limiter, error handler
│       └── index.js               # Entry point Express server
│
└── frontend/
    └── src/
        ├── components/
        │   ├── SlotReels.jsx      # Animasi reel slot (1.5s delay per reel)
        │   ├── Navbar.jsx         # Responsive + guest banner + hapus akun
        │   ├── ConfirmDialog.jsx  # Modal konfirmasi reusable
        │   ├── LoadingScreen.jsx  # Splash screen
        │   ├── Notification.jsx
        │   ├── RTPMeter.jsx
        │   └── StatCard.jsx
        ├── pages/
        │   ├── CasinoPage.jsx     # Main spin interface
        │   ├── AdminPage.jsx      # PIN-protected admin panel
        │   ├── AnalyticsPage.jsx  # Recharts dashboard
        │   ├── LeaderboardPage.jsx
        │   ├── GamesPage.jsx      # 6 mini games
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   └── WelcomePage.jsx    # Loading screen post-login
        ├── hooks/
        │   └── useSocketEvents.js # Socket.io event subscriptions
        ├── services/
        │   └── api.js             # Axios instance + 15 API functions
        ├── socket/
        │   └── socketClient.js    # Singleton socket (reconnect on user change)
        ├── store/
        │   └── index.js           # 5 Zustand stores
        └── App.jsx                # Router + GuestBanner
```

---

## 🚀 Instalasi & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (lokal atau [Neon](https://neon.tech))
- Redis (lokal atau [Upstash](https://upstash.com))

### 1. Clone Repository

```bash
git clone https://github.com/username/jokris99.git
cd jokris99
```

### 2. Setup Backend

```bash
cd backend
npm install

# Salin file env dan isi nilainya
cp .env.example .env
# Edit .env dengan DATABASE_URL dan REDIS_URL kamu

# Generate Prisma client
npm run db:generate

# Push schema ke database
npm run db:push

# (Opsional) Isi dengan data dummy
npm run db:seed

# Jalankan server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install

# Buat file .env
echo "VITE_API_URL=/api" > .env
echo "VITE_SOCKET_URL=http://localhost:3001" >> .env
echo "VITE_ADMIN_PIN=1234" >> .env

# Jalankan dev server
npm run dev
```

### 4. Buka di Browser

```
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Contoh | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Connection string PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | URL Redis server |
| `JWT_SECRET` | `your_secret_key_here` | Secret untuk signing JWT |
| `PORT` | `3001` | Port backend server |
| `NODE_ENV` | `development` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:5173` | URL frontend yang diizinkan |

### Frontend (`frontend/.env`)

| Variable | Contoh | Keterangan |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL API (proxy via Vite) |
| `VITE_SOCKET_URL` | `http://localhost:3001` | URL Socket.io server |
| `VITE_ADMIN_PIN` | `1234` | PIN untuk akses admin panel |

---

## 📡 API Reference

### Auth

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user baru (balance: 10.000) | — |
| `POST` | `/api/auth/login` | Login dengan username/email + password | — |
| `POST` | `/api/auth/guest` | Guest login (balance: 5.000, temp) | — |
| `GET` | `/api/auth/me` | Get current user & player | ✅ JWT |
| `DELETE` | `/api/auth/me` | Hapus akun sendiri (cascade) | ✅ JWT |

### Game

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/game/spin` | Jalankan spin (cooldown 1.5s via Redis) | ✅ |
| `POST` | `/api/game/start-session` | Mulai sesi bermain | ✅ |
| `POST` | `/api/game/end-session` | Akhiri sesi + hitung averageBet | ✅ |

### Player

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/player` | Semua player (include user.isBanned) |
| `GET` | `/api/player/:id` | Player by ID + RTP Profile |
| `GET` | `/api/player/:id/stats` | Stats lengkap + sessions |
| `GET` | `/api/player/:id/history` | Riwayat game rounds |

### Admin

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/admin/ban/:userId` | Ban user (hapus session Redis) |
| `POST` | `/api/admin/unban/:userId` | Unban user |
| `DELETE` | `/api/admin/user/:userId` | Hapus user + cascade delete |
| `POST` | `/api/admin/simulate-spins` | Simulasi N spin (max 500) |
| `GET` | `/api/admin/system-stats` | System stats + banned count |
| `POST` | `/api/admin/force-win-streak` | Override win streak |
| `POST` | `/api/admin/force-lose-streak` | Override lose streak |
| `GET` | `/api/admin/inspect-redis` | Lihat semua key Redis |

### Lainnya

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/leaderboard` | Leaderboard + recent wins + hot streaks |
| `GET` | `/api/rtp/:playerId` | Get RTP Profile |
| `POST` | `/api/rtp/reset/:playerId` | Reset RTP Profile ke default |
| `GET` | `/api/health` | Health check |

---

## 🔧 Fitur Admin

Admin panel dilindungi PIN (default: `1234`, set via `VITE_ADMIN_PIN`).

### Player Accounts
- List semua akun dengan search real-time dan sort 6 kolom
- Filter: Semua / Aktif / Banned
- Klik baris → detail modal (stats, RTP profile, aksi)

### Aksi Per User
| Aksi | Efek |
|---|---|
| 🚫 **Ban** | Set `isBanned=true`, hapus Redis session (user ter-logout paksa) |
| ✅ **Unban** | Set `isBanned=false`, user bisa login kembali |
| 🗑️ **Hapus Permanen** | Cascade delete: `GameRound → GameSession → RTPProfile → Player → User` |

### Tools Lain
- **Force Streak** — Override win/lose streak untuk testing RTP Engine
- **Simulate Spins** — Jalankan N spin otomatis (max 500) tanpa animasi frontend
- **Inspect Redis** — Lihat semua key-value di Redis secara realtime

---

## 👤 Guest System

```
Login Guest
    │
    ├── Buat User (guestAccount: true) + Player (balance: 5.000)
    ├── JWT expire dalam 1 hari
    ├── Tampilkan GuestBanner (sticky di bawah Navbar)
    │       └── Info: saldo terbatas + tombol REGISTER SEKARANG
    │
    └── Saat Logout atau Klik REGISTER SEKARANG
            ├── DELETE /api/auth/me (hapus User + cascade)
            └── Clear token & redirect ke /login atau /register
```

---

## 🎰 Spin Game Flow

```
User klik SPIN
    │
    ├─► Kurangi saldo di UI (optimistic update)
    ├─► isRolling = true (disable tombol + input)
    ├─► POST /api/game/spin
    │       ├─► Cek cooldown Redis (1.5s)
    │       ├─► Load Player + RTPProfile
    │       ├─► Hitung win rate (RTP Engine, 7 modifier)
    │       ├─► Generate outcome (Math.random vs winRate)
    │       ├─► Prisma $transaction (GameRound + Player + GameSession + RTPProfile)
    │       ├─► Update Redis (leaderboard, win feed, hot streak)
    │       └─► Emit Socket.io events
    │
    ├─► Animasi reel berputar (1.8s)
    ├─► Reel 1 berhenti (0ms) → Reel 2 (1.5s) → Reel 3 (3s)
    ├─► Tampilkan outcome badge + flash overlay
    ├─► Jika WIN: tambah payout ke saldo
    └─► isRolling = false (buka kembali tombol)
```

---

## 🔌 Socket.io Events

### Server → Client

| Event | Payload | Keterangan |
|---|---|---|
| `leaderboard:update` | Array ranking | Update leaderboard realtime |
| `feed:recentWins` | Array win | Feed kemenangan terbaru |
| `system:onlineCount` | `{ count }` | Jumlah player online |
| `player:win` | Result object | Notifikasi hasil menang |
| `player:lose` | Result object | Notifikasi hasil kalah |
| `system:bigWin` | `{ username, payout }` | Big win broadcast ke semua |
| `player:spin` | Spin data | Feed aktivitas spin global |

---

## 📝 NPM Scripts

### Backend

```bash
npm run dev          # Jalankan dengan nodemon (hot reload)
npm run start        # Jalankan production
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema ke DB (tanpa migration file)
npm run db:seed      # Isi DB dengan 20 player dummy
npm run db:studio    # Buka Prisma Studio (GUI database)
```

### Frontend

```bash
npm run dev          # Dev server (port 5173)
npm run build        # Build production
npm run preview      # Preview build
npm run lint         # ESLint check
```

---

## ⚠️ Catatan Penting

> **Disclaimer:** Jokris99 adalah proyek akademis untuk keperluan mata kuliah Sistem Basis Data. Platform ini menggunakan mata uang virtual (koin) dan tidak melibatkan transaksi uang nyata. RTP Engine dirancang untuk tujuan demonstrasi sistem basis data, bukan untuk digunakan sebagai platform perjudian nyata.

---

<div align="center">

**Jokris99** — Final Project Sistem Basis Data

Made with ❤️ and ☕

</div>
