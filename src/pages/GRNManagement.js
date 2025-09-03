import React from 'react';


const samplePOs = [
  {
    poNumber: 'PO-001',
    supplier: 'HealthCorp',
    products: [
      { name: 'Paracetamol', qty: 100, cost: 10, total: 1000 },
      { name: 'Ibuprofen', qty: 50, cost: 20, total: 1000 },
      { name: 'Amoxicillin', qty: 20, cost: 50, total: 1000 },
    ],
    totalAmount: 3000,
  },
  {
    poNumber: 'PO-002',
    supplier: 'MediSupply',
    products: [
      { name: 'Cetirizine', qty: 80, cost: 15, total: 1200 },
      { name: 'Aspirin', qty: 40, cost: 25, total: 1000 },
    ],
    totalAmount: 2200,
  },
];

import { useState } from 'react';

const GRNManagement = () => {
  const [selectedPO, setSelectedPO] = useState('');
  const [grnNumber, setGrnNumber] = useState('GRN-002');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [approved, setApproved] = useState(false);

  const po = samplePOs.find(p => p.poNumber === selectedPO);

  const handleApprove = () => {
    setApproved(true);
    // Update stocks logic here
    alert('GRN Approved and stocks updated!');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Goods Receipt Note (GRN) Management</h2>
      {/* Section 1: Select PO */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label htmlFor="poNumber" style={{ fontWeight: 500 }}>Select Purchase Order:</label>
        <select id="poNumber" value={selectedPO} onChange={e => setSelectedPO(e.target.value)} style={{ padding: 8, minWidth: 180 }}>
          <option value="">Select PO Number</option>
          {samplePOs.map(po => (
            <option key={po.poNumber} value={po.poNumber}>{po.poNumber}</option>
          ))}
        </select>
      </div>

      {/* Section 2: PO Details */}
      {po && (
        <div style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 20, background: '#fafafa' }}>
          <h3 style={{ marginBottom: 16 }}>Purchase Order Details</h3>
          <div style={{ marginBottom: 12 }}><strong>Supplier:</strong> {po.supplier}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Product</th>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Quantity</th>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Cost</th>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {po.products.map((prod, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{prod.name}</td>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{prod.qty}</td>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{prod.cost}</td>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{prod.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div><strong>Total Amount:</strong> Rs. {po.totalAmount.toFixed(2)}</div>
        </div>
      )}

      {/* Section 3: GRN Info */}
      {po && (
        <div style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 20, background: '#f5f5f5' }}>
          <h3 style={{ marginBottom: 16 }}>GRN Information</h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
              <label style={{ marginBottom: 6 }}>GRN Number</label>
              <input type="text" value={grnNumber} onChange={e => setGrnNumber(e.target.value)} style={{ padding: 8 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
              <label style={{ marginBottom: 6 }}>Invoice Number</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={{ padding: 8 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
              <label style={{ marginBottom: 6 }}>Received Date</label>
              <input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} style={{ padding: 8 }} />
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Approve Button */}
      {po && (
        <div style={{ textAlign: 'right' }}>
          <button onClick={handleApprove} disabled={approved} style={{ padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>
            {approved ? 'Approved' : 'Approve & Update Stocks'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GRNManagement;