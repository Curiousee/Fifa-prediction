import { Response } from 'express';
import Comment from '../models/Comment';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/comments/general
export const getGeneralComments = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ type: 'general' })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name');
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// GET /api/comments/match/:matchId
export const getMatchComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ type: 'match', matchId: req.params.matchId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name');
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Error fetching match comments' });
  }
};

// POST /api/comments
export const postComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, type, matchId } = req.body as { text: string; type: string; matchId?: string };

    if (!text?.trim()) {
      res.status(400).json({ message: 'Comment text is required' });
      return;
    }
    if (!['general', 'match'].includes(type)) {
      res.status(400).json({ message: 'type must be general or match' });
      return;
    }
    if (type === 'match' && !matchId) {
      res.status(400).json({ message: 'matchId required for match comments' });
      return;
    }

    const comment = await Comment.create({
      text: text.trim().slice(0, 1000),
      userId: req.user?.id,
      type,
      matchId: type === 'match' ? matchId : undefined,
    });

    const populated = await comment.populate('userId', 'name');
    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: 'Error posting comment' });
  }
};

// DELETE /api/comments/:id  (own comment or admin)
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    const isOwner = comment.userId.toString() === req.user?.id;
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: 'Not allowed' });
      return;
    }
    await comment.deleteOne();
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};
