import React, { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../components/AuthContext";
import * as XLSX from "xlsx";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const pageSize = 10;

const BULK_COLUMNS = [
  "name",
  "genericName",
  "categoryName",
  "supplierName",
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

// Regex for exactly 2 letters + 4 digits (e.g., AB1234)
const PRODUCT_CODE_RE = /^[A-Za-z]{2}\d{4}$/;

function sheetToObjects(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// Helper function to parse Excel dates
function parseExcelDate(value) {
  if (!value) return null;

  // If already a valid date string (YYYY-MM-DD), return as-is
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  // If it's a number (Excel date serial), convert it
  if (typeof value === "number" || !isNaN(Number(value))) {
    const excelEpoch = new Date(1899, 11, 30); // Excel's epoch
    const days = Number(value);
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Try to parse as Date object
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return null;
}

// 1. UPDATE normalizeRow function - make fields optional for updates
function normalizeRow(r) {
  const pick = (key) => {
    const foundKey = Object.keys(r).find(
      (k) =>
        k &&
        k.toString().replace(/\s|_/g, "").toLowerCase() === key.toLowerCase()
    );
    return foundKey ? r[foundKey] : "";
  };

  const obj = {};

  // Mandatory fields for CSV upload
  const name = String(pick("name")).trim();
  if (name) obj.name = name;

  const genericName = String(pick("genericName")).trim();
  if (genericName) obj.genericName = genericName;

  const categoryName = String(pick("categoryName")).trim();
  if (categoryName) obj.categoryName = categoryName;

  const supplierName = String(pick("supplierName")).trim();
  if (supplierName) obj.supplierName = supplierName;

  // Optional numeric fields - only include if not empty
  const costPrice = pick("costPrice");
  if (costPrice !== "" && costPrice !== null && costPrice !== undefined) {
    obj.costPrice = Number(costPrice);
  }

  const price = pick("price");
  if (price !== "" && price !== null && price !== undefined) {
    obj.price = Number(price);
  }

  const stock = pick("stock");
  if (stock !== "" && stock !== null && stock !== undefined) {
    obj.stock = Number(stock);
  }

  const minStock = pick("minStock");
  if (minStock !== "" && minStock !== null && minStock !== undefined) {
    obj.minStock = Number(minStock);
  }

  const maxStock = pick("maxStock");
  if (maxStock !== "" && maxStock !== null && maxStock !== undefined) {
    obj.maxStock = Number(maxStock);
  }

  const maxDiscount = pick("maxDiscount");
  if (maxDiscount !== "" && maxDiscount !== null && maxDiscount !== undefined) {
    obj.maxDiscount = Number(maxDiscount);
  }

  const expiryDate = pick("expiryDate");
  if (expiryDate) obj.expiryDate = parseExcelDate(expiryDate);

  const patientInstructions = String(pick("patientInstructions")).trim();
  if (patientInstructions) obj.patientInstructions = patientInstructions;

  const binLocation = String(pick("binLocation")).trim();
  if (binLocation) obj.binLocation = binLocation;

  return obj;
}

// 2. UPDATE validateRow function - simpler validation
function validateRow(obj, idx) {
  // Validate mandatory fields for CSV upload
  if (!obj.name || !obj.name.trim()) {
    return `Row ${idx}: "name" is required`;
  }

  if (!obj.genericName || !obj.genericName.trim()) {
    return `Row ${idx}: "genericName" is required`;
  }

  if (!obj.categoryName || !obj.categoryName.trim()) {
    return `Row ${idx}: "categoryName" is required`;
  }

  if (!obj.supplierName || !obj.supplierName.trim()) {
    return `Row ${idx}: "supplierName" is required`;
  }

  // Validate numeric fields if provided
  if (obj.price !== undefined && obj.price !== "" && (isNaN(obj.price) || obj.price < 0)) {
    return `Row ${idx}: "price" must be a valid number >= 0`;
  }

  if (
    obj.costPrice !== undefined && 
    obj.costPrice !== "" && 
    (isNaN(obj.costPrice) || obj.costPrice < 0)
  ) {
    return `Row ${idx}: "costPrice" must be a valid number >= 0`;
  }

  if (obj.stock !== undefined && obj.stock !== "" && (isNaN(obj.stock) || obj.stock < 0)) {
    return `Row ${idx}: "stock" must be a valid number >= 0`;
  }

  if (obj.minStock !== undefined && obj.minStock !== "" && (isNaN(obj.minStock) || obj.minStock < 0)) {
    return `Row ${idx}: "minStock" must be a valid number >= 0`;
  }

  if (obj.maxStock !== undefined && obj.maxStock !== "" && (isNaN(obj.maxStock) || obj.maxStock < 0)) {
    return `Row ${idx}: "maxStock" must be a valid number >= 0`;
  }

  if (obj.maxDiscount !== undefined && obj.maxDiscount !== "" && (isNaN(obj.maxDiscount) || obj.maxDiscount < 0)) {
    return `Row ${idx}: "maxDiscount" must be a valid number >= 0`;
  }

  return null;
}


function downloadTemplate() {
  const data = [
    BULK_COLUMNS,
    [
      "Paracetamol 500mg",       // name (mandatory)
      "Acetaminophen",           // genericName (mandatory)
      "Pain Relief",             // categoryName (mandatory)
      "ABC Pharma",              // supplierName (mandatory)
      "10.50",                   // costPrice (optional)
      "15.00",                   // price (optional)
      "100",                     // stock (optional)
      "20",                      // minStock (optional)
      "500",                     // maxStock (optional)
      "10",                      // maxDiscount (optional)
      "2026-12-31",              // expiryDate (optional, YYYY-MM-DD)
      "Take after meals",        // patientInstructions (optional)
      "A1-B2",                   // binLocation (optional)
    ],
    [
      "Amoxicillin 250mg",
      "Amoxicillin",
      "Antibiotics",
      "XYZ Medical",
      "25.00",
      "35.00",
      "50",
      "10",
      "200",
      "5",
      "2027-06-30",
      "Complete the full course",
      "C3-D4",
    ],
    [
      "Ibuprofen 400mg",
      "Ibuprofen",
      "Pain Relief",
      "ABC Pharma",
      "8.00",
      "12.00",
      "75",
      "15",
      "300",
      "15",
      "2026-09-15",
      "Take with food",
      "A1-B3",
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

function exportToCSV(products) {
  if (!products || products.length === 0) {
    alert('No products to export');
    return;
  }

  // CSV header
  const headers = [
    'Product Code',
    'Name',
    'Generic Name',
    'Category',
    'Supplier',
    'Cost Price',
    'Price',
    'Stock',
    'Min Stock',
    'Max Stock',
    'Max Discount',
    'Expiry Date',
    'Barcode',
    'Bin Location',
    'Patient Instructions'
  ];

  // CSV rows
  const rows = products.map(p => [
    p.productCode || '',
    p.name || '',
    p.genericName || '',
    p.categoryName || '',
    p.supplierName || '',
    p.costPrice || '',
    p.price || '',
    p.stock || '',
    p.minStock || '',
    p.maxStock || '',
    p.maxDiscount || '',
    p.expiryDate || '',
    p.barcode || '',
    p.binLocation || '',
    (p.patientInstructions || '').replace(/[\r\n]+/g, ' ') // Remove line breaks
  ]);

  // Escape CSV values
  const escapeCSV = (value) => {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// UI helpers
function normalizeProductCode(value) {
  return (value || "").toUpperCase();
}
function genCode() {
  const letters =
    String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
    String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return letters + digits;
}
function genBarcode() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

function getRolesArray(ctxRoles) {
  if (Array.isArray(ctxRoles) && ctxRoles.length) return ctxRoles;
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

// 🔔 alert helper for bulk results
function alertReport(report, title = "Bulk upload") {
  const { ok = 0, failed = 0, errors = [] } = report || {};
  const msg =
    `${title}\n` +
    `Imported: ${ok}\n` +
    `Failed: ${failed}` +
    (errors.length ? `\n\nErrors:\n- ${errors.join("\n- ")}` : "");
  alert(msg);
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
  const { token: ctxToken, roles: ctxRoles } = useContext(AuthContext);
  const token = useMemo(
    () => ctxToken || localStorage.getItem("token") || "",
    [ctxToken]
  );
  const rolesArr = useMemo(() => getRolesArray(ctxRoles), [ctxRoles]);
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

  // Inventory modal state
  const [inventoryOpenFor, setInventoryOpenFor] = useState(null);
  const [inventoryProduct, setInventoryProduct] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");

  // Inventory form & saving
  const [inventoryForm, setInventoryForm] = useState({
    price: "",
    costPrice: "",
    stock: "",
    batchNo: "",
  });
  const [inventorySaving, setInventorySaving] = useState(false);

  // Inventory edit state: track which inventory id is being edited and a local draft
  const [editingInventoryId, setEditingInventoryId] = useState(null);
  const [editingInventoryDraft, setEditingInventoryDraft] = useState({
    price: "",
    costPrice: "",
    stock: "",
    batchNo: "",
  });
  const [inventoryActionError, setInventoryActionError] = useState("");

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
    const url = id ? `/api/products/${id}` : `/api/products`;
    const res = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("Response text:", text);
    if (!res.ok) {
      try {
        const json = JSON.parse(text);
        const details =
          json.details && Array.isArray(json.details)
            ? json.details.join("\n")
            : json.error || text;
        throw new Error(details);
      } catch (err) {
        throw new Error(text || res.statusText);
      }
    }
    return JSON.parse(text);
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
    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim(),
        genericName: form.genericName?.trim() || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        productCode: form.productCode?.trim() || null,
        barcode: form.barcode?.trim() || null,
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
      if (e2 && Array.isArray(e2.details) && e2.details.length) {
        setFormErrors([]);
        setError(String(e2.details[0]));
      } else if (e2 && e2.details) {
        setError(String(e2.details));
      } else {
        setError(e2.message || String(e2));
      }
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
      stock: p.totalStock ?? "",
      price: p.lastPrice ?? "",
      costPrice: p.lastCostPrice ?? "",
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
      if (!res.ok) throw new Error(tryParseError(txt, res.statusText));
      setList((prev) => prev.filter((x) => x.productId !== id));
      if (form.productId === id) reset();
    } catch (e2) {
      setError(e2.message);
    }
  };
  // ---------- Inventory APIs: fetch, create, update, delete ----------

  // Fetch inventory buckets for a product (optional endpoint)
  async function fetchInventory(productId) {
    setInventoryLoading(true);
    setInventoryError("");
    setInventoryItems([]);
    try {
      const res = await fetch(
        `${API_BASE}/api/products/${productId}/inventory`,
        {
          headers: { ...authHeaders },
        }
      );
      const txt = await res.text();
      if (!res.ok) throw new Error(tryParseError(txt, res.statusText));
      const data = JSON.parse(txt);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setInventoryError(err.message || "Failed to load inventory");
    } finally {
      setInventoryLoading(false);
    }
  }

  // Add a new inventory bucket (or increment existing bucket if same price)
  async function addInventoryBucket(productId) {
    setInventorySaving(true);
    setInventoryError("");
    try {
      // validation
      if (!inventoryForm.price || isNaN(Number(inventoryForm.price))) {
        throw new Error("Price is required and must be a number");
      }
      if (inventoryForm.stock !== "" && isNaN(Number(inventoryForm.stock))) {
        throw new Error("Stock must be a number");
      }
      const payload = {
        price: Number(inventoryForm.price),
        costPrice:
          inventoryForm.costPrice === ""
            ? null
            : Number(inventoryForm.costPrice),
        stock: inventoryForm.stock === "" ? 0 : Number(inventoryForm.stock),
        batchNo: inventoryForm.batchNo || null,
      };

      const res = await fetch(
        `${API_BASE}/api/products/${productId}/inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        }
      );

      const txt = await res.text();
      if (!res.ok) throw new Error(tryParseError(txt, res.statusText));

      // refresh inventory and products to update totalStock/lastPrice
      await fetchInventory(productId);
      await reloadProducts();

      // clear form
      setInventoryForm({ price: "", costPrice: "", stock: "", batchNo: "" });
    } catch (err) {
      setInventoryError(err.message || "Failed to add inventory bucket");
      throw err;
    } finally {
      setInventorySaving(false);
    }
  }

  // update inventory bucket (PUT)
  async function updateInventoryBucket(productId, inventoryId, draft) {
    setInventoryActionError("");
    try {
      // basic validation
      if (!draft.price || isNaN(Number(draft.price)))
        throw new Error("Price required and must be a number");
      if (draft.stock !== "" && isNaN(Number(draft.stock)))
        throw new Error("Stock must be a number");
      const payload = {
        price: Number(draft.price),
        costPrice: draft.costPrice === "" ? null : Number(draft.costPrice),
        stock: draft.stock === "" ? 0 : Number(draft.stock),
        batchNo: draft.batchNo || null,
      };
      const res = await fetch(
        `${API_BASE}/api/products/${productId}/inventory/${inventoryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payload),
        }
      );
      const txt = await res.text();
      if (!res.ok) throw new Error(tryParseError(txt, res.statusText));
      // refresh
      await fetchInventory(productId);
      await reloadProducts();
      setEditingInventoryId(null);
      setEditingInventoryDraft({
        price: "",
        costPrice: "",
        stock: "",
        batchNo: "",
      });
    } catch (err) {
      setInventoryActionError(err.message || "Failed to update inventory");
      throw err;
    }
  }

  // delete inventory bucket
  async function deleteInventoryBucket(productId, inventoryId) {
    if (
      !window.confirm(
        "Delete this inventory bucket? This action cannot be undone."
      )
    )
      return;
    setInventoryActionError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/products/${productId}/inventory/${inventoryId}`,
        {
          method: "DELETE",
          headers: { ...authHeaders },
        }
      );
      const txt = await res.text();
      if (!res.ok) throw new Error(tryParseError(txt, res.statusText));
      await fetchInventory(productId);
      await reloadProducts();
    } catch (err) {
      setInventoryActionError(err.message || "Failed to delete inventory");
    }
  }

  // Open inventory modal and prefill form with last price/cost
  function openInventoryModal(productId, product = null) {
    setInventoryOpenFor(productId);
    setInventoryProduct(product);
    setInventoryItems([]);
    setInventoryError("");
    // prefill form with product's last known prices if provided
    if (product) {
      setInventoryForm({
        price: product.lastPrice ?? "",
        costPrice: product.lastCostPrice ?? "",
        stock: "",
        batchNo: "",
      });
    } else {
      setInventoryForm({ price: "", costPrice: "", stock: "", batchNo: "" });
    }
    fetchInventory(productId);
  }

  function closeInventoryModal() {
    setInventoryOpenFor(null);
    setInventoryProduct(null);
    setInventoryItems([]);
    setInventoryError("");
    setInventoryForm({ price: "", costPrice: "", stock: "", batchNo: "" });
  }

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

      const payloads = [];
      const errors = [];

      rows.forEach((r, i) => {
        const idx = i + 2; // +2 because row 1 is header
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

      // Call the bulk CSV endpoint
      const bulkUrl = `${API_BASE}/api/products/bulk-csv`;

      try {
        const res = await fetch(bulkUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify(payloads),
        });

        const txt = await res.text();

        if (!res.ok) {
          throw new Error(tryParseError(txt, res.statusText));
        }

        // Parse server response
        let serverReport;
        try {
          serverReport = JSON.parse(txt);
        } catch {
          serverReport = {
            ok: payloads.length,
            failed: 0,
            errors: [],
          };
        }

        setBulkReport(serverReport);
        alertReport(serverReport, "Bulk upload completed");

        // Reload products if any succeeded
        if (serverReport.ok > 0) {
          await reloadProducts();
        }
      } catch (err) {
        const rep = {
          ok: 0,
          failed: payloads.length,
          errors: [`Server error: ${err.message}`],
        };
        setBulkReport(rep);
        alertReport(rep, "Bulk upload failed");
      }
    } catch (err) {
      const rep = {
        ok: 0,
        failed: 1,
        errors: [`File processing error: ${err.message}`],
      };
      setBulkReport(rep);
      alertReport(rep, "Bulk upload error");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Product Management</h2>

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
          <label>Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{ padding: 8 }}
          />
        </div>

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
              pattern="[A-Za-z]{2}\d{4}"
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
        </div>
      </form>

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
        <button 
          type="button" 
          onClick={() => exportToCSV(filtered)}
          style={{
            background: '#4caf50',
            color: '#fff',
            padding: '6px 12px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Export to CSV
        </button>
        {bulkBusy && <span>Uploading…</span>}
      </div>

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
                  {p.totalStock ?? 0}
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
                <td style={{ padding: 6, border: "1px solid #ddd", whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => onEdit(p)}
                    style={{
                      background: "#ffe066",
                      color: "#333",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p.productId)}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Only admins can delete" : undefined}
                    style={{
                      marginLeft: 4,
                      background: "#ff6b6b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                  >
                    Del
                  </button>
                  <button
                    onClick={() => openInventoryModal(p.productId, p)}
                    style={{
                      marginLeft: 4,
                      background: "#63b3ed",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                    title="View inventory buckets (price/stock)"
                  >
                    Inv
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
      </div>

      {/* Inventory modal (simple) */}
      {inventoryOpenFor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 760,
              maxHeight: "80vh",
              overflow: "auto",
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3>
                Inventory for: {inventoryProduct?.name || `Product #${inventoryOpenFor}`}
                {inventoryProduct?.productCode && ` (${inventoryProduct.productCode})`}
              </h3>
              <div>
                <button onClick={closeInventoryModal}>Close</button>
              </div>
            </div>

            {inventoryLoading && <div>Loading inventory…</div>}
            {inventoryError && (
              <div style={{ color: "crimson" }}>{inventoryError}</div>
            )}
            {!inventoryLoading &&
              !inventoryError &&
              inventoryItems.length === 0 && (
                <div>No inventory buckets found.</div>
              )}

            {!inventoryLoading && inventoryItems.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f0f0" }}>
                    <th>Selling Price</th>
                    <th>Unit Cost</th>
                    <th>Stock</th>
                    <th>Batch</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((it) => (
                    <tr key={it.id}>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {editingInventoryId === it.id ? (
                          <input
                            style={{ width: 100, padding: 6 }}
                            value={editingInventoryDraft.price}
                            onChange={(e) =>
                              setEditingInventoryDraft((d) => ({
                                ...d,
                                price: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          it.price ?? "-"
                        )}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {editingInventoryId === it.id ? (
                          <input
                            style={{ width: 100, padding: 6 }}
                            value={editingInventoryDraft.costPrice}
                            onChange={(e) =>
                              setEditingInventoryDraft((d) => ({
                                ...d,
                                costPrice: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          it.costPrice ?? "-"
                        )}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {editingInventoryId === it.id ? (
                          <input
                            style={{ width: 80, padding: 6 }}
                            value={editingInventoryDraft.stock}
                            onChange={(e) =>
                              setEditingInventoryDraft((d) => ({
                                ...d,
                                stock: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          it.stock ?? 0
                        )}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {editingInventoryId === it.id ? (
                          <input
                            style={{ width: 140, padding: 6 }}
                            value={editingInventoryDraft.batchNo}
                            onChange={(e) =>
                              setEditingInventoryDraft((d) => ({
                                ...d,
                                batchNo: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          it.batchNo ?? "-"
                        )}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {it.createdAt
                          ? new Date(it.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {it.updatedAt
                          ? new Date(it.updatedAt).toLocaleString()
                          : "-"}
                      </td>
                      <td style={{ padding: 6, border: "1px solid #ddd" }}>
                        {editingInventoryId === it.id ? (
                          <>
                            <button
                              onClick={() =>
                                updateInventoryBucket(
                                  inventoryOpenFor,
                                  it.id,
                                  editingInventoryDraft
                                )
                              }
                              disabled={inventorySaving || !isAdmin}
                              style={{ marginRight: 6 }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingInventoryId(null);
                                setEditingInventoryDraft({
                                  price: "",
                                  costPrice: "",
                                  stock: "",
                                  batchNo: "",
                                });
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingInventoryId(it.id);
                                setEditingInventoryDraft({
                                  price: it.price ?? "",
                                  costPrice: it.costPrice ?? "",
                                  stock: it.stock ?? "",
                                  batchNo: it.batchNo ?? "",
                                });
                              }}
                              style={{ marginRight: 6 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                deleteInventoryBucket(inventoryOpenFor, it.id)
                              }
                              disabled={!isAdmin}
                              style={{ background: "#ff6b6b", color: "#fff" }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add / Receive form */}
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid #eee",
              }}
            >
              <h4 style={{ margin: "8px 0" }}>
                Add / Receive stock (price-level)
              </h4>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label>Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryForm.price}
                    onChange={(e) =>
                      setInventoryForm((f) => ({ ...f, price: e.target.value }))
                    }
                    style={{ padding: 8, minWidth: 120 }}
                    placeholder="e.g. 15.00"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label>Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inventoryForm.costPrice}
                    onChange={(e) =>
                      setInventoryForm((f) => ({
                        ...f,
                        costPrice: e.target.value,
                      }))
                    }
                    style={{ padding: 8, minWidth: 120 }}
                    placeholder="e.g. 10.00"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label>Stock</label>
                  <input
                    type="number"
                    value={inventoryForm.stock}
                    onChange={(e) =>
                      setInventoryForm((f) => ({ ...f, stock: e.target.value }))
                    }
                    style={{ padding: 8, minWidth: 80 }}
                    placeholder="Qty"
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label>Batch</label>
                  <input
                    value={inventoryForm.batchNo}
                    onChange={(e) =>
                      setInventoryForm((f) => ({
                        ...f,
                        batchNo: e.target.value,
                      }))
                    }
                    style={{ padding: 8, minWidth: 160 }}
                    placeholder="Optional batch"
                  />
                </div>

                <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                  <button
                    onClick={() => addInventoryBucket(inventoryOpenFor)}
                    disabled={inventorySaving || !isAdmin}
                    style={{
                      marginTop: 20,
                      padding: "8px 12px",
                      background: "#48bb78",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                    }}
                    title={
                      !isAdmin ? "Only admins can receive stock" : undefined
                    }
                  >
                    {inventorySaving ? "Saving…" : "Add / Receive"}
                  </button>
                  <button
                    onClick={() =>
                      setInventoryForm({
                        price: "",
                        costPrice: "",
                        stock: "",
                        batchNo: "",
                      })
                    }
                    disabled={inventorySaving}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {inventoryError && (
                <div style={{ color: "crimson", marginTop: 8 }}>
                  {inventoryError}
                </div>
              )}
              {inventoryActionError && (
                <div style={{ color: "crimson", marginTop: 8 }}>
                  {inventoryActionError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
