import React, { useState, useEffect } from 'react';

interface AccessLog {
  _id: string;
  ip: string;
  method: string;
  path: string;
  statusCode: number;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  timestamp: string;
}

interface BannedIP {
  _id: string;
  ip: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

const AccessLogs: React.FC = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [ipToBan, setIpToBan] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchBannedIPs();
  }, [page, filter]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/access-logs?page=${page}&filter=${filter}&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      
      // Handle the response structure correctly
      if (data.pagination) {
        setLogs(data.logs || []);
        setTotalPages(data.pagination.pages || 1);
      } else {
        // Fallback if API returns logs directly
        setLogs(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedIPs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/banned-ips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch banned IPs');

      const data = await response.json();
      setBannedIPs(data);
    } catch (err) {
      console.error('Failed to load banned IPs:', err);
    }
  };

  const handleBanIP = async (ip: string, reason: string) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/ban-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip, reason })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to ban IP');
      }

      setSuccess(`IP ${ip} has been banned`);
      setIpToBan('');
      setBanReason('');
      fetchBannedIPs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban IP');
    }
  };

  const handleUnbanIP = async (ip: string) => {
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/unban-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unban IP');
      }

      setSuccess(`IP ${ip} has been unbanned`);
      fetchBannedIPs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unban IP');
    }
  };

  const getStatusClass = (statusCode: number): string => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'info';
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) return <div className="loading">Loading access logs...</div>;

  return (
    <div className="access-logs">
      <h2>Access Logs & IP Management</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Banned IPs Section */}
      <div className="banned-ips-section">
        <h3>Banned IP Addresses</h3>
        
        <div className="ban-ip-form">
          <input
            type="text"
            placeholder="IP Address"
            value={ipToBan}
            onChange={(e) => setIpToBan(e.target.value)}
          />
          <input
            type="text"
            placeholder="Reason"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <button
            className="button button-danger"
            onClick={() => handleBanIP(ipToBan, banReason)}
            disabled={!ipToBan || !banReason}
          >
            Ban IP
          </button>
        </div>

        {bannedIPs.length > 0 ? (
          <table className="banned-ips-table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Reason</th>
                <th>Banned By</th>
                <th>Banned At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bannedIPs.map((ban) => (
                <tr key={ban._id}>
                  <td><code>{ban.ip}</code></td>
                  <td>{ban.reason}</td>
                  <td>{ban.bannedBy}</td>
                  <td>{new Date(ban.bannedAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="button button-sm button-primary"
                      onClick={() => handleUnbanIP(ban.ip)}
                    >
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">No banned IP addresses</p>
        )}
      </div>

      {/* Access Logs Section */}
      <div className="logs-section">
        <div className="logs-header">
          <h3>Access Logs</h3>
          <div className="filter-controls">
            <select value={filter} onChange={(e) => {
              setFilter(e.target.value);
              setPage(1); // Reset to page 1 when filter changes
            }}>
              <option value="all">All Requests</option>
              <option value="success">Successful (2xx)</option>
              <option value="errors">Errors (4xx, 5xx)</option>
              <option value="auth">Authentication</option>
            </select>
          </div>
        </div>

        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>User</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><code>{log.ip}</code></td>
                    <td><span className={`method method-${log.method.toLowerCase()}`}>{log.method}</span></td>
                    <td><code>{log.path}</code></td>
                    <td>
                      <span className={`status status-${getStatusClass(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td>{log.userEmail || <span className="anonymous">Anonymous</span>}</td>
                    <td>
                      {!bannedIPs.find(b => b.ip === log.ip) && (
                        <button
                          className="button button-sm button-danger"
                          onClick={() => {
                            setIpToBan(log.ip);
                            setBanReason('Suspicious activity');
                          }}
                        >
                          Ban IP
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            className="button button-sm"
            onClick={handlePrevPage}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="button button-sm"
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessLogs;