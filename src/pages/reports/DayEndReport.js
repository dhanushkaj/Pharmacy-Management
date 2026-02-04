
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';

const noteDenominations = [5000, 2000, 1000, 500, 100, 50, 20];
const coinDenominations = [10, 5, 1];

const DayEndReport = () => {
  const { token } = useContext(AuthContext);
  // Header fields
  const [branch, setBranch] = useState('Main Branch');
  const [posId, setPosId] = useState('POS-01');
  const [cashier, setCashier] = useState('');
  const [shift, setShift] = useState('');
  const [dayEndNo, setDayEndNo] = useState('');
  // Denominations
  const [notes, setNotes] = useState({ 5000: 0, 2000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 });
  const [coins, setCoins] = useState({ 10: 0, 5: 0, 1: 0 });
  // Non-cash
  const [cardPayments, setCardPayments] = useState('0.00');
  const [onlineTransfers, setOnlineTransfers] = useState('0.00');
  const [customerChequePayments, setCustomerChequePayments] = useState('0.00');
  // Supplier payments
  const [supplierPayments, setSupplierPayments] = useState([]);
  const [supplierInput, setSupplierInput] = useState({ supplierName: '', mode: 'Cash', amount: '' });
  // System sales summary
  const [totalSales, setTotalSales] = useState('0.00');
  const [cashSales, setCashSales] = useState('0.00');
  const [cardSales, setCardSales] = useState('0.00');
  const [onlineTransferSales, setOnlineTransferSales] = useState('0.00');
  const [chequeSales, setChequeSales] = useState('0.00');
  const [returns, setReturns] = useState('0.00');
  // Reconciliation
  const [expectedCash, setExpectedCash] = useState('0.00');
  const [physicalCashCounted, setPhysicalCashCounted] = useState('0.00');
  const [difference, setDifference] = useState('0.00');
  const [status, setStatus] = useState('BALANCED');
  const [differenceReason, setDifferenceReason] = useState('');
  // Sign-off
  const [cashierSignature, setCashierSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showTotal, setShowTotal] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Helper
  const cashValue =
    noteDenominations.reduce((sum, d) => sum + (Number(notes[d]) || 0) * d, 0) +
    coinDenominations.reduce((sum, d) => sum + (Number(coins[d]) || 0) * d, 0);

  const handleSupplierAdd = () => {
    setSupplierPayments([...supplierPayments, supplierInput]);
    setSupplierInput({ supplierName: '', mode: 'Cash', amount: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowTotal(false);
    try {
      const payload = {
        branch,
        posId,
        cashier,
        shift,
        dayEndNo,
        noteDenominations: noteDenominations.map(d => ({ value: d, qty: Number(notes[d]) || 0, total: (Number(notes[d]) || 0) * d })),
        coinDenominations: coinDenominations.map(d => ({ value: d, qty: Number(coins[d]) || 0, total: (Number(coins[d]) || 0) * d })),
        cardPayments: parseFloat(cardPayments) || 0,
        onlineTransfers: parseFloat(onlineTransfers) || 0,
        customerChequePayments: parseFloat(customerChequePayments) || 0,
        supplierPayments,
        totalSales: parseFloat(totalSales) || 0,
        cashSales: parseFloat(cashSales) || 0,
        cardSales: parseFloat(cardSales) || 0,
        onlineTransferSales: parseFloat(onlineTransferSales) || 0,
        chequeSales: parseFloat(chequeSales) || 0,
        returns: parseFloat(returns) || 0,
        expectedCash: parseFloat(expectedCash) || 0,
        physicalCashCounted: parseFloat(physicalCashCounted) || 0,
        difference: parseFloat(difference) || 0,
        status,
        differenceReason,
        cashierSignature,
        supervisorSignature,
        printedOn: new Date().toISOString(),
      };
      const result = await api('/api/day-end-report', {
        method: 'POST',
        body: payload,
        token
      });
      setSuccess('Day-End Report submitted!');
      setSubmittedData(result);
      setShowTotal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="day-end-report">
      <h2>Day-End Report</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
      {showTotal && submittedData && (
        <div style={{ marginTop: 32 }}>
          <div id="dayend-report-print" style={{ background: '#fff', padding: 40, borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', maxWidth: 900, margin: '0 auto', fontFamily: 'Segoe UI, Arial, sans-serif', border: '1.5px solid #1976d2' }}>
            <h1 style={{ textAlign: 'center', margin: 0, letterSpacing: 2, fontWeight: 700, fontSize: 28, color: '#1976d2' }}>DAILY CLOSING REPORT</h1>
            <div style={{ fontFamily: 'monospace', marginBottom: 8 }}>
              <div>Branch: <b>{submittedData.branch}</b></div>
              <div>POS ID: <b>{submittedData.posId}</b></div>
              <div>Cashier: <b>{submittedData.cashier}</b></div>
              <div>Business Date: <b>{new Date().toLocaleDateString()}</b></div>
              <div>Shift: <b>{submittedData.shift}</b></div>
              <div>Day End No: <b>{submittedData.dayEndNo}</b></div>
            </div>
            <hr />
            <h3>PHYSICAL CASH VALUE (BREAKDOWN)</h3>
            <table style={{ width: '100%', marginBottom: 12 }}>
              <thead><tr><th>Denomination</th><th>Qty</th><th>Value</th></tr></thead>
              <tbody>
                {submittedData.noteDenominations.map((n, i) => (
                  <tr key={i}><td>{n.value}</td><td>{n.qty}</td><td>{n.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                ))}
              </tbody>
            </table>
            <h4>Coins</h4>
            <table style={{ width: '100%', marginBottom: 12 }}>
              <thead><tr><th>Denomination</th><th>Qty</th><th>Value</th></tr></thead>
              <tbody>
                {submittedData.coinDenominations.map((c, i) => (
                  <tr key={i}><td>{c.value}</td><td>{c.qty}</td><td>{c.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontWeight: 'bold', marginBottom: 12 }}>TOTAL PHYSICAL CASH: Rs. {Number(submittedData.noteDenominations.reduce((sum, n) => sum + n.total, 0) + submittedData.coinDenominations.reduce((sum, c) => sum + c.total, 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <h3>NON-CASH COLLECTIONS</h3>
            <div>Card Payments: <b>{submittedData.cardPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Online Transfers: <b>{submittedData.onlineTransfers.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Customer Cheque Payments: <b>{submittedData.customerChequePayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <h3>SUPPLIER PAYMENTS (SAME DAY)</h3>
            <table style={{ width: '100%', marginBottom: 12 }}>
              <thead><tr><th>Supplier Name</th><th>Mode</th><th>Amount</th></tr></thead>
              <tbody>
                {submittedData.supplierPayments.map((sp, i) => (
                  <tr key={i}><td>{sp.supplierName}</td><td>{sp.mode}</td><td>{sp.amount}</td></tr>
                ))}
              </tbody>
            </table>
            <h3>SYSTEM SALES SUMMARY (AUTO)</h3>
            <div>Total Sales: <b>{submittedData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Cash Sales: <b>{submittedData.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Card Sales: <b>{submittedData.cardSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Online Transfer Sales: <b>{submittedData.onlineTransferSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Cheque Sales: <b>{submittedData.chequeSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Returns / Refunds: <b>{submittedData.returns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <h3>CASH RECONCILIATION</h3>
            <div>Expected Cash: <b>{submittedData.expectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Physical Cash Counted: <b>{submittedData.physicalCashCounted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Difference: <b>{submittedData.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Status: <b>{submittedData.status}</b></div>
            {submittedData.difference !== 0 && (
              <div>Reason: <b>{submittedData.differenceReason}</b></div>
            )}
            <h3>SIGN OFF</h3>
            <div>Cashier Signature: ___________________</div>
            <div>Supervisor Signature: ___________________</div>
            <div>Printed On: {new Date(submittedData.printedOn).toLocaleString()}</div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => window.print()} style={{ fontSize: 18, padding: '10px 32px', background: '#388e3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Print Report</button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3>Header Info</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input placeholder="Branch" value={branch} onChange={e => setBranch(e.target.value)} />
          <input placeholder="POS ID" value={posId} onChange={e => setPosId(e.target.value)} />
          <input placeholder="Cashier" value={cashier} onChange={e => setCashier(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input placeholder="Shift" value={shift} onChange={e => setShift(e.target.value)} />
          <input placeholder="Day End No" value={dayEndNo} onChange={e => setDayEndNo(e.target.value)} />
        </div>
        <h3>Physical Cash Value (Breakdown)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'max-content 80px', gap: '8px 24px', marginBottom: 8 }}>
          {noteDenominations.map(denom => (
            <React.Fragment key={denom}>
              <label style={{ alignSelf: 'center' }}>{denom} Note</label>
              <input
                type="number"
                min="0"
                value={notes[denom]}
                onChange={e => setNotes({ ...notes, [denom]: e.target.value })}
                style={{ width: 70, textAlign: 'right' }}
              />
            </React.Fragment>
          ))}
          {coinDenominations.map(denom => (
            <React.Fragment key={denom}>
              <label style={{ alignSelf: 'center' }}>{denom} Coin</label>
              <input
                type="number"
                min="0"
                value={coins[denom]}
                onChange={e => setCoins({ ...coins, [denom]: e.target.value })}
                style={{ width: 70, textAlign: 'right' }}
              />
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontWeight: 'bold', marginTop: 8 }}>Total Cash Value: {cashValue}</div>
        <h3>Non-Cash Collections</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label>Card Payments:</label>
          <input type="number" min="0" step="0.01" value={cardPayments} onChange={e => setCardPayments(e.target.value)} />
          <label>Online Transfers:</label>
          <input type="number" min="0" step="0.01" value={onlineTransfers} onChange={e => setOnlineTransfers(e.target.value)} />
          <label>Customer Cheque Payments:</label>
          <input type="number" min="0" step="0.01" value={customerChequePayments} onChange={e => setCustomerChequePayments(e.target.value)} />
        </div>
        <h3>Supplier Payments (Same Day)</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input type="text" placeholder="Supplier Name" value={supplierInput.supplierName} onChange={e => setSupplierInput({ ...supplierInput, supplierName: e.target.value })} />
          <select value={supplierInput.mode} onChange={e => setSupplierInput({ ...supplierInput, mode: e.target.value })}>
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
          </select>
          <input type="number" placeholder="Amount" value={supplierInput.amount} onChange={e => setSupplierInput({ ...supplierInput, amount: e.target.value })} />
          <button type="button" onClick={handleSupplierAdd}>Add Supplier Payment</button>
        </div>
        <ul>
          {supplierPayments.map((sp, idx) => (
            <li key={idx}>{sp.supplierName} ({sp.mode}) - {sp.amount}</li>
          ))}
        </ul>
        <h3>System Sales Summary (Auto)</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label>Total Sales:</label>
          <input type="number" min="0" step="0.01" value={totalSales} onChange={e => setTotalSales(e.target.value)} />
          <label>Cash Sales:</label>
          <input type="number" min="0" step="0.01" value={cashSales} onChange={e => setCashSales(e.target.value)} />
          <label>Card Sales:</label>
          <input type="number" min="0" step="0.01" value={cardSales} onChange={e => setCardSales(e.target.value)} />
          <label>Online Transfer Sales:</label>
          <input type="number" min="0" step="0.01" value={onlineTransferSales} onChange={e => setOnlineTransferSales(e.target.value)} />
          <label>Cheque Sales:</label>
          <input type="number" min="0" step="0.01" value={chequeSales} onChange={e => setChequeSales(e.target.value)} />
          <label>Returns/Refunds:</label>
          <input type="number" min="0" step="0.01" value={returns} onChange={e => setReturns(e.target.value)} />
        </div>
        <h3>Cash Reconciliation</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <label>Expected Cash:</label>
          <input type="number" min="0" step="0.01" value={expectedCash} onChange={e => setExpectedCash(e.target.value)} />
          <label>Physical Cash Counted:</label>
          <input type="number" min="0" step="0.01" value={physicalCashCounted} onChange={e => setPhysicalCashCounted(e.target.value)} />
          <label>Difference:</label>
          <input type="number" min="0" step="0.01" value={difference} onChange={e => setDifference(e.target.value)} />
          <label>Status:</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="BALANCED">BALANCED</option>
            <option value="SHORT">SHORT</option>
            <option value="EXCESS">EXCESS</option>
          </select>
        </div>
        {difference !== '0.00' && (
          <div style={{ marginBottom: 12 }}>
            <label>Reason (if not zero):</label>
            <input type="text" value={differenceReason} onChange={e => setDifferenceReason(e.target.value)} />
          </div>
        )}
        <h3>Sign Off</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input placeholder="Cashier Signature" value={cashierSignature} onChange={e => setCashierSignature(e.target.value)} />
          <input placeholder="Supervisor Signature" value={supervisorSignature} onChange={e => setSupervisorSignature(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 24, width: '100%', fontSize: 18, padding: '12px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Submit Day-End Report</button>
      </form>
    </div>
  );
};

export default DayEndReport;
