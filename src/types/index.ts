export interface User {
    id: string;
    username: string;
    password: string;
}

export interface PrintRequest {
    id: string;
    userId: string;
    status: 'pending' | 'in-progress' | 'completed';
    timestamp: Date;
}