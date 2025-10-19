import React, { useState, useEffect } from 'react';

interface User {
  _id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleResendVerification = async (email: string) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend verification');
      }

      setSuccess('Verification email sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invite');
      }

      setSuccess('Invitation sent successfully');
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <button
          className="button button-primary"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          + Invite User
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showInviteForm && (
        <div className="invite-form-container">
          <form onSubmit={handleInviteUser} className="invite-form">
            <div className="form-group">
              <label htmlFor="invite-email">Email Address:</label>
              <input
                type="email"
                id="invite-email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="button button-primary">
                Send Invitation
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteEmail('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Display Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>
                {editingUser?._id === user._id ? (
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                ) : (
                  user.email
                )}
              </td>
              <td>
                {editingUser?._id === user._id ? (
                  <input
                    type="text"
                    value={editingUser.displayName}
                    onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  />
                ) : (
                  user.displayName
                )}
              </td>
              <td>
                {editingUser?._id === user._id ? (
                  <select
                    value={editingUser.isAdmin ? 'admin' : 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, isAdmin: e.target.value === 'admin' })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`role-badge ${user.isAdmin ? 'admin' : 'user'}`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                )}
              </td>
              <td>
                <span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
                  {user.isVerified ? '✓ Verified' : '⚠ Unverified'}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="actions">
                {editingUser?._id === user._id ? (
                  <>
                    <button
                      className="button button-sm button-primary"
                      onClick={() => handleUpdateUser(user._id, {
                        email: editingUser.email,
                        displayName: editingUser.displayName,
                        isAdmin: editingUser.isAdmin
                      })}
                    >
                      Save
                    </button>
                    <button
                      className="button button-sm button-secondary"
                      onClick={() => setEditingUser(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="button button-sm"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    {!user.isVerified && (
                      <button
                        className="button button-sm"
                        onClick={() => handleResendVerification(user.email)}
                      >
                        Resend
                      </button>
                    )}
                    <button
                      className="button button-sm button-danger"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;