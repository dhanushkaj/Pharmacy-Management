import React from 'react';

const SettingsSecurity = () => (
  <div>
    <h2>Settings & Security</h2>
    <div style={{ marginTop: 24 }}>
      <h4>User Settings</h4>
      <p>Change password, update profile, set preferences.</p>
      <button>Change Password</button>
    </div>
    <div style={{ marginTop: 32 }}>
      <h4>Security</h4>
      <p>Manage user roles, enable 2FA, audit log.</p>
      <button>Manage Roles</button>
    </div>
  </div>
);

export default SettingsSecurity;