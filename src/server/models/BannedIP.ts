import mongoose, { Schema, Document } from 'mongoose';

export interface IBannedIP extends Document {
  ip: string;
  reason: string;
  bannedBy: string;
  bannedAt: Date;
  expiresAt?: Date;
}

const BannedIPSchema = new Schema<IBannedIP>({
  ip: { type: String, required: true, unique: true, index: true },
  reason: { type: String, required: true },
  bannedBy: { type: String, required: true },
  bannedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export default mongoose.model<IBannedIP>('BannedIP', BannedIPSchema);