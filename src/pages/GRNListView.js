import React, { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utill/api";
import { AuthContext } from "../components/AuthContext";

// Helper function to safely parse JSON
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const GRNListView = () => {
  const navigate = useNavigate();
  const [grns, setGrns] = useState([]);
  const [filteredGrns, setFilteredGrns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paidFilter, setPaidFilter] = useState(""); // "", "paid", "unpaid"
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const { isAuthenticated } = useContext(AuthContext);

  // Load all GRNs
  useEffect(() => {
    loadGrns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Filter GRNs when search term changes
  useEffect(() => {
    let filtered = grns;
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((grn) => {
        const grnCodeMatch = grn.grnCode.toLowerCase().includes(searchLower);
        const poCodeMatch = grn.purchaseOrderCode && grn.purchaseOrderCode.toLowerCase().includes(searchLower);
        const supplierMatch = grn.supplierName && grn.supplierName.toLowerCase().includes(searchLower);
        const productMatch = Array.isArray(grn.items) && grn.items.some(item => item.productName && item.productName.toLowerCase().includes(searchLower));
        const dateStr = formatDate(grn.createdAt);
        const dateMatch = dateStr && dateStr.toLowerCase().includes(searchLower);
        // Paid status search
        const paidMatch = (searchLower === "paid" && grn.paid) || (searchLower === "unpaid" && !grn.paid);
        return grnCodeMatch || poCodeMatch || supplierMatch || productMatch || dateMatch || paidMatch;
      });
    }
    if (paidFilter === "paid") {
      filtered = filtered.filter(grn => grn.paid);
    } else if (paidFilter === "unpaid") {
      filtered = filtered.filter(grn => !grn.paid);
    }
    setFilteredGrns(filtered);
  }, [searchTerm, grns, paidFilter]);

  const loadGrns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api(`/api/grns?page=${currentPage}&size=${pageSize}&sortBy=createdAt&sortDir=desc`);
      // Handle paginated response
      const grnList = data.content || [];
      setGrns(grnList);
      setFilteredGrns(grnList);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error("Error fetching GRNs:", err);
      setError(err.message || "Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  const viewGrnDetails = async (grnId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/grns/${grnId}`, {
        headers: { ...authHeaders },
      });
      const data = await safeJson(res);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load GRN details");
      }
      setSelectedGrn(data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching GRN details:", err);
      setError(err.message || "Failed to load GRN details");
    } finally {
      setLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedGrn(null);
  };

  const deleteGrn = async (grnId, grnCode) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete GRN: ${grnCode}?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    setLoading(true);
    setError("");
    try {
      await api(`/api/grns/${grnId}`, {
        method: "DELETE",
      });

      alert(`GRN ${grnCode} deleted successfully`);
      // Reload the GRN list
      loadGrns();
    } catch (err) {
      console.error("Error deleting GRN:", err);
      setError(err.message || "Failed to delete GRN");
      alert("Error deleting GRN: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { background: "#ffc107", color: "#000" },
      APPROVED: { background: "#28a745", color: "#fff" },
      REJECTED: { background: "#dc3545", color: "#fff" },
    };
    return (
      <span
        style={{
          ...statusBadge,
          ...(styles[status] || {}),
        }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>GRN List</h2>
        <button onClick={loadGrns} style={btnPrimary} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {/* Search Box */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by GRN Code, PO Code, Supplier, Product, Date, Paid/Unpaid..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInput}
        />
        <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} style={{ padding: 10, fontSize: 14, borderRadius: 4, border: '1px solid #ced4da' }}>
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        {searchTerm && (
          <span style={{ marginLeft: 12, color: "#666" }}>
            Found {filteredGrns.length} result(s)
          </span>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && <p>Loading...</p>}

      {/* GRN Table */}
      {!loading && filteredGrns.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={th}>GRN Code</th>
                <th style={th}>PO Code</th>
                <th style={th}>Supplier</th>
                <th style={th}>Created Date</th>
                <th style={th}>Status</th>
                <th style={th}>Paid</th>
                <th style={th}>Due Date</th>
                <th style={th}>Due Days</th>
                <th style={th}>Cheque Date</th>
                <th style={th}>Approved By</th>
                <th style={th}>Approved Date</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrns.map((grn) => (
                <tr key={grn.id} style={tr}>
                  <td style={td}>{grn.grnCode}</td>
                  <td style={td}>{grn.purchaseOrderCode}</td>
                  <td style={td}>{grn.supplierName || 'N/A'}</td>
                  <td style={td}>{formatDate(grn.createdAt)}</td>
                  <td style={td}>{getStatusBadge(grn.status)}</td>
                  <td style={td}>{grn.paid ? 'Paid' : 'Unpaid'}</td>
                  <td style={td}>{grn.paymentDueDate ? formatDate(grn.paymentDueDate) : 'N/A'}</td>
                  <td style={td}>{typeof grn.paymentDueDays === 'number' ? grn.paymentDueDays : 'N/A'}</td>
                  <td style={td}>{grn.chequeDate ? formatDate(grn.chequeDate) : 'N/A'}</td>
                  <td style={td}>{grn.approvedUser || "N/A"}</td>
                  <td style={td}>{formatDate(grn.approvedDate)}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => viewGrnDetails(grn.id)}
                        style={btnView}
                      >
                        View Details
                      </button>
                      {grn.status === "PENDING" && (
                        <button
                          onClick={() => navigate(`/grn?grnId=${grn.id}`)}
                          style={btnApprove}
                        >
                          Approve/Reject
                        </button>
                      )}
                      <button
                        onClick={() => deleteGrn(grn.id, grn.grnCode)}
                        style={btnDelete}
                        title="Delete GRN"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredGrns.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
          {searchTerm ? "No GRNs found matching your search." : "No GRNs available."}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: 20,
          padding: "12px 0"
        }}>
          <div style={{ color: "#666", fontSize: 14 }}>
            Showing page {currentPage + 1} of {totalPages} ({totalElements} total GRNs)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              style={{
                ...btnPrimary,
                opacity: currentPage === 0 ? 0.5 : 1,
                cursor: currentPage === 0 ? "not-allowed" : "pointer"
              }}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                ...btnPrimary,
                opacity: currentPage === 0 ? 0.5 : 1,
                cursor: currentPage === 0 ? "not-allowed" : "pointer"
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                ...btnPrimary,
                opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer"
              }}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                ...btnPrimary,
                opacity: currentPage >= totalPages - 1 ? 0.5 : 1,
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer"
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedGrn && (
        <div style={modalOverlay} onClick={closeDetailsModal}>
          <div style={modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>GRN Details</h3>
              <button onClick={closeDetailsModal} style={closeButton}>
                ✕
              </button>
            </div>

            <div style={detailsSection}>
              <div style={detailRow}>
                <strong>GRN Code:</strong>
                <span>{selectedGrn.grnCode}</span>
              </div>
              <div style={detailRow}>
                <strong>Purchase Order:</strong>
                <span>{selectedGrn.purchaseOrderCode}</span>
              </div>
              <div style={detailRow}>
                <strong>Supplier:</strong>
                <span>{selectedGrn.supplierName || 'N/A'}</span>
              </div>
              <div style={detailRow}>
                <strong>Status:</strong>
                {getStatusBadge(selectedGrn.status)}
              </div>
              <div style={detailRow}>
                <strong>Paid:</strong>
                <span>{selectedGrn.paid ? 'Paid' : 'Unpaid'}</span>
              </div>
              <div style={detailRow}>
                <strong>Due Date:</strong>
                <span>{selectedGrn.paymentDueDate ? formatDate(selectedGrn.paymentDueDate) : 'N/A'}</span>
              </div>
              <div style={detailRow}>
                <strong>Due Days:</strong>
                <span>{typeof selectedGrn.paymentDueDays === 'number' ? selectedGrn.paymentDueDays : 'N/A'}</span>
              </div>
              <div style={detailRow}>
                <strong>Cheque Date:</strong>
                <span>{selectedGrn.chequeDate ? formatDate(selectedGrn.chequeDate) : 'N/A'}</span>
              </div>
              <div style={detailRow}>
                <strong>Created Date:</strong>
                <span>{formatDate(selectedGrn.createdAt)}</span>
              </div>
              {selectedGrn.approvedUser && (
                <div style={detailRow}>
                  <strong>Approved By:</strong>
                  <span>{selectedGrn.approvedUser}</span>
                </div>
              )}
              {selectedGrn.approvedDate && (
                <div style={detailRow}>
                  <strong>Approved Date:</strong>
                  <span>{formatDate(selectedGrn.approvedDate)}</span>
                </div>
              )}
              {selectedGrn.rejectedReason && (
                <div style={detailRow}>
                  <strong>Rejection Reason:</strong>
                  <span style={{ color: "#dc3545" }}>{selectedGrn.rejectedReason}</span>
                </div>
              )}
            </div>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>Items</h4>
            <table style={table}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  <th style={th}>Product</th>
                  <th style={th}>Quantity</th>
                  <th style={th}>Unit Cost</th>
                  <th style={th}>Selling Price</th>
                  <th style={th}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {selectedGrn.items.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>{item.productName}</td>
                    <td style={td}>{item.receivedQuantity}</td>
                    <td style={td}>Rs.{item.unitCost.toFixed(2)}</td>
                    <td style={td}>Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</td>
                    <td style={td}>
                      Rs.{(item.receivedQuantity * item.unitCost).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8f9fa", fontWeight: "bold" }}>
                  <td style={td} colSpan="4">Total</td>
                  <td style={td}>
                    Rs. 
                    {selectedGrn.items
                      .reduce(
                        (sum, item) => sum + item.receivedQuantity * item.unitCost,
                        0
                      )
                      .toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ marginTop: 24, textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {selectedGrn.status === "PENDING" && (
                <button
                  onClick={() => navigate(`/grn?grnId=${selectedGrn.id}`)}
                  style={btnApprove}
                >
                  Edit & Approve
                </button>
              )}
              <button onClick={closeDetailsModal} style={btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- STYLES ----------
const table = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #dee2e6",
};

const th = {
  padding: 12,
  border: "1px solid #dee2e6",
  textAlign: "left",
  fontWeight: 600,
};

const td = {
  padding: 12,
  border: "1px solid #dee2e6",
};

const tr = {
  transition: "background-color 0.2s",
};

const searchInput = {
  padding: 10,
  width: "100%",
  maxWidth: 400,
  fontSize: 14,
  border: "1px solid #ced4da",
  borderRadius: 4,
};

const btnPrimary = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const btnView = {
  background: "#17a2b8",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 13,
};

const btnApprove = {
  background: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const btnDelete = {
  background: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
};

const btnSecondary = {
  background: "#6c757d",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: 14,
};

const statusBadge = {
  padding: "4px 12px",
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  display: "inline-block",
};

const errorBox = {
  padding: 12,
  marginBottom: 16,
  background: "#f8d7da",
  color: "#721c24",
  border: "1px solid #f5c6cb",
  borderRadius: 4,
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
  minWidth: 600,
  maxWidth: 900,
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const closeButton = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
  color: "#6c757d",
  padding: 0,
  width: 30,
  height: 30,
};

const detailsSection = {
  background: "#f8f9fa",
  padding: 16,
  borderRadius: 4,
  marginBottom: 16,
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #dee2e6",
};

export default GRNListView;