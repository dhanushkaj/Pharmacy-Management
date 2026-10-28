import React, { useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utill/api";
import { getLastPrices } from "../utill/lastPriceApi";
import { AuthContext } from "../components/AuthContext";

// Helper function to safely parse JSON
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const GRNManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnNumber, setGrnNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [grnItems, setGrnItems] = useState([]);
  const [createdGrnId, setCreatedGrnId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [paymentDueDays, setPaymentDueDays] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [loadedGrn, setLoadedGrn] = useState(null); // For loading existing GRN
  const [approved, setApproved] = useState(false);
  const [approvedUser, setApprovedUser] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // PO filter
  const [poDateFromFilter, setPoDateFromFilter] = useState("");
  const [poDateToFilter, setPoDateToFilter] = useState("");
  const [approvedGrnForPo, setApprovedGrnForPo] = useState(false);

  // Invoice recording
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [paymentDueDate_Invoice, setPaymentDueDate_Invoice] = useState("");
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceSuccess, setInvoiceSuccess] = useState("");
  const [grnSupplierId, setGrnSupplierId] = useState(null); // Store supplier ID from approved GRN
  const [showInvoiceConfirm, setShowInvoiceConfirm] = useState(false); // Invoice confirmation modal
  const [pendingApproveUser, setPendingApproveUser] = useState(""); // Store user for pending approval
  
  // Supplier autocomplete
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(-1);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedSupplierName, setSelectedSupplierName] = useState("");
  
  const { token: ctxToken, roles: ctxRoles, username } = useContext(AuthContext);
  const token = useMemo(
    () => ctxToken || localStorage.getItem("token") || "",
    [ctxToken]
  );
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );
  const API_BASE = process.env.REACT_APP_API_BASE || '';

  useEffect(() => {
    let abort = false;
    
    // Check if GRN ID is passed in URL (from GRN List)
    const urlParams = new URLSearchParams(window.location.search);
    const grnId = urlParams.get('grnId');
    
    if (grnId) {
      loadGrnForApproval(grnId);
    }
    
    // Load purchase orders (fetch all pages for dropdown)
    (async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch with large size to get all purchase orders for dropdown
        const data = await api('/api/purchase-orders?page=0&size=1000', { token });
        if (!abort) {
          // Spring Boot paginated response has 'content' array
          const orders = data.content || (Array.isArray(data) ? data : []);
          setPurchaseOrders(orders);
        }
      } catch (err) {
        if (!abort) {
          console.error("Error fetching POs:", err);
          setError(err.message || "Failed to load purchase orders");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load suppliers for autocomplete
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const data = await api('/api/suppliers', { token });
        if (!abort) {
          setSuppliers(Array.isArray(data) ? data : data.content || []);
        }
      } catch (err) {
        console.error("Error loading suppliers:", err);
      }
    })();
    return () => {
      abort = true;
    };
  }, [token]);

  const loadGrnForApproval = async (grnId) => {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/grns/${grnId}`, { token });
      
      console.log("Loaded GRN:", data);
      setLoadedGrn(data);
      setCreatedGrnId(data.id);
      setGrnNumber(data.grnCode);
      setApproved(data.status === "APPROVED");
      setApprovedUser(data.approvedUser || "");
      setIsPaid(!!data.paid);
      setPaymentDueDate(data.paymentDueDate || "");
      setPaymentDueDays(data.paymentDueDays ?? "");
      setChequeDate(data.chequeDate || "");
      
      // Set the items for display
      if (data.items && data.items.length > 0) {
        const items = data.items.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          receivedQuantity: it.receivedQuantity,
          unitCost: it.unitCost,
          sellPrice: it.price ?? (it.unitCost * 1.2),
        }));
        setGrnItems(items);
      }
      
      // Find and set the related PO if available
      if (data.purchaseOrderId && purchaseOrders.length > 0) {
        const po = purchaseOrders.find(p => p.id === data.purchaseOrderId);
        if (po) {
          setSelectedPO(po);
        }
      }
      
    } catch (err) {
      console.error("Error loading GRN:", err);
      setError(err.message);
      alert("Error loading GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPO = async (poId) => {
    const po = purchaseOrders.find((p) => p.id === Number(poId));
    setSelectedPO(po);
    setCreatedGrnId(null);
    setApproved(false);
    setApprovedGrnForPo(false);
    
    if (po) {
      // Check if GRN is already approved for this PO
      try {
        const grnData = await api(`/api/grns?page=0&size=1000`);
        const grnList = grnData.content || [];
        // Filter to find APPROVED GRN for THIS specific PO only
        const approvedGrn = grnList.find(g => 
          g.status === 'APPROVED' && 
          (g.purchaseOrderId === po.id || Number(g.purchaseOrderId) === Number(po.id))
        );
        if (approvedGrn) {
          setApprovedGrnForPo(true);
          setError(`GRN already approved for this PO (${approvedGrn.grnCode}). You can only view the details.`);
          return;
        }
      } catch (e) {
        console.error("Error checking GRN status:", e);
      }
      
      // Fetch last selling price and last cost price for all products in PO
      const items = await Promise.all(
        po.items.map(async (it) => {
          let lastPrice = 0;
          let lastCost = 0;
          try {
            const prices = await getLastPrices(it.productId, token);
            lastPrice = prices.lastPrice || 0;
            lastCost = prices.lastCostPrice || 0;
          } catch (e) {
            lastPrice = it.sellPrice || 0;
            lastCost = it.unitCost || 0;
          }
          return {
            productId: it.productId,
            productName: it.productName,
            receivedQuantity: it.quantity,
            unitCost: lastCost || it.unitCost || 0,
            sellPrice: lastPrice || it.sellPrice || 0,
          };
        })
      );
      setGrnItems(items);
      setGrnNumber(
        `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${poId}`
      );
    }
  };

  // Supplier autocomplete handlers
  const filteredSuppliers = suppliers.filter((s) =>
    !supplierSearchQuery || s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())
  );

  const handleSupplierInput = (value) => {
    setSupplierSearchQuery(value);
    setShowSupplierDropdown(true);
    setHighlightedSupplierIndex(-1);
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplierId(supplier.id);
    setSelectedSupplierName(supplier.name);
    setSupplierSearchQuery("");
    setShowSupplierDropdown(false);
    setHighlightedSupplierIndex(-1);
  };

  const handleSupplierKeyDown = (e) => {
    if (!showSupplierDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedSupplierIndex((prev) =>
        Math.min(prev + 1, filteredSuppliers.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedSupplierIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedSupplierIndex >= 0) {
        handleSelectSupplier(filteredSuppliers[highlightedSupplierIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSupplierDropdown(false);
    }
  };

  const handleChangeItem = (index, field, value) => {
    const updated = [...grnItems];
    updated[index][field] = value;
    setGrnItems(updated);
  };

  const handleCreateGrn = async () => {
    if (!selectedPO) return alert("Select a purchase order first");
    if (!paymentMethod) return alert("Please select a payment method");

    // Payment validation logic:
    // At least one of paymentDueDate, chequeDate, or paymentDueDays must be entered (if not paid)
    if (!isPaid) {
      const hasDueDate = !!paymentDueDate;
      const hasChequeDate = !!chequeDate;
      const hasDueDays = paymentDueDays !== "" && paymentDueDays !== null && paymentDueDays !== undefined;
      if (!hasDueDate && !hasChequeDate && !hasDueDays) {
        return alert("Please enter either Payment Due Date, Cheque Date, or Payment Due (Days)");
      }
    }
    // Cheque date required if payment method is Cheque
    if (paymentMethod === "CHEQUE" && !chequeDate) {
      return alert("Please select a Cheque Date");
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        purchaseOrderId: selectedPO.id,
        paymentMethod,
        paid: isPaid,
        paymentDueDate: paymentDueDate || null,
        paymentDueDays: paymentDueDays || null,
        chequeDate: paymentMethod === "CHEQUE" ? chequeDate : null,
        items: grnItems.map((i) => ({
          productId: i.productId,
          receivedQuantity: Number(i.receivedQuantity),
          unitCost: Number(i.unitCost),
          price: Number(i.sellPrice),
        })),
      };

      const data = await api('/api/grns', {
        method: 'POST',
        body: payload,
      });

      setCreatedGrnId(data.id);
      alert("GRN Created Successfully!");
      console.log("Created GRN:", data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Error creating GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLoadedGrn = async () => {
    if (!loadedGrn || !loadedGrn.id) {
      alert("No GRN loaded for editing");
      return;
    }
    if (loadedGrn.status !== "PENDING") {
      alert("Only PENDING GRNs can be edited");
      return;
    }

    if (!isPaid) {
      const hasDueDate = !!paymentDueDate;
      const hasChequeDate = !!chequeDate;
      const hasDueDays = paymentDueDays !== "" && paymentDueDays !== null && paymentDueDays !== undefined;
      if (!hasDueDate && !hasChequeDate && !hasDueDays) {
        alert("Please enter either Payment Due Date, Cheque Date, or Payment Due (Days)");
        return;
      }
    }

    setSavingEdits(true);
    setError("");
    try {
      const payload = {
        paid: isPaid,
        paymentDueDate: paymentDueDate || null,
        paymentDueDays: paymentDueDays === "" ? null : Number(paymentDueDays),
        chequeDate: chequeDate || null,
        items: grnItems.map((i) => ({
          productId: i.productId,
          receivedQuantity: Number(i.receivedQuantity),
          unitCost: Number(i.unitCost),
          price: Number(i.sellPrice),
        })),
      };

      const data = await api(`/api/grns/${loadedGrn.id}`, {
        method: 'PUT',
        body: payload,
      });

      setLoadedGrn(data);
      setGrnItems((data.items || []).map((it) => ({
        productId: it.productId,
        productName: it.productName,
        receivedQuantity: it.receivedQuantity,
        unitCost: it.unitCost,
        sellPrice: it.price ?? (it.unitCost * 1.2),
      })));
      alert("GRN updated successfully. You can now approve.");
    } catch (err) {
      console.error("Update GRN error:", err);
      setError(err.message || "Failed to update GRN");
      alert("Error updating GRN: " + (err.message || "Unknown error"));
    } finally {
      setSavingEdits(false);
    }
  };

  const handleApprove = async () => {
    if (!username) {
      alert("User not logged in");
      return;
    }
    if (!createdGrnId) {
      alert("Please create a GRN first");
      return;
    }

    // Check if invoice is empty
    if (!invoiceNumber || !invoiceNumber.trim()) {
      // Store the approved user for later use
      setPendingApproveUser(username);
      setShowInvoiceConfirm(true);
      return;
    }

    // If invoice exists, proceed with approval
    await proceedWithApproval(username);
  };

  const proceedWithApproval = async (approvedUserVal) => {
    setLoading(true);
    setError("");
    try {
      console.log("Approving GRN:", createdGrnId, "with user:", approvedUserVal);
      
      const data = await api(`/api/grns/${createdGrnId}/approve`, {
        method: 'PUT',
        body: { approvedUser: approvedUserVal.trim() },
      });

      console.log("Response data:", data);

      setApproved(true);
      
      // Store supplier ID from the GRN response or selected PO
      const supplierId = data.supplierId || selectedPO?.supplierId;
      setGrnSupplierId(supplierId);
      
      alert("GRN Approved and Inventory Updated!");
      
      // Redirect to GRN list
      setTimeout(() => {
        window.location.href = '/grn-list';
      }, 1500);
    } catch (err) {
      console.error("Approve error:", err);
      setError(err.message);
      alert("Error approving GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordInvoice = async (e) => {
    e.preventDefault();
    
    if (!invoiceNumber.trim()) {
      alert("Enter invoice number");
      return;
    }
    if (!invoiceDate) {
      alert("Select invoice date");
      return;
    }
    if (!invoiceAmount || Number(invoiceAmount) <= 0) {
      alert("Enter valid invoice amount");
      return;
    }
    if (!paymentDueDate_Invoice) {
      alert("Select payment due date");
      return;
    }

    // Validate required IDs
    const grnId = createdGrnId || loadedGrn?.id;
    const supplierId = grnSupplierId || selectedPO?.supplierId || loadedGrn?.supplierId;

    if (!grnId) {
      setError("Error: GRN ID is missing. Please approve the GRN first.");
      return;
    }
    if (!supplierId) {
      setError("Error: Supplier ID is missing. Please ensure the GRN has a supplier.");
      return;
    }

    setSubmittingInvoice(true);
    setError("");
    setInvoiceSuccess("");
    try {
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        grnId: Number(grnId),
        supplierId: Number(supplierId),
        invoiceDate: invoiceDate,
        invoiceAmount: parseFloat(invoiceAmount),
        paymentDueDate: paymentDueDate_Invoice,
      };

      console.log("Recording invoice with payload:", payload);

      const response = await api('/api/invoices', {
        method: 'POST',
        body: payload,
      });
      
      console.log("Invoice recording response:", response);

      setInvoiceSuccess(`✓ Invoice recorded successfully! Invoice #${invoiceNumber}`);
      
      // Reset form (but keep invoiceNumber so approval knows it was entered)
      setInvoiceDate("");
      setInvoiceAmount("");
      setPaymentDueDate_Invoice("");
      
      // Stay on page, don't redirect
    } catch (err) {
      console.error("Invoice recording error:", err);
      const errorMessage = err.message || "Failed to record invoice";
      console.error("Full error details:", {
        message: errorMessage,
        status: err.status,
        stack: err.stack
      });
      setError(`❌ ${errorMessage}`);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const openRejectModal = () => {
    if (!createdGrnId && !loadedGrn) return alert("Please create a GRN first");
    setShowRejectModal(true);
  };

  const clearLoadedGrn = () => {
    setLoadedGrn(null);
    setCreatedGrnId(null);
    setGrnNumber("");
    setGrnItems([]);
    setApproved(false);
    setApprovedUser("");
    setSelectedPO(null);
    setIsPaid(false);
    setPaymentDueDate("");
    setPaymentDueDays("");
    setChequeDate("");
    setError("");
    setGrnSupplierId(null);
    setInvoiceNumber("");
    setInvoiceDate("");
    setInvoiceAmount("");
    setPaymentDueDate_Invoice("");
    setInvoiceSuccess("");
    // Clear the URL parameter
    window.history.replaceState({}, document.title, "/grn");
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason("");
  };

  const formatCurrency = (value) => {
    if (!value) return "0.00";
    return parseFloat(value).toFixed(2);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/grns/${createdGrnId}/reject`, {
        method: 'PUT',
        body: { reason: rejectReason },
      });

      alert("GRN Rejected Successfully");
      console.log("Rejected:", data);
      closeRejectModal();
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Error rejecting GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Goods Receipt Note (GRN) Management</h2>
        <button 
          onClick={() => window.location.href = '/grn-list'} 
          style={btnInfo}
        >
          📋 View All GRNs
        </button>
      </div>

      {/* Error/Warning Display */}
      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: error.includes("already approved") ? "#fff3cd" : "#f8d7da",
            color: error.includes("already approved") ? "#856404" : "#721c24",
            border: error.includes("already approved") ? "1px solid #ffeeba" : "1px solid #f5c6cb",
            borderRadius: 4,
          }}
        >
          <strong>{error.includes("already approved") ? "Info:" : "Error:"}</strong> {error}
          <button 
            onClick={() => setError("")}
            style={{
              marginLeft: 12,
              background: "transparent",
              border: "none",
              color: error.includes("already approved") ? "#856404" : "#721c24",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* Loaded GRN Info (when loading from list) */}
      {loadedGrn && (
        <div style={{
          padding: 16,
          marginBottom: 24,
          background: "#e7f3ff",
          border: "1px solid #2196F3",
          borderRadius: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginTop: 0 }}>Loaded GRN: {loadedGrn.grnCode}</h3>
              <p><strong>Status:</strong> {loadedGrn.status}</p>
              <p><strong>Purchase Order:</strong> {loadedGrn.purchaseOrderCode || `PO-${loadedGrn.purchaseOrderId}`}</p>
              <p><strong>Supplier:</strong> {loadedGrn.supplierName || 'N/A'}</p>
              <p><strong>Received Date:</strong> {new Date(loadedGrn.receivedDate).toLocaleString()}</p>
            </div>
            <button
              onClick={clearLoadedGrn}
              style={{
                background: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              ✕ Close & Create New GRN
            </button>
          </div>
        </div>
      )}

      {/* Editable Section for Loaded PENDING GRN */}
      {loadedGrn && loadedGrn.status === "PENDING" && (
        <div
          style={{
            marginBottom: 32,
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 8,
            background: "#fffdf2",
          }}
        >
          <h3>Edit GRN Before Approval</h3>
          <p style={{ marginTop: 0, color: "#666" }}>
            If anything is wrong, update values here and click <strong>Save Changes</strong> before approving.
          </p>

          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={e => setIsPaid(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Mark as Paid
            </label>
            <div>
              <label style={{ fontWeight: 500, marginRight: 8 }}>
                Payment Due Date:
              </label>
              <input
                type="date"
                value={paymentDueDate}
                onChange={e => setPaymentDueDate(e.target.value)}
                style={{ padding: 6 }}
                disabled={isPaid}
              />
            </div>
            <div>
              <label style={{ fontWeight: 500, marginRight: 8 }}>
                Payment Due (Days):
              </label>
              <input
                type="number"
                value={paymentDueDays}
                onChange={e => setPaymentDueDays(e.target.value)}
                style={{ padding: 6, width: 80 }}
                min="0"
                disabled={isPaid}
              />
            </div>
            <div>
              <label style={{ fontWeight: 500, marginRight: 8 }}>
                Cheque Date:
              </label>
              <input
                type="date"
                value={chequeDate}
                onChange={e => setChequeDate(e.target.value)}
                style={{ padding: 6 }}
                disabled={isPaid}
              />
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={th}>Product</th>
                <th style={th}>Received Qty</th>
                <th style={th}>Unit Cost</th>
                <th style={th}>Sell Price</th>
              </tr>
            </thead>
            <tbody>
              {grnItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={td}>{item.productName}</td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.receivedQuantity}
                      onChange={(e) => handleChangeItem(idx, "receivedQuantity", e.target.value)}
                      style={input}
                      min="1"
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => handleChangeItem(idx, "unitCost", e.target.value)}
                      style={input}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.sellPrice}
                      onChange={(e) => handleChangeItem(idx, "sellPrice", e.target.value)}
                      style={input}
                      step="0.01"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <button
              onClick={handleUpdateLoadedGrn}
              style={btnInfo}
              disabled={savingEdits || loading}
            >
              {savingEdits ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Select Purchase Order (only show if NOT loading existing GRN) */}
      {!loadedGrn && (
        <div style={{ marginBottom: 24 }}>
          {/* PO Search Filters */}
          {/* Supplier Autocomplete Filter */}
          <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
            <h4 style={{ marginTop: 0 }}>Filter by Supplier</h4>
            <div style={{ position: 'relative', minWidth: 250 }}>
              <input
                type="text"
                placeholder="Type supplier name..."
                value={supplierSearchQuery || selectedSupplierName}
                onChange={(e) => handleSupplierInput(e.target.value)}
                onFocus={() => setShowSupplierDropdown(true)}
                onKeyDown={handleSupplierKeyDown}
                style={{
                  padding: 8,
                  width: '100%',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                }}
              />
              {showSupplierDropdown && filteredSuppliers.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ccc',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: 250,
                    overflowY: 'auto',
                    zIndex: 10,
                  }}
                >
                  {filteredSuppliers.map((supplier, idx) => (
                    <div
                      key={supplier.id}
                      onClick={() => handleSelectSupplier(supplier)}
                      style={{
                        padding: 10,
                        background: idx === highlightedSupplierIndex ? '#e6f7ff' : '#fff',
                        cursor: 'pointer',
                        borderLeft: idx === highlightedSupplierIndex ? '4px solid #1890ff' : 'none',
                      }}
                    >
                      {supplier.name}
                    </div>
                  ))}
                </div>
              )}
              {selectedSupplierName && (
                <button
                  onClick={() => {
                    setSelectedSupplierId(null);
                    setSelectedSupplierName("");
                    setSupplierSearchQuery("");
                  }}
                  style={{
                    marginTop: 8,
                    background: '#f5f5f5',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    padding: '4px 12px',
                    cursor: 'pointer',
                  }}
                >
                  Clear Supplier Filter (✕)
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
            <h4 style={{ marginTop: 0 }}>Filter Purchase Orders by Date</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Created From</label>
                <input
                  type="date"
                  value={poDateFromFilter}
                  onChange={(e) => setPoDateFromFilter(e.target.value)}
                  style={{ padding: 8, width: '100%', marginTop: 4 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Created To</label>
                <input
                  type="date"
                  value={poDateToFilter}
                  onChange={(e) => setPoDateToFilter(e.target.value)}
                  style={{ padding: 8, width: '100%', marginTop: 4 }}
                />
              </div>
            </div>
          </div>

          <label style={{ fontWeight: 500, marginRight: 12 }}>
            Select Purchase Order:
          </label>
          <select
            value={selectedPO?.id || ""}
            onChange={(e) => handleSelectPO(e.target.value)}
            style={{ padding: 8, minWidth: 200 }}
            disabled={loading || approvedGrnForPo}
          >
            <option value="">-- Select PO --</option>
            {purchaseOrders
              .filter((po) => {
                // Filter by supplier name if selected
                if (selectedSupplierName && (po.supplierName || '').toLowerCase() !== selectedSupplierName.toLowerCase()) {
                  return false;
                }
                
                if (poDateFromFilter && (po.createdAt ? new Date(po.createdAt).toISOString().split('T')[0] : '') < poDateFromFilter) {
                  return false;
                }
                if (poDateToFilter && (po.createdAt ? new Date(po.createdAt).toISOString().split('T')[0] : '') > poDateToFilter) {
                  return false;
                }
                return true;
              })
              .map((po) => (
                <option key={po.id} value={po.id}>
                  {po.orderCode || `PO-${po.id}`} - {po.supplierName}
                </option>
              ))}
          </select>
          
          {approvedGrnForPo && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: '#e3f2fd',
              border: '1px solid #2196F3',
              borderRadius: 4,
              color: '#0d47a1',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>⚠️ <strong>GRN Already Approved:</strong> A GRN is already approved for this purchase order. You can only view its details.</span>
              <button
                onClick={() => {
                  setApprovedGrnForPo(false);
                  setSelectedPO(null);
                  setError("");
                }}
                style={{
                  background: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  marginLeft: 12
                }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      )}

      {/* PO Details (only show when creating new GRN) */}
      {!loadedGrn && selectedPO && (
        <div
          style={{
            marginBottom: 32,
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 8,
          }}
        >
          <h3>Purchase Order Details</h3>
          <p>
            <strong>Supplier:</strong> {selectedPO.supplierName}
          </p>
          <p>
            <strong>Order Date:</strong> {selectedPO.date}
          </p>


          {/* Payment Method Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 500, marginRight: 12 }}>
              Payment Method <span style={{ color: 'red' }}>*</span>:
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={{ padding: 8, minWidth: 200 }}
              required
            >
              <option value="">-- Select Payment Method --</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Payment Status Handling */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
            <label style={{ fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={isPaid}
                onChange={e => setIsPaid(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Mark as Paid
            </label>
            <span style={{ fontWeight: 500 }}>or</span>
            <div>
              <label style={{ fontWeight: 500, marginRight: 8 }}>
                Payment Due Date:
              </label>
              <input
                type="date"
                value={paymentDueDate}
                onChange={e => setPaymentDueDate(e.target.value)}
                style={{ padding: 6 }}
                disabled={isPaid}
              />
            </div>
            <div>
              <label style={{ fontWeight: 500, marginRight: 8 }}>
                Payment Due (Days):
              </label>
              <input
                type="number"
                value={paymentDueDays}
                onChange={e => setPaymentDueDays(e.target.value)}
                style={{ padding: 6, width: 80 }}
                min="0"
                disabled={isPaid}
              />
            </div>
            {/* Cheque Date (only if payment method is Cheque) */}
            {paymentMethod === "CHEQUE" && (
              <div>
                <label style={{ fontWeight: 500, marginRight: 8 }}>
                  Cheque Date:
                </label>
                <input
                  type="date"
                  value={chequeDate}
                  onChange={e => setChequeDate(e.target.value)}
                  style={{ padding: 6 }}
                  disabled={isPaid}
                />
              </div>
            )}
          </div>

          <table
            style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}
          >
            <thead>
              <tr style={{ background: "#f2f2f2" }}>
                <th style={th}>Product</th>
                <th style={th}>Received Qty</th>
                <th style={th}>Unit Cost</th>
                <th style={th}>Sell Price</th>
              </tr>
            </thead>
            <tbody>
              {grnItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={td}>{item.productName}</td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.receivedQuantity}
                      onChange={(e) =>
                        handleChangeItem(idx, "receivedQuantity", e.target.value)
                      }
                      style={input}
                      min="0"
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) =>
                        handleChangeItem(idx, "unitCost", e.target.value)
                      }
                      style={input}
                      step="0.01"
                      min="0"
                    />
                  </td>
                  <td style={td}>
                    <input
                      type="number"
                      value={item.sellPrice}
                      onChange={(e) =>
                        handleChangeItem(idx, "sellPrice", e.target.value)
                      }
                      style={input}
                      step="0.01"
                      min="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleCreateGrn}
              style={btnPrimary}
              disabled={loading || createdGrnId || approvedGrnForPo}
            >
              {approvedGrnForPo
                ? "GRN Already Approved ✓"
                : createdGrnId
                ? "GRN Created ✓"
                : loading
                ? "Creating..."
                : "Create GRN"}
            </button>
            {createdGrnId && !approvedGrnForPo && (
              <p style={{ marginTop: 8, color: "#28a745", fontWeight: 500 }}>
                GRN Created (ID: {createdGrnId}) - You can now approve or reject
                it below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Invoice Recording Form - Optional, visible before GRN approval */}
      {(createdGrnId || loadedGrn) && !approved && (
        <div style={{
          marginTop: 24,
          marginBottom: 24,
          padding: 20,
          background: "#f0f9ff",
          border: "2px solid #2196F3",
          borderRadius: 8,
        }}>
          <h3 style={{ marginTop: 0, color: "#1976d2" }}>📄 Record Supplier Invoice (Optional)</h3>
          <p style={{ marginTop: 0, marginBottom: 16, color: "#666", fontSize: 14 }}>
            📝 You can record the supplier's invoice now or later. This is optional and can be skipped.
          </p>
          
          {invoiceSuccess && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              background: "#d4edda",
              color: "#155724",
              border: "1px solid #c3e6cb",
              borderRadius: 4,
            }}>
              ✓ {invoiceSuccess}
            </div>
          )}

          {error && (
            <div style={{
              padding: 12,
              marginBottom: 16,
              background: "#f8d7da",
              color: "#721c24",
              border: "1px solid #f5c6cb",
              borderRadius: 4,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleRecordInvoice} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Invoice Number *</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g., INV-2026-001"
                style={input}
                disabled={submittingInvoice}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Invoice Date *</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                style={input}
                disabled={submittingInvoice}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Invoice Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="0.00"
                style={input}
                disabled={submittingInvoice}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Payment Due Date *</label>
              <input
                type="date"
                value={paymentDueDate_Invoice}
                onChange={(e) => setPaymentDueDate_Invoice(e.target.value)}
                style={input}
                disabled={submittingInvoice}
                required
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <button
                type="submit"
                disabled={submittingInvoice}
                style={{
                  padding: "10px 20px",
                  background: "#2196F3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: submittingInvoice ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  opacity: submittingInvoice ? 0.6 : 1,
                }}
              >
                {submittingInvoice ? "Recording..." : "Record Invoice"}
              </button>
            </div>
          </form>

          <p style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
            💡 <strong>Tip:</strong> After recording the invoice, you can record payments in the Supplier Payment section. You can also record the invoice anytime after GRN approval.
          </p>
        </div>
      )}

      {/* Approval Section - Show when GRN is created OR loaded */}
      {(createdGrnId || loadedGrn) && (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h3>Approval Section</h3>
          {!createdGrnId && !loadedGrn && (
            <p style={{ color: "#856404", background: "#fff3cd", padding: 8, borderRadius: 4, marginBottom: 12 }}>
              ℹ️ Please create a GRN first before approving or rejecting.
            </p>
          )}
          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500 }}>Approved By:</label>
              <div style={{ 
                padding: 10, 
                background: '#f5f5f5', 
                border: '1px solid #ccc', 
                borderRadius: 4,
                marginTop: 4,
                fontWeight: 500 
              }}>
                {username || "Not logged in"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleApprove}
              disabled={approved || loading || savingEdits || (!createdGrnId && !loadedGrn)}
              style={{
                ...btnApprove,
                opacity: (approved || loading || savingEdits || (!createdGrnId && !loadedGrn)) ? 0.5 : 1,
                cursor: (approved || loading || savingEdits || (!createdGrnId && !loadedGrn)) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading
                ? "Processing..."
                : approved
                ? "Approved ✓"
                : "Approve GRN"}
            </button>
            <button
              onClick={openRejectModal}
              style={{
                ...btnReject,
                opacity: (loading || savingEdits || (!createdGrnId && !loadedGrn)) ? 0.5 : 1,
                cursor: (loading || savingEdits || (!createdGrnId && !loadedGrn)) ? 'not-allowed' : 'pointer',
              }}
              disabled={loading || savingEdits || (!createdGrnId && !loadedGrn)}
            >
              Reject GRN
            </button>
            {loadedGrn && (
              <button
                onClick={clearLoadedGrn}
                style={{
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Cancel & Create New GRN
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0 }}>Reject GRN</h3>
            <p style={{ marginBottom: 16, color: "#666" }}>
              Please provide a reason for rejecting this GRN:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={textarea}
              rows="4"
              disabled={loading}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={closeRejectModal}
                style={btnSecondary}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                style={btnReject}
                disabled={loading || !rejectReason.trim()}
              >
                {loading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Confirmation Modal */}
      {showInvoiceConfirm && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ marginTop: 0 }}>Invoice Not Entered</h3>
            <p style={{ marginBottom: 16, color: "#666" }}>
              No invoice number has been entered. Do you want to proceed with GRN approval without an invoice?
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowInvoiceConfirm(false);
                  setPendingApproveUser("");
                }}
                style={btnSecondary}
              >
                No, Enter Invoice First
              </button>
              <button
                onClick={() => {
                  setShowInvoiceConfirm(false);
                  proceedWithApproval(pendingApproveUser);
                }}
                style={btnApprove}
              >
                Yes, Approve Without Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- STYLES ----------
const th = { padding: 8, border: "1px solid #ccc", textAlign: "left" };
const td = { padding: 8, border: "1px solid #ccc" };
const input = { padding: 6, width: "100%", boxSizing: "border-box" };
const textarea = {
  padding: 8,
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: 4,
  resize: "vertical",
};
const btnPrimary = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 16px",
  cursor: "pointer",
};
const btnApprove = {
  background: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 16px",
  cursor: "pointer",
};
const btnReject = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 16px",
  cursor: "pointer",
};
const btnSecondary = {
  background: "#6c757d",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 16px",
  cursor: "pointer",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalContent = {
  background: "#fff",
  padding: 24,
  borderRadius: 8,
  minWidth: 400,
  maxWidth: 500,
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};
const btnInfo = {
  background: "#17a2b8",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "8px 16px",
  cursor: "pointer",
};

export default GRNManagement;