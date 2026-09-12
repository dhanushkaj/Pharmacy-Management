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
          <li><b>Total Sale:</b> All sales for the day (cash, card, online, cheque) + Credit Paid Today. New credit sales are excluded until paid. Auto-filled from billing.</li>
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

  // Next day opening float: entered separately from Physical Cash Value, netted out of Expected Cash
  const [nextDayNotes, setNextDayNotes] = useState({ 5000: 0, 2000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 });
  const [nextDayCoins, setNextDayCoins] = useState({ 10: 0, 5: 0, 1: 0 });
  // Opening balance carried forward from previous day's retained float
  const [openingBalance, setOpeningBalance] = useState(0);

  // Non-cash
  const [cardPayments, setCardPayments] = useState('0.00');
  const [onlineTransfers, setOnlineTransfers] = useState('0.00');
  const [customerChequePayments, setCustomerChequePayments] = useState('0.00');

  // Auto-fetched supplier payments for today
  const [autoSupplierPayments, setAutoSupplierPayments] = useState('0.00');
  const [supplierPaymentsArray, setSupplierPaymentsArray] = useState([]); // Store the array of supplier payments
  
  // Track which payment is being printed (for individual payment printing)
  const [printingPaymentIndex, setPrintingPaymentIndex] = useState(-1);

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
          if (Array.isArray(details.nextDayFloatNoteDenominations)) {
            const floatNotesObj = { 5000: 0, 2000: 0, 1000: 0, 500: 0, 100: 0, 50: 0, 20: 0 };
            details.nextDayFloatNoteDenominations.forEach(n => { if (n && n.value in floatNotesObj) floatNotesObj[n.value] = n.qty; });
            setNextDayNotes(floatNotesObj);
          }
          if (Array.isArray(details.nextDayFloatCoinDenominations)) {
            const floatCoinsObj = { 10: 0, 5: 0, 1: 0 };
            details.nextDayFloatCoinDenominations.forEach(c => { if (c && c.value in floatCoinsObj) floatCoinsObj[c.value] = c.qty; });
            setNextDayCoins(floatCoinsObj);
          }
          setOpeningBalance(details.openingBalanceFromPreviousDay ?? 0);

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
          
          // Calculate and set supplier payments total from the response array
          if (Array.isArray(details.supplierPayments)) {
            const supplierPaymentsTotal = details.supplierPayments.reduce((sum, sp) => {
              return sum + (parseFloat(sp.amount) || 0);
            }, 0);
            setAutoSupplierPayments(supplierPaymentsTotal.toFixed(2));
            setSupplierPaymentsArray(details.supplierPayments); // Store the array for display
          }
          
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

  // Fetch supplier payments made today (fallback if not in day-end report response)
  React.useEffect(() => {
    const fetchSupplierPayments = async () => {
      // Skip if already loaded from day-end report response
      if (parseFloat(autoSupplierPayments) > 0) {
        return;
      }
      
      try {
        const today = new Date().toISOString().split('T')[0];
        console.log("🔍 Fetching supplier payments for date:", today);
        
        const url = `${process.env.REACT_APP_API_BASE || ''}/api/supplier-payments/date-range?startDate=${today}&endDate=${today}`;
        console.log("📡 API URL:", url);
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        
        console.log("📨 Response status:", response.status);
        
        if (response.ok) {
          const payments = await response.json();
          console.log("💰 Supplier payments received:", payments);
          
          const total = Array.isArray(payments) 
            ? payments.reduce((sum, p) => sum + (parseFloat(p.paymentAmount) || 0), 0)
            : 0;
          console.log("✅ Total supplier payments today:", total);
          setAutoSupplierPayments(total.toFixed(2));
        } else {
          console.warn("⚠️ Failed to fetch supplier payments:", response.status, response.statusText);
          setAutoSupplierPayments('0.00');
        }
      } catch (e) {
        console.error("❌ Error fetching supplier payments:", e);
        setAutoSupplierPayments('0.00');
      }
    };
    if (token) {
      fetchSupplierPayments();
    }
  }, [token, autoSupplierPayments]);
  // Print-only CSS: thermal (float slip) vs A4 (full report), swapped dynamically right before printing
  const printStyleRef = React.useRef(null);
  const buildPrintCss = () => `
    /* Simplified - main print CSS is in App.css */
    @media print {
      /* Only override if needed for specific styling */
    }
  `;

  React.useEffect(() => {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'print-only-style';
    style.innerHTML = buildPrintCss();
    document.head.appendChild(style);
    printStyleRef.current = style;
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

  // Next day opening float total (cash set aside for tomorrow, entered separately from Physical Cash Value)
  const nextDayFloatTotal = React.useMemo(() =>
    noteDenominations.reduce((sum, d) => sum + (Number(nextDayNotes[d]) || 0) * d, 0) +
    coinDenominations.reduce((sum, d) => sum + (Number(nextDayCoins[d]) || 0) * d, 0)
  , [nextDayNotes, nextDayCoins]);

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
        nextDayFloatNoteDenominations: noteDenominations.map(d => ({ value: d, qty: Number(nextDayNotes[d]) || 0, total: (Number(nextDayNotes[d]) || 0) * d })),
        nextDayFloatCoinDenominations: coinDenominations.map(d => ({ value: d, qty: Number(nextDayCoins[d]) || 0, total: (Number(nextDayCoins[d]) || 0) * d })),
        nextDayFloatTotal: Number(nextDayFloatTotal),
        cardPayments: parseFloat(cardPayments) || 0,
        onlineTransfers: parseFloat(onlineTransfers) || 0,
        customerChequePayments: parseFloat(customerChequePayments) || 0,
        totalSales: parseFloat(totalSales) || 0,
        cashSales: parseFloat(cashSales) || 0,
        cardSales: parseFloat(cardSales) || 0,
        onlineTransferSales: parseFloat(onlineTransferSales) || 0,
        chequeSales: parseFloat(chequeSales) || 0,
        returns: parseFloat(returns) || 0,
        oldManualBillTotal: parseFloat(oldManualBillValue) || 0,
        creditCustomerTotal: parseFloat(creditCustomerBillings) || 0,
        manualBillEntries: manualBillEntries,
        supplierPayments: supplierPaymentsArray, // Include supplier payments array
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

  // Print only the Next Day Opening Float slip on a thermal (72mm) page — wrap this printout with the retained cash
  const handlePrintFloatSlip = () => {
    document.body.classList.add('print-float-slip-mode');
    window.onafterprint = () => {
      document.body.classList.remove('print-float-slip-mode');
      window.onafterprint = null;
    };
    window.print();
  };

  return (
    <>
      <div className="day-end-report">
        <h2>Day-End Report</h2>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && <div style={{ color: 'green' }}>{success}</div>}

        {showTotal && submittedData && (
          <div style={{ marginTop: 32, clear: 'both', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 16, borderTop: '3px solid #1976d2', paddingBottom: 8 }} className="no-print">
              <h2 style={{ color: '#1976d2', margin: 0 }}>📋 Day-End Report Summary</h2>
              <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>Submitted on {submittedData?.printedOn ? new Date(submittedData.printedOn).toLocaleString() : 'N/A'}</p>
            </div>
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

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SYSTEM SALES SUMMARY</div>
              <div style={{ fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Sales:</span><b>{(submittedData?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cash Sales:</span><b>{(submittedData?.cashSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Card Sales:</span><b>{(submittedData?.cardSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Online Transfer:</span><b>{(submittedData?.onlineTransferSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cheque Sales:</span><b>{(submittedData?.chequeSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Returns/Refunds:</span><b>{(submittedData?.returns || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Old Manual Bill:</span><b>{((submittedData?.oldManualBillTotal != null ? parseFloat(submittedData.oldManualBillTotal) : 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Credit Paid Today:</span><b>{((submittedData?.creditCustomerTotal != null ? parseFloat(submittedData.creditCustomerTotal) : 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Supplier Payments (Paid):</span><b>-{(Array.isArray(submittedData?.supplierPayments) ? submittedData?.supplierPayments.reduce((sum, sp) => sum + (parseFloat(sp.amount) || 0), 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Manual Bill Entry:</span><b>{(Array.isArray(submittedData?.manualBillEntries) ? submittedData?.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>CASH RECONCILIATION</div>
              {(() => {
                const cashSalesNum = parseFloat(submittedData?.cashSales) || 0;
                const creditPaidTodayNum = parseFloat(submittedData?.creditCustomerTotal) || 0;
                let manualBillEntriesNum = 0;
                if (Array.isArray(submittedData?.manualBillEntries)) {
                  manualBillEntriesNum = submittedData?.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
                }
                let supplierPaymentsCashNum = 0;
                if (Array.isArray(submittedData?.supplierPayments)) {
                  supplierPaymentsCashNum = submittedData?.supplierPayments
                    .filter(sp => sp.mode === 'CASH')
                    .reduce((sum, sp) => sum + (parseFloat(sp.amount) || 0), 0);
                }
                const floatRetained = Number(submittedData?.nextDayFloatTotal) || 0;
                // Expected Cash = Cash Sales + Manual Bill Entries + Credit Paid Today - Supplier Payments (cash)
                // Note: Float is NOT deducted from expected cash (it comes FROM the cash)
                const expectedCashCalc = cashSalesNum + creditPaidTodayNum + manualBillEntriesNum - supplierPaymentsCashNum;
                const physicalCashNum = Number(cashValue);
                const difference = physicalCashNum - expectedCashCalc;
                const cashForDeposit = physicalCashNum - floatRetained;
                
                return (
                  <div style={{ fontSize: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cash Sales:</span>
                      <b>{cashSalesNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Credit Paid Today:</span>
                      <b>+{creditPaidTodayNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Manual Bill Entry:</span>
                      <b>+{manualBillEntriesNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Less: Supplier Payments (Cash):</span>
                      <b>-{supplierPaymentsCashNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: 2, borderTop: '1px dashed #000' }}>
                      <span>Expected Cash:</span>
                      <b>{expectedCashCalc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ fontSize: 8, textAlign: 'right', marginBottom: 4 }}>(Cash Sales + Credit Paid + Manual Bill - Supplier Payments)</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Physical Cash Counted:</span>
                      <b>{physicalCashNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: 2, borderTop: '1px dashed #000' }}>
                      <span>Difference:</span>
                      <b style={{ color: difference > 0 ? '#28a745' : difference < 0 ? '#dc3545' : '#000' }}>
                        {difference >= 0 ? '+' : ''}{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, paddingTop: 2, borderTop: '1px solid #000' }}>
                      <span>Status:</span>
                      <b style={{ fontSize: 12 }}>{
                        physicalCashNum > expectedCashCalc
                          ? 'EXCESS'
                          : physicalCashNum < expectedCashCalc
                          ? 'SHORT'
                          : 'BALANCED'
                      }</b>
                    </div>

                    <div style={{ borderTop: '1px solid #000', margin: '8px 0', paddingTop: 8 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 4 }}>CASH ALLOCATION</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                        <span>Retained for Next Day Float:</span>
                        <b>{floatRetained.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontWeight: 'bold', paddingTop: 2, borderTop: '1px dashed #000' }}>
                        <span>Available for Deposit/Settlement:</span>
                        <b>{cashForDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>NEXT DAY OPENING FLOAT</div>
              <div style={{ fontSize: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Retained in Drawer:</span>
                  <b>{Number(submittedData?.nextDayFloatTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                </div>
                <div style={{ fontSize: 8, textAlign: 'right', marginBottom: 2 }}>(From Physical Cash Counted)</div>
              </div>

              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>

              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SIGN OFF</div>
              <div style={{ fontSize: 10, marginBottom: 8 }}>
                <div>Cashier: ___________________</div>
                <div style={{ marginTop: 4 }}>Supervisor: ___________________</div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center', fontWeight: 'bold' }}>
                Printed: {submittedData?.printedOn ? new Date(submittedData.printedOn).toLocaleString() : 'N/A'}
              </div>

              <div style={{ textAlign: 'center', marginTop: 12 }} className="no-print">
                {!submittedData && (
                  <div style={{ fontSize: 12, color: '#d32f2f', marginBottom: 8, fontWeight: 'bold' }}>
                    ⚠️ Submit the report first before printing
                  </div>
                )}
                <button
                  onClick={() => {
                    if (submittedData) {
                      document.body.classList.add('print-day-end-report-mode');
                      window.onafterprint = () => {
                        document.body.classList.remove('print-day-end-report-mode');
                        window.onafterprint = null;
                      };
                      window.print();
                    }
                  }}
                  disabled={!submittedData}
                  style={{ fontSize: 14, padding: '8px 24px', background: submittedData ? '#388e3c' : '#bdbdbd', color: '#fff', border: 'none', borderRadius: 4, cursor: submittedData ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: submittedData ? 1 : 0.5 }}
                >
                  🖨️ Print Report
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ maxWidth: 700, margin: '0 auto' }}>{guidance}</div>

        {/* Outside the form: the print CSS hides <form> entirely when printing the main report, which would blank out this slip too */}
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ background: '#fff3e0', border: '2px solid #e65100', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Next Day Opening Float (Drawer Retention)</h3>
            <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
              Cash you are setting aside from the drawer for tomorrow's opening. Enter this <b>first</b>, then count and enter the remainder in "Physical Cash Value" below.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'max-content 80px', gap: '8px 24px', marginBottom: 8 }}>
              {coinDenominations.map(denom => (
                <React.Fragment key={`float-coin-${denom}`}>
                  <label style={{ alignSelf: 'center' }}>{denom} Coin</label>
                  <input
                    type="number"
                    min="0"
                    value={nextDayCoins[denom]}
                    onChange={e => setNextDayCoins({ ...nextDayCoins, [denom]: e.target.value })}
                    style={{ width: 70, textAlign: 'right' }}
                  />
                </React.Fragment>
              ))}
              {noteDenominations.map(denom => (
                <React.Fragment key={`float-note-${denom}`}>
                  <label style={{ alignSelf: 'center' }}>{denom} Note</label>
                  <input
                    type="number"
                    min="0"
                    value={nextDayNotes[denom]}
                    onChange={e => setNextDayNotes({ ...nextDayNotes, [denom]: e.target.value })}
                    style={{ width: 70, textAlign: 'right' }}
                  />
                </React.Fragment>
              ))}
            </div>
            <div style={{ fontWeight: 'bold', marginTop: 8 }}>
              Next Day Float Total: Rs. {Number(nextDayFloatTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }} className="no-print">
              <button
                type="button"
                onClick={handlePrintFloatSlip}
                style={{ fontSize: 14, padding: '8px 24px', background: '#e65100', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
              >
                🖨️ Print Float Slip (Thermal)
              </button>
            </div>

            {/* Printable thermal slip: only the next-day float, to wrap with the retained cash */}
            <div
              id="float-slip-print"
              style={{
                width: 280,
                margin: '16px auto 0',
                padding: '12px 8px',
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                lineHeight: 1.4,
                background: '#fff',
                color: '#000',
                border: '1px dashed #999',
              }}
            >
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                NEXT DAY OPENING FLOAT
              </div>
              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>
              <div style={{ fontSize: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span><b>{branch}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cashier:</span><b>{cashier}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span><b>{new Date().toLocaleDateString()}</b></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Day End No:</span><b>{dayEndNo}</b></div>
              </div>
              <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>
              <table style={{ width: '100%', fontSize: 10, marginBottom: 4, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: '2px 0' }}>Denom</th>
                    <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {coinDenominations.filter(d => (Number(nextDayCoins[d]) || 0) > 0).map(d => (
                    <tr key={`slip-coin-${d}`}>
                      <td style={{ padding: '2px 0' }}>{d} Coin</td>
                      <td style={{ textAlign: 'center', padding: '2px 0' }}>{Number(nextDayCoins[d]) || 0}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{((Number(nextDayCoins[d]) || 0) * d).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {noteDenominations.filter(d => (Number(nextDayNotes[d]) || 0) > 0).map(d => (
                    <tr key={`slip-note-${d}`}>
                      <td style={{ padding: '2px 0' }}>{d} Note</td>
                      <td style={{ textAlign: 'center', padding: '2px 0' }}>{Number(nextDayNotes[d]) || 0}</td>
                      <td style={{ textAlign: 'right', padding: '2px 0' }}>{((Number(nextDayNotes[d]) || 0) * d).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 'bold' }}>
                <span>TOTAL RETAINED:</span>
                <span>{Number(nextDayFloatTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ borderTop: '1px solid #000', margin: '6px 0' }}></div>
              <div style={{ fontSize: 10, marginTop: 8 }}>
                <div>Cashier: ___________________</div>
                <div style={{ marginTop: 4 }}>Received by (next day): ___________________</div>
              </div>
              <div style={{ fontSize: 8, textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>
                Wrap this slip with the retained cash and place in drawer
              </div>
            </div>

            {/* Supplier Payment History - Thermal Slip */}
            <div style={{ marginTop: 24 }}>
              {/* Individual Payment Records with Print Buttons */}
              <div className="no-print" style={{ maxWidth: 700, margin: '0 auto', marginBottom: 20 }}>
                {Array.isArray(submittedData?.supplierPayments) && submittedData?.supplierPayments.length > 0 ? (
                  submittedData?.supplierPayments.map((payment, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        marginBottom: 12, 
                        padding: 12, 
                        border: '1px solid #ddd', 
                        borderRadius: 6,
                        background: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                          {idx + 1}. {payment.supplierName}
                        </div>
                        <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                          <b>Amount:</b> Rs. {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                          <b>Mode:</b> {payment.mode}
                        </div>
                        {payment.mode === 'CHECK' && payment.chequeNumber && (
                          <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                            <b>Cheque #:</b> {payment.chequeNumber}
                          </div>
                        )}
                        {payment.remarks && (
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' }}>
                            Note: {payment.remarks}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          document.body.classList.add(`print-single-payment-mode-${idx}`);
                          window.onafterprint = () => {
                            document.body.classList.remove(`print-single-payment-mode-${idx}`);
                            window.onafterprint = null;
                          };
                          window.print();
                        }}
                        style={{ 
                          fontSize: 12, 
                          padding: '6px 12px', 
                          background: '#f57c00', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer', 
                          fontWeight: 'bold',
                          marginLeft: 12,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🖨️ Print
                      </button>
                    </div>
                  ))
                ) : null}
              </div>
              

              {/* Individual Payment Print Slips */}
              {Array.isArray(submittedData?.supplierPayments) && submittedData?.supplierPayments.map((payment, idx) => (
                <div
                  key={`payment-print-${idx}`}
                  id={`supplier-payment-print-${idx}`}
                  style={{
                    width: 280,
                    margin: '16px auto 0',
                    padding: '12px 8px',
                    fontFamily: "'Courier New', monospace",
                    fontSize: 10,
                    lineHeight: 1.3,
                    background: '#fff',
                    color: '#000',
                    border: '1px dashed #999',
                    display: 'none'
                  }}
                >
                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                    SUPPLIER PAYMENT
                  </div>
                  <div style={{ fontSize: 9, textAlign: 'center', marginBottom: 2 }}>
                    Payment #{idx + 1}
                  </div>
                  <div style={{ borderTop: '2px solid #000', margin: '6px 0' }}></div>
                  
                  <div style={{ fontSize: 9, marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span><b>{branch}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cashier:</span><b>{cashier}</b></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span><b>{new Date().toLocaleDateString()}</b></div>
                  </div>

                  <div style={{ borderTop: '1px solid #000', margin: '4px 0', paddingTop: 4 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4, textAlign: 'center' }}>
                      {payment.supplierName}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span>Amount:</span>
                      <b>Rs. {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                      <span>Mode:</span>
                      <b>{payment.mode}</b>
                    </div>
                    {payment.mode === 'CHECK' && payment.chequeNumber && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>Cheque #:</span>
                        <b>{payment.chequeNumber}</b>
                      </div>
                    )}
                    {payment.remarks && (
                      <div style={{ fontSize: 8, marginTop: 4, wordWrap: 'break-word', padding: '4px 0', borderTop: '1px dashed #000' }}>
                        Note: {payment.remarks}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: '2px solid #000', margin: '6px 0', paddingTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold' }}>
                      <span>AMOUNT:</span>
                      <span>Rs. {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #000', margin: '6px 0', paddingTop: 4, fontSize: 9 }}>
                    <div style={{ marginBottom: 4 }}>Received by: ___________________</div>
                    <div>Date/Time: {new Date().toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ maxWidth: 700, margin: '0 auto' }}>

          <h3>Header Info</h3>
          <div style={{ background: '#fff8e1', border: '1px solid #ffca28', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 15 }}>
            <b>Opening Balance (Carried from Previous Day):</b> Rs. {Number(openingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
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
          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
            Enter the remainder cash only — after setting aside the Next Day Opening Float above.
          </div>
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
            <div>Credit Paid Today: <b>{creditCustomerBillings !== null ? creditCustomerBillings.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</b></div>
            <div>Supplier Payments (Paid Today): <b>{Number(autoSupplierPayments).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Total Manual Bill Entry (Today): <b>{manualBillEntriesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div>Next Day Opening Float (Retained): <b>-{Number(nextDayFloatTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          </div>

        <h3>Cash Reconciliation</h3>
        <div style={{ marginBottom: 12, fontSize: 16 }}>
          {(() => {
            // Calculate supplier payments total from auto-fetched data
            const supplierPaymentsTotal = parseFloat(autoSupplierPayments) || 0;
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
