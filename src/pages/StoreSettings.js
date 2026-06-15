import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

export default function StoreSettings() {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    storeName: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    logo: '' // Base64 or URL
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load from localStorage first (primary storage)
      const savedSettings = localStorage.getItem('storeSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Try to load from backend if available
        try {
          const data = await api('/api/store-settings', { token });
          if (data) {
            setSettings(data);
          }
        } catch (err) {
          console.log('No backend settings found, using defaults');
        }
      }
    } catch (err) {
      console.log('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage (primary storage for now)
      localStorage.setItem('storeSettings', JSON.stringify(settings));
      
      // Optionally try to save to backend (if endpoint exists in future)
      try {
        await api('/api/store-settings', {
          method: 'POST',
          body: settings,
          token,
        });
      } catch (backendErr) {
        console.log('Backend save not available yet, using localStorage only');
      }
      
      alert('Store settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit for small logo
        alert('Logo file too large! Please use an image under 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Store Settings</h2>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Configure your store details for printing on bills
      </p>

      <div style={{ maxWidth: 600, background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Store Name *</label>
          <input
            type="text"
            value={settings.storeName}
            onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
            placeholder="ABC Pharmacy"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Address *</label>
          <textarea
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="123 Main St, City, Country"
            rows={3}
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Phone *</label>
          <input
            type="text"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            placeholder="+94 11 234 5678"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            placeholder="info@pharmacy.com"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Tax ID / Registration No</label>
          <input
            type="text"
            value={settings.taxId}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            placeholder="TAX123456"
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Logo (Max 500KB)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'block', marginBottom: 8 }}
          />
          {settings.logo && (
            <div style={{ marginTop: 8 }}>
              <img 
                src={settings.logo} 
                alt="Store Logo" 
                style={{ maxWidth: 150, maxHeight: 80, border: '1px solid #ddd', padding: 4 }}
              />
              <button
                onClick={() => setSettings({ ...settings, logo: '' })}
                style={{ display: 'block', marginTop: 4, padding: '4px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Remove Logo
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !settings.storeName || !settings.address || !settings.phone}
          style={{
            padding: '10px 20px',
            background: loading || !settings.storeName || !settings.address || !settings.phone ? '#ccc' : '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading || !settings.storeName || !settings.address || !settings.phone ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Preview */}
      {settings.storeName && (
        <div style={{ marginTop: 30 }}>
          <h3>Bill Preview</h3>
          <div style={{ 
            maxWidth: 300, 
            background: '#fff', 
            border: '2px dashed #ccc', 
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.4
          }}>
            {settings.logo && (
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <img src={settings.logo} alt="Logo" style={{ maxWidth: 100, maxHeight: 50 }} />
              </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14 }}>
              {settings.storeName}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10 }}>
              {settings.address}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10 }}>
              Tel: {settings.phone}
            </div>
            {settings.email && (
              <div style={{ textAlign: 'center', fontSize: 10 }}>
                {settings.email}
              </div>
            )}
            {settings.taxId && (
              <div style={{ textAlign: 'center', fontSize: 10 }}>
                Tax ID: {settings.taxId}
              </div>
            )}
            <div style={{ borderTop: '1px dashed #333', marginTop: 8, paddingTop: 8 }}>
              <div>Bill #: BILL-20241212-0001</div>
              <div>Date: {new Date().toLocaleString()}</div>
              <div>Customer: Sample Customer</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
