import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import UserManagement from './UserManagement';
import ServerSettings from './ServerSettings';
import AccessLogs from './AccessLogs';

const AdminPanel: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'logs'>('users');

  // Redirect if not admin
  if (!user?.isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Queue
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          User Management
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          Server Settings
        </button>
        <button
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <span className="tab-icon">📊</span>
          Access Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'settings' && <ServerSettings />}
        {activeTab === 'logs' && <AccessLogs />}
      </div>
    </div>
  );
};

export default AdminPanel;