import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { api } from '../../utill/api';

export default function DayEndReportHistory() {
  const { token } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Filter reports based on search date
    if (searchDate) {
      const filtered = reports.filter(report => 
        report.date && report.date.includes(searchDate)
      );
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reports);
    }
  }, [searchDate, reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api('/api/day-end-report/list', {
        method: 'GET',
        token,
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort reports by date (newest first)
      const sorted = response.sort((a, b) => new Date(b.date) - new Date(a.date));
      setReports(sorted);
      setFilteredReports(sorted);
      setError(null);
    } catch (err) {
      setError('Failed to fetch day end reports: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const handlePrintReport = (report) => {
    // Set the report data and trigger print
    setSelectedReport(report);
    setTimeout(() => {
      document.body.classList.add('print-day-end-report-mode');
      window.onafterprint = () => {
        document.body.classList.remove('print-day-end-report-mode');
        window.onafterprint = null;
      };
      window.print();
    }, 100);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedReport(null);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading reports...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>📋 Day-End Report History</h2>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          background: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px',
          border: '1px solid #ef5350'
        }}>
          {error}
        </div>
      )}

      {/* Search Section */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        background: '#f5f5f5', 
        borderRadius: '4px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <label style={{ fontWeight: 'bold' }}>Search by Date:</label>
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        {searchDate && (
          <button
            onClick={() => setSearchDate('')}
            style={{
              padding: '8px 16px',
              background: '#e0e0e0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          background: '#f9f9f9', 
          borderRadius: '4px',
          color: '#666'
        }}>
          No day end reports found.
        </div>
      ) : (
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <thead style={{ background: '#1976d2', color: '#fff' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Cashier</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Branch</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Expected Cash</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Physical Cash</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Difference</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report, idx) => (
              <tr 
                key={idx}
                style={{
                  borderBottom: '1px solid #eee',
                  background: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                }}
              >
                <td style={{ padding: '12px' }}>
                  {report.date ? new Date(report.date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{ padding: '12px' }}>{report.cashier || 'N/A'}</td>
                <td style={{ padding: '12px' }}>{report.branch || 'N/A'}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  Rs. {(report.expectedCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  Rs. {(report.physicalCashCounted || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  Rs. {(report.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ 
                  padding: '12px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: report.status === 'BALANCED' ? '#2e7d32' : report.status === 'SHORT' ? '#d32f2f' : '#f57c00'
                }}>
                  {report.status || 'N/A'}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleViewDetails(report)}
                    style={{
                      padding: '6px 12px',
                      background: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginRight: '8px'
                    }}
                  >
                    👁️ View
                  </button>
                  <button
                    onClick={() => handlePrintReport(report)}
                    style={{
                      padding: '6px 12px',
                      background: '#388e3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🖨️ Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Details Modal */}
      {showDetails && selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '24px',
            maxHeight: '80vh',
            overflow: 'auto',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#1976d2' }}>
              Day-End Report - {selectedReport.date ? new Date(selectedReport.date).toLocaleDateString() : 'N/A'}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Branch:</strong> {selectedReport.branch || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>POS ID:</strong> {selectedReport.posId || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Cashier:</strong> {selectedReport.cashier || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Shift:</strong> {selectedReport.shift || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Day End No:</strong> {selectedReport.dayEndNo || 'N/A'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>Sales Summary</h4>
              <div style={{ marginBottom: '8px' }}>
                <strong>Total Sales:</strong> Rs. {(selectedReport.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Cash Sales:</strong> Rs. {(selectedReport.cashSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Card Sales:</strong> Rs. {(selectedReport.cardSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Online Transfer:</strong> Rs. {(selectedReport.onlineTransferSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Cheque Sales:</strong> Rs. {(selectedReport.chequeSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Credit Paid Today:</strong> Rs. {(selectedReport.creditCustomerTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>Cash Reconciliation</h4>
              <div style={{ marginBottom: '8px' }}>
                <strong>Expected Cash:</strong> Rs. {(selectedReport.expectedCash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Physical Cash Counted:</strong> Rs. {(selectedReport.physicalCashCounted || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Difference:</strong> Rs. {(selectedReport.difference || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ 
                marginBottom: '8px',
                fontWeight: 'bold',
                color: selectedReport.status === 'BALANCED' ? '#2e7d32' : selectedReport.status === 'SHORT' ? '#d32f2f' : '#f57c00'
              }}>
                <strong>Status:</strong> {selectedReport.status || 'N/A'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>Next Day Float</h4>
              <div style={{ marginBottom: '8px' }}>
                <strong>Retained for Next Day:</strong> Rs. {(selectedReport.nextDayFloatTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {selectedReport.differenceReason && (
              <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '12px', color: '#1976d2' }}>Notes</h4>
                <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                  {selectedReport.differenceReason}
                </div>
              </div>
            )}

            <div style={{ 
              borderTop: '1px solid #eee', 
              paddingTop: '16px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseDetails}
                style={{
                  padding: '8px 16px',
                  background: '#e0e0e0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCloseDetails();
                  handlePrintReport(selectedReport);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#388e3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🖨️ Print Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print content */}
      {selectedReport && (
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span><b>{selectedReport.branch}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>POS ID:</span><b>{selectedReport.posId}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cashier:</span><b>{selectedReport.cashier}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date:</span><b>{selectedReport.date ? new Date(selectedReport.date).toLocaleDateString() : 'N/A'}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shift:</span><b>{selectedReport.shift}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Day End No:</span><b>{selectedReport.dayEndNo}</b></div>
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

          <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>SYSTEM SALES SUMMARY</div>
          <div style={{ fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Sales:</span><b>{(selectedReport.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cash Sales:</span><b>{(selectedReport.cashSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Card Sales:</span><b>{(selectedReport.cardSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Online Transfer:</span><b>{(selectedReport.onlineTransferSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cheque Sales:</span><b>{(selectedReport.chequeSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Returns/Refunds:</span><b>{(selectedReport.returns || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Old Manual Bill:</span><b>{((selectedReport?.oldManualBillTotal != null ? parseFloat(selectedReport.oldManualBillTotal) : 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Credit Paid Today:</span><b>{((selectedReport?.creditCustomerTotal != null ? parseFloat(selectedReport.creditCustomerTotal) : 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Supplier Payments (Paid):</span><b>-{(Array.isArray(selectedReport?.supplierPayments) ? selectedReport?.supplierPayments.reduce((sum, sp) => sum + (parseFloat(sp.amount) || 0), 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Manual Bill Entry:</span><b>{(Array.isArray(selectedReport?.manualBillEntries) ? selectedReport?.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '4px 0' }}></div>

          <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>CASH RECONCILIATION</div>
          {(() => {
            const cashSalesNum = parseFloat(selectedReport?.cashSales) || 0;
            const creditPaidTodayNum = parseFloat(selectedReport?.creditCustomerTotal) || 0;
            let manualBillEntriesNum = 0;
            if (Array.isArray(selectedReport?.manualBillEntries)) {
              manualBillEntriesNum = selectedReport?.manualBillEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
            }
            let supplierPaymentsCashNum = 0;
            if (Array.isArray(selectedReport?.supplierPayments)) {
              supplierPaymentsCashNum = selectedReport?.supplierPayments
                .filter(sp => sp.mode === 'CASH')
                .reduce((sum, sp) => sum + (parseFloat(sp.amount) || 0), 0);
            }
            const floatRetained = Number(selectedReport?.nextDayFloatTotal) || 0;
            const expectedCashCalc = cashSalesNum + creditPaidTodayNum + manualBillEntriesNum - supplierPaymentsCashNum;
            const physicalCashNum = Number(selectedReport?.physicalCashCounted) || 0;
            const difference = Number(selectedReport?.difference) || 0;
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
                  <b style={{ fontSize: 12 }}>{selectedReport?.status || 'N/A'}</b>
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
              <b>{Number(selectedReport?.nextDayFloatTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
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
            Printed: {selectedReport?.printedOn ? new Date(selectedReport.printedOn).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
