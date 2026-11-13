# ⚽ FootyPredict

A community football prediction app for league fixtures and international football throughout the season. Players predict match outcomes, discuss fixtures, and compete on the leaderboard.

## Product scope

- Year-round match predictions, instead of a World Cup-only contest
- Community discussion, public leaderboard, and match-by-match prediction polls
- Featured fixtures from major European competitions
- Admin-managed prediction matches and result declarations

The app's own match board is the source of truth for predictions and scoring. Admins create fixtures and declare their results. The live league scoreboard is a separate ESPN-powered convenience widget; it does not automatically create matches or award points.

## Tech stack

| Layer | Technology |
|-------|----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT |

## Run locally

Requirements: Node.js 18+, MongoDB, and npm.

```bash
npm run install-all
cp server/.env.example server/.env
# Set MONGODB_URI, JWT_SECRET, and admin credentials in server/.env
npm run dev
```

The Vite client runs on port 5173 and the API on port 5000. To build for production, run `npm run build`; to serve the production build, run `npm start`.

## Admin-managed fixtures

Use the admin panel to add a fixture with its competition name, kickoff time, teams, and prediction window. Competition names are free text, so domestic leagues, cups, and international matches can all be represented. Predictions lock at the configured deadline. Admins with score permissions declare results and the existing scoring rules award points.

## ESPN live scoreboard

The dashboard shows a best-effort scoreboard for selected leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and Champions League). The scoreboard is informational only and may be unavailable or incomplete; it is not used for prediction deadlines, fixture creation, or scoring.
