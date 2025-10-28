import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../components/AuthContext";

const API_BASE = process.env.REACT_APP_API_BASE || "";

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
  const [approved, setApproved] = useState(false);
  const [approvedUser, setApprovedUser] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  const { token: ctxToken, roles: ctxRoles } = useContext(AuthContext);
  const token = useMemo(
    () => ctxToken || localStorage.getItem("token") || "",
    [ctxToken]
  );
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/purchase-orders`, {
          headers: { ...authHeaders },
        });
        const data = await safeJson(res);
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load purchase orders");
        }
        if (!abort) {
          setPurchaseOrders(Array.isArray(data) ? data : []);
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

  const handleSelectPO = (poId) => {
    const po = purchaseOrders.find((p) => p.id === Number(poId));
    setSelectedPO(po);
    setCreatedGrnId(null);
    setApproved(false);
    if (po) {
      const items = po.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        receivedQuantity: it.quantity,
        unitCost: it.unitCost || 0,
        sellPrice: it.sellPrice || 0,
      }));
      setGrnItems(items);
      setGrnNumber(
        `GRN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${poId}`
      );
    }
  };

  const handleChangeItem = (index, field, value) => {
    const updated = [...grnItems];
    updated[index][field] = value;
    setGrnItems(updated);
  };

  const handleCreateGrn = async () => {
    if (!selectedPO) return alert("Select a purchase order first");

    setLoading(true);
    setError("");
    try {
      const payload = {
        purchaseOrderId: selectedPO.id,
        items: grnItems.map((i) => ({
          productId: i.productId,
          receivedQuantity: Number(i.receivedQuantity),
          unitCost: Number(i.unitCost),
        })),
      };

      const res = await fetch(`${API_BASE}/api/grns`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create GRN");
      }

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

  const handleApprove = async () => {
    if (!approvedUser) return alert("Enter Approved User");
    if (!createdGrnId) return alert("Please create a GRN first");

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/grns/${createdGrnId}/approve`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvedUser }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to approve GRN");
      }

      setApproved(true);
      alert("GRN Approved and Inventory Updated!");
      console.log("Approved:", data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert("Error approving GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = () => {
    if (!createdGrnId) return alert("Please create a GRN first");
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason for rejection");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/grns/${createdGrnId}/reject`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to reject GRN");
      }

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

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* Select Purchase Order */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 500, marginRight: 12 }}>
          Select Purchase Order:
        </label>
        <select
          value={selectedPO?.id || ""}
          onChange={(e) => handleSelectPO(e.target.value)}
          style={{ padding: 8, minWidth: 200 }}
          disabled={loading}
        >
          <option value="">-- Select PO --</option>
          {purchaseOrders.map((po) => (
            <option key={po.id} value={po.id}>
              {po.code} - {po.supplierName}
            </option>
          ))}
        </select>
      </div>

      {/* PO Details */}
      {selectedPO && (
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
              disabled={loading || createdGrnId}
            >
              {createdGrnId
                ? "GRN Created ✓"
                : loading
                ? "Creating..."
                : "Create GRN"}
            </button>
            {createdGrnId && (
              <p style={{ marginTop: 8, color: "#28a745", fontWeight: 500 }}>
                GRN Created (ID: {createdGrnId}) - You can now approve or reject
                it below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Approval Section */}
      {selectedPO && (
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <h3>Approval Section</h3>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Approved User"
              value={approvedUser}
              onChange={(e) => setApprovedUser(e.target.value)}
              style={input}
              disabled={loading}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleApprove}
              disabled={approved || loading || !createdGrnId}
              style={btnApprove}
            >
              {loading
                ? "Processing..."
                : approved
                ? "Approved ✓"
                : "Approve GRN"}
            </button>
            <button
              onClick={openRejectModal}
              style={btnReject}
              disabled={loading || !createdGrnId}
            >
              Reject GRN
            </button>
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