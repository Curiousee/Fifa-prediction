import { Response, NextFunction } from 'express';
import { requireAdmin } from '../../middleware/admin.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireAdmin middleware', () => {
  it('returns 403 when req.user is undefined', () => {
    const req = {} as AuthRequest;
    const res = mockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is not admin', () => {
    const req = {
      user: { id: '1', role: 'user', email: 'u@x.com', canChangeScores: false, isSuperAdmin: false },
    } as AuthRequest;
    const res = mockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when user role is admin', () => {
    const req = {
      user: { id: '1', role: 'admin', email: 'a@x.com', canChangeScores: true, isSuperAdmin: false },
    } as AuthRequest;
    const res = mockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
