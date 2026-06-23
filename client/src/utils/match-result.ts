import type { Match } from '../types';

export function getMatchResultLabel(match: Match): string | null {
  if (!match.result) return null;
  if (match.result === 'teamA') return `${match.teamA.flag} ${match.teamA.name} Win`;
  if (match.result === 'teamB') return `${match.teamB.flag} ${match.teamB.name} Win`;
  return 'Draw';
}
