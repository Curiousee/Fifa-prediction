import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Match from '../../models/Match';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Match.deleteMany({});
});

describe('Match model', () => {
  const validMatchData = {
    matchNumber: 1,
    matchDate: new Date('2025-07-01'),
    teamA: { name: 'Brazil', flag: '🇧🇷' },
    teamB: { name: 'France', flag: '🇫🇷' },
    predictionStart: new Date('2025-06-30'),
    predictionEnd: new Date('2025-07-01'),
  };

  describe('creation and defaults', () => {
    it('creates a match with correct defaults', async () => {
      const match = await Match.create(validMatchData);

      expect(match.matchNumber).toBe(1);
      expect(match.status).toBe('upcoming');
      expect(match.result).toBeNull();
      expect(match.teamA.name).toBe('Brazil');
      expect(match.teamB.name).toBe('France');
    });

    it('rejects duplicate matchNumber', async () => {
      await Match.create(validMatchData);
      await expect(Match.create(validMatchData)).rejects.toThrow();
    });

    it('rejects missing required fields', async () => {
      await expect(Match.create({ matchNumber: 99 })).rejects.toThrow();
    });
  });

  describe('pre-save hook (auto-generate options)', () => {
    it('generates prediction options from team names on creation', async () => {
      const match = await Match.create(validMatchData);

      expect(match.options).toEqual(['Brazil Win', 'Draw', 'France Win']);
    });

    it('updates options when team names are modified', async () => {
      const match = await Match.create(validMatchData);
      expect(match.options).toContain('Brazil Win');

      match.teamA = { name: 'Germany', flag: '🇩🇪' };
      await match.save();

      expect(match.options).toEqual(['Germany Win', 'Draw', 'France Win']);
    });

    it('updates options when teamB is modified', async () => {
      const match = await Match.create(validMatchData);

      match.teamB = { name: 'Argentina', flag: '🇦🇷' };
      await match.save();

      expect(match.options).toEqual(['Brazil Win', 'Draw', 'Argentina Win']);
    });
  });

  describe('status and result enums', () => {
    it('allows valid status values', async () => {
      const match = await Match.create(validMatchData);

      for (const status of ['upcoming', 'open', 'closed', 'completed'] as const) {
        match.status = status;
        await match.save();
        expect(match.status).toBe(status);
      }
    });

    it('allows valid result values', async () => {
      const match = await Match.create(validMatchData);

      for (const result of ['teamA', 'teamB', 'draw'] as const) {
        match.result = result;
        await match.save();
        expect(match.result).toBe(result);
      }
    });

    it('rejects invalid status', async () => {
      await expect(
        Match.create({ ...validMatchData, matchNumber: 2, status: 'invalid' })
      ).rejects.toThrow();
    });
  });
});
