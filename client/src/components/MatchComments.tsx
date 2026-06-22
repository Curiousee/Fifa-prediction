import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { commentsAPI } from '../services/api';
import { useAuth } from '../context/useAuth';

interface Comment {
  _id: string;
  text: string;
  userId: { _id: string; name: string } | null;
  createdAt: string;
}

interface Props {
  matchId: string;
  matchLabel: string;
}

const MatchComments: React.FC<Props> = ({ matchId, matchLabel }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || loaded) return;
    const load = async () => {
      try {
        const res = await commentsAPI.getMatch(matchId);
        setComments((res.data as Comment[]).slice().reverse());
        setLoaded(true);
      } catch { /* silent */ }
    };
    load();
  }, [open, loaded, matchId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await commentsAPI.post({ text: text.trim(), type: 'match', matchId });
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
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (c: Comment) => {
    if (!user) return false;
    return (user as { id?: string }).id === c.userId?._id || (user as { role?: string }).role === 'admin';
  };

  return (
    <div className="mt-3 border-t border-gray-800/60 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
      >
        <MessageSquare size={13} />
        <span>Discussion — {matchLabel}</span>
        <span className="ml-auto">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Messages */}
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {!loaded ? (
              <p className="text-xs text-gray-600 text-center py-2">Loading...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-3">No comments yet. Start the discussion!</p>
            ) : (
              comments.map((c) => {
                const isMe = (user as { id?: string } | null)?.id === c.userId?._id;
                return (
                  <div key={c._id} className="flex gap-2 group">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(c.userId?.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold ${isMe ? 'text-green-400' : 'text-gray-300'}`}>
                          {c.userId?.name ?? 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-600">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                        {canDelete(c) && (
                          <button
                            onClick={() => handleDelete(c._id)}
                            disabled={deletingId === c._id}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity ml-auto"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-0.5 break-words">{c.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          {user ? (
            <form onSubmit={handlePost} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                maxLength={500}
                className="input-field flex-1 text-xs py-1.5 px-2.5"
              />
              <button
                type="submit"
                disabled={!text.trim() || posting}
                className="btn-primary px-2.5 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Send size={11} />
                {posting ? '...' : 'Post'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-600 text-center">
              <a href="/login" className="text-green-400 hover:text-green-300">Sign in</a> to comment
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchComments;
