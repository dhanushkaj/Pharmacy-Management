import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';



const ALERT_TYPE_LABELS = {
  EXPIRY_WARNING: 'Expiry Warning',
  EXPIRY_CRITICAL: 'Expiry Critical',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  PAYMENT_DUE: 'Payment Due',
  PAYMENT_OVERDUE: 'Payment Overdue',
  NON_MOVING: 'Non Moving',
  OVER_STOCK: 'Over Stock',
};

const SEVERITY_LABELS = {
  INFO: 'Info',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
};

const AlertConfig = () => {
  const { token, roles } = useContext(AuthContext);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    alertType: '',
    thresholdDays: '',
    severity: '',
    enabled: true,
    description: '',
  });

  const isAdmin = Array.isArray(roles) && roles.some(r => r.toLowerCase() === 'admin');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/api/alerts/config', { token });
      setConfigs(data || []);
    } catch (err) {
      setError('Failed to load alert configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditing(config.alertConfigId);
    setForm({
      alertType: config.alertType,
      thresholdDays: config.thresholdDays,
      severity: config.severity,
      enabled: config.enabled,
      description: config.description || '',
    });
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };


  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      if (editing) {
        await api(`/api/alerts/config/${editing}`, {
          method: 'PUT',
          token,
          body: form,
        });
      } else {
        await api('/api/alerts/config', {
          method: 'POST',
          token,
          body: form,
        });
      }
      setEditing(null);
      setForm({ alertType: '', thresholdDays: '', severity: '', enabled: true, description: '' });
      fetchConfigs();
    } catch (err) {
      setError('Failed to save alert configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (configId) => {
    if (!window.confirm('Are you sure you want to delete this alert configuration?')) return;
    setLoading(true);
    setError(null);
    api(`/api/alerts/config/${configId}`, { method: 'DELETE', token })
      .then(() => fetchConfigs())
      .catch(() => setError('Failed to delete alert configuration'))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2>Alert Configuration</h2>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Type</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Threshold</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Severity</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Enabled</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Description</th>
            {isAdmin && <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {configs.map(cfg => (
            <tr key={cfg.alertConfigId}>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{ALERT_TYPE_LABELS[cfg.alertType] || cfg.alertType}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{cfg.thresholdDays}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{SEVERITY_LABELS[cfg.severity] || cfg.severity}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{cfg.enabled ? 'Yes' : 'No'}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{cfg.description}</td>
              {isAdmin && <td style={{ padding: 8, border: '1px solid #eee' }}>
                <button onClick={() => handleEdit(cfg)} style={{ marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDelete(cfg.alertConfigId)} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>Delete</button>
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin && (
        <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
          <h3>{editing ? 'Edit Alert Config' : 'Add Alert Config'}</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label>Type</label><br />
              <select value={form.alertType} onChange={e => handleChange('alertType', e.target.value)}>
                <option value="">Select</option>
                {Object.keys(ALERT_TYPE_LABELS).map(type => (
                  <option key={type} value={type}>{ALERT_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <label>{form.alertType === 'LOW_SALE' ? 'Non-Moving Days' : 'Threshold Days'}</label><br />
              <input
                type="number"
                value={form.thresholdDays}
                onChange={e => handleChange('thresholdDays', e.target.value)}
                placeholder={form.alertType === 'LOW_SALE' ? 'e.g. 90 for 3 months' : ''}
              />
            </div>
            <div>
              <label>Severity</label><br />
              <select value={form.severity} onChange={e => handleChange('severity', e.target.value)}>
                <option value="">Select</option>
                {Object.keys(SEVERITY_LABELS).map(sev => (
                  <option key={sev} value={sev}>{SEVERITY_LABELS[sev]}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Enabled</label><br />
              <input type="checkbox" checked={form.enabled} onChange={e => handleChange('enabled', e.target.checked)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Description</label><br />
              <input type="text" value={form.description} onChange={e => handleChange('description', e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>
          <button onClick={handleSave} style={{ marginTop: 16, padding: '8px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>{editing ? 'Update' : 'Add'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ alertType: '', thresholdDays: '', severity: '', enabled: true, description: '' }); }} style={{ marginLeft: 12 }}>Cancel</button>}
        </div>
      )}
    </div>
  );
};
export default AlertConfig;