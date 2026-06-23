import { type FormEvent, useState } from 'react';
import { commentsAPI } from '../services/api';
import type { Comment, User } from '../types';

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePost = async (
    e: FormEvent,
    text: string,
    payload: { type: 'general' | 'match'; matchId?: string },
    onSuccess: () => void
  ) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await commentsAPI.post({ text: text.trim(), ...payload });
      setComments((prev) => [...prev, res.data as Comment]);
      onSuccess();
    } catch {
      alert('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this comment?')) return;
    setDeletingId(id);
    try {
      await commentsAPI.delete(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert('Failed to delete comment');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (comment: Comment, user: User | null): boolean => {
    if (!user) return false;
    return user.id === comment.userId?._id || user.role === 'admin';
  };

  return { comments, setComments, posting, deletingId, handlePost, handleDelete, canDelete };
}
