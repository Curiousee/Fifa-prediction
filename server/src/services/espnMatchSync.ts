import Match from '../models/Match';

interface ESPNTeam {
  displayName: string;
  abbreviation: string;
  logo?: string;
}

interface ESPNCompetitor {
  team: ESPNTeam;
  score?: string;
  homeAway: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: { type: { state: string; completed: boolean } };
  competitions: Array<{
    competitors: ESPNCompetitor[];
    venue?: { fullName: string };
  }>;
}

interface ESPNScoreboard {
  events?: ESPNEvent[];
}

/**
 * Fuzzy-matches an ESPN team name against a stored team name.
 */
function teamMatches(espnName: string, storedName: string): boolean {
  const a = espnName.toLowerCase().trim();
  const b = storedName.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/**
 * Fetches upcoming/recent FIFA World Cup 2026 matches from ESPN
 * and syncs them with the database.
 */
export async function syncESPNMatches(): Promise<void> {
  try {
    const today = new Date();
    const start = new Date('2026-06-11');
    const end = new Date('2026-07-20');

    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmt(start)}-${fmt(end)}&limit=200`;

    console.log('[ESPNSync] Fetching FIFA World Cup 2026 matches from ESPN...');
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[ESPNSync] ESPN API returned status ${res.status}`);
      return;
    }

    const data = (await res.json()) as ESPNScoreboard;
    const events = data.events || [];

    if (events.length === 0) {
      console.log('[ESPNSync] No events found from ESPN');
      return;
    }

    console.log(`[ESPNSync] Found ${events.length} matches from ESPN`);

    // Get all existing matches from database
    const dbMatches = await Match.find({});
    let synced = 0;

    for (const espnEvent of events) {
      const comps = espnEvent.competitions?.[0]?.competitors;
      if (!comps || comps.length < 2) continue;

      const home = comps.find((c) => c.homeAway === 'home') ?? comps[0];
      const away = comps.find((c) => c.homeAway === 'away') ?? comps[1];

      // Try to find matching database match
      const dbMatch = dbMatches.find((m) => {
        const matchHomeAway =
          teamMatches(home.team.displayName, m.teamA.name) &&
          teamMatches(away.team.displayName, m.teamB.name);
        const matchReversed =
          teamMatches(home.team.displayName, m.teamB.name) &&
          teamMatches(away.team.displayName, m.teamA.name);
        return matchHomeAway || matchReversed;
      });

      if (!dbMatch) continue;

      // Update match date from ESPN data
      const espnDate = new Date(espnEvent.date);
      if (espnDate.getTime() !== new Date(dbMatch.matchDate).getTime()) {
        dbMatch.matchDate = espnDate;
        await dbMatch.save();
        synced++;
      }

      // Update status based on ESPN state
      const espnState = espnEvent.status?.type?.state;
      let newStatus: 'upcoming' | 'open' | 'closed' | 'completed' = dbMatch.status;

      if (espnState === 'post' && espnEvent.status?.type?.completed) {
        newStatus = 'completed';
      } else if (espnState === 'live' || espnState === 'in_progress') {
        newStatus = 'closed';
      } else if (espnState === 'pre') {
        const now = new Date();
        if (now < new Date(dbMatch.predictionEnd)) {
          newStatus = 'open';
        } else {
          newStatus = 'closed';
        }
      }

      if (newStatus !== dbMatch.status && dbMatch.status !== 'completed') {
        dbMatch.status = newStatus;
        await dbMatch.save();
      }
    }

    console.log(`[ESPNSync] Synced ${synced} matches with ESPN data`);
  } catch (err) {
    console.error('[ESPNSync] Error syncing with ESPN:', err);
  }
}

/**
 * Starts periodic ESPN sync service
 */
export function startESPNSyncService(): void {
  console.log('[ESPNSync] Service started — syncing every 30 minutes');
  // Run once immediately after slight delay
  setTimeout(() => syncESPNMatches(), 5_000);
  // Then run on interval (30 minutes)
  setInterval(() => syncESPNMatches(), 30 * 60 * 1000);
}
