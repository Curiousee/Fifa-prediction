import mongoose, { Document, Schema } from 'mongoose';

export interface IPointHistory extends Document {
  userId: mongoose.Types.ObjectId;
  points: number;
  reason: string;
  addedByAdmin: boolean;
  adminId?: mongoose.Types.ObjectId;
  matchId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PointHistorySchema = new Schema<IPointHistory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    addedByAdmin: { type: Boolean, default: false },
    adminId: { type: Schema.Types.ObjectId, ref: 'User' },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
  },
  { timestamps: true }
);

export default mongoose.model<IPointHistory>('PointHistory', PointHistorySchema);
