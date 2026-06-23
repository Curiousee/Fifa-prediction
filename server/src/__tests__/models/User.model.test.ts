import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../../models/User';

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
  await User.deleteMany({});
});

describe('User model', () => {
  const validUserData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('creation and validation', () => {
    it('creates a user with default values', async () => {
      const user = await User.create(validUserData);

      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.points).toBe(0);
      expect(user.canChangeScores).toBe(false);
      expect(user.isSuperAdmin).toBe(false);
      expect(user.joinedDate).toBeInstanceOf(Date);
    });

    it('rejects duplicate emails', async () => {
      await User.create(validUserData);
      await expect(User.create(validUserData)).rejects.toThrow();
    });

    it('rejects invalid email format', async () => {
      await expect(
        User.create({ ...validUserData, email: 'not-an-email' })
      ).rejects.toThrow();
    });

    it('rejects missing required fields', async () => {
      await expect(User.create({ name: 'X' })).rejects.toThrow();
    });

    it('trims name and lowercases email', async () => {
      const user = await User.create({
        ...validUserData,
        name: '  Trimmed  ',
        email: 'UPPER@CASE.com',
      });

      expect(user.name).toBe('Trimmed');
      expect(user.email).toBe('upper@case.com');
    });
  });

  describe('password hashing (pre-save hook)', () => {
    it('hashes the password on creation', async () => {
      const user = await User.create(validUserData);

      expect(user.password).not.toBe('password123');
      expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash prefix
    });

    it('does not re-hash if password is not modified', async () => {
      const user = await User.create(validUserData);
      const originalHash = user.password;

      user.name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('re-hashes when password is changed', async () => {
      const user = await User.create(validUserData);
      const originalHash = user.password;

      user.password = 'newpassword456';
      await user.save();

      expect(user.password).not.toBe(originalHash);
      expect(user.password).not.toBe('newpassword456');
    });
  });

  describe('comparePassword method', () => {
    it('returns true for correct password', async () => {
      const user = await User.create(validUserData);
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const user = await User.create(validUserData);
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('removes password from JSON output', async () => {
      const user = await User.create(validUserData);
      const json = user.toJSON();
      expect(json).not.toHaveProperty('password');
      expect(json).toHaveProperty('name', 'Test User');
    });
  });
});
