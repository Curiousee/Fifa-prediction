import { Types } from 'mongoose';

interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  points: number;
  joinedDate: Date;
}

export interface FormattedUser {
  id: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  points: number;
  joinedDate: Date;
}

export function formatUserResponse(user: UserDoc): FormattedUser {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    points: user.points,
    joinedDate: user.joinedDate,
  };
}
