import { Request, Response } from 'express';
import { register, login, getMe } from '../../controllers/auth.controller';
import User from '../../models/User';
import { AuthRequest } from '../../middleware/auth.middleware';

jest.mock('../../models/User');
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Helper: fake a Request with express-validator results already baked in
const fakeReqWithValidation = (body: Record<string, unknown>, hasErrors = false): Request => {
  const req = {
    body,
    // express-validator stores internal state on the request
  } as unknown as Request;
  return req;
};

// We need to mock express-validator's validationResult
jest.mock('express-validator', () => {
  const original = jest.requireActual('express-validator');
  return {
    ...original,
    validationResult: jest.fn(),
  };
});
import { validationResult } from 'express-validator';
const mockedValidationResult = validationResult as unknown as jest.Mock;

describe('auth.controller', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('register', () => {
    it('returns 400 when validation fails', async () => {
      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Name is required' }],
      });
      const req = fakeReqWithValidation({});
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Name is required' }] });
    });

    it('returns 400 when email already exists', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });

      const req = fakeReqWithValidation({ name: 'Test', email: 'test@test.com', password: 'password123' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('creates user and returns 201 with token on success', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const fakeUser = {
        _id: { toString: () => 'user1' },
        name: 'Test User',
        email: 'test@test.com',
        role: 'user',
        points: 0,
        joinedDate: new Date('2024-01-01'),
      };
      (User.create as jest.Mock).mockResolvedValue(fakeUser);

      const req = fakeReqWithValidation({ name: 'Test User', email: 'test@test.com', password: 'password123' });
      const res = mockRes();

      await register(req, res);

      expect(User.create).toHaveBeenCalledWith({ name: 'Test User', email: 'test@test.com', password: 'password123' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-jwt-token', user: expect.objectContaining({ name: 'Test User' }) })
      );
    });

    it('returns 500 when User.create throws', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      const req = fakeReqWithValidation({ name: 'Test', email: 'test@test.com', password: 'pw' });
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error during registration' });
    });
  });

  describe('login', () => {
    it('returns 400 when validation fails', async () => {
      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Valid email is required' }],
      });
      const req = fakeReqWithValidation({});
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when user is not found', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = fakeReqWithValidation({ email: 'nouser@test.com', password: 'pw' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('returns 401 when password does not match', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: { toString: () => 'u1' },
        comparePassword: jest.fn().mockResolvedValue(false),
      });

      const req = fakeReqWithValidation({ email: 'test@test.com', password: 'wrong' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('returns token and user data on successful login', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      const fakeUser = {
        _id: { toString: () => 'u1' },
        name: 'Alice',
        email: 'alice@test.com',
        role: 'user',
        points: 10,
        joinedDate: new Date('2024-01-01'),
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      (User.findOne as jest.Mock).mockResolvedValue(fakeUser);

      const req = fakeReqWithValidation({ email: 'alice@test.com', password: 'correctpw' });
      const res = mockRes();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-jwt-token', user: expect.objectContaining({ name: 'Alice' }) })
      );
    });

    it('returns 500 on unexpected error', async () => {
      mockedValidationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
      (User.findOne as jest.Mock).mockRejectedValue(new Error('DB fail'));

      const req = fakeReqWithValidation({ email: 'x@x.com', password: 'p' });
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMe', () => {
    it('returns 404 when user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      const req = { user: { id: 'unknown' } } as AuthRequest;
      const res = mockRes();

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('returns user data on success', async () => {
      const fakeUser = {
        _id: 'u1',
        name: 'Bob',
        email: 'bob@test.com',
        role: 'user',
        points: 5,
        joinedDate: new Date('2024-01-01'),
      };
      (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

      const req = { user: { id: 'u1' } } as AuthRequest;
      const res = mockRes();

      await getMe(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob', email: 'bob@test.com' }));
    });

    it('returns 500 on unexpected error', async () => {
      (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB')) });

      const req = { user: { id: 'u1' } } as AuthRequest;
      const res = mockRes();

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
