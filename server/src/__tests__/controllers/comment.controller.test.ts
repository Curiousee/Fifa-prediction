import { Response } from 'express';
import { getGeneralComments, getMatchComments, postComment, deleteComment } from '../../controllers/comment.controller';
import Comment from '../../models/Comment';
import { AuthRequest } from '../../middleware/auth.middleware';

jest.mock('../../models/Comment');

const mockRes = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('comment.controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getGeneralComments', () => {
    it('returns general comments', async () => {
      const fakeComments = [{ text: 'Hello' }];
      (Comment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(fakeComments),
          }),
        }),
      });

      const req = {} as AuthRequest;
      const res = mockRes();

      await getGeneralComments(req, res);

      expect(Comment.find).toHaveBeenCalledWith({ type: 'general' });
      expect(res.json).toHaveBeenCalledWith(fakeComments);
    });

    it('returns 500 on error', async () => {
      (Comment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(new Error('DB')),
          }),
        }),
      });

      const req = {} as AuthRequest;
      const res = mockRes();

      await getGeneralComments(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMatchComments', () => {
    it('returns comments for a match', async () => {
      const fakeComments = [{ text: 'Good match' }];
      (Comment.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(fakeComments),
          }),
        }),
      });

      const req = { params: { matchId: 'm1' } } as unknown as AuthRequest;
      const res = mockRes();

      await getMatchComments(req, res);

      expect(Comment.find).toHaveBeenCalledWith({ type: 'match', matchId: 'm1' });
      expect(res.json).toHaveBeenCalledWith(fakeComments);
    });
  });

  describe('postComment', () => {
    it('returns 400 when text is empty', async () => {
      const req = {
        body: { text: '', type: 'general' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await postComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment text is required' });
    });

    it('returns 400 for invalid type', async () => {
      const req = {
        body: { text: 'hello', type: 'invalid' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await postComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'type must be general or match' });
    });

    it('returns 400 when match comment has no matchId', async () => {
      const req = {
        body: { text: 'hello', type: 'match' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await postComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'matchId required for match comments' });
    });

    it('creates a general comment and returns 201', async () => {
      const fakeComment = {
        _id: 'c1',
        text: 'Great!',
        userId: 'u1',
        type: 'general',
        populate: jest.fn().mockResolvedValue({
          _id: 'c1',
          text: 'Great!',
          userId: { _id: 'u1', name: 'Alice' },
          type: 'general',
        }),
      };
      (Comment.create as jest.Mock).mockResolvedValue(fakeComment);

      const req = {
        body: { text: 'Great!', type: 'general' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await postComment(req, res);

      expect(Comment.create).toHaveBeenCalledWith({
        text: 'Great!',
        userId: 'u1',
        type: 'general',
        matchId: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('creates a match comment with matchId', async () => {
      const fakeComment = {
        _id: 'c2',
        text: 'Nice',
        populate: jest.fn().mockResolvedValue({ _id: 'c2' }),
      };
      (Comment.create as jest.Mock).mockResolvedValue(fakeComment);

      const req = {
        body: { text: 'Nice', type: 'match', matchId: 'm1' },
        user: { id: 'u1' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await postComment(req, res);

      expect(Comment.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'match', matchId: 'm1' })
      );
    });
  });

  describe('deleteComment', () => {
    it('returns 404 when comment not found', async () => {
      (Comment.findById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: 'missing' },
        user: { id: 'u1', role: 'user' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when user is neither owner nor admin', async () => {
      (Comment.findById as jest.Mock).mockResolvedValue({
        userId: { toString: () => 'other-user' },
      });

      const req = {
        params: { id: 'c1' },
        user: { id: 'u1', role: 'user' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await deleteComment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows owner to delete their comment', async () => {
      const fakeComment = {
        userId: { toString: () => 'u1' },
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      (Comment.findById as jest.Mock).mockResolvedValue(fakeComment);

      const req = {
        params: { id: 'c1' },
        user: { id: 'u1', role: 'user' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await deleteComment(req, res);

      expect(fakeComment.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Deleted' });
    });

    it('allows admin to delete any comment', async () => {
      const fakeComment = {
        userId: { toString: () => 'other-user' },
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      (Comment.findById as jest.Mock).mockResolvedValue(fakeComment);

      const req = {
        params: { id: 'c1' },
        user: { id: 'admin1', role: 'admin' },
      } as unknown as AuthRequest;
      const res = mockRes();

      await deleteComment(req, res);

      expect(fakeComment.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Deleted' });
    });
  });
});
