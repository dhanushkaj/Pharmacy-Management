import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utill/api";

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const PurchaseOrder = () => {
  const navigate = useNavigate();

  // Header
  const [supplierId, setSupplierId] = useState("");
  const [neededDate, setNeededDate] = useState("");

  // Suppliers
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSup, setLoadingSup] = useState(false);
  const [err, setErr] = useState("");

  // Product search
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Selected product + quantity
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState("");

  // Items in this PO
  const [items, setItems] = useState([]);

  // Quick Product Creation Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({
    productCode: "",
    name: "",
    categoryId: "",
    description: "",
    barcode: "",
  });
  const [creatingProduct, setCreatingProduct] = useState(false);

  // --------- ROLE GATE (reworked)
  function readJwtRoles(jwtToken) {
    try {
      if (!jwtToken || !jwtToken.includes(".")) return [];
      const base64 = jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      const payload = JSON.parse(json);
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
    return String(r)
      .toLowerCase()
      .replace(/^role_/, "")      // ROLE_ADMIN -> admin
      .replace(/^super_/, "admin"); // SUPER_ADMIN -> admin
  }

  function readLocalRoles() {
    const rolesStr = localStorage.getItem("roles") || "";
    let list = [];
    try {
      const parsed = JSON.parse(rolesStr);
      if (Array.isArray(parsed)) list = parsed;
      else if (parsed) list = [parsed];
    } catch {
      list = rolesStr.split(/[ ,;]+/).filter(Boolean);
    }
    return list;
  }

  function getAllRoles() {
    const fromStorage = readLocalRoles();
    const fromJwt = [];  // Token is in HTTP-only cookie, can't read roles from it
    const all = [...fromStorage, ...fromJwt].map(normalizeRole);
    return Array.from(new Set(all)); // de-dupe
  }

  const isAllowed = useMemo(() => {
    const roles = getAllRoles();
    const allowedSet = new Set(["admin"]);
    return roles.some((r) => allowedSet.has(r));
    // re-evaluate when local roles change
  }, [localStorage.getItem("roles")]);
  // --------- END ROLE GATE

  // --- Load categories for product modal
  useEffect(() => {
    let abort = false;
    async function loadCategories() {
      try {
        const data = await api('/api/categories');
        if (!abort) setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load categories:", e.message);
      }
    }
    loadCategories();
    return () => {
      abort = true;
    };
  }, []);

  // --- Load suppliers
  useEffect(() => {
    let abort = false;
    async function load() {
      setLoadingSup(true);
      setErr("");
      try {
        const data = await api('/api/suppliers');
        if (!abort) setSuppliers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!abort) setErr(e.message);
      } finally {
        if (!abort) setLoadingSup(false);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, []);

  // --- Product search (by name/generic/productCode on backend)
  useEffect(() => {
    let abort = false;
    async function search() {
      if (!debouncedQuery || debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await api(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!abort) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!abort) setResults([]);
      } finally {
        if (!abort) setSearching(false);
      }
    }
    search();
    return () => {
      abort = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const canAdd = useMemo(
    () => Boolean(selectedProduct && qty && Number(qty) > 0),
    [selectedProduct, qty]
  );

  function addItem() {
    if (!canAdd) return;
    const exists = items.find((i) => i.productId === selectedProduct.productId);
    if (exists) {
      setItems((list) =>
        list.map((i) =>
          i.productId === selectedProduct.productId
            ? { ...i, quantity: Number(i.quantity) + Number(qty) }
            : i
        )
      );
    } else {
      setItems((list) => [
        ...list,
        {
          productId: selectedProduct.productId,
          productName: selectedProduct.name,
          productCode: selectedProduct.productCode || "-",
          quantity: Number(qty),
        },
      ]);
    }
    setSelectedProduct(null);
    setQuery("");
    setQty("");
    setResults([]);
  }

  function removeItem(pid) {
    setItems((list) => list.filter((i) => i.productId !== pid));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Block not allowed
    if (!isAllowed) {
      setErr("Only Admin can create a Purchase Order");
      return;
    }

    if (!supplierId) return alert("Please select a supplier");
    if (items.length === 0) return alert("Please add at least one product");

    const supName =
      suppliers.find((s) => String(s.supplierId) === String(supplierId))?.name || "";
    const confirm = window.confirm(
      `Create Purchase Order?\n\nSupplier: ${supName}\nNeeded Date: ${neededDate}\nItems: ${items.length}`
    );
    if (!confirm) return;

    try {
      const payload = {
        supplierId: Number(supplierId),
        neededDate,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      const data = await api('/api/purchase-orders', {
        method: 'POST',
        body: payload,
      });

      navigate(`/purchase-order/${data.id}`, {
        state: { po: data },
        replace: true,
      });
    } catch (e2) {
      setErr(e2.message || "Failed to submit purchase order");
    }
  }

  // --- Open product modal
  function openProductModal() {
    setNewProduct({
      productCode: "",
      name: "",
      categoryId: "",
      description: "",
    });
    setShowProductModal(true);
  }

  // --- Close product modal
  function closeProductModal() {
    setShowProductModal(false);
    setNewProduct({
      productCode: "",
      name: "",
      categoryId: "",
      description: "",
    });
  }

  // --- Create new product
  async function handleCreateProduct(e) {
    e.preventDefault();
    
    if (!newProduct.productCode.trim()) return alert("Product code is required");
    if (!newProduct.name.trim()) return alert("Product name is required");
    if (!newProduct.categoryId) return alert("Category is required");

    setCreatingProduct(true);
    try {
      // Auto-generate barcode if blank
      const barcode = newProduct.barcode?.trim() || String(Math.floor(100000000000 + Math.random() * 900000000000));
      const payload = {
        productCode: newProduct.productCode.trim(),
        name: newProduct.name.trim(),
        categoryId: Number(newProduct.categoryId),
        description: newProduct.description.trim() || null,
        barcode,
      };

      const data = await api('/api/products', {
        method: 'POST',
        body: payload,
      });

      // Close modal
      closeProductModal();

      // Auto-select the newly created product
      setSelectedProduct({
        productId: data.productId,
        name: data.name,
        productCode: data.productCode,
        genericName: data.genericName || "",
      });
      setQuery("");
      setResults([]);

      alert(`Product "${data.name}" created successfully!`);
    } catch (e) {
      alert(`Failed to create product: ${e.message}`);
    } finally {
      setCreatingProduct(false);
    }
  }

  function updateQty(productId, value) {
    const n = Math.max(1, Number(value) || 1); // force ≥ 1
    setItems((list) =>
      list.map((it) => (it.productId === productId ? { ...it, quantity: n } : it))
    );
  }

  async function safeJson(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Create Purchase Order</h2>
        <button
          type="button"
          onClick={() => navigate("/purchase-orders")}
          style={{
            padding: "7px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          View All Purchase Orders
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div>}

      {/* Banner for users who are not admin/manager */}
      {!isAllowed && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            border: "1px solid #f0c36d",
            background: "#fff8e5",
            borderRadius: 6,
            color: "#7a5d00",
          }}
        >
          Only Admin can create a Purchase Order
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", minWidth: 240 }}>
            <label style={{ marginBottom: 6 }}>Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              disabled={loadingSup || !isAllowed}
              style={{ padding: 8 }}
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 220 }}>
            <label style={{ marginBottom: 6 }}>When Stock Needed</label>
            <input
              type="date"
              value={neededDate}
              onChange={(e) => setNeededDate(e.target.value)}
              style={{ padding: 8 }}
              disabled={!isAllowed}
            />
          </div>
        </div>

        <hr />

        {/* Product search + add */}
        <h3 style={{ marginTop: 24 }}>Add Products</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "flex-start",
            marginTop: 8,
          }}
        >
          <div style={{ minWidth: 240, flex: 2, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ display: "block" }}>
                Search by name / generic / code
              </label>
              <button
                type="button"
                onClick={openProductModal}
                disabled={!isAllowed}
                style={{
                  padding: "4px 12px",
                  background: "#1890ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 13,
                  cursor: isAllowed ? "pointer" : "not-allowed",
                  opacity: isAllowed ? 1 : 0.6,
                }}
                title="Create new product"
              >
                + New Product
              </button>
            </div>
            <input
              placeholder="Type at least 2 characters…"
              value={selectedProduct ? selectedProduct.name : query}
              onChange={(e) => {
                setSelectedProduct(null);
                setQuery(e.target.value);
              }}
              style={{ padding: 8, width: "100%" }}
              disabled={!isAllowed}
            />
            {!selectedProduct && results.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  width: "100%",
                  maxHeight: 240,
                  overflowY: "auto",
                  marginTop: 4,
                }}
              >
                {results.map((r) => (
                  <div
                    key={r.productId}
                    onClick={() => {
                      if (!isAllowed) return;
                      setSelectedProduct(r);
                      setResults([]);
                    }}
                    style={{
                      padding: 8,
                      cursor: isAllowed ? "pointer" : "not-allowed",
                      opacity: isAllowed ? 1 : 0.6,
                    }}
                    title={`${r.name} (${r.productCode || "-"})`}
                  >
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {r.genericName || "-"} • Code: {r.productCode || "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searching && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Searching…</div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 120, flex: 1, marginLeft: 12 }}>
            <label style={{ marginBottom: 6 }}>Quantity *</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ padding: 8 }}
              disabled={!isAllowed}
            />
          </div>

          <div style={{ alignSelf: "flex-end", marginLeft: 12 }}>
            <button
              type="button"
              onClick={addItem}
              disabled={!canAdd || !isAllowed}
              style={{
                padding: "8px 16px",
                background: "#43ea7a",
                color: "#000",
                border: "1px solid #0c0",
                borderRadius: 6,
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Items table */}
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
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Product</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Code</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Quantity</th>
              <th style={{ padding: 8, border: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.productId}>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{i.productName}</td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>{i.productCode}</td>
                <td style={{ padding: 8, border: "1px solid #eee", width: 140 }}>
                  <input
                    type="number"
                    min="1"
                    value={i.quantity}
                    onChange={(e) => updateQty(i.productId, e.target.value)}
                    onBlur={(e) => updateQty(i.productId, e.target.value)}
                    style={{ width: "100%", padding: 0 }}
                    disabled={!isAllowed}
                  />
                </td>
                <td style={{ padding: 8, border: "1px solid #eee" }}>
                  <button
                    onClick={() => removeItem(i.productId)}
                    style={{
                      background: "#ff6b6b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 12px",
                    }}
                    disabled={!isAllowed}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12, textAlign: "center" }}>
                  No products added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <button
          type="submit"
          style={{
            marginTop: 24,
            padding: "8px 18px",
            background: "#43ea7a",
            color: "#000",
            border: "1px solid #0c0",
            borderRadius: 6,
          }}
          disabled={!isAllowed}
        >
          Submit Purchase Order
        </button>
      </form>

      {/* Quick Product Creation Modal */}
      {showProductModal && (
        <div
          style={{
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
          }}
          onClick={closeProductModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              width: "90%",
              maxWidth: 500,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 24 }}>Create New Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Product Code *
                </label>
                <input
                  type="text"
                  value={newProduct.productCode}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, productCode: e.target.value })
                  }
                  placeholder="e.g., AA1234"
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  disabled={creatingProduct}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g., Paracetamol 500mg"
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  disabled={creatingProduct}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Category *
                </label>
                <select
                  value={newProduct.categoryId}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, categoryId: e.target.value })
                  }
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  disabled={creatingProduct}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                                  Barcode
                                </label>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <input
                                    type="text"
                                    value={newProduct.barcode}
                                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                                    placeholder="Auto-generated if blank"
                                    style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                                    disabled={creatingProduct}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setNewProduct({ ...newProduct, barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)) })}
                                    style={{ padding: "8px 12px", borderRadius: 4, border: "1px solid #1890ff", background: "#1890ff", color: "#fff" }}
                                    disabled={creatingProduct}
                                  >
                                    Generate Barcode
                                  </button>
                                </div>
                              </div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="Optional product description"
                  rows={3}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
                  disabled={creatingProduct}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={closeProductModal}
                  disabled={creatingProduct}
                  style={{
                    padding: "8px 16px",
                    background: "#f0f0f0",
                    color: "#333",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    cursor: creatingProduct ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  style={{
                    padding: "8px 16px",
                    background: creatingProduct ? "#ccc" : "#1890ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: creatingProduct ? "not-allowed" : "pointer",
                  }}
                >
                  {creatingProduct ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
