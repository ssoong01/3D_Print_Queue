import mongoose, { Schema, Document } from 'mongoose';

export interface IShowcase extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userDisplayName: string;
  imageUrl: string;
  isUpload: boolean; // true if uploaded file, false if external link
  caption?: string;
  createdAt: Date;
}

const ShowcaseSchema = new Schema<IShowcase>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userDisplayName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  isUpload: {
    type: Boolean,
    default: false
  },
  caption: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

export default mongoose.model<IShowcase>('Showcase', ShowcaseSchema);