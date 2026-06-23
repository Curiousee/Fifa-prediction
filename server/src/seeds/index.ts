import Match from '../models/Match';
import { worldCup2026Matches } from './world-cup-2026-matches';

/**
 * Seeds FIFA World Cup 2026 matches into the database if they don't exist
 */
export const seedMatches = async (): Promise<void> => {
  try {
    const existingCount = await Match.countDocuments({});

    if (existingCount >= 72) {
      // At least group stage matches exist
      console.log(`✅ Matches already seeded: ${existingCount} matches found`);
      return;
    }

    console.log('🌱 Seeding FIFA World Cup 2026 matches...');

    // Insert all matches
    await Match.insertMany(worldCup2026Matches);

    console.log(
      `✅ World Cup 2026 matches seeded successfully: ${worldCup2026Matches.length} matches inserted`
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      // Duplicate key error (matches already exist)
      console.log('✅ Matches already seeded');
    } else {
      console.error('Failed to seed matches:', error);
    }
  }
};
