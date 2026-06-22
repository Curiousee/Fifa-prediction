import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  matchId: mongoose.Types.ObjectId;
  choice: 'teamA' | 'teamB' | 'draw';
  pointsAwarded: number;
  isCorrect: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    choice: {
      type: String,
      required: true,
      enum: ['teamA', 'teamB', 'draw'],
    },
    pointsAwarded: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: null },
  },
  { timestamps: true }
);

// Enforce one prediction per user per match
PredictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export default mongoose.model<IPrediction>('Prediction', PredictionSchema);
