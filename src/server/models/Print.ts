import mongoose from 'mongoose';

export interface IPrint {
    userId: mongoose.Types.ObjectId;
    userEmail: string;
    userDisplayName: string;
    itemToPrint: string;
    modelUrl?: string;
    notes?: string;
    status: 'new' | 'ready-to-print' | 'printing' | 'completed' | 'print-error' | 'cancelled';
    priority: number;
    createdAt: Date;
    completedAt?: Date;
}

const printSchema = new mongoose.Schema<IPrint>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userDisplayName: {
        type: String,
        required: true
    },
    itemToPrint: {
        type: String,
        required: true
    },
    modelUrl: {
        type: String,
        required: false
    },
    notes: String,
    status: {
        type: String,
        enum: ['new', 'ready-to-print', 'printing', 'completed', 'print-error', 'cancelled'],
        default: 'new'
    },
    priority: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        required: false
    }
});

const Print = mongoose.model<IPrint>('Print', printSchema);
export default Print;