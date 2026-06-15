// Print-only CSS to restrict print to report section

import React, { useState, useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';
import DayEndManualBillEntry from './DayEndManualBillEntry';

const noteDenominations = [5000, 2000, 1000, 500, 100, 50, 20];
const coinDenominations = [10, 5, 1];


const DayEndReport = () => {
    // User guidance for calculations
    const guidance = (
      <div style={{ background: '#e3f2fd', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 15, color: '#1a237e' }}>
        <b>Day-End Report Guidance:</b>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li><b>Total Sale:</b> All sales for the day (cash, card, online, cheque, credit). Auto-filled from billing.</li>
          <li><b>Cash Sales:</b> Only sales paid by cash. Auto-filled from billing.</li>
          <li><b>Expected Cash:</b> <br />
            <span style={{ fontSize: 14 }}>
              <i>Cash Sales + Manual Bill Entries Total</i>
            </span>
          </li>
          <li><b>Physical Cash Counted:</b> Actual cash you count, based on denominations entered.</li>
          <li><b>Difference:</b> <br />
            <span style={{ fontSize: 14 }}>
              <i>Physical Cash Counted - Expected Cash</i>
            </span>
          </li>
          <li><b>Status:</b> <br />
            <span style={{ fontSize: 14 }}>
              <b>SHORT:</b> Cash Counted &lt; Expected Cash (cash missing)<br />
              <b>EXCESS:</b> Cash Counted &gt; Expected Cash (extra cash)<br />
              <b>BALANCED:</b> Cash Counted = Expected Cash (perfect match)
            </span>
          </li>
        </ul>
        <div style={{ marginTop: 8, fontSize: 14 }}>
          All values are auto-calculated. Enter denominations and check the report for discrepancies.
        </div>
      </div>
    );
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

  // Auto-fill details from backend on mount
  React.useEffect(() => {
    const fetchDayEndDetails = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const details = await api(`/api/day-end-report/details?date=${today}`, { method: 'GET', token });
        if (details) {
          setBranch(details.branch ?? 'Main Branch');
          setPosId(details.posId ?? 'POS-01');
          setCashier(details.cashier ?? '');
          setShift(details.shift ?? '');
          setDayEndNo(details.dayEndNo ?? '');

          // Denominations
          if (Array.isArray(details.noteDenominations)) {
            const notesObj = { 5000: 0, 2000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 };
            details.noteDenominations.forEach(n => { if (n && n.value in notesObj) notesObj[n.value] = n.qty; });
            setNotes(notesObj);
          }
          if (Array.isArray(details.coinDenominations)) {
            const coinsObj = { 10: 0, 5: 0, 1: 0 };
            details.coinDenominations.forEach(c => { if (c && c.value in coinsObj) coinsObj[c.value] = c.qty; });
            setCoins(coinsObj);
          }

          setSupplierPayments(Array.isArray(details.supplierPayments) ? details.supplierPayments : []);

          setTotalSales(details.totalSales?.toString() ?? '0.00');
          setCashSales(details.cashSales?.toString() ?? '0.00');
          setCardSales(details.cardSales?.toString() ?? '0.00');
          setOnlineTransferSales(details.onlineTransferSales?.toString() ?? '0.00');
          setChequeSales(details.chequeSales?.toString() ?? '0.00');
          setReturns(details.returns?.toString() ?? '0.00');

          setExpectedCash(details.expectedCash?.toString() ?? '0.00');
          setPhysicalCashCounted(details.physicalCashCounted?.toString() ?? '0.00');
          setDifference(details.difference?.toString() ?? '0.00');
          setStatus(details.status ?? 'BALANCED');
          setDifferenceReason(details.differenceReason ?? '');

          setCashierSignature(details.cashierSignature ?? '');
          setSupervisorSignature(details.supervisorSignature ?? '');

          setOldManualBillValue(details.oldManualBillTotal ?? 0);
          setCreditCustomerBillings(details.creditCustomerTotal ?? 0);
          // Fill system sales summary for report display
          setSystemSalesSummary({
            totalSales: details.totalSales ?? 0,
            cashSales: details.cashSales ?? 0,
            cardSales: details.cardSales ?? 0,
            onlineTransferSales: details.onlineTransferSales ?? 0,
            chequeSales: details.chequeSales ?? 0,
            returns: details.returns ?? 0
          });
          setCashReconciliation({
            expectedCash: details.expectedCash ?? 0,
            physicalCashCounted: details.physicalCashCounted ?? 0,
            difference: details.difference ?? 0,
            status: details.status ?? 'No data'
          });
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchDayEndDetails();
  }, [token]);
  
  // Print-only CSS to restrict print to report section
  // Print-only CSS to restrict print to report section
React.useEffect(() => {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.id = 'print-only-style';
  style.innerHTML = `
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        overflow: hidden !important;
      }

      body * {
        visibility: hidden !important;
      }

      #dayend-report-print,
      #dayend-report-print * {
        visibility: visible !important;
      }

      #dayend-report-print {
        position: absolute !important;
        top: 0;
        left: 0;
        width: 210mm !important;
        min-height: 297mm !important;
        padding: 12mm !important;
        box-sizing: border-box !important;
        background: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
      }

      button {
        display: none !important;
      }

      form {
        display: none !important;
      }

    }
  `;
  document.head.appendChild(style);
  return () => {
    const el = document.getElementById('print-only-style');
    if (el) el.remove();
  };
}, []);


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
  const [creditCustomerBillings, setCreditCustomerBillings] = useState(null);  
   // SYSTEM SALES SUMMARY (AUTO) state
  const [systemSalesSummary, setSystemSalesSummary] = useState(null);
  const [cashReconciliation, setCashReconciliation] = useState(null);
  // Credit Customer Billings state
  
  // Old Manual Bill Value state
  const [oldManualBillValue, setOldManualBillValue] = useState(null);

  // Manual Bill Entries (sum amounts)
  const [manualBillEntries, setManualBillEntries] = useState([]);
  const manualBillEntriesTotal = Array.isArray(manualBillEntries)
    ? manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)
    : 0;

  // Fetch Old Manual Bill Value on mount (for today)
  React.useEffect(() => {
    const fetchOldManualBillValue = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const resp = await api(`/api/day-end-manual-bills/${today}`, { method: 'GET', token });
        // If API returns an array and it's empty, set to 0
        if (Array.isArray(resp) && resp.length === 0) {
          setOldManualBillValue(0);
        } else if (resp && typeof resp.total === 'number') {
          setOldManualBillValue(resp.total);
        } else if (Array.isArray(resp) && resp.length > 0 && typeof resp[0].amount === 'number') {
          // fallback: sum amounts if array of bills
          setOldManualBillValue(resp.reduce((sum, b) => sum + (b.amount || 0), 0));
        } else {
          setOldManualBillValue(0);
        }
      } catch (e) {
        setOldManualBillValue(0);
      }
    };
    fetchOldManualBillValue();
  }, [token]);


  // Helper: always number
  const cashValue = React.useMemo(() =>
    noteDenominations.reduce((sum, d) => sum + (Number(notes[d]) || 0) * d, 0) +
    coinDenominations.reduce((sum, d) => sum + (Number(coins[d]) || 0) * d, 0)
  , [notes, coins]);

  // Non-cash total (auto)
  const nonCashTotal = React.useMemo(() =>
    (parseFloat(cardPayments) || 0) +
    (parseFloat(onlineTransfers) || 0) +
    (parseFloat(customerChequePayments) || 0)
  , [cardPayments, onlineTransfers, customerChequePayments]);

  // Sync physicalCashCounted and difference with cashValue and expectedCash
  React.useEffect(() => {
    setPhysicalCashCounted(Number(cashValue).toFixed(2));
    const diff = (Number(cashValue) || 0) - (parseFloat(expectedCash) || 0);
    setDifference(diff.toFixed(2));
  }, [cashValue, expectedCash]);

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
        oldManualBillTotal: parseFloat(oldManualBillValue) || 0,
        creditCustomerTotal: parseFloat(creditCustomerBillings) || 0,
        manualBillEntries: manualBillEntries,
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

      setSubmittedData(payload); // <- fixed: store submitted data for display
      setSuccess('Day-End Report submitted!');
      setShowTotal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="day-end-report">
        <h2>Day-End Report</h2>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && <div style={{ color: 'green' }}>{success}</div>}

        {showTotal && submittedData && (
          <div style={{ marginTop: 32 }}>
            <div
              id="dayend-report-print"
              style={{
                width: 320,
                margin: '0 auto',
                padding: '16px 12px',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.4,
                background: '#fff',
                color: '#000',
              }}
            >
              {/* Store Header */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                DAY-END REPORT
              </div>
              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>
              
              <div style={{ fontSize: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span><b>{submittedData.branch}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>POS ID:</span><b>{submittedData.posId}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cashier:</span><b>{submittedData.cashier}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span><b>{new Date().toLocaleDateString()}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shift:</span><b>{submittedData.shift}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Day End No:</span><b>{submittedData.dayEndNo}</b></div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SUPPLIER PAYMENTS</div>
              {submittedData.supplierPayments && submittedData.supplierPayments.length > 0 ? (
                <table style={{ width: '100%', fontSize: 10, marginBottom: 4, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 'bold' }}>Supplier</th>
                      <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>Mode</th>
                      <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 'bold' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedData.supplierPayments.map((sp, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                        <td style={{ padding: '2px 0', fontWeight: 'bold' }}>{sp.supplierName}</td>
                        <td style={{ textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>{sp.mode}</td>
                        <td style={{ textAlign: 'right', padding: '2px 0', fontWeight: 'bold' }}>{parseFloat(sp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ fontSize: 10, fontStyle: 'italic', marginBottom: 4 }}>No supplier payments</div>
              )}

              <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SYSTEM SALES SUMMARY</div>
              <div style={{ fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Sales:</span><b>{submittedData.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cash Sales:</span><b>{submittedData.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Card Sales:</span><b>{submittedData.cardSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Online Transfer:</span><b>{submittedData.onlineTransferSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cheque Sales:</span><b>{submittedData.chequeSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Returns/Refunds:</span><b>{submittedData.returns.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Old Manual Bill:</span><b>{(submittedData.oldManualBillTotal != null ? parseFloat(submittedData.oldManualBillTotal) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Credit Customer:</span><b>{(submittedData.creditCustomerTotal != null ? parseFloat(submittedData.creditCustomerTotal) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Manual Bill Entry:</span><b>{(Array.isArray(submittedData.manualBillEntries) ? submittedData.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>CASH RECONCILIATION</div>
              {(() => {
                const cashSalesNum = parseFloat(submittedData.cashSales) || 0;
                let manualBillEntriesNum = 0;
                if (Array.isArray(submittedData.manualBillEntries)) {
                  manualBillEntriesNum = submittedData.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                }
                // Expected Cash = Cash Sales + Manual Bill Entries only
                const expectedCashCalc = cashSalesNum + manualBillEntriesNum;
                return (
                  <div style={{ fontSize: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Expected Cash:</span>
                      <b>{expectedCashCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ fontSize: 8, textAlign: 'right', marginBottom: 2 }}>(Cash Sales + Manual Bill Entry)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Physical Cash:</span>
                      <b>{Number(cashValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Difference:</span>
                      <b>{(Number(cashValue) - expectedCashCalc).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, paddingTop: 2, borderTop: '1px solid #000' }}>
                      <span>Status:</span>
                      <b style={{ fontSize: 12 }}>{
                        Number(cashValue) > expectedCashCalc
                          ? 'EXCESS'
                          : Number(cashValue) < expectedCashCalc
                          ? 'SHORT'
                          : 'BALANCED'
                      }</b>
                    </div>
                  </div>
                );
              })()}

              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SIGN OFF</div>
              <div style={{ fontSize: 10, marginBottom: 8 }}>
                <div>Cashier: ___________________</div>
                <div style={{ marginTop: 4 }}>Supervisor: ___________________</div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center', fontWeight: 'bold' }}>
                Printed: {new Date(submittedData.printedOn).toLocaleString()}
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }} className="no-print">
                <button
                  onClick={() => window.print()}
                  style={{ fontSize: 14, padding: '8px 24px', background: '#388e3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: '0 auto' }}>

           <div style={{ maxWidth: 700, margin: '0 auto' }}>{guidance}</div>
           
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
          <div style={{ fontWeight: 'bold', marginTop: 8 }}>Total Cash Value: {Number(cashValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
  
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

         
        <DayEndManualBillEntry
          reportDate={new Date().toISOString().split('T')[0]}
          user={cashier}
          onChange={setManualBillEntries}
        />

          <h3>SYSTEM SALES SUMMARY (AUTO)</h3>
          <div style={{ marginBottom: 12, fontSize: 16 }}>
            <div>Total Sales: <b>{systemSalesSummary?.totalSales != null ? systemSalesSummary.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Cash Sales: <b>{systemSalesSummary?.cashSales != null ? systemSalesSummary.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Card Sales: <b>{systemSalesSummary?.cardSales != null ? systemSalesSummary.cardSales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Online Transfer Sales: <b>{systemSalesSummary?.onlineTransferSales != null ? systemSalesSummary.onlineTransferSales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Cheque Sales: <b>{systemSalesSummary?.chequeSales != null ? systemSalesSummary.chequeSales.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Returns/Refunds: <b>{systemSalesSummary?.returns != null ? systemSalesSummary.returns.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Old Manual Bill Value: <b>{oldManualBillValue !== null ? oldManualBillValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Credit Customer Billings: <b>{creditCustomerBillings !== null ? creditCustomerBillings.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Total Manual Bill Entry (Today): <b>{manualBillEntriesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          </div>

        <h3>Cash Reconciliation</h3>
        <div style={{ marginBottom: 12, fontSize: 16 }}>
          {(() => {
            // Calculate supplier payments total
            let supplierPaymentsTotal = 0;
            if (Array.isArray(supplierPayments)) {
              supplierPaymentsTotal = supplierPayments.reduce((sum, sp) => sum + (parseFloat(sp.amount) || 0), 0);
            }
            // Calculate expected cash using the updated formula
            const cashSalesNum = parseFloat(cashSales) || 0;
            const returnsNum = parseFloat(returns) || 0;
            const oldManualNum = oldManualBillValue != null ? parseFloat(oldManualBillValue) : 0;
            const creditCustomerNum = creditCustomerBillings != null ? parseFloat(creditCustomerBillings) : 0;
            const manualBillEntriesNum = manualBillEntriesTotal;
            const expectedCashCalc = cashSalesNum - returnsNum - supplierPaymentsTotal + oldManualNum + manualBillEntriesNum - creditCustomerNum;
            const liveDifference = Number(physicalCashCounted) - expectedCashCalc;
            return (
              <>
                <div>Physical Cash Counted: <b>{Number(physicalCashCounted).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
              </>
            );
          })()}
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

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 24, width: '100%', fontSize: 18, padding: '12px 0', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Submit Day-End Report
          </button>
        </form>
      </div>
    </>
  );
};

export default DayEndReport;
