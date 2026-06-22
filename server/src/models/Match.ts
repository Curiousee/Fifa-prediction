import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam {
  name: string;
  flag: string;
}

export interface IMatch extends Document {
  matchNumber: number;
  matchDate: Date;
  teamA: ITeam;
  teamB: ITeam;
  predictionStart: Date;
  predictionEnd: Date;
  status: 'upcoming' | 'open' | 'closed' | 'completed';
  result: 'teamA' | 'teamB' | 'draw' | null;
  options: string[];
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true },
    flag: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    matchNumber: { type: Number, required: true, unique: true },
    matchDate: { type: Date, required: true },
    teamA: { type: TeamSchema, required: true },
    teamB: { type: TeamSchema, required: true },
    predictionStart: { type: Date, required: true },
    predictionEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed', 'completed'],
      default: 'upcoming',
    },
    result: {
      type: String,
      enum: ['teamA', 'teamB', 'draw', null],
      default: null,
    },
    options: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Auto-generate prediction options from team names
MatchSchema.pre('save', function (next) {
  if (this.isModified('teamA') || this.isModified('teamB') || this.isNew) {
    this.options = [
      `${this.teamA.name} Win`,
      'Draw',
      `${this.teamB.name} Win`,
    ];
  }
  next();
});

export default mongoose.model<IMatch>('Match', MatchSchema);
