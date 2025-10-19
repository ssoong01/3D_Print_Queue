import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessLog extends Document {
  ip: string;
  endpoint: string;
  method: string;
  statusCode: number;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

const AccessLogSchema = new Schema<IAccessLog>({
  ip: { type: String, required: true, index: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  statusCode: { type: Number, required: true },
  userAgent: { type: String, default: '' },
  userId: { type: String },
  userEmail: { type: String },
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

export default mongoose.model<IAccessLog>('AccessLog', AccessLogSchema);