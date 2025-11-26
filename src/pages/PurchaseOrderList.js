// src/pages/PurchaseOrdersList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "";

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
  const debouncedOrderCode = useDebounced(orderCodeFilter, 250);

  // sorting (by orderCode)
  const [sortAsc, setSortAsc] = useState(true);

  const token = localStorage.getItem("token") || "";
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // isAdmin gate (ONLY admins can see Actions column)
  const isAdmin = useMemo(() => {
    const all = [...readLocalRoles(), ...readJwtRoles(token)].map(normalizeRole);
    const set = new Set(all);
    return set.has("admin");
  }, [token, localStorage.getItem("roles")]);

  // column count changes if Actions is hidden
  const colCount = isAdmin ? 6 : 5;

  // Load orders
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/purchase-orders?page=${currentPage}&size=${pageSize}&sortBy=createdAt&sortDir=desc`, {
          headers: { ...authHeaders },
        });
        const data = await safeJson(res);
        if (!res.ok)
          throw new Error(data?.message || "Failed to load purchase orders");
        // Handle paginated response
        const orderList = data.content || [];
        if (!abort) {
          setOrders(orderList);
          setTotalPages(data.totalPages || 0);
          setTotalElements(data.totalElements || 0);
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
        const res = await fetch(`${API_BASE}/api/suppliers`, {
          headers: { ...authHeaders },
        });
        const data = await safeJson(res);
        if (!res.ok)
          throw new Error(data?.message || "Failed to load suppliers");
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
      .sort((a, b) => {
        const A = a.orderCode || "";
        const B = b.orderCode || "";
        const cmp = A.localeCompare(B, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortAsc ? cmp : -cmp;
      });
  }, [orders, debouncedOrderCode, supplierIdFilter, sortAsc]);

  async function handleDelete(id, code) {
    if (!window.confirm(`Delete purchase order ${code || id}?`)) return;
    setDeletingId(id);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      const data = await safeJson(res);
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete purchase order");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setErr(e.message || "Failed to delete purchase order");
    } finally {
      setDeletingId(null);
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
        style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 220 }}
        >
          <label style={{ marginBottom: 6 }}>Search by Order Code</label>
          <input
            placeholder="e.g., PO-20250923-0001"
            value={orderCodeFilter}
            onChange={(e) => setOrderCodeFilter(e.target.value)}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 220 }}
        >
          <label style={{ marginBottom: 6 }}>Supplier</label>
          <select
            value={supplierIdFilter}
            onChange={(e) => setSupplierIdFilter(e.target.value)}
            style={{ padding: 8 }}
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ alignSelf: "flex-end" }}>
          <button
            onClick={() => setSortAsc((s) => !s)}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: "1px solid #ccc",
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
    </div>
  );
}
