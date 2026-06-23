import Match from '../models/Match';
import Prediction from '../models/Prediction';
import User from '../models/User';
import PointHistory from '../models/PointHistory';

interface ESPNCompetitor {
  team: { displayName: string; abbreviation: string };
  score: string;
  winner?: boolean;
  homeAway: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  status: { type: { state: string; completed: boolean } };
  competitions: Array<{ competitors: ESPNCompetitor[] }>;
}

/**
 * Determines the match result from ESPN competitor data.
 * Returns 'teamA' | 'teamB' | 'draw' based on scores.
 */
function resolveResult(
  homeScore: number,
  awayScore: number
): 'teamA' | 'teamB' | 'draw' {
  if (homeScore > awayScore) return 'teamA';
  if (awayScore > homeScore) return 'teamB';
  return 'draw';
}

/**
 * Fuzzy-matches an ESPN team name against a stored team name.
 * Handles abbreviations and partial matches.
 */
function teamMatches(espnName: string, storedName: string): boolean {
  const a = espnName.toLowerCase().trim();
  const b = storedName.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

/**
 * Awards points using the same logic as declareResult:
 * - First correct predictor gets 2 pts
 * - All other correct predictors get 1 pt
 * - Incorrect predictions get 0 pts
 */
async function awardPoints(
  matchId: string,
  matchNumber: number,
  teamAName: string,
  teamBName: string,
  result: 'teamA' | 'teamB' | 'draw'
): Promise<number> {
  const correctPredictions = await Prediction.find({
    matchId,
    choice: result,
  }).sort({ createdAt: 1 });

  for (let index = 0; index < correctPredictions.length; index++) {
    const prediction = correctPredictions[index];
    const totalPoints = index === 0 ? 2 : 1;
    const isFirst = index === 0;

    prediction.isCorrect = true;
    prediction.pointsAwarded = totalPoints;
    await prediction.save();

    await User.findByIdAndUpdate(prediction.userId, {
      $inc: { points: totalPoints },
    });

    const note = isFirst ? ' (first correct pick \u2014 2 pts)' : ' (1 pt)';
    await PointHistory.create({
      userId: prediction.userId,
      points: totalPoints,
      reason: `Correct prediction for Match ${matchNumber}: ${teamAName} vs ${teamBName}${note}`,
      addedByAdmin: false,
      matchId,
    });
  }

  await Prediction.updateMany(
    { matchId, choice: { $ne: result } },
    { isCorrect: false, pointsAwarded: 0 }
  );

  return correctPredictions.length;
}

/**
 * Checks ESPN for completed FIFA World Cup matches and auto-declares results
 * for any "closed" matches in the database whose result hasn't been set yet.
 */
async function checkAndDeclareResults(): Promise<void> {
  try {
    // Find matches that are closed (prediction window ended) but not yet completed
    const pendingMatches = await Match.find({
      status: 'closed',
      result: null,
    });

    if (pendingMatches.length === 0) return;

    // Fetch recent FIFA World Cup results from ESPN
    const today = new Date();
    const start = new Date('2026-06-11');
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmt(start)}-${fmt(today)}&limit=80`;

    const res = await fetch(url);
    if (!res.ok) return;

    const json = await res.json() as { events?: ESPNEvent[] };
    const completedEvents = (json.events || []).filter(
      (e) => e.status.type.state === 'post' && e.status.type.completed
    );

    if (completedEvents.length === 0) return;

    for (const match of pendingMatches) {
      // Try to find matching ESPN event by team names
      const espnMatch = completedEvents.find((event) => {
        const comps = event.competitions?.[0]?.competitors;
        if (!comps || comps.length < 2) return false;

        const home = comps.find((c) => c.homeAway === 'home') ?? comps[0];
        const away = comps.find((c) => c.homeAway === 'away') ?? comps[1];

        // Check if teamA matches home and teamB matches away (or vice versa)
        const matchHomeAway =
          teamMatches(home.team.displayName, match.teamA.name) &&
          teamMatches(away.team.displayName, match.teamB.name);
        const matchReversed =
          teamMatches(home.team.displayName, match.teamB.name) &&
          teamMatches(away.team.displayName, match.teamA.name);

        return matchHomeAway || matchReversed;
      });

      if (!espnMatch) continue;

      const comps = espnMatch.competitions[0].competitors;
      const home = comps.find((c) => c.homeAway === 'home') ?? comps[0];
      const away = comps.find((c) => c.homeAway === 'away') ?? comps[1];
      const homeScore = parseInt(home.score, 10);
      const awayScore = parseInt(away.score, 10);

      if (isNaN(homeScore) || isNaN(awayScore)) continue;

      // Determine if teamA in our DB corresponds to home or away in ESPN
      const teamAIsHome = teamMatches(home.team.displayName, match.teamA.name);

      let result: 'teamA' | 'teamB' | 'draw';
      if (teamAIsHome) {
        result = resolveResult(homeScore, awayScore);
      } else {
        // Our teamA is the away team in ESPN data
        const flipped = resolveResult(homeScore, awayScore);
        if (flipped === 'teamA') result = 'teamB';
        else if (flipped === 'teamB') result = 'teamA';
        else result = 'draw';
      }

      // Declare result
      match.result = result;
      match.status = 'completed';
      await match.save();

      const correctCount = await awardPoints(
        String(match._id),
        match.matchNumber,
        match.teamA.name,
        match.teamB.name,
        result
      );

      console.log(
        `[AutoResult] Match #${match.matchNumber} ${match.teamA.name} vs ${match.teamB.name}: ` +
        `result=${result}, ${correctCount} correct prediction(s) awarded`
      );
    }
  } catch (err) {
    console.error('[AutoResult] Error checking results:', err);
  }
}

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export function startAutoResultService(): void {
  console.log('[AutoResult] Service started — checking every 5 minutes');
  // Run once immediately after startup (slight delay to let DB connect)
  setTimeout(() => checkAndDeclareResults(), 10_000);
  // Then run on interval
  setInterval(() => checkAndDeclareResults(), CHECK_INTERVAL_MS);
}
