import React, { useState, useEffect } from 'react';
import { api } from '../../utill/api';
import { useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';

const DayEndManualBillEntry = ({ reportDate, user, onChange }) => {
  const [manualBills, setManualBills] = useState([]);
  const [newBill, setNewBill] = useState({ billNumber: '', amount: '' });
  const [editingId, setEditingId] = useState(null);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchBills();
  }, [reportDate]);

  const fetchBills = async () => {
    const bills = await api(`/api/day-end-manual-bills/${reportDate}`, { token });
    setManualBills(bills);
    if (onChange) onChange(bills);
  };

  const handleAdd = async () => {
    if (!newBill.billNumber || !newBill.amount) return;
    await api('/api/day-end-manual-bills', {
      method: 'POST',
      body: { ...newBill, reportDate, createdBy: user },
      token
    });
    setNewBill({ billNumber: '', amount: '' });
    fetchBills();
  };

  const handleEdit = (bill) => {
    setEditingId(bill.id);
    setNewBill({ billNumber: bill.billNumber, amount: bill.amount });
  };

  const handleUpdate = async () => {
    await api(`/api/day-end-manual-bills/${editingId}`, {
      method: 'PUT',
      body: { ...newBill, reportDate, createdBy: user },
      token
    });
    setEditingId(null);
    setNewBill({ billNumber: '', amount: '' });
    fetchBills();
  };

  const handleDelete = async (id) => {
    await api(`/api/day-end-manual-bills/${id}`, { method: 'DELETE', token });
    fetchBills();
  };

  return (
    <div style={{ marginTop: 24 }}>
       <h3>Manual Bill Entry</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Bill Number"
          value={newBill.billNumber}
          onChange={e => setNewBill(b => ({ ...b, billNumber: e.target.value }))}
          style={{ padding: 8, minWidth: 120 }}
        />
        <input
          type="number"
          placeholder="Amount"
          value={newBill.amount}
          onChange={e => setNewBill(b => ({ ...b, amount: e.target.value }))}
          style={{ padding: 8, minWidth: 100 }}
        />
        {editingId ? (
          <button type="button" onClick={handleUpdate} style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>Update</button>
        ) : (
          <button type="button" onClick={handleAdd} style={{ padding: '8px 16px', background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add</button>
        )}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: 8, border: '1px solid #ccc' }}>Bill Number</th>
            <th style={{ padding: 8, border: '1px solid #ccc' }}>Amount</th>
            <th style={{ padding: 8, border: '1px solid #ccc' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {manualBills.map(bill => (
            <tr key={bill.id}>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{bill.billNumber}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>{bill.amount}</td>
              <td style={{ padding: 8, border: '1px solid #eee' }}>
                <button onClick={() => handleEdit(bill)} style={{ marginRight: 8, padding: '4px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>Edit</button>
                <button onClick={() => handleDelete(bill.id)} style={{ padding: '4px 12px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4 }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DayEndManualBillEntry;
