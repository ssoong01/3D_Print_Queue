import React, { useState, useEffect } from 'react';

interface Settings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSenderName: string;
  adminPassword: string;
  maxLoginAttempts: number;
  lockoutDuration: number;
  maxQueueItems: number;
  notifyAdminsOnNewRequest: boolean;
  appUrl: string;
}

const ServerSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSenderName: '3D Print Queue',
    adminPassword: '',
    maxLoginAttempts: 3,
    lockoutDuration: 15,
    maxQueueItems: 5,
    notifyAdminsOnNewRequest: true,
    appUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Track if passwords have been changed
  const [smtpPassChanged, setSmtpPassChanged] = useState(false);
  const [adminPassChanged, setAdminPassChanged] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings({
        smtpHost: data.smtpHost || 'smtp.gmail.com',
        smtpPort: data.smtpPort || 587,
        smtpUser: data.smtpUser || '',
        smtpPass: '', // Don't populate password fields
        smtpSenderName: data.smtpSenderName || '3D Print Queue',
        adminPassword: '', // Don't populate password fields
        maxLoginAttempts: data.lockoutAttempts || 3,
        lockoutDuration: data.lockoutDuration || 15,
        maxQueueItems: data.maxQueueItems || 5,
        notifyAdminsOnNewRequest: data.notifyAdminsOnNewRequest ?? true,
        appUrl: data.appUrl || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setSavingSection('smtp');
      const token = localStorage.getItem('token');
      
      const updates: any = {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpSenderName: settings.smtpSenderName,
        appUrl: settings.appUrl
      };

      // Only include password if it was changed
      if (smtpPassChanged && settings.smtpPass) {
        updates.smtpPass = settings.smtpPass;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update SMTP settings');
      }

      setSuccess('SMTP settings updated successfully');
      setSmtpPassChanged(false);
      setSettings({ ...settings, smtpPass: '' }); // Clear password field
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update SMTP settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setSavingSection('security');
      const token = localStorage.getItem('token');
      
      const updates: any = {
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDuration: settings.lockoutDuration
      };

      // Only include admin password if it was changed
      if (adminPassChanged && settings.adminPassword) {
        updates.adminPassword = settings.adminPassword;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update security settings');
      }

      setSuccess('Security settings updated successfully');
      setAdminPassChanged(false);
      setSettings({ ...settings, adminPassword: '' }); // Clear password field
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update security settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setSavingSection('queue');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxQueueItems: settings.maxQueueItems,
          notifyAdminsOnNewRequest: settings.notifyAdminsOnNewRequest
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update queue settings');
      }

      setSuccess('Queue settings updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update queue settings');
    } finally {
      setSavingSection(null);
    }
  };

  const handleTestEmail = async () => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send test email');
      }

      setSuccess('Test email sent successfully! Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    }
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="server-settings">
      <h2>Server Settings</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* SMTP Configuration */}
      <form onSubmit={handleSaveSmtp} className="settings-form">
        <div className="settings-section">
          <h3>📧 SMTP & Application Configuration</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label htmlFor="appUrl">Application URL:</label>
              <input
                type="url"
                id="appUrl"
                value={settings.appUrl}
                onChange={(e) => setSettings({ ...settings, appUrl: e.target.value })}
                placeholder="http://localhost:8080"
                required
              />
              <p className="field-help">Used for email verification links. Include protocol (http:// or https://)</p>
            </div>

            <div className="form-group">
              <label htmlFor="smtpHost">SMTP Host:</label>
              <input
                type="text"
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="smtpPort">SMTP Port:</label>
              <input
                type="number"
                id="smtpPort"
                value={settings.smtpPort}
                onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="smtpUser">SMTP Username/Email:</label>
              <input
                type="email"
                id="smtpUser"
                value={settings.smtpUser}
                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="smtpPass">SMTP Password/App Password:</label>
              <div className="password-input-group">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  id="smtpPass"
                  value={settings.smtpPass}
                  onChange={(e) => {
                    setSettings({ ...settings, smtpPass: e.target.value });
                    setSmtpPassChanged(true);
                  }}
                  placeholder={smtpPassChanged ? "Enter new password" : "••••••••••••••••"}
                />
              </div>
              <p className="field-help">Leave blank to keep existing password</p>
            </div>

            <div className="form-group">
              <label htmlFor="smtpSenderName">Sender Name:</label>
              <input
                type="text"
                id="smtpSenderName"
                value={settings.smtpSenderName}
                onChange={(e) => setSettings({ ...settings, smtpSenderName: e.target.value })}
                placeholder="3D Print Queue"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="button button-secondary" 
              onClick={handleTestEmail}
            >
              📨 Send Test Email
            </button>
            <button 
              type="submit" 
              className="button button-primary"
              disabled={savingSection === 'smtp'}
            >
              {savingSection === 'smtp' ? 'Saving...' : '💾 Save SMTP & App Settings'}
            </button>
          </div>
        </div>
      </form>

      {/* Security Settings */}
      <form onSubmit={handleSaveSecurity} className="settings-form">
        <div className="settings-section">
          <h3>🔒 Security Settings</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label htmlFor="adminPassword">Admin Registration Password:</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                id="adminPassword"
                value={settings.adminPassword}
                onChange={(e) => {
                  setSettings({ ...settings, adminPassword: e.target.value });
                  setAdminPassChanged(true);
                }}
                placeholder={adminPassChanged ? "Enter new password" : "••••••••••••••••"}
              />
              <p className="field-help">
                Required password for users to register as admin. Leave blank to keep existing password.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="maxLoginAttempts">Max Failed Admin Registration Attempts:</label>
              <input
                type="number"
                id="maxLoginAttempts"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                min="1"
                max="10"
                required
              />
              <p className="field-help">Number of failed attempts before lockout (currently: {settings.maxLoginAttempts})</p>
            </div>

            <div className="form-group">
              <label htmlFor="lockoutDuration">Lockout Duration (minutes):</label>
              <input
                type="number"
                id="lockoutDuration"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })}
                min="1"
                max="1440"
                required
              />
              <p className="field-help">How long users are locked out after max attempts (currently: {settings.lockoutDuration} minutes)</p>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              👁️ Show Passwords
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="button button-primary"
              disabled={savingSection === 'security'}
            >
              {savingSection === 'security' ? 'Saving...' : '💾 Save Security Settings'}
            </button>
          </div>
        </div>
      </form>

      {/* Queue Settings */}
      <form onSubmit={handleSaveQueue} className="settings-form">
        <div className="settings-section">
          <h3>📋 Queue Settings</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label htmlFor="maxQueueItems">Max Active Queue Items Per User:</label>
              <input
                type="number"
                id="maxQueueItems"
                value={settings.maxQueueItems}
                onChange={(e) => setSettings({ ...settings, maxQueueItems: parseInt(e.target.value) })}
                min="1"
                max="20"
                required
              />
              <p className="field-help">Maximum number of active print requests per user (currently: {settings.maxQueueItems})</p>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={settings.notifyAdminsOnNewRequest}
                onChange={(e) => setSettings({ ...settings, notifyAdminsOnNewRequest: e.target.checked })}
              />
              📧 Notify admins when new print requests are submitted
            </label>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="button button-primary"
              disabled={savingSection === 'queue'}
            >
              {savingSection === 'queue' ? 'Saving...' : '💾 Save Queue Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServerSettings;