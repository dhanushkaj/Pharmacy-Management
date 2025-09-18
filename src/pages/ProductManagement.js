<<<<<<< HEAD
import React, { useContext, useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import { AuthContext } from "../components/AuthContext";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const pageSize = 10;

const BULK_COLUMNS = [
  "name",
  "genericName",
  "categoryId",
  "supplierId",
  "productCode",
  "barcode",
  "costPrice",
  "price",
  "stock",
  "minStock",
  "maxStock",
  "maxDiscount",
  "expiryDate",
  "patientInstructions",
  "binLocation",
];

function alertReport(report, title = "Bulk upload result") {
  const { ok = 0, failed = 0, errors = [] } = report || {};
  const msg =
    `${title}\n` +
    `Imported: ${ok}\n` +
    `Failed: ${failed}` +
    (errors && errors.length ? `\n\nErrors:\n- ${errors.join("\n- ")}` : "");
  alert(msg);
}

/** Convert a worksheet to an array of objects keyed by header row. */
function sheetToObjects(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows;
}

/** Coerce/clean a row from Excel into your API payload shape. */
function normalizeRow(r) {
  // accept different header letter-casing, spaces, underscores
  const pick = (key) => {
    const foundKey = Object.keys(r).find(
      (k) =>
        k &&
        k.toString().replace(/\s|_/g, "").toLowerCase() === key.toLowerCase()
    );
    return foundKey ? r[foundKey] : "";
  };

  const obj = {
    name: String(pick("name")).trim(),
    genericName: String(pick("genericName")).trim() || null,
    categoryId: pick("categoryId") === "" ? null : Number(pick("categoryId")),
    supplierId: pick("supplierId") === "" ? null : Number(pick("supplierId")),
    productCode: String(pick("productCode")).trim().toUpperCase() || null,
    barcode: String(pick("barcode")).trim() || null,
    costPrice: Number(pick("costPrice")),
    price: Number(pick("price")),
    stock: pick("stock") === "" ? 0 : Number(pick("stock")),
    minStock: pick("minStock") === "" ? null : Number(pick("minStock")),
    maxStock: pick("maxStock") === "" ? null : Number(pick("maxStock")),
    maxDiscount:
      pick("maxDiscount") === "" ? null : Number(pick("maxDiscount")),
    expiryDate: String(pick("expiryDate")).trim() || null,
    patientInstructions: String(pick("patientInstructions")).trim() || null,
    binLocation: String(pick("binLocation")).trim() || null,
  };
  return obj;
}

/** Validate a normalized row; return null if OK, or an error string */
function validateRow(obj, idx) {
  if (!obj.name) return `Row ${idx}: "name" is required`;
  if (Number.isNaN(obj.costPrice))
    return `Row ${idx}: "costPrice" must be a number`;
  if (Number.isNaN(obj.price)) return `Row ${idx}: "price" must be a number`;
  if (obj.productCode && !PRODUCT_CODE_RE.test(obj.productCode))
    return `Row ${idx}: "productCode" must match AA9999`;
  return null;
}

/** Download an Excel template the user can fill. */
function downloadTemplate() {
  const data = [
    BULK_COLUMNS, // header
    // sample line (can be removed by user)
    [
      "Paracetamol",
      "Acetaminophen",
      "1",
      "2",
      "PA1234",
      "1234567890123",
      "12.50",
      "18.00",
      "100",
      "10",
      "300",
      "5",
      "2026-12-31",
      "After meals",
      "A1-03",
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  const blob = new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })], {
    type: "application/octet-stream",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product_bulk_template.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// Regex for exactly 2 letters + 4 digits
const PRODUCT_CODE_RE = /^[A-Za-z]{2}\d{4}$/;

// Ensure product code stays uppercase as user types
function normalizeProductCode(value) {
  return (value || "").toUpperCase();
}

// 2 letters + 4 digits (e.g., AB1234)
function genCode() {
  const letters =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
  return letters + digits;
}

function genBarcode() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

// ✅ Helper to normalize roles (avoid "map is not a function" error)
function getRolesArray(ctxRoles) {
  // prefer roles from AuthContext if it's already an array
  if (Array.isArray(ctxRoles) && ctxRoles.length) return ctxRoles;

  // check localStorage
  const rawRoles = localStorage.getItem("roles");
  const rawRole = localStorage.getItem("role");

  if (rawRoles) {
    try {
      const parsed = JSON.parse(rawRoles);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return [parsed];
    } catch {
      if (typeof rawRoles === "string") return [rawRoles];
    }
  }

  if (rawRole && typeof rawRole === "string") return [rawRole];

  return [];
}

function tryParseError(text, fallback) {
  try {
    const j = JSON.parse(text);
    return j?.error || j?.message || fallback || "Request failed";
  } catch {
    return text || fallback || "Request failed";
  }
}

const emptyForm = {
  productId: null,
  categoryId: "",
  supplierId: "",
  name: "",
  genericName: "",
  stock: "",
  price: "",
  costPrice: "",
  expiryDate: "",
  productCode: "",
  barcode: "",
  minStock: "",
  maxStock: "",
  maxDiscount: "",
  patientInstructions: "",
  binLocation: "",
};

const ProductManagement = () => {
  // 🔑 get token + roles from AuthContext
  const { token: ctxToken, roles: ctxRoles } = useContext(AuthContext);

  // ✅ normalize token
  const token = useMemo(
    () => ctxToken || localStorage.getItem("token") || "",
    [ctxToken]
  );

  // ✅ normalize roles into an array
  const rolesArr = useMemo(() => getRolesArray(ctxRoles), [ctxRoles]);

  // ✅ compute admin flag safely
  const isAdmin = useMemo(
    () => rolesArr.some((r) => String(r).toLowerCase() === "admin"),
    [rolesArr]
  );

  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search + paging
  const [search, setSearch] = useState({
    category: "",
    code: "",
    name: "",
    generic: "",
  });
  const [page, setPage] = useState(1);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkReport, setBulkReport] = useState({
    ok: 0,
    failed: 0,
    errors: [],
  });

  // Load categories + suppliers
  useEffect(() => {
    let aborted = false;
    async function loadRefs() {
      try {
        const [catRes, supRes] = await Promise.all([
          fetch(`${API_BASE}/api/categories`, { headers: { ...authHeaders } }),
          fetch(`${API_BASE}/api/suppliers`, { headers: { ...authHeaders } }),
        ]);
        const [catData, supData] = await Promise.all([
          catRes.json(),
          supRes.json(),
        ]);
        if (!catRes.ok)
          throw new Error(catData?.message || "Failed to load categories");
        if (!supRes.ok)
          throw new Error(supData?.message || "Failed to load suppliers");
        if (!aborted) {
          setCategories(Array.isArray(catData) ? catData : []);
          setSuppliers(Array.isArray(supData) ? supData : []);
        }
      } catch (e) {
        if (!aborted) setError(e.message);
      }
    }
    loadRefs();
    return () => {
      aborted = true;
    };
  }, [authHeaders]);

  // Load products
  useEffect(() => {
    let aborted = false;
    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`, {
          headers: { ...authHeaders },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.message || "Failed to load products");
        if (!aborted) setList(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!aborted) setError(e.message);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      aborted = true;
    };
  }, [authHeaders]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (files && files[0]) {
      setForm((f) => ({ ...f, [name]: URL.createObjectURL(files[0]) }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };

  const autoCode = () => setForm((f) => ({ ...f, productCode: genCode() }));
  const autoBarcode = () => setForm((f) => ({ ...f, barcode: genBarcode() }));
  const reset = () => setForm(emptyForm);

  async function createOrUpdate(payload, id) {
    const url = id
      ? `${API_BASE}/api/products/${id}`
      : `${API_BASE}/api/products`;
    const method = id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(tryParseError(text, res.statusText));
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function reloadProducts() {
    const res = await fetch(`${API_BASE}/api/products`, {
      headers: { ...authHeaders },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load products");
    setList(Array.isArray(data) ? data : []);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.price || !form.costPrice) {
      setError("Name, Cost Price and Sell Price are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim(),
        genericName: form.genericName?.trim() || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        productCode: form.productCode?.trim() || null,
        barcode: form.barcode?.trim() || null,
        costPrice: Number(form.costPrice),
        price: Number(form.price),
        stock: form.stock === "" ? 0 : Number(form.stock),
        minStock: form.minStock === "" ? null : Number(form.minStock),
        maxStock: form.maxStock === "" ? null : Number(form.maxStock),
        maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
        expiryDate: form.expiryDate || null,
        patientInstructions: form.patientInstructions || null,
        binLocation: form.binLocation || null,
      };

      await createOrUpdate(payload, form.productId);
      await reloadProducts();
      reset();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (p) => {
    setForm({
      productId: p.productId,
      categoryId: p.categoryId || "",
      supplierId: p.supplierId || "",
      name: p.name || "",
      genericName: p.genericName || "",
      stock: p.stock ?? "",
      price: p.price ?? "",
      costPrice: p.costPrice ?? "",
      expiryDate: p.expiryDate || "",
      productCode: p.productCode || "",
      barcode: p.barcode || "",
      minStock: p.minStock ?? "",
      maxStock: p.maxStock ?? "",
      maxDiscount: p.maxDiscount ?? "",
      patientInstructions: p.patientInstructions || "",
      binLocation: p.binLocation || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm(`Delete product #${id}?`)) return;
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(tryParseError(text, res.statusText));
      setList((prev) => prev.filter((x) => x.productId !== id));
      if (form.productId === id) reset();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const filtered = list.filter(
    (p) =>
      (!search.category ||
        (p.categoryName || "")
          .toLowerCase()
          .includes(search.category.toLowerCase())) &&
      (!search.code ||
        (p.productCode || "")
          .toLowerCase()
          .includes(search.code.toLowerCase())) &&
      (!search.name ||
        (p.name || "").toLowerCase().includes(search.name.toLowerCase())) &&
      (!search.generic ||
        (p.genericName || "")
          .toLowerCase()
          .includes(search.generic.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (pageSafe - 1) * pageSize,
    pageSafe * pageSize
  );

  async function handleBulkFile(file) {
    setBulkReport({ ok: 0, failed: 0, errors: [] });
    if (!file) return;

    setBulkBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const rows = sheetToObjects(wb);

      if (!rows.length) {
        const rep = {
          ok: 0,
          failed: 0,
          errors: ["No rows found in the first sheet"],
        };
        setBulkReport(rep);
        alertReport(rep, "Bulk upload");
        return;
      }

      // Normalize + validate
      const payloads = [];
      const errors = [];
      rows.forEach((r, i) => {
        const idx = i + 2; // +2 for header row
        const obj = normalizeRow(r);
        const err = validateRow(obj, idx);
        if (err) errors.push(err);
        else payloads.push(obj);
      });

      if (errors.length) {
        const rep = { ok: 0, failed: errors.length, errors };
        setBulkReport(rep);
        alertReport(rep, "Bulk upload (validation errors)");
        return;
      }

      // Try server bulk endpoint
      let ok = 0,
        failed = 0,
        failMsgs = [];
      const bulkUrl = `${API_BASE}/api/products/bulk`;
      const singleUrl = `${API_BASE}/api/products`;

      try {
        const res = await fetch(bulkUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payloads),
        });

        const text = await res.text();

        if (!res.ok) {
          // bulk endpoint responded with an error → fall back to per-row
          throw new Error(tryParseError(text, res.statusText));
        }

        // Expecting { ok, failed, errors[] } from backend
        let serverReport;
        try {
          serverReport = JSON.parse(text);
        } catch {
          serverReport = {
            ok: 0,
            failed: 0,
            errors: ["Invalid server response"],
          };
        }

        setBulkReport(serverReport);
        alertReport(serverReport, "Bulk upload (server report)");
      } catch (bulkErr) {
        // Fall back: create one by one
        for (let i = 0; i < payloads.length; i++) {
          try {
            const r = await fetch(singleUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders },
              body: JSON.stringify(payloads[i]),
            });
            const txt = await r.text();
            if (!r.ok) throw new Error(tryParseError(txt, r.statusText));
            ok++;
          } catch (err) {
            failed++;
            failMsgs.push(`Row ${i + 2}: ${err.message}`);
          }
        }

        const rep = { ok, failed, errors: failMsgs };
        setBulkReport(rep);
        alertReport(rep, "Bulk upload (fallback per-row)");
      }

      await reloadProducts();
    } catch (err) {
      const rep = { ok: 0, failed: 1, errors: [err.message] };
      setBulkReport(rep);
      alertReport(rep, "Bulk upload (unexpected error)");
    } finally {
      setBulkBusy(false);
      await reloadProducts();
    }
  }
=======
import React from 'react';


import { useState } from 'react';
import logo from '../assets/logo.png';

const categories = ['Pain Relief', 'Antibiotics', 'Allergy', 'Vitamins'];
const suppliers = ['HealthCorp', 'MediSupply'];

function generateUniqueCode() {
  return 'P' + Math.floor(Math.random() * 1000000);
}

function generateBarcode() {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

const ProductManagement = () => {
  const [form, setForm] = useState({
    category: '',
    name: '',
    generic: '',
    supplier: '',
    stock: '',
    price: '',
    expire: '',
    code: '',
    barcode: '',
    image: '',
  });
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState({ category: '', code: '', name: '', generic: '' });
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const handleChange = e => {
    const { name, value, files } = e.target;
    setForm(f => ({ ...f, [name]: files ? URL.createObjectURL(files[0]) : value }));
  };

  const handleAutoCode = () => setForm(f => ({ ...f, code: generateUniqueCode() }));
  const handleAutoBarcode = () => setForm(f => ({ ...f, barcode: generateBarcode() }));

  const handleAdd = e => {
    e.preventDefault();
    if (!form.category || !form.name || !form.generic || !form.supplier || !form.stock || !form.price || !form.expire) return;
    setProducts([
      ...products,
      { ...form, id: Date.now() }
    ]);
    setForm({ category: '', name: '', generic: '', supplier: '', stock: '', price: '', expire: '', code: '', barcode: '', image: '' });
  };

  const filtered = products.filter(p =>
    (!search.category || p.category === search.category) &&
    (!search.code || p.code.includes(search.code)) &&
    (!search.name || p.name.toLowerCase().includes(search.name.toLowerCase())) &&
    (!search.generic || p.generic.toLowerCase().includes(search.generic.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
>>>>>>> parent of 88f596c2 (Product CRUD completed)

  return (
    <div style={{ padding: 24 }}>
      <h2>Product Management</h2>
<<<<<<< HEAD

      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
          marginBottom: 24,
          background: "#f5f5f5",
          padding: 20,
          borderRadius: 8,
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 180 }}
        >
          <label>Category</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            style={{ padding: 8 }}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 220 }}
        >
=======
      {/* Add Product Form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, background: '#f5f5f5', padding: 20, borderRadius: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange} required style={{ padding: 8 }}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
>>>>>>> parent of 88f596c2 (Product CRUD completed)
          <label>Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ padding: 8 }}
          />
        </div>
<<<<<<< HEAD

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 220 }}
        >
          <label>Generic Name</label>
          <input
            name="genericName"
            value={form.genericName}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 180 }}
        >
          <label>Supplier</label>
          <select
            name="supplierId"
            value={form.supplierId}
            onChange={handleChange}
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

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
        >
          <label>Stock</label>
          <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 140 }}
        >
          <label>Cost Price</label>
          <input
            type="number"
            step="0.01"
            name="costPrice"
            value={form.costPrice}
            onChange={handleChange}
            required
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 140 }}
        >
          <label>Sell Price</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 170 }}
        >
          <label>Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={form.expiryDate}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 200 }}
        >
          <label>Product Code</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="productCode"
              value={form.productCode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  productCode: normalizeProductCode(e.target.value),
                }))
              }
              placeholder="Auto-generate if empty"
              pattern="[A-Za-z]{2}\d{4}" // HTML5 validation
              title="Use 2 letters followed by 4 digits, e.g., AB1234"
              style={{ padding: 8, flex: 1 }}
              required
            />
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, productCode: genCode() }))}
            >
              Auto
            </button>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 200 }}
        >
          <label>Barcode</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="barcode"
              value={form.barcode}
              onChange={handleChange}
              placeholder="Auto-generate if empty"
              style={{ padding: 8, flex: 1 }}
            />
            <button type="button" onClick={autoBarcode}>
              Auto
            </button>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
        >
          <label>Min Stock</label>
          <input
            type="number"
            name="minStock"
            value={form.minStock}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 120 }}
        >
          <label>Max Stock</label>
          <input
            type="number"
            name="maxStock"
            value={form.maxStock}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 150 }}
        >
          <label>Max Discount %</label>
          <input
            type="number"
            step="0.01"
            name="maxDiscount"
            value={form.maxDiscount}
            onChange={handleChange}
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 260 }}
        >
          <label>Patient Instructions</label>
          <input
            name="patientInstructions"
            value={form.patientInstructions}
            onChange={handleChange}
            placeholder="e.g., after meals"
            style={{ padding: 8 }}
          />
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", minWidth: 160 }}
        >
          <label>Bin Location</label>
          <input
            name="binLocation"
            value={form.binLocation}
            onChange={handleChange}
            placeholder="A1-03"
            style={{ padding: 8 }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
          <button
            type="submit"
            disabled={saving || !isAdmin}
            title={!isAdmin ? "Only admins can create/update" : undefined}
            style={{
              marginTop: 24,
              padding: "7px 18px",
              fontSize: 15,
              background: "#43ea7a",
              color: "#000",
              border: "1px solid #0c0",
              borderRadius: 4,
            }}
          >
            {form.productId
              ? saving
                ? "Updating…"
                : "Update Product"
              : saving
              ? "Adding…"
              : "Add Product"}
          </button>
          {form.productId && (
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              style={{
                marginTop: 24,
                padding: "7px 18px",
                fontSize: 15,
                background: "#eee",
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            >
              Cancel
            </button>
          )}
=======
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Generic Name</label>
          <input name="generic" value={form.generic} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Supplier</label>
          <select name="supplier" value={form.supplier} onChange={handleChange} required style={{ padding: 8 }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
          <label>Stock</label>
          <input name="stock" type="number" value={form.stock} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
          <label>Sell Price</label>
          <input name="price" type="number" value={form.price} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Expiry Date</label>
          <input name="expire" type="date" value={form.expire} onChange={handleChange} required style={{ padding: 8 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Product Code</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input name="code" value={form.code} onChange={handleChange} style={{ padding: 8, flex: 1 }} placeholder="Auto-generate if empty" />
            <button type="button" onClick={handleAutoCode}>Auto</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Barcode</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input name="barcode" value={form.barcode} onChange={handleChange} style={{ padding: 8, flex: 1 }} placeholder="Auto-generate if empty" />
            <button type="button" onClick={handleAutoBarcode}>Auto</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <label>Product Image</label>
          <input name="image" type="file" accept="image/*" onChange={handleChange} style={{ padding: 8 }} />
>>>>>>> parent of 88f596c2 (Product CRUD completed)
        </div>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Add Product</button>
      </form>

<<<<<<< HEAD
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {loading && <div>Loading…</div>}

      {/* Bulk upload */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          margin: "12px 0 18px",
          border: "1px dashed #bbb",
          borderRadius: 8,
          background: "#fcfcfc",
        }}
      >
        <strong>Bulk upload products:</strong>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={bulkBusy || !isAdmin}
          title={!isAdmin ? "Only admins can upload" : undefined}
          onChange={(e) => handleBulkFile(e.target.files?.[0])}
        />
        <button type="button" onClick={downloadTemplate}>
          Download template
        </button>
        {bulkBusy && <span>Uploading…</span>}
      </div>

      {/* Bulk report */}
      {(bulkReport.ok || bulkReport.failed || bulkReport.errors.length > 0) && (
        <div style={{ marginBottom: 12 }}>
          <div>
            Imported: <b>{bulkReport.ok}</b> • Failed:{" "}
            <b>{bulkReport.failed}</b>
          </div>
          {bulkReport.errors.length > 0 && (
            <ul style={{ marginTop: 6, color: "crimson" }}>
              {bulkReport.errors.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {bulkReport.errors.length > 10 && (
                <li>…and {bulkReport.errors.length - 10} more</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <input
          placeholder="Search by Category"
          value={search.category}
          onChange={(e) =>
            setSearch((s) => ({ ...s, category: e.target.value }))
          }
          style={{ padding: 8, minWidth: 160 }}
        />
        <input
          placeholder="Search by Product Code"
          value={search.code}
          onChange={(e) => setSearch((s) => ({ ...s, code: e.target.value }))}
          style={{ padding: 8, minWidth: 160 }}
        />
        <input
          placeholder="Search by Name"
          value={search.name}
          onChange={(e) => setSearch((s) => ({ ...s, name: e.target.value }))}
          style={{ padding: 8, minWidth: 160 }}
        />
        <input
          placeholder="Search by Generic Name"
          value={search.generic}
          onChange={(e) =>
            setSearch((s) => ({ ...s, generic: e.target.value }))
          }
          style={{ padding: 8, minWidth: 180 }}
        />
      </div>

      
      {/* List */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fafafa",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>Product Name</th>
            <th>Generic Name</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Stock</th>
            <th>Cost</th>
            <th>Sell</th>
            <th>Expiry</th>
            <th>Product Code</th>
            <th>Barcode</th>
            <th>Min</th>
            <th>Max</th>
            <th>Max Disc %</th>
            <th>Bin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered
            .slice((pageSafe - 1) * pageSize, pageSafe * pageSize)
            .map((p) => (
              <tr key={p.productId}>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.name}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.genericName || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.categoryName || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.supplierName || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.stock ?? 0}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.costPrice}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.price}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.expiryDate || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.productCode || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.barcode || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.minStock ?? "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.maxStock ?? "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.maxDiscount ?? "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  {p.binLocation || "-"}
                </td>
                <td style={{ padding: 6, border: "1px solid #ddd" }}>
                  <button
                    onClick={() => onEdit(p)}
                    style={{
                      background: "#ffe066",
                      color: "#333",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.productId)}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Only admins can delete" : undefined}
                    style={{
                      marginLeft: 8,
                      background: "#ff6b6b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "6px 12px",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={16} style={{ padding: 10, textAlign: "center" }}>
                No products
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageSafe === 1}
        >
          Prev
        </button>
        <span>
          Page {pageSafe} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageSafe === totalPages}
        >
          Next
        </button>
=======
      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input placeholder="Search by Category" value={search.category} onChange={e => setSearch(s => ({ ...s, category: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Product Code" value={search.code} onChange={e => setSearch(s => ({ ...s, code: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Name" value={search.name} onChange={e => setSearch(s => ({ ...s, name: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
        <input placeholder="Search by Generic Name" value={search.generic} onChange={e => setSearch(s => ({ ...s, generic: e.target.value }))} style={{ padding: 8, minWidth: 140 }} />
      </div>

      {/* Product List with Pagination */}
      <div style={{ marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fafafa' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Image</th>
              <th>Product Name</th>
              <th>Generic Name</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Stock</th>
              <th>Sell Price</th>
              <th>Expiry Date</th>
              <th>Product Code</th>
              <th>Barcode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id}>
                <td><img src={p.image || logo} alt="Product" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /></td>
                <td>{p.name}</td>
                <td>{p.generic}</td>
                <td>{p.category}</td>
                <td>{p.supplier}</td>
                <td>{p.stock}</td>
                <td>{p.price}</td>
                <td>{p.expire}</td>
                <td>{p.code}</td>
                <td>{p.barcode}</td>
                <td>
                  <button style={{ background: '#ffe066', color: '#333', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Edit</button>
                  <button style={{ marginLeft: 8, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Pagination Controls */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span>Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>Next</button>
        </div>
>>>>>>> parent of 88f596c2 (Product CRUD completed)
      </div>
    </div>
  );
};

export default ProductManagement;