import React, { useState, useContext } from 'react';
import { BillDetailsModal } from './ProductBin';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const CustomerCreditReport = () => {
  const { token, hasRole } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = [];
      if (name) params.push(`name=${encodeURIComponent(name)}`);
      if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
      if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
      const query = params.length ? `?${params.join('&')}` : '';
      const data = await api(`/api/billings/credit-report${query}`, { token });
      setResults((data || []).filter(b => !b.paid));
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  const handleMarkPaid = async (billingNumber) => {
    if (!window.confirm('Mark this bill as paid?')) return;
    try {
      await api(`/api/billings/${billingNumber}/mark-paid`, { method: 'PUT', token });
      setResults(results.filter(b => b.billingNumber !== billingNumber));
    } catch (e) {
      alert('Failed to mark as paid');
    }
  };

  const handleViewBill = async (billingNumber) => {
    try {
      const bill = await api(`/api/billings/by-number/${billingNumber}`, { token });
      setSelectedBill(bill);
      setShowBillModal(true);
    } catch (e) {
      alert('Failed to load bill details');
    }
  };

  if (!hasRole('admin')) {
    return <div style={{ padding: 24, color: 'crimson', fontWeight: 'bold' }}>Access denied. Admins only.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Customer Credit Report</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Customer Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: 8, minWidth: 140 }}
        />
        <input
          type="text"
          placeholder="Mobile Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ padding: 8, minWidth: 120 }}
        />
        <input
          type="datetime-local"
          placeholder="Start Date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          type="datetime-local"
          placeholder="End Date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          style={{ padding: 8 }}
        />
        <button onClick={fetchReport} style={{ padding: '8px 18px' }}>Search</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Customer Name</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Phone</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Credit Bill</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Billing Date</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Amount</th>
              <th style={{ padding: 10, border: '1px solid #ccc' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20 }}>No results found.</td></tr>
            ) : (
              results.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{r.customerName}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{r.phone}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>
                    <button onClick={() => handleViewBill(r.billingNumber)} style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {r.billingNumber}
                    </button>
                  </td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>{r.billingDate ? new Date(r.billingDate).toLocaleString() : '-'}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>Rs.{r.grandTotal?.toFixed(2)}</td>
                  <td style={{ padding: 10, border: '1px solid #ccc' }}>
                    <button onClick={() => handleMarkPaid(r.billingNumber)} style={{ background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 18px', fontWeight: 'bold', cursor: 'pointer' }}>Paid</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {showBillModal && selectedBill && (
        selectedBill.items ? (
          <BillDetailsModal bill={selectedBill} onClose={() => setShowBillModal(false)} storeSettings={{ storeName: 'PHARMACY' }} width={600} />
        ) : (
          <pre>{JSON.stringify(selectedBill, null, 2)}</pre>
        )
      )}
    </div>
  );
};

export default CustomerCreditReport;
