import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utill/api";
import { AuthContext } from "../components/AuthContext";
import "../css/SupplierPayment.css";

const SupplierPayment = () => {
  const navigate = useNavigate();
  
  // All unpaid invoices and filtering
  const [allUnpaidInvoices, setAllUnpaidInvoices] = useState([]);
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterInvoiceNumber, setFilterInvoiceNumber] = useState("");
  
  // Payment recording
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  
  // Form fields
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  
  // Payment history
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("record-payment");
  
  const { token: ctxToken } = useContext(AuthContext);
  const token = useMemo(
    () => ctxToken || localStorage.getItem("token") || "",
    [ctxToken]
  );
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  // Load all unpaid invoices on mount
  useEffect(() => {
    loadAllUnpaidInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load payment history when switching tabs
  useEffect(() => {
    if (activeTab === "payment-history") {
      loadSupplierPaymentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadAllUnpaidInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/invoices/unpaid`,
        { headers: authHeaders, credentials: 'include' }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error ${response.status}:`, errorText);
        setError(`Failed to load invoices (${response.status})`);
        setAllUnpaidInvoices([]);
        return;
      }
      
      const data = await response.json();
      console.log("Loaded unpaid invoices:", data);
      setAllUnpaidInvoices(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError(`Failed to load invoices: ${err.message}`);
      setAllUnpaidInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierPaymentHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/supplier-payments`,
        { headers: authHeaders, credentials: 'include' }
      );
      
      if (!response.ok) {
        console.error(`Error ${response.status} loading payment history`);
        setPaymentHistory([]);
        return;
      }
      
      const data = await response.json();
      console.log("Payment history response:", data);
      
      // Handle both direct array and paginated response
      let historyList = [];
      if (Array.isArray(data)) {
        historyList = data;
      } else if (data && typeof data === 'object') {
        // Try to extract from paginated response
        historyList = data.content || data.data || data.payments || [];
      }
      
      console.log("Parsed payment history:", historyList);
      setPaymentHistory(historyList);
    } catch (err) {
      console.error("Error loading payment history:", err);
      setPaymentHistory([]);
    }
  };

  // Filter invoices based on criteria
  const filteredInvoices = useMemo(() => {
    return allUnpaidInvoices.filter(inv => {
      const matchSupplier = !filterSupplier || 
        inv.supplierName?.toLowerCase().includes(filterSupplier.toLowerCase());
      
      const matchInvoiceNumber = !filterInvoiceNumber || 
        inv.invoiceNumber?.toLowerCase().includes(filterInvoiceNumber.toLowerCase());
      
      const invDate = new Date(inv.invoiceDate);
      const matchDateFrom = !filterDateFrom || invDate >= new Date(filterDateFrom);
      const matchDateTo = !filterDateTo || invDate <= new Date(filterDateTo);
      
      return matchSupplier && matchInvoiceNumber && matchDateFrom && matchDateTo;
    });
  }, [allUnpaidInvoices, filterSupplier, filterInvoiceNumber, filterDateFrom, filterDateTo]);

  const handleEditInvoice = (invoice) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    setSelectedInvoiceForPayment(invoice);
    setIsRecordingPayment(true);
    setPaymentAmount("");
    setPaymentDate(today); // Auto-set to today's date
    setPaymentMethod("CASH");
    setChequeDate("");
    setChequeNumber("");
    setRemarks("");
    setError("");
    setSuccessMessage("");
  };

  const handleBackToGrid = () => {
    setIsRecordingPayment(false);
    setSelectedInvoiceForPayment(null);
    setPaymentAmount("");
    setPaymentDate("");
    setPaymentMethod("CASH");
    setChequeDate("");
    setChequeNumber("");
    setRemarks("");
    setError("");
    setSuccessMessage("");
    loadAllUnpaidInvoices();
    // Also reload payment history so newly recorded payments show up
    if (activeTab === "payment-history") {
      loadSupplierPaymentHistory();
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      return;
    }

    try {
      setError("");
      const response = await fetch(
        `${API_BASE}/api/invoices/${invoiceId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete invoice (${response.status})`);
      }

      setSuccessMessage("Invoice deleted successfully!");
      loadAllUnpaidInvoices();
    } catch (err) {
      console.error("Error deleting invoice:", err);
      setError(`Failed to delete invoice: ${err.message}`);
    }
  };

  const validateForm = () => {
    if (!selectedInvoiceForPayment) {
      setError("Invoice not selected");
      return false;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Payment amount must be greater than 0");
      return false;
    }
    if (parseFloat(paymentAmount) > parseFloat(selectedInvoiceForPayment.amountRemaining)) {
      setError("Payment amount cannot exceed remaining balance");
      return false;
    }
    if (!paymentDate) {
      setError("Payment date is required");
      return false;
    }
    if (paymentMethod === "CHECK" && !chequeDate) {
      setError("Cheque date is mandatory for cheque payments");
      return false;
    }
    return true;
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError("");
    setSuccessMessage("");

    const paymentData = {
      invoiceId: selectedInvoiceForPayment.id,
      supplierId: selectedInvoiceForPayment.supplierId,
      paymentAmount: parseFloat(paymentAmount),
      paymentDate: paymentDate,
      paymentMethod: paymentMethod,
      chequeDate: paymentMethod === "CHECK" ? chequeDate : null,
      chequeNumber: chequeNumber || null,
      remarks: remarks
    };

    try {
      const response = await fetch(`${API_BASE}/api/supplier-payments`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to record payment");
      }

      setSuccessMessage(`✓ Payment recorded successfully! Ref: ${result.paymentReference}`);
      
      setTimeout(() => {
        setActiveTab("payment-history");
        loadSupplierPaymentHistory();
        handleBackToGrid();
      }, 2000);
    } catch (err) {
      console.error("Payment recording error:", err);
      setError(`❌ ${err.message || "Failed to record payment"}`);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return "0.00";
    return parseFloat(value).toFixed(2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentStatusBadge = (status) => {
    const statusClass = {
      "UNPAID": "badge-danger",
      "PARTIAL": "badge-warning",
      "PAID": "badge-success"
    };
    return <span className={`badge ${statusClass[status] || "badge-secondary"}`}>{status}</span>;
  };

  const printPaymentReceipt = (payment) => {
    // Create a temporary print window
    const printWindow = window.open('', '', 'height=400,width=300');
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Payment Receipt</title>
        <style>
          @page {
            size: 72mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 8px;
            width: 72mm;
            font-size: 10px;
            line-height: 1.4;
          }
          .receipt {
            text-align: center;
            width: 100%;
          }
          .header {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 6px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
          }
          .field {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            font-size: 9px;
          }
          .field-label {
            text-align: left;
            flex: 1;
          }
          .field-value {
            text-align: right;
            font-weight: bold;
          }
          .supplier-name {
            font-weight: bold;
            font-size: 11px;
            margin: 6px 0;
            text-align: center;
          }
          .amount-section {
            margin: 8px 0;
            padding: 4px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          .amount-label {
            font-size: 9px;
            text-align: left;
          }
          .amount-value {
            font-weight: bold;
            font-size: 13px;
            text-align: right;
            margin: 4px 0;
          }
          .footer {
            margin-top: 8px;
            font-size: 8px;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 4px;
          }
          .signature-line {
            margin-top: 8px;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">SUPPLIER PAYMENT</div>
          <div class="field">
            <span class="field-label">Ref:</span>
            <span class="field-value">${payment.paymentReference}</span>
          </div>
          <div class="field">
            <span class="field-label">Date:</span>
            <span class="field-value">${formatDate(payment.paymentDate)}</span>
          </div>
          
          <div class="supplier-name">${payment.supplierName || 'N/A'}</div>
          
          <div class="field">
            <span class="field-label">Invoice:</span>
            <span class="field-value">${payment.invoiceNumber || '-'}</span>
          </div>
          <div class="field">
            <span class="field-label">Method:</span>
            <span class="field-value">${payment.paymentMethod}</span>
          </div>
          ${payment.paymentMethod === 'CHECK' && payment.chequeNumber ? `
          <div class="field">
            <span class="field-label">Cheque #:</span>
            <span class="field-value">${payment.chequeNumber}</span>
          </div>
          ` : ''}
          
          <div class="amount-section">
            <div class="amount-label">AMOUNT PAID</div>
            <div class="amount-value">Rs. ${formatCurrency(payment.paymentAmount)}</div>
          </div>
          
          ${payment.remarks ? `
          <div class="field" style="margin-top: 6px; font-size: 8px;">
            <span style="text-align: left;">Note: ${payment.remarks}</span>
          </div>
          ` : ''}
          
          <div class="signature-line">
            <div>Received by: _______________</div>
            <div style="margin-top: 4px;">Date/Time: ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h2>💳 Supplier Payment Management</h2>
      <p>Record and manage supplier payments for invoices</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Tab Navigation */}
      <div style={{ marginBottom: 24, display: "flex", gap: 8, borderBottom: "2px solid #ddd" }}>
        <button
          className={`tab-button ${activeTab === "record-payment" ? "active" : ""}`}
          onClick={() => setActiveTab("record-payment")}
          style={{
            padding: "12px 24px",
            background: activeTab === "record-payment" ? "#2196F3" : "#f0f0f0",
            color: activeTab === "record-payment" ? "#fff" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Record Payment
        </button>
        <button
          className={`tab-button ${activeTab === "payment-history" ? "active" : ""}`}
          onClick={() => setActiveTab("payment-history")}
          style={{
            padding: "12px 24px",
            background: activeTab === "payment-history" ? "#2196F3" : "#f0f0f0",
            color: activeTab === "payment-history" ? "#fff" : "#333",
            border: "none",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Payment History
        </button>
      </div>

      {/* RECORD PAYMENT TAB */}
      {activeTab === "record-payment" && (
        <div className="record-payment-section">
          {isRecordingPayment && selectedInvoiceForPayment ? (
            // PAYMENT RECORDING FORM
            <div>
              <button
                onClick={handleBackToGrid}
                style={{
                  marginBottom: 20,
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ← Back to Invoice List
              </button>

              <div style={{
                padding: 20,
                background: "#f0f9ff",
                border: "2px solid #2196F3",
                borderRadius: 8,
                marginBottom: 24,
              }}>
                <h3 style={{ marginTop: 0, color: "#1976d2" }}>📄 Invoice Details</h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 16,
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Invoice Number:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{selectedInvoiceForPayment.invoiceNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Supplier:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{selectedInvoiceForPayment.supplierName}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Invoice Date:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>{formatDate(selectedInvoiceForPayment.invoiceDate)}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Invoice Amount:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>Rs. {formatCurrency(selectedInvoiceForPayment.invoiceAmount)}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Amount Paid:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>Rs. {formatCurrency(selectedInvoiceForPayment.amountPaid)}</p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Remaining Balance:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14, color: "#dc3545", fontWeight: 600 }}>
                      Rs. {formatCurrency(selectedInvoiceForPayment.amountRemaining)}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Status:</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: 14 }}>
                      {getPaymentStatusBadge(selectedInvoiceForPayment.paymentStatus)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Recording Form */}
              <div style={{
                padding: 20,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}>
                <h3 style={{ marginTop: 0 }}>💰 Record Payment</h3>
                <form onSubmit={handleRecordPayment} style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 16,
                }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Payment Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Max: Rs. ${formatCurrency(selectedInvoiceForPayment.amountRemaining)}`}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                      disabled={saving}
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHECK">Cheque</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {paymentMethod === "CHECK" && (
                    <>
                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                          Cheque Date *
                        </label>
                        <input
                          type="date"
                          value={chequeDate}
                          onChange={(e) => setChequeDate(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 14,
                          }}
                          disabled={saving}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                          Cheque Number
                        </label>
                        <input
                          type="text"
                          value={chequeNumber}
                          onChange={(e) => setChequeNumber(e.target.value)}
                          placeholder="e.g., 123456"
                          style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: 4,
                            fontSize: 14,
                          }}
                          disabled={saving}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Remarks (Optional)
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter any notes about this payment..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                        minHeight: 80,
                      }}
                      disabled={saving}
                      rows="3"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12 }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: "10px 20px",
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? "Recording..." : "✓ Record Payment"}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToGrid}
                      disabled={saving}
                      style={{
                        padding: "10px 20px",
                        background: "#6c757d",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            // INVOICE GRID VIEW
            <>
              {/* Filters */}
              <div style={{
                marginBottom: 24,
                padding: 20,
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}>
                <h4 style={{ marginTop: 0, marginBottom: 16 }}>🔍 Filters</h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={filterSupplier}
                      onChange={(e) => setFilterSupplier(e.target.value)}
                      placeholder="Search supplier..."
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={filterInvoiceNumber}
                      onChange={(e) => setFilterInvoiceNumber(e.target.value)}
                      placeholder="Search invoice #..."
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 12, color: "#666" }}>
                  📌 Showing {filteredInvoices.length} of {allUnpaidInvoices.length} unpaid invoices
                </p>
              </div>

              {/* Invoices Grid */}
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}>Loading invoices...</div>
              ) : filteredInvoices.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: 40,
                  background: "#f9f9f9",
                  borderRadius: 8,
                  color: "#666",
                }}>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>No unpaid invoices found</p>
                  <p style={{ fontSize: 14 }}>All invoices have been paid or filters don't match any records</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    background: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}>
                    <thead style={{ background: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
                      <tr>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Invoice #</th>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Supplier</th>
                        <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Date</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 14 }}>Amount</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 14 }}>Paid</th>
                        <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 14 }}>Remaining</th>
                        <th style={{ padding: 12, textAlign: "center", fontWeight: 600, fontSize: 14 }}>Status</th>
                        <th style={{ padding: 12, textAlign: "center", fontWeight: 600, fontSize: 14 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((invoice, idx) => (
                        <tr key={invoice.id} style={{
                          borderBottom: "1px solid #eee",
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        }}>
                          <td style={{ padding: 12, fontSize: 14 }}>
                            <strong>{invoice.invoiceNumber}</strong>
                          </td>
                          <td style={{ padding: 12, fontSize: 14 }}>
                            {invoice.supplierName}
                          </td>
                          <td style={{ padding: 12, fontSize: 14 }}>
                            {formatDate(invoice.invoiceDate)}
                          </td>
                          <td style={{ padding: 12, textAlign: "right", fontSize: 14 }}>
                            Rs. {formatCurrency(invoice.invoiceAmount)}
                          </td>
                          <td style={{ padding: 12, textAlign: "right", fontSize: 14 }}>
                            Rs. {formatCurrency(invoice.amountPaid)}
                          </td>
                          <td style={{ padding: 12, textAlign: "right", fontSize: 14, fontWeight: 600, color: "#dc3545" }}>
                            Rs. {formatCurrency(invoice.amountRemaining)}
                          </td>
                          <td style={{ padding: 12, textAlign: "center", fontSize: 14 }}>
                            {getPaymentStatusBadge(invoice.paymentStatus)}
                          </td>
                          <td style={{ padding: 12, textAlign: "center" }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditInvoice(invoice)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#2196F3",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                style={{
                                  padding: "6px 12px",
                                  background: "#dc3545",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  fontSize: 12,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* PAYMENT HISTORY TAB */}
      {activeTab === "payment-history" && (
        <div className="payment-history-section">
          <h3>💾 Payment History</h3>
          {paymentHistory.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 40,
              background: "#f9f9f9",
              borderRadius: 8,
              color: "#666",
            }}>
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
              }}>
                <thead style={{ background: "#f0f0f0", borderBottom: "2px solid #ddd" }}>
                  <tr>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Reference</th>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Invoice</th>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Supplier</th>
                    <th style={{ padding: 12, textAlign: "right", fontWeight: 600, fontSize: 14 }}>Amount</th>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Method</th>
                    <th style={{ padding: 12, textAlign: "left", fontWeight: 600, fontSize: 14 }}>Date</th>
                    <th style={{ padding: 12, textAlign: "center", fontWeight: 600, fontSize: 14 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, idx) => (
                    <tr key={payment.id} style={{
                      borderBottom: "1px solid #eee",
                      background: idx % 2 === 0 ? "#fff" : "#fafafa",
                    }}>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        <strong>{payment.paymentReference}</strong>
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {payment.invoiceNumber || "-"}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {payment.supplierName || "-"}
                      </td>
                      <td style={{ padding: 12, textAlign: "right", fontSize: 14 }}>
                        Rs. {formatCurrency(payment.paymentAmount)}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {payment.paymentMethod}
                      </td>
                      <td style={{ padding: 12, fontSize: 14 }}>
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td style={{ padding: 12, textAlign: "center", fontSize: 14 }}>
                        <button
                          type="button"
                          onClick={() => printPaymentReceipt(payment)}
                          style={{
                            fontSize: 12,
                            padding: '6px 12px',
                            background: '#2196F3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          🖨️ Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierPayment;
