import { Router, Request, Response } from 'express';

const router = Router();

interface ESPNTeam {
  displayName: string;
  abbreviation: string;
  logo?: string;
}

interface ESPNCompetitor {
  team: ESPNTeam;
  score: string;
  winner?: boolean;
  homeAway?: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: { state: string; description: string; completed: boolean };
    displayClock?: string;
  };
  competitions: Array<{ competitors: ESPNCompetitor[] }>;
}

let cachedEvents: ESPNEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/fifa/results
 * Fetches FIFA World Cup 2026 matches from ESPN with caching
 */
router.get('/results', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    
    // Return cached results if still valid
    if (cachedEvents && (now - lastFetchTime) < CACHE_DURATION) {
      res.json(cachedEvents);
      return;
    }

    const today = new Date();
    const start = new Date('2026-06-11');
    const future = new Date(today);
    future.setDate(future.getDate() + 3);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmt(start)}-${fmt(future)}&limit=50`;

    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      throw new Error(`ESPN API returned ${fetchRes.status}`);
    }

    const json = await fetchRes.json();
    const all: ESPNEvent[] = json.events || [];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    cachedEvents = all;
    lastFetchTime = now;

    res.json(all);
  } catch (error) {
    console.error('FIFA results fetch error:', error);
    res.status(500).json({ message: 'Could not fetch FIFA results' });
  }
});

export default router;
