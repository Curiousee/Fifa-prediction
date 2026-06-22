import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  text: string;
  userId: mongoose.Types.ObjectId;
  type: 'general' | 'match';
  matchId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['general', 'match'], required: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', default: null },
  },
  { timestamps: true }
);

CommentSchema.index({ type: 1, matchId: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
