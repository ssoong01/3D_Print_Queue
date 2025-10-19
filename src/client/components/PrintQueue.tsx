import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface PrintRequest {
    _id: string;
    userId: string;
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

export default function PrintQueue() {
    const [requests, setRequests] = useState<PrintRequest[]>([]);
    const [completedRequests, setCompletedRequests] = useState<PrintRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<PrintRequest | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [itemToPrint, setItemToPrint] = useState('');
    const [modelUrl, setModelUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
        fetchPrintRequests();
        fetchCompletedRequests();
        const interval = setInterval(() => {
            fetchPrintRequests();
            fetchCompletedRequests();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPrintRequests = async () => {
        try {
            const response = await fetch('/api/prints');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setRequests(data);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch print requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompletedRequests = async () => {
        try {
            const response = await fetch('/api/prints/completed');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setCompletedRequests(data);
        } catch (err) {
            console.error('Fetch completed error:', err);
        }
    };

    const openDetailsModal = (request: PrintRequest) => {
        setSelectedRequest(request);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setSelectedRequest(null);
        setShowDetailsModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const userEmail = localStorage.getItem('email');
            const userDisplayName = localStorage.getItem('displayName');
            
            if (!token || !userId || !userEmail || !userDisplayName) {
                navigate('/auth');
                return;
            }

            const response = await fetch('/api/prints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    userId,
                    userEmail,
                    userDisplayName,
                    itemToPrint,
                    modelUrl: modelUrl || undefined,
                    notes 
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit print request');
            }

            // Reset form and close modal
            setItemToPrint('');
            setModelUrl('');
            setNotes('');
            setShowModal(false);
            
            // Refresh the queue
            fetchPrintRequests();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleStatusChange = async (printId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/auth');
                return;
            }

            const response = await fetch(`/api/prints/${printId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    status: newStatus,
                    isAdmin: user?.isAdmin 
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update status');
            }

            // Refresh both queues
            fetchPrintRequests();
            fetchCompletedRequests();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDelete = async (printId: string) => {
        if (!confirm('Are you sure you want to delete this print request?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token || !userId) {
                navigate('/auth');
                return;
            }

            const response = await fetch(`/api/prints/${printId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, isAdmin })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete print request');
            }

            // Refresh both queues
            fetchPrintRequests();
            fetchCompletedRequests();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        if (!user?.isAdmin) return;
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (!user?.isAdmin || draggedIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
        if (!user?.isAdmin || draggedIndex === null) return;
        e.preventDefault();

        if (draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        // Reorder the array
        const newRequests = [...requests];
        const [draggedItem] = newRequests.splice(draggedIndex, 1);
        newRequests.splice(dropIndex, 0, draggedItem);

        // Update local state immediately for responsive UI
        setRequests(newRequests);
        setDraggedIndex(null);

        // Send the new order to the server
        try {
            const token = localStorage.getItem('token');
            const orderedIds = newRequests.map(req => req._id);

            const response = await fetch('/api/prints/reorder', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    orderedIds,
                    isAdmin: user.isAdmin 
                })
            });

            if (!response.ok) {
                throw new Error('Failed to reorder queue');
            }

            // Refresh to get the updated priorities from server
            fetchPrintRequests();
        } catch (err) {
            console.error('Error reordering:', err);
            // Revert on error
            fetchPrintRequests();
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const canDelete = (request: PrintRequest): boolean => {
        if (!user) return false;
        const isCompleted = ['completed', 'cancelled'].includes(request.status);
        if (isCompleted) {
            return user.isAdmin;
        }
        return user.isAdmin || request.userId === user.id;
    };

    const getStatusDisplay = (status: string): string => {
        const statusMap: Record<string, string> = {
            'new': 'New',
            'ready-to-print': 'Ready to Print',
            'printing': 'Printing',
            'completed': 'Completed',
            'print-error': 'Print Error',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="queue-container">
            <div className="current-queue">
                <div className="queue-header">
                    <h2>Current Print Queue</h2>
                    {user && (
                        <button onClick={() => setShowModal(true)} className="add-request-btn">
                            + New Request
                        </button>
                    )}
                </div>

                {requests.length === 0 ? (
                    <p>No print requests in queue</p>
                ) : (
                    <ul className="print-list">
                        {requests.map((request, index) => (
                            <li 
                                key={request._id} 
                                className={`print-item ${draggedIndex === index ? 'dragging' : ''} ${user?.isAdmin ? 'draggable' : ''}`}
                                draggable={user?.isAdmin}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="print-item-row">
                                    <div className="priority-number">{index + 1}</div>
                                    <div className="print-details">
                                        <div className="print-info-top">
                                            <h3>{request.itemToPrint}</h3>
                                            {request.modelUrl && (
                                                <p className="model-url">
                                                    <a href={request.modelUrl} target="_blank" rel="noopener noreferrer">
                                                        View Model
                                                    </a>
                                                </p>
                                            )}
                                            <p className="requester">{request.userDisplayName}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="print-actions">
                                    <div className="print-actions-left">
                                        {user?.isAdmin ? (
                                            <select
                                                value={request.status}
                                                onChange={(e) => handleStatusChange(request._id, e.target.value)}
                                                className={`status-select status-${request.status}`}
                                            >
                                                <option value="new">New</option>
                                                <option value="ready-to-print">Ready to Print</option>
                                                <option value="printing">Printing</option>
                                                <option value="completed">Completed</option>
                                                <option value="print-error">Print Error</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        ) : (
                                            <span className={`status status-${request.status}`}>
                                                {getStatusDisplay(request.status)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="print-actions-right">
                                        <time className="print-meta">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </time>
                                        {canDelete(request) && (
                                            <button 
                                                onClick={() => handleDelete(request._id)} 
                                                className="delete-btn"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {request.notes && (
                                    <div className="print-notes-row">
                                        <p className="notes">{request.notes}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="completed-queue">
                <div className="queue-header">
                    <h2>Completed Prints</h2>
                </div>

                {completedRequests.length === 0 ? (
                    <p>No completed prints</p>
                ) : (
                    <ul className="print-list">
                        {completedRequests.map((request) => (
                            <li key={request._id} className="print-item completed-item">
                                <div className="completed-content">
                                    <div className="completed-line-1">
                                        <div className="completed-line-1-left">
                                            <h4>{request.itemToPrint}</h4>
                                            <span className="requester-completed">{request.userDisplayName}</span>
                                        </div>
                                        <span className={`status status-${request.status}`}>
                                            {getStatusDisplay(request.status)}
                                        </span>
                                    </div>
                                    <div className="completed-line-2">
                                        <button 
                                            className="view-details-btn"
                                            onClick={() => openDetailsModal(request)}
                                        >
                                            View Details
                                        </button>
                                        <div className="completed-right">
                                            <time dateTime={new Date(request.createdAt).toISOString()}>
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </time>
                                            {user?.isAdmin && (
                                                <button 
                                                    onClick={() => handleDelete(request._id)}
                                                    className="delete-btn-small"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Submit Print Request</h2>
                            <button 
                                className="modal-close" 
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        {formError && <div className="error">{formError}</div>}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="requester">Requester:</label>
                                <input
                                    type="text"
                                    id="requester"
                                    value={user?.displayName || ''}
                                    disabled
                                    className="locked-field"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="itemToPrint">Item to Print: *</label>
                                <input
                                    type="text"
                                    id="itemToPrint"
                                    value={itemToPrint}
                                    onChange={(e) => setItemToPrint(e.target.value)}
                                    required
                                    placeholder="e.g., Chess piece, phone stand, etc."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="modelUrl">Model URL (Optional):</label>
                                <input
                                    type="url"
                                    id="modelUrl"
                                    value={modelUrl}
                                    onChange={(e) => setModelUrl(e.target.value)}
                                    placeholder="https://www.thingiverse.com/..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">Notes (Optional):</label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="Any special requirements, color preferences, etc."
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button type="submit">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedRequest && (
                <div className="modal-overlay" onClick={closeDetailsModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Print Request Details</h2>
                            <button 
                                className="modal-close" 
                                onClick={closeDetailsModal}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="details-content">
                            <div className="detail-row">
                                <span className="detail-label">Title:</span>
                                <span className="detail-value">{selectedRequest.itemToPrint}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Requested By:</span>
                                <span className="detail-value">{selectedRequest.userDisplayName}</span>
                            </div>
                            {selectedRequest.modelUrl && (
                                <div className="detail-row">
                                    <span className="detail-label">Model URL:</span>
                                    <span className="detail-value">
                                        <a href={selectedRequest.modelUrl} target="_blank" rel="noopener noreferrer">
                                            {selectedRequest.modelUrl}
                                        </a>
                                    </span>
                                </div>
                            )}
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className={`status status-${selectedRequest.status}`}>
                                    {getStatusDisplay(selectedRequest.status)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Request Date:</span>
                                <span className="detail-value">
                                    {new Date(selectedRequest.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Completion Date:</span>
                                <span className="detail-value">
                                    {new Date(selectedRequest.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {selectedRequest.notes && (
                                <div className="detail-row detail-notes">
                                    <span className="detail-label">Notes:</span>
                                    <span className="detail-value">{selectedRequest.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}