import React, { useState, useContext, useEffect } from 'react';
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
  const [storeSettings, setStoreSettings] = useState(null);

  // Load store settings
  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      // Load from localStorage (primary storage)
      const savedSettings = localStorage.getItem('storeSettings');
      if (savedSettings) {
        setStoreSettings(JSON.parse(savedSettings));
        return;
      }
      
      // If not in localStorage, fetch from backend
      const data = await api('/api/store-settings', { token });
      if (data) {
        setStoreSettings(data);
        localStorage.setItem('storeSettings', JSON.stringify(data));
      }
    } catch (err) {
      console.log('Error loading store settings:', err);
    }
  };

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

  const handlePrintBill = (bill) => {
    if (!bill) return;
    // Add body class for print mode
    document.body.classList.add('print-credit-report-bill-mode');
    window.onafterprint = () => {
      document.body.classList.remove('print-credit-report-bill-mode');
      window.onafterprint = null;
    };
    window.print();
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
        <>
          {selectedBill.items ? (
            <>
              {/* Thermal Print Format - Exact BillingHistory replica */}
              <div id="credit-report-bill-print" style={{ width: '100%', maxWidth: 260, margin: '0 auto', padding: '12px 4px', fontFamily: 'monospace', fontSize: '10px', lineHeight: 1.3, background: '#fff', display: 'none' }}>
                {/* Store Name Header - Logo placeholder, Name Right */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginBottom: 1, paddingLeft: '2px', paddingRight: '2px' }}>
                  {/* Logo */}
                  {storeSettings?.logo && (
                    <img
                      src={storeSettings.logo}
                      alt="Logo"
                      style={{ width: '65px', height: '65px', objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}
                  {!storeSettings?.logo && (
                    <div style={{ width: '65px', height: '65px', backgroundColor: '#000', flexShrink: 0, borderRadius: '1px' }}></div>
                  )}
                  {/* Store Name - Center aligned */}
                  <div style={{ textAlign: 'center', minWidth: 0 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', lineHeight: 1.0, marginBottom: 0, wordWrap: 'break-word' }}>
                      {(storeSettings?.storeName || 'PHARMACY').split(' ').slice(1).join(' ') || 'PHARMACY'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
                  {storeSettings?.address || 'Store Address'}
                </div>
                {storeSettings?.phone && storeSettings.phone !== 'N/A' && (
                  <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: 1, lineHeight: 1.1, fontWeight: '700' }}>
                    Ph: {storeSettings.phone}
                  </div>
                )}

                <div style={{ borderTop: '2px solid #000', margin: '2px 0' }}></div>

                {/* Bill Details */}
                <div style={{ fontSize: '9px', marginBottom: 1, lineHeight: 1.2, fontWeight: '600' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                    <span>Bill No:</span>
                    <span>{selectedBill?.billingNumber || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                    <span>Date:</span>
                    <span>{selectedBill?.billingDate ? new Date(selectedBill.billingDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                    <span>Customer:</span>
                    <span>{selectedBill?.customerName || 'N/A'}</span>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', color: '#000', marginTop: 1 }}>** CREDIT **</div>
                </div>

                <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

                {/* Items List */}
                <div style={{ marginBottom: 0 }}>
                  {selectedBill?.items && selectedBill.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 1, paddingBottom: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '10px', wordBreak: 'break-word', marginBottom: 1, letterSpacing: '0.5px' }}>
                        {item.productName?.substring(0, 22) || 'Item'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '30px 50px 1fr', gap: '0px', fontSize: '9px', fontWeight: '700', alignItems: 'center' }}>
                        <span style={{ whiteSpace: 'nowrap' }}>Q:{item.quantity}</span>
                        <span style={{ whiteSpace: 'nowrap', paddingLeft: '2px' }}>P:{item.unitPrice?.toFixed(2) || '0.00'}</span>
                        <span style={{ textAlign: 'right', fontWeight: '900', whiteSpace: 'nowrap', paddingLeft: '2px' }}>{(item.quantity * item.unitPrice)?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

                {/* Totals */}
                <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                    <span>Subtotal</span>
                    <span style={{ textAlign: 'right' }}>{selectedBill?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  {selectedBill?.discountAmount && selectedBill.discountAmount > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                      <span>Discount</span>
                      <span style={{ textAlign: 'right' }}>-{selectedBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 1, marginTop: 1 }}>
                    <span>TOTAL</span>
                    <span style={{ textAlign: 'right' }}>{selectedBill?.grandTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

                {/* Payment Summary - For Credit Bills */}
                <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                    <span>Status</span>
                    <span style={{ textAlign: 'right' }}>UNPAID</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                    <span>Payment</span>
                    <span style={{ textAlign: 'right' }}>{selectedBill?.paymentMethod || 'CREDIT'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

                {/* Footer */}
                <div style={{ textAlign: 'left', fontSize: '8px', marginTop: 0, marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
                  <div>Items Sold: {selectedBill?.items?.length || 0}</div>
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px', marginTop: 0 }}>Thank You Come Again!</div>
                  <div style={{ textAlign: 'center', fontSize: '12px', marginTop: 0, fontWeight: 'bold' }}>Need Advice? Contact Us: {storeSettings?.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Modal Overlay with Print Button in Header */}
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setShowBillModal(false)}>
                <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 600, width: '90vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
                  {/* Header with Print and Close Buttons */}
                  <div style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 13 }}>Bill #: {selectedBill?.billingNumber}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handlePrintBill(selectedBill)}
                        title="Print in thermal format"
                        style={{
                          padding: '8px 14px',
                          background: '#1976d2',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 12
                        }}
                      >
                        🖨️ Print
                      </button>
                      <button 
                        onClick={() => setShowBillModal(false)} 
                        style={{ 
                          padding: '8px 12px', 
                          background: '#f44336', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {/* Bill Content - Formatted preview matching BillingHistory */}
                  <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                    <div style={{ maxWidth: 400, margin: '0 auto', fontFamily: 'Arial, sans-serif', fontSize: 12, lineHeight: 1.6 }}>
                      {/* Header with Logo and Store Name */}
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                          {/* Logo */}
                          {storeSettings?.logo && (
                            <img
                              src={storeSettings.logo}
                              alt="Logo"
                              style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                            />
                          )}
                          {!storeSettings?.logo && (
                            <div style={{ width: '60px', height: '60px', backgroundColor: '#000', borderRadius: '2px' }}></div>
                          )}
                          {/* Store Name */}
                          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                            {(storeSettings?.storeName || 'PHARMACY').split(' ').slice(1).join(' ') || 'PHARMACY'}
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: '#666', marginBottom: 2 }}>
                          {storeSettings?.address || 'Store Address'}
                        </div>
                        {storeSettings?.phone && storeSettings.phone !== 'N/A' && (
                          <div style={{ fontSize: 11, color: '#666' }}>
                            Ph: {storeSettings.phone}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ borderTop: '2px solid #000', marginBottom: 15 }}></div>

                      {/* Bill Details */}
                      <div style={{ marginBottom: 15, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Bill No:</strong>
                          <span>{selectedBill?.billingNumber || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Date:</strong>
                          <span>{selectedBill?.billingDate ? new Date(selectedBill.billingDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Customer:</strong>
                          <span>{selectedBill?.customerName || 'N/A'}</span>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>
                          ** CREDIT **
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginBottom: 12 }}></div>

                      {/* Items */}
                      <div style={{ marginBottom: 12 }}>
                        {selectedBill?.items && selectedBill.items.map((item, idx) => (
                          <div key={idx} style={{ marginBottom: 8, fontSize: 11 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: 3 }}>
                              {item.productName || 'Item'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                              <span>Q: {item.quantity} × Rs.{item.unitPrice?.toFixed(2) || '0.00'}</span>
                              <span style={{ fontWeight: 'bold' }}>Rs.{(item.quantity * item.unitPrice)?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginBottom: 12 }}></div>

                      {/* Totals */}
                      <div style={{ marginBottom: 12, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span>Subtotal</span>
                          <span>Rs.{selectedBill?.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {selectedBill?.discountAmount && selectedBill.discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#e91e63' }}>
                            <span>Discount</span>
                            <span>-Rs.{selectedBill.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 8 }}>
                          <span>TOTAL</span>
                          <span>Rs.{selectedBill?.grandTotal?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginBottom: 12 }}></div>

                      {/* Payment Info */}
                      <div style={{ marginBottom: 12, fontSize: 11 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Status:</strong>
                          <span style={{ color: '#f44336', fontWeight: 'bold' }}>UNPAID</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Payment:</strong>
                          <span>{selectedBill?.paymentMethod || 'CREDIT'}</span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #000', marginBottom: 12 }}></div>

                      {/* Footer */}
                      <div style={{ textAlign: 'center', fontSize: 10, color: '#666' }}>
                        <div style={{ marginBottom: 6 }}>Items Sold: {selectedBill?.items?.length || 0}</div>
                        <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Thank You Come Again!</div>
                        <div style={{ fontSize: 9 }}>
                          Need Advice? Contact Us: {storeSettings?.phone || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <pre>{JSON.stringify(selectedBill, null, 2)}</pre>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerCreditReport;
