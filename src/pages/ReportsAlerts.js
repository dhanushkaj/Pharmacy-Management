import React from 'react';

const mockReports = [
  { id: 1, title: "Daily Sales", date: "2025-08-31", summary: "Total sales: Rs. 12,000" },
  { id: 2, title: "Low Stock Alert", date: "2025-08-31", summary: "Amoxicillin stock below threshold" },
];

const ReportsAlerts = () => (
  <div style={{ padding: 24 }}>
    <h2>Reports & Alerts</h2>
    {/* Submenu */}
    <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
  <button id="billing-report-btn" style={{ padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Billing Report</button>
  <button id="alert-report-btn" style={{ padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Alert Report</button>
  <button id="sales-report-btn" style={{ padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Sales Report</button>
    </div>

    {/* Billing Report Section */}
    <div style={{ marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <h3>Billing Report</h3>
      <p>View all bills by customer, by date, and by product.</p>
      {/* Example table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Bill No</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Product</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1001</td>
            <td>John Doe</td>
            <td>2025-08-31</td>
            <td>Paracetamol</td>
            <td>Rs. 150.00</td>
          </tr>
          <tr>
            <td>1002</td>
            <td>Jane Smith</td>
            <td>2025-08-31</td>
            <td>Amoxicillin</td>
            <td>Rs. 300.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Sales Report Section */}
    <div style={{ marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <h3>Sales Report</h3>
      <p>Sales done by date, month, year, and by product.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Date</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Total Sales</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2025-08-31</td>
            <td>Paracetamol</td>
            <td>10</td>
            <td>Rs. 150.00</td>
          </tr>
          <tr>
            <td>2025-08-31</td>
            <td>Amoxicillin</td>
            <td>5</td>
            <td>Rs. 300.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Alert Report Section */}
    <div style={{ marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
      <h3>Alert Report</h3>
      <p>Alerts for expiry and low stock.</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>Type</th>
            <th>Product</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Low Stock</td>
            <td>Amoxicillin</td>
            <td>Stock below threshold</td>
          </tr>
          <tr>
            <td>Expiry</td>
            <td>Vitamin C</td>
            <td>Expires soon</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default ReportsAlerts;