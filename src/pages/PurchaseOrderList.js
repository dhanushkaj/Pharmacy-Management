// src/pages/PurchaseOrdersList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utill/api";

async function safeJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ---- Role helpers: determine if current user is ADMIN ---- */
function readJwtRoles(jwtToken) {
  try {
    if (!jwtToken || !jwtToken.includes(".")) return [];
    const base64 = jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    const raw =
      payload.roles ??
      payload.authorities ??
      payload.scopes ??
      payload.scope ??
      payload.role ??
      [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return raw.split(/[ ,;]+/);
    return [];
  } catch {
    return [];
  }
}
function normalizeRole(r) {
  return String(r).toLowerCase().replace(/^role_/, "").replace(/^super_/, "admin");
}
function readLocalRoles() {
  const rolesStr = localStorage.getItem("roles") || "";
  try {
    const parsed = JSON.parse(rolesStr);
    if (Array.isArray(parsed)) return parsed;
    if (parsed) return [parsed];
  } catch {
    /* not JSON */
  }
  return rolesStr.split(/[ ,;]+/).filter(Boolean);
}

export default function PurchaseOrdersList() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // filters
  const [orderCodeFilter, setOrderCodeFilter] = useState("");
  const [supplierIdFilter, setSupplierIdFilter] = useState(""); // '' = all
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [grnStatusMap, setGrnStatusMap] = useState({}); // Map of PO ID to GRN approved status
  const debouncedOrderCode = useDebounced(orderCodeFilter, 250);

  // sorting (by orderCode)
  const [sortAsc, setSortAsc] = useState(true);

  const [editingPO, setEditingPO] = useState(null);
  const [editSupplier, setEditSupplier] = useState("");
  const [editNeededDate, setEditNeededDate] = useState("");
  const [saving, setSaving] = useState(false);

  // isAdmin gate (ONLY admins can see Actions column)
  const isAdmin = useMemo(() => {
    const all = readLocalRoles().map(normalizeRole);
    const set = new Set(all);
    return set.has("admin");
  }, [localStorage.getItem("roles")]);

  // column count changes if Actions is hidden
  const colCount = isAdmin ? 7 : 6;

  // Load orders
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await api(`/api/purchase-orders?page=${currentPage}&size=${pageSize}&sortBy=createdAt&sortDir=desc`);
        // Handle paginated response
        const orderList = data.content || [];
        if (!abort) {
          setOrders(orderList);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
          
          // Fetch GRN status for each PO
          const statusMap = {};
          for (const po of orderList) {
            try {
              const grnData = await api(`/api/grns?page=0&size=100`);
              const grnList = grnData.content || [];
              // Check for APPROVED GRN that belongs to this specific PO
              const approvedGrn = grnList.find(g => 
                g.status === 'APPROVED' && 
                (g.purchaseOrderId === po.id || Number(g.purchaseOrderId) === Number(po.id))
              );
              statusMap[po.id] = approvedGrn ? 'Yes' : 'No';
            } catch (e) {
              statusMap[po.id] = 'No';
            }
          }
          if (!abort) setGrnStatusMap(statusMap);
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load purchase orders");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Load suppliers for dropdown
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const data = await api('/api/suppliers');
        if (!abort) setSuppliers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!abort) setErr((prev) => prev || e.message);
      }
    })();
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const code = debouncedOrderCode.trim().toLowerCase();
    return orders
      .filter((o) =>
        code ? (o.orderCode || "").toLowerCase().includes(code) : true
      )
      .filter((o) =>
        supplierIdFilter
          ? String(o.supplierId) === String(supplierIdFilter)
          : true
      )
      .filter((o) => {
        if (!dateFromFilter && !dateToFilter) return true;
        const createdDate = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '';
        if (dateFromFilter && createdDate < dateFromFilter) return false;
        if (dateToFilter && createdDate > dateToFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const A = a.orderCode || "";
        const B = b.orderCode || "";
        const cmp = A.localeCompare(B, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortAsc ? cmp : -cmp;
      });
  }, [orders, debouncedOrderCode, supplierIdFilter, dateFromFilter, dateToFilter, sortAsc]);

  async function handleDelete(id, code) {
    if (!window.confirm(`Delete purchase order ${code || id}?`)) return;
    setDeletingId(id);
    setErr("");
    try {
      await api(`/api/purchase-orders/${id}`, {
        method: "DELETE",
      });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setErr(e.message || "Failed to delete purchase order");
    } finally {
      setDeletingId(null);
    }
  }

  function openEditModal(po) {
    setEditingPO(po);
    setEditSupplier(po.supplierId || "");
    setEditNeededDate(po.neededDate || "");
    setErr("");
  }

  function closeEditModal() {
    setEditingPO(null);
    setEditSupplier("");
    setEditNeededDate("");
  }

  async function handleUpdate() {
    if (!editingPO) return;
    setSaving(true);
    setErr("");
    try {
      const body = {};
      if (editSupplier) body.supplierId = parseInt(editSupplier);
      if (editNeededDate) body.neededDate = editNeededDate;

      const data = await api(`/api/purchase-orders/${editingPO.id}`, {
        method: "PUT",
        body: body,
      });

      // Update the order in the list
      setOrders((prev) =>
        prev.map((o) => (o.id === editingPO.id ? { ...o, ...data } : o))
      );
      closeEditModal();
    } catch (e) {
      setErr(e.message || "Failed to update purchase order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h2>Purchase Orders</h2>
        <Link to="/purchase-order" style={{ textDecoration: "none" }}>
          <button
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: "1px solid #0c0",
              background: "#43ea7a",
              color: "#000",
            }}
          >
            Create Purchase Order
          </button>
        </Link>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 8 }}>{err}</div>}

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 220, flex: 1 }}>
          <label style={{ marginBottom: 6 }}>Search by Order Code</label>
          <input
            placeholder="e.g., PO-20250923-0001"
            value={orderCodeFilter}
            onChange={(e) => setOrderCodeFilter(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 220, flex: 1 }}>
          <label style={{ marginBottom: 6 }}>Supplier</label>
          <select
            value={supplierIdFilter}
            onChange={(e) => setSupplierIdFilter(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 150, flex: 1 }}>
          <label style={{ marginBottom: 6 }}>Created From</label>
          <input
            type="date"
            value={dateFromFilter}
            onChange={(e) => setDateFromFilter(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 150, flex: 1 }}>
          <label style={{ marginBottom: 6 }}>Created To</label>
          <input
            type="date"
            value={dateToFilter}
            onChange={(e) => setDateToFilter(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <button
            onClick={() => setSortAsc((s) => !s)}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
              width: "100%",
            }}
            title="Toggle sort by Order Code"
          >
            Sort by Order Code {sortAsc ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: 16,
          background: "#fafafa",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th
              style={{
                padding: 8,
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
              onClick={() => setSortAsc((s) => !s)}
              title="Click to toggle sort"
            >
              Order Code {sortAsc ? "▲" : "▼"}
            </th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Supplier</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Created</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Needed</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Items</th>
            <th style={{ padding: 8, border: "1px solid #ddd", background: "#fff3cd" }}>Approved GRN</th>
            <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>

          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={colCount} style={{ padding: 12 }}>
                Loading…
              </td>
            </tr>
          )}

          {!loading &&
            filtered.map((po) => (
              <tr key={po.id}>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  {po.orderCode}
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  {po.supplierName} (ID: {po.supplierId})
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  {po.createdAt}
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  {po.neededDate}
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  {(po.items || []).length}
                </td>
                <td style={{ padding: 8, border: "1px solid #eee", background: "#fff9e6", fontWeight: 500 }}>
                  {grnStatusMap[po.id] === 'Yes' ? (
                    <span style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✓ Yes
                    </span>
                  ) : (
                    <span style={{ color: '#6c757d' }}>{grnStatusMap[po.id] || 'No'}</span>
                  )}
                </td>

                
                  <td style={{ padding: 8, border: "1px solid #eee" }}>
                    <Link
                      to={`/purchase-order/${po.id}`}
                      state={{ po }}
                      style={{ textDecoration: "none" }}
                    >
                      <button
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: "1px solid #ccc",
                        }}
                      >
                        View
                      </button>
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(po)}
                          style={{
                            marginLeft: 8,
                            padding: "6px 12px",
                            borderRadius: 4,
                            border: "1px solid #17a2b8",
                            background: "#17a2b8",
                            color: "#fff",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(po.id, po.orderCode)}
                          disabled={deletingId === po.id}
                          style={{
                            marginLeft: 8,
                            padding: "6px 12px",
                            borderRadius: 4,
                            border: "1px solid #d33",
                            background: "#ff6b6b",
                            color: "#fff",
                          }}
                          title="Delete this purchase order"
                        >
                          {deletingId === po.id ? "Deleting…" : "Delete"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
            ))}

          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={colCount} style={{ padding: 12, textAlign: "center" }}>
                No purchase orders
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
            Showing page {currentPage + 1} of {totalPages} ({totalElements} total orders)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "1px solid #007bff",
                background: currentPage === 0 ? "#e0e0e0" : "#007bff",
                color: currentPage === 0 ? "#999" : "#fff",
                cursor: currentPage === 0 ? "not-allowed" : "pointer"
              }}
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "1px solid #007bff",
                background: currentPage === 0 ? "#e0e0e0" : "#007bff",
                color: currentPage === 0 ? "#999" : "#fff",
                cursor: currentPage === 0 ? "not-allowed" : "pointer"
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "1px solid #007bff",
                background: currentPage >= totalPages - 1 ? "#e0e0e0" : "#007bff",
                color: currentPage >= totalPages - 1 ? "#999" : "#fff",
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer"
              }}
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: "8px 16px",
                borderRadius: 4,
                border: "1px solid #007bff",
                background: currentPage >= totalPages - 1 ? "#e0e0e0" : "#007bff",
                color: currentPage >= totalPages - 1 ? "#999" : "#fff",
                cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer"
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPO && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: 500,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Purchase Order: {editingPO.orderCode}</h3>
            {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Supplier
              </label>
              <select
                value={editSupplier}
                onChange={(e) => setEditSupplier(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.supplierId} value={s.supplierId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6 }}>
                Needed Date
              </label>
              <input
                type="date"
                value={editNeededDate}
                onChange={(e) => setEditNeededDate(e.target.value)}
                style={{ width: "100%", padding: 8 }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={closeEditModal}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  background: "#f5f5f5",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #28a745",
                  background: "#28a745",
                  color: "#fff",
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
