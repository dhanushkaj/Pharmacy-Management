import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { api } from '../utill/api';

// tiny debounce hook
function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* -------- Role helpers: determine if current user is ADMIN -------- */
function readJwtRoles(jwtToken) {
  try {
    if (!jwtToken || !jwtToken.includes('.')) return [];
    const base64 = jwtToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    const raw =
      payload.roles ??
      payload.authorities ??
      payload.scopes ??
      payload.scope ??
      payload.role ??
      [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return raw.split(/[ ,;]+/);
    return [];
  } catch {
    return [];
  }
}
function normalizeRole(r) {
  return String(r).toLowerCase().replace(/^role_/, '').replace(/^super_/, 'admin');
}
function readLocalRoles(rolesStr) {
  try {
    const parsed = JSON.parse(rolesStr);
    if (Array.isArray(parsed)) return parsed;
    if (parsed) return [parsed];
  } catch { /* not JSON */ }
  return rolesStr.split(/[ ,;]+/).filter(Boolean);
}
/* ----------------------------------------------------------------- */

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();

  const [po, setPo] = useState(location.state?.po || null);

  const [err, setErr] = useState('');
  const [busyRow, setBusyRow] = useState(null);
  const [editing, setEditing] = useState(null); // { itemId, qty }

  // NEW: filters
  const [nameFilter, setNameFilter] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const debouncedName = useDebounced(nameFilter, 250);
  const debouncedCode = useDebounced(codeFilter, 250);

  const token = localStorage.getItem('token') || '';
  const rolesStr = localStorage.getItem('roles') || '';

  // Only admins can see the Actions column
  const isAdmin = useMemo(() => {
    const all = [...readLocalRoles(rolesStr), ...readJwtRoles(token)].map(normalizeRole);
    const set = new Set(all);
    return set.has('admin');
  }, [token, rolesStr]);

  useEffect(() => {
    if (po) return;
    let abort = false;
    (async () => {
      setErr('');
      try {
        const data = await api(`/api/purchase-orders/${id}`);
        if (!abort) setPo(data);
      } catch (e) {
        if (!abort) setErr(e.message || 'Failed to load purchase order');
      }
    })();
    return () => { abort = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function startEdit(it) { if (isAdmin) setEditing({ itemId: it.itemId, qty: String(it.quantity) }); }
  function cancelEdit() { setEditing(null); }
  function changeEditQty(v) { setEditing(prev => prev ? { ...prev, qty: v } : prev); }

  async function saveQty(item) {
    if (!isAdmin) return;
    if (!editing || editing.itemId !== item.itemId) return;
    const current = Number(item.quantity);
    const desired = Math.max(1, Number(editing.qty) || 1);

    const proceed = desired === current
      ? window.confirm(`Quantity for "${item.productName}" is already ${current}.\n\nSave anyway?`)
      : window.confirm(`Update quantity for "${item.productName}"?\n\nCurrent: ${current}\nNew: ${desired}`);
    if (!proceed) return;

    setBusyRow(item.itemId);
    setErr('');
    try {
      const data = await api(`/api/purchase-orders/${id}/items/${item.itemId}`, {
        method: 'PATCH',
        body: { quantity: desired }
      });

      setPo(prev => ({
        ...prev,
        items: (prev.items || []).map(it =>
          it.itemId === item.itemId ? { ...it, quantity: desired } : it
        )
      }));
      setEditing(null);
    } catch (e) {
      setErr(e.message || 'Failed to update quantity');
    } finally {
      setBusyRow(null);
    }
  }

  async function deleteItem(item) {
    if (!isAdmin) return;
    if (!window.confirm(`Remove "${item.productName}" (qty: ${item.quantity}) from this purchase order?`)) return;

    setBusyRow(item.itemId);
    setErr('');
    try {
      await api(`/api/purchase-orders/${id}/items/${item.itemId}`, {
        method: 'DELETE'
      });

      setPo(prev => ({
        ...prev,
        items: (prev.items || []).filter(it => it.itemId !== item.itemId)
      }));
    } catch (e) {
      setErr(e.message || 'Failed to delete item');
    } finally {
      setBusyRow(null);
    }
  }

  // NEW: filter items by product name & code
  const filteredItems = useMemo(() => {
    const name = debouncedName.trim().toLowerCase();
    const code = debouncedCode.trim().toLowerCase();
    const items = po?.items || [];
    return items.filter(it => {
      const nm = (it.productName || '').toLowerCase();
      const cd = (it.productCode || '').toLowerCase();
      const okName = name ? nm.includes(name) : true;
      const okCode = code ? cd.includes(code) : true;
      return okName && okCode;
    });
  }, [po, debouncedName, debouncedCode]);

  if (err && !po) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Purchase Order #{id}</h2>
        <div style={{ color: 'crimson' }}>{err}</div>
        <div style={{ marginTop: 12 }}>
          <Link to="/purchase-orders" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #ccc' }}>Back to all</button>
          </Link>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Purchase Order #{id}</h2>
        <div>Loading…</div>
      </div>
    );
  }

  // Column count adapts if Actions is hidden
  const colCount = isAdmin ? 4 : 3;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Purchase Order Details</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/purchase-orders" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #ccc' }}>Back to all</button>
          </Link>
        </div>
      </div>

      {err && <div style={{ color: 'crimson', margin: '8px 0 12px' }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 12, marginTop: 8, marginBottom: 16 }}>
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Order ID</div>
          <div style={{ fontWeight: 600 }}>{po.id}</div>
        </div>
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Order Code</div>
          <div style={{ fontWeight: 600 }}>{po.orderCode}</div>
        </div>
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Created Date</div>
          <div style={{ fontWeight: 600 }}>{po.createdAt}</div>
        </div>
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Needed Date</div>
          <div style={{ fontWeight: 600 }}>{po.neededDate}</div>
        </div>
        <div style={{ background: '#f7f7f7', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Supplier</div>
          <div style={{ fontWeight: 600 }}>{po.supplierName} (ID: {po.supplierId})</div>
        </div>
      </div>

      <h3>Items</h3>

      {/* NEW: search inputs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
          <label style={{ marginBottom: 6 }}>Search by Product Name</label>
          <input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="e.g., Paracetamol"
            style={{ padding: 8 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
          <label style={{ marginBottom: 6 }}>Search by Product Code</label>
          <input
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
            placeholder="e.g., PA1234"
            style={{ padding: 8 }}
          />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Product</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Code</th>
            <th style={{ padding: 8, border: '1px solid #ddd' }}>Quantity</th>
            {isAdmin && <th style={{ padding: 8, border: '1px solid #ddd' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(it => {
            const isEditing = editing?.itemId === it.itemId;
            return (
              <tr key={it.itemId}>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{it.productName}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{it.productCode}</td>
                <td style={{ padding: 8, border: '1px solid #eee', width: 160 }}>
                  {isAdmin && isEditing ? (
                    <input
                      type="number"
                      min="1"
                      value={editing.qty}
                      onChange={(e) => changeEditQty(e.target.value)}
                      onBlur={(e) => changeEditQty(e.target.value)}
                      style={{ width: '100%', padding: 6 }}
                      disabled={busyRow === it.itemId}
                    />
                  ) : (
                    it.quantity
                  )}
                </td>
                {isAdmin && (
                  <td style={{ padding: 8, border: '1px solid #eee', whiteSpace: 'nowrap' }}>
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => startEdit(it)}
                          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', marginRight: 8 }}
                          disabled={busyRow === it.itemId}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(it)}
                          style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px' }}
                          disabled={busyRow === it.itemId}
                        >
                          {busyRow === it.itemId ? 'Removing…' : 'Remove'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => saveQty(it)}
                          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #0c0', background: '#43ea7a', color: '#000', marginRight: 8 }}
                          disabled={busyRow === it.itemId}
                        >
                          {busyRow === it.itemId ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid ' + (busyRow === it.itemId ? '#ddd' : '#ccc') }}
                          disabled={busyRow === it.itemId}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          {filteredItems.length === 0 && (
            <tr><td colSpan={colCount} style={{ padding: 12, textAlign: 'center' }}>No matching items</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrderDetails;
