import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  text: string;
  userId: { _id: string; name: string } | null;
  createdAt: string;
}

const Community: React.FC = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await commentsAPI.getGeneral();
      // server returns newest-first; reverse for chat order
      setComments((res.data as Comment[]).slice().reverse());
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await commentsAPI.post({ text: text.trim(), type: 'general' });
      setComments((prev) => [...prev, res.data as Comment]);
      setText('');
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

  const canDelete = (comment: Comment) => {
    if (!user) return false;
    const authorId = comment.userId?._id;
    return (user as { id?: string; role?: string }).id === authorId || (user as { role?: string }).role === 'admin';
  };

  return (
    <div className="page-container max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/15 rounded-2xl mb-3">
          <MessageSquare size={24} className="text-blue-400" />
        </div>
        <h1 className="section-title mb-1">Community</h1>
        <p className="text-gray-400 text-sm">General discussion — chat with fellow predictors</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto card p-4 space-y-3 mb-4 min-h-0">
        {isLoading ? (
          <LoadingSpinner size="md" text="Loading discussion..." />
        ) : comments.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            No messages yet. Be the first to say something!
          </div>
        ) : (
          comments.map((c) => {
            const isMe = (user as { id?: string } | null)?.id === c.userId?._id;
            return (
              <div key={c._id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {(c.userId?.name ?? '?').charAt(0).toUpperCase()}
                </div>
                {/* Bubble */}
                <div className={`flex-1 max-w-xs sm:max-w-sm ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className={`flex items-center gap-2 text-xs text-gray-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className={`font-semibold ${isMe ? 'text-green-400' : 'text-gray-300'}`}>
                      {c.userId?.name ?? 'Unknown'}{isMe && ' (you)'}
                    </span>
                    <span>{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                  </div>
                  <div className={`relative group px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-green-600/25 text-green-100 rounded-tr-sm'
                      : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                  }`}>
                    {c.text}
                    {canDelete(c) && (
                      <button
                        onClick={() => handleDelete(c._id)}
                        disabled={deletingId === c._id}
                        className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 items-center justify-center bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <Trash2 size={9} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {user ? (
        <form onSubmit={handlePost} className="flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            maxLength={1000}
            className="input-field flex-1 text-sm py-2.5"
          />
          <button
            type="submit"
            disabled={!text.trim() || posting}
            className="btn-primary px-4 py-2.5 flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Send size={14} />
            {posting ? 'Sending...' : 'Send'}
          </button>
        </form>
      ) : (
        <div className="text-center text-sm text-gray-500 py-3 card">
          <a href="/login" className="text-green-400 hover:text-green-300 font-semibold">Sign in</a> to join the discussion
        </div>
      )}
    </div>
  );
};

export default Community;
