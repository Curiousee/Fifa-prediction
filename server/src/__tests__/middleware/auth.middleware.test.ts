import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest, SUPER_ADMIN_EMAIL } from '../../middleware/auth.middleware';
import User from '../../models/User';

jest.mock('../../models/User');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext: NextFunction = jest.fn();

describe('authenticate middleware', () => {
  const JWT_SECRET = 'test-secret-key-for-unit-tests';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it('returns 401 when no authorization header is present', async () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header does not start with Bearer', async () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthRequest;
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('returns 500 when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    const req = { headers: { authorization: 'Bearer sometoken' } } as AuthRequest;
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Server configuration error' });
  });

  it('returns 401 when token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid.token.here' } } as AuthRequest;
    const res = mockRes();

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
  });

  it('returns 401 when user is not found in the database', async () => {
    const token = jwt.sign({ id: 'nonexistent-id', role: 'user' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await authenticate(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('populates req.user and calls next() for a valid token', async () => {
    const token = jwt.sign({ id: 'user123', role: 'user' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    const fakeUser = {
      _id: { toString: () => 'user123' },
      role: 'user',
      email: 'test@example.com',
      canChangeScores: false,
      isSuperAdmin: false,
    };
    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    await authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user123',
      role: 'user',
      email: 'test@example.com',
      canChangeScores: false,
      isSuperAdmin: false,
    });
  });

  it('sets isSuperAdmin true when user email matches SUPER_ADMIN_EMAIL', async () => {
    const token = jwt.sign({ id: 'admin1', role: 'admin' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    const fakeUser = {
      _id: { toString: () => 'admin1' },
      role: 'admin',
      email: SUPER_ADMIN_EMAIL,
      canChangeScores: true,
      isSuperAdmin: false,
    };
    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    await authenticate(req, res, mockNext);

    expect(req.user?.isSuperAdmin).toBe(true);
  });

  it('sets isSuperAdmin true when user.isSuperAdmin flag is true', async () => {
    const token = jwt.sign({ id: 'admin2', role: 'admin' }, JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    const fakeUser = {
      _id: { toString: () => 'admin2' },
      role: 'admin',
      email: 'other-admin@example.com',
      canChangeScores: true,
      isSuperAdmin: true,
    };
    (User.findById as jest.Mock).mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    await authenticate(req, res, mockNext);

    expect(req.user?.isSuperAdmin).toBe(true);
  });
});
