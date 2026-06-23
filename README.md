# ⚽ FIFA World Cup Match Prediction Contest

A full-stack web application for running a FIFA World Cup match prediction contest — built to replace a manual Google Forms workflow.

## Tech Stack

| Layer | Technology |
|-------|----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts (pie charts) |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Icons | Lucide React |

---

## Project Structure

```
fifa-prediction/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── match/       # MatchCard component
│   │   │   └── ui/          # Navbar, LoadingSpinner, ProtectedRoute
│   │   ├── context/         # AuthContext (JWT state)
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Matches.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── PollResult.tsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── CreateMatch.tsx
│   │   │       ├── ManageUsers.tsx
│   │   │       └── ManagePoints.tsx
│   │   ├── services/        # Axios API calls
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── App.tsx          # Routes
│   ├── .env.production      # Production environment
│   └── package.json
│
└── server/                  # Express API
    ├── src/
    │   ├── config/          # MongoDB connection
    │   ├── controllers/     # Business logic
    │   ├── middleware/       # JWT auth + admin guard
    │   ├── models/          # Mongoose schemas
    │   └── routes/          # Express routers
    ├── .env                 # Environment variables
    └── package.json
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or pnpm

### 1. Clone & Install

```bash
# Install all dependencies
npm run install-all
```

### 2. Configure Environment

```bash
# In /server, copy .env.example to .env
cp server/.env.example server/.env
```

Edit `/server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fifa-prediction
JWT_SECRET=your-super-secret-key-min-32-chars
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SUPER_ADMIN_EMAIL=admin@yoursite.com
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=change-me-to-a-strong-password
ADMIN_NAME=Admin
```

### 3. Admin User

The admin user is automatically seeded on startup when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`. Change these to a strong password immediately after first login.

### 4. Run Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

Or in separate terminals:

```bash
# Terminal 1 — Backend
npm run server

# Terminal 2 — Frontend
npm run client
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api/health

---

## Deployment

### Build for Production

```bash
npm run build
```

This will:
1. Install all dependencies
2. Build the React frontend to `client/dist`
3. Compile the TypeScript backend to `server/dist`

### Run Production Build Locally

```bash
npm start
```

The server will serve the frontend build and API from a single port (default: 5000).

### Deploy to Render

**Setup Render Service:**

1. **Environment Variables:**
   ```
   PORT=5000
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<secure-random-string>
   CLIENT_URL=<your-render-url>
   NODE_ENV=production
   SUPER_ADMIN_EMAIL=<your-admin-email>
   ADMIN_EMAIL=<your-admin-email>
   ADMIN_PASSWORD=<strong-password>
   ADMIN_NAME=Admin
   ```

2. **Build Command:**
   ```
   npm run build
   ```

3. **Start Command:**
   ```
   npm start
   ```

4. **Root Directory:** Leave as default or set to `/`

The app will serve both the frontend and backend from the same Render service.

---

## Features

### User Features
- Register / Login (JWT auth, 7-day token)
- View upcoming, open, and completed matches
- Submit predictions during open windows
- View community prediction poll (pie chart) after submitting
- Real-time leaderboard with rank highlighting

### Admin Features
- Dashboard with stats (users, matches, predictions)
- Create matches with auto-generated prediction options
- Declare match results → automatic point award with timestamps
- Manual point adjustment with reason/comment (for migrating Google Form data)
- View all users with point totals

---

## Scoring System

| Scenario | Points |
|----------|--------|
| Correct prediction (base) | +10 |
| First correct predictor | +5 bonus |
| Second correct predictor | +4 bonus |
| Third correct predictor | +3 bonus |
| Incorrect prediction | 0 |

Points are awarded automatically when admin declares the result. Bonus points are calculated based on prediction `createdAt` timestamp (earliest = highest bonus).

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |

### Matches
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/matches` | Public |
| GET | `/api/matches/:id` | Public |
| POST | `/api/matches` | Admin |
| PUT | `/api/matches/:id` | Admin |
| POST | `/api/matches/:id/result` | Admin |

### Predictions
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/predictions` | Auth |
| GET | `/api/predictions/my` | Auth |
| GET | `/api/predictions/poll/:matchId` | Public |

### Leaderboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/leaderboard` | Public |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/users` | Admin |
| POST | `/api/admin/points/adjust` | Admin |
| GET | `/api/admin/points/history/:userId` | Admin |

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire in 7 days
- Rate limiting: 200 requests / 15 min per IP
- Input validation via express-validator
- Request body size limited to 10KB
- CORS restricted to configured CLIENT_URL
- One prediction per user per match (DB-level unique index)
- Admin-only routes guarded by middleware

---

## Database Models

### User
```
name, email (unique), password (hashed), role, points, joinedDate
```

### Match
```
matchNumber (unique), matchDate, teamA {name, flag}, teamB {name, flag},
predictionStart, predictionEnd, status, result, options[]
```

### Prediction
```
userId, matchId, choice (teamA|teamB|draw), pointsAwarded, isCorrect
Unique index: (userId, matchId)
```

### PointHistory
```
userId, points, reason, addedByAdmin, adminId, matchId
```

---

## Troubleshooting

### White Screen Error "cannot get"
- Ensure MongoDB is running
- Check that both backend and frontend servers are running in development
- Verify `.env` file is configured correctly

### Build Issues
- Clear `node_modules` and rebuild: `rm -rf node_modules client/node_modules server/node_modules && npm run install-all`
- Ensure Node.js 18+ is installed: `node --version`

### MongoDB Connection Error
- Ensure MongoDB service is running
- Verify `MONGODB_URI` in `.env` is correct
- For MongoDB Atlas, check IP whitelist and connection string
