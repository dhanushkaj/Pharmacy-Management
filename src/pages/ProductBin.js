// Helper: Inventory Return modal (for customer/supplier returns)
function InventoryReturnDetailsModal({ ret, onClose }) {
  if (!ret) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16 }}>
          <h3 style={{ margin: 0 }}>Inventory Return Details</h3>
          <button onClick={onClose} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', marginLeft: 8 }}>✕</button>
        </div>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ marginBottom: 12 }}>
            <div><strong>Date:</strong> {ret.returnDate ? new Date(ret.returnDate).toLocaleString() : '-'}</div>
            <div><strong>Type:</strong> {ret.returnType === 'FROM_CUSTOMER' ? 'From Customer' : 'To Supplier'}</div>
            <div><strong>Product:</strong> {ret.productCode} - {ret.productName}</div>
            <div><strong>Batch No:</strong> {ret.batchNo || '-'}</div>
            <div><strong>Quantity:</strong> {ret.quantity}</div>
            <div><strong>Unit Price:</strong> Rs.{ret.unitPrice?.toFixed(2)}</div>
            <div><strong>Total:</strong> Rs.{ret.totalAmount?.toFixed(2)}</div>
            <div><strong>{ret.returnType === 'FROM_CUSTOMER' ? 'Customer' : 'Supplier'}:</strong> {ret.customerName || ret.supplierName || '-'}</div>
            <div><strong>Reason:</strong> {ret.reason}</div>
            {ret.notes && <div><strong>Notes:</strong> {ret.notes}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={onClose} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '7px 18px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Manual Inventory Change modal
function ManualInventoryChangeModal({ movement, onClose }) {
  if (!movement) return null;
  // Debug: log the movement object to inspect what fields are present
  console.log('ManualInventoryChangeModal movement:', movement);
  // Defensive fallback for missing fields
  const product = movement.productName || movement.product || movement.productCode || '-';
  const batch = movement.batchNo || movement.batch || '-';
  const fromBin = movement.fromBin || movement.from || '-';
  const toBin = movement.toBin || movement.to || '-';
  const qty = typeof movement.quantity !== 'undefined' ? movement.quantity : (movement.qty || '-');
  const performedBy = movement.performedBy || movement.by || movement.user || '-';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 420, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16 }}>
          <h3 style={{ margin: 0 }}>Manual Inventory Change</h3>
          <button onClick={onClose} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', marginLeft: 8 }}>✕</button>
        </div>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ marginBottom: 12 }}>
            <div><strong>Date:</strong> {movement.createdAt ? new Date(movement.createdAt).toLocaleString() : '-'}</div>
            <div><strong>Product:</strong> {product}</div>
            <div><strong>Batch No:</strong> {batch}</div>
            <div><strong>From Bin:</strong> {fromBin}</div>
            <div><strong>To Bin:</strong> {toBin}</div>
            <div><strong>Quantity:</strong> {qty}</div>
            <div><strong>Performed By:</strong> {performedBy}</div>
            {movement.notes && <div><strong>Notes:</strong> {movement.notes}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={onClose} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '7px 18px', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Helper: GRN modal content (extracted from GRNListView.js, simplified for reuse)
function GrnDetailsModal({ grn, onClose }) {
  if (!grn) return <div style={{ padding: 32, color: 'crimson' }}>No GRN data found.</div>;
  // Inline styles from GRNListView.js
  const detailRow = { display: 'flex', justifyContent: 'space-between', marginBottom: 8 };
  const detailsSection = { marginBottom: 18 };
  const table = { width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 };
  const th = { padding: 8, border: '1px solid #ddd', background: '#f8f9fa' };
  const td = { padding: 8, border: '1px solid #ddd' };
  const btnSecondary = { background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '7px 18px', cursor: 'pointer' };
  const closeButton = { background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', marginLeft: 8 };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', minWidth: 350 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16 }}>
          <h3 style={{ margin: 0 }}>GRN Details</h3>
          <button onClick={onClose} style={closeButton}>✕</button>
        </div>
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={detailsSection}>
            <div style={detailRow}><strong>GRN Code:</strong><span>{grn.grnCode}</span></div>
            <div style={detailRow}><strong>Purchase Order:</strong><span>{grn.purchaseOrderCode}</span></div>
            <div style={detailRow}><strong>Supplier:</strong><span>{grn.supplierName || 'N/A'}</span></div>
            <div style={detailRow}><strong>Status:</strong><span>{grn.status}</span></div>
            <div style={detailRow}><strong>Paid:</strong><span>{grn.paid ? 'Paid' : 'Unpaid'}</span></div>
            <div style={detailRow}><strong>Due Date:</strong><span>{grn.paymentDueDate ? new Date(grn.paymentDueDate).toLocaleDateString() : 'N/A'}</span></div>
            <div style={detailRow}><strong>Due Days:</strong><span>{typeof grn.paymentDueDays === 'number' ? grn.paymentDueDays : 'N/A'}</span></div>
            <div style={detailRow}><strong>Cheque Date:</strong><span>{grn.chequeDate ? new Date(grn.chequeDate).toLocaleDateString() : 'N/A'}</span></div>
            <div style={detailRow}><strong>Created Date:</strong><span>{new Date(grn.createdAt).toLocaleDateString()}</span></div>
            {grn.approvedUser && (<div style={detailRow}><strong>Approved By:</strong><span>{grn.approvedUser}</span></div>)}
            {grn.approvedDate && (<div style={detailRow}><strong>Approved Date:</strong><span>{new Date(grn.approvedDate).toLocaleDateString()}</span></div>)}
            {grn.rejectedReason && (<div style={detailRow}><strong>Rejection Reason:</strong><span style={{ color: '#dc3545' }}>{grn.rejectedReason}</span></div>)}
          </div>
          <h4 style={{ marginTop: 24, marginBottom: 12 }}>Items</h4>
          {Array.isArray(grn.items) && grn.items.length > 0 ? (
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Quantity</th>
                  <th style={th}>Unit Cost</th>
                  <th style={th}>Selling Price</th>
                  <th style={th}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {grn.items.map((item) => (
                  <tr key={item.id}>
                    <td style={td}>{item.productName}</td>
                    <td style={td}>{item.receivedQuantity}</td>
                    <td style={td}>Rs.{item.unitCost.toFixed(2)}</td>
                    <td style={td}>Rs.{item.price ? item.price.toFixed(2) : 'N/A'}</td>
                    <td style={td}>Rs.{(item.receivedQuantity * item.unitCost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                  <td style={td} colSpan="4">Total</td>
                  <td style={td}>Rs. {grn.items.reduce((sum, item) => sum + item.receivedQuantity * item.unitCost, 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div style={{ color: '#888', margin: '16px 0' }}>No items found for this GRN.</div>
          )}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <button onClick={onClose} style={btnSecondary}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useContext } from 'react';
// For bill modal rendering
import { api } from '../utill/api';
import { AuthContext } from '../components/AuthContext';

// Helper: Bill modal content (extracted from BillingHistory.js, simplified for reuse)
export function BillDetailsModal({ bill, onClose, storeSettings, width = 600 }) {
  if (!bill) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: width, width: '90vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5' }}>
          <span style={{ fontWeight: 'bold' }}>Bill Preview</span>
          <button onClick={onClose} style={{ padding: '6px 16px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ width: 320, margin: '0 auto', padding: '24px 20px', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5, background: '#fff' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{storeSettings?.storeName || 'PHARMACY'}</div>
          <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>{storeSettings?.address || 'Store Address'}</div>
          <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>Tel: {storeSettings?.phone || 'N/A'}</div>
          {storeSettings?.email && (<div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>{storeSettings.email}</div>)}
          {storeSettings?.taxId && (<div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>Tax ID: {storeSettings.taxId}</div>)}
          <div style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>
          <div style={{ fontSize: 11, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Invoice #:</strong><span>{bill.billingNumber}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Date:</strong><span>{new Date(bill.billingDate).toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Customer:</strong><span>{bill.customerName}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Phone:</strong><span>{bill.customerPhone}</span></div>
            {bill.paymentMethod && (<div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Payment:</strong><span>{bill.paymentMethod}</span></div>)}
          </div>
          <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>
          <table style={{ width: '100%', fontSize: 10, marginBottom: 10, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 'bold' }}>Item</th>
                <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 'bold' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '6px 0', fontSize: 10 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                    {item.productCode && (<div style={{ fontSize: 8, color: '#666' }}>Code: {item.productCode}</div>)}
                  </td>
                  <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>{item.unitPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>
          <div style={{ fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Subtotal:</span><span>Rs. {bill.subtotal.toFixed(2)}</span></div>
            {bill.discountAmount > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Discount Applied:</span><span>- Rs. {Number(bill.discountAmount).toFixed(2)}</span></div>)}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '2px solid #000', fontWeight: 'bold', fontSize: 14, marginTop: 6 }}><span>GRAND TOTAL:</span><span>Rs. {(bill.subtotal - Number(bill.discountAmount || 0)).toFixed(2)}</span></div>
          </div>
          {bill.notes && (<><div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div><div style={{ fontSize: 9, fontStyle: 'italic', wordWrap: 'break-word' }}><strong>Notes:</strong> {bill.notes}</div></>)}
          <div style={{ borderTop: '2px solid #000', margin: '12px 0' }}></div>
          <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12 }}><div style={{ fontWeight: 'bold', marginBottom: 6 }}>Thank You!</div><div style={{ fontSize: 9 }}>Please keep this bill for warranty claims</div></div>
          <div style={{ textAlign: 'center', fontSize: 8, marginTop: 10, color: '#999' }}>Powered by Pharmacy Management System</div>
        </div>
      </div>
    </div>
  );
}
import ProductSearchDropdown from '../components/ProductSearchDropdown';
//import { api } from '../utill/api';
//import { AuthContext } from '../components/AuthContext';

const mockAudit = [
  { id: 1, product: "Paracetamol 500mg", action: "Added stock", qty: 100, date: "2025-08-20", by: "Admin" },
  { id: 2, product: "Amoxicillin 250mg", action: "Removed expired", qty: -20, date: "2025-08-23", by: "Manager" },
];


const ProductBin = () => {
  const { token } = useContext(AuthContext);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [viewDoc, setViewDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inventorySummary, setInventorySummary] = useState([]);

  useEffect(() => {
    // fetch categories
    (async () => {
      try {
        const list = await api('/api/categories', { token });
        setCategories(list || []);
      } catch (e) {
        console.error('Failed to load categories', e.message);
      }
    })();
  }, [token]);

  const fetchMovements = async (product, pageNum = 0) => {
    setLoading(true);
    try {
      const movementsPage = await api(`/api/products/${product.productId}/bin-movements?page=${pageNum}&size=20`, { token });
      setTransactions(movementsPage.content || []);
      setTotalPages(movementsPage.totalPages || 1);
      setPage(movementsPage.number || 0);
    } catch (e) {
      console.error('Failed to fetch movements', e.message);
      setTransactions([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const onProductSelect = async (product) => {
    setSelectedProduct(product);
    setProductDetails(null);
    fetchMovements(product, 0);
    try {
      const [details, sum] = await Promise.all([
        api(`/api/products/${product.productId}`, { token }),
        api(`/api/products/${product.productId}/inventory-summary`, { token }),
      ]);
      setProductDetails(details || product);
      setInventorySummary(sum || []);
    } catch (e) {
      console.error('Failed to fetch product details / inventory summary', e.message);
      setProductDetails(product);
      setInventorySummary([]);
    }
  };

  const handlePageChange = (newPage) => {
    if (selectedProduct && newPage >= 0 && newPage < totalPages) {
      fetchMovements(selectedProduct, newPage);
    }
  };

  return (
    <div>
      <h2>Product Bin / Audit Trail</h2>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: 10, display: 'block' }}>Category:</label>
          <select value={selectedCategory || ''} onChange={e => setSelectedCategory(e.target.value || null)} style={{ padding: 8 }}>
            <option value="">All</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Product:</label>
          <ProductSearchDropdown categoryId={selectedCategory} onSelect={onProductSelect} />
        </div>
      </div>
      {selectedProduct ? (
        <div>
          {/* Product Info Card */}
          {productDetails && (
            <div style={{ background: '#f0f7ff', border: '1px solid #b3d0f5', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#1565c0', fontSize: 16 }}>📦 Product Information</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ minWidth: 180, flex: '1 1 180px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Product Name</div>
                  <div style={{ fontWeight: 600 }}>{productDetails.name || '-'}</div>
                </div>
                <div style={{ minWidth: 130, flex: '1 1 130px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Product Code</div>
                  <div style={{ fontWeight: 600 }}>{productDetails.productCode || '-'}</div>
                </div>
                <div style={{ minWidth: 160, flex: '1 1 160px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Generic Name</div>
                  <div>{productDetails.genericName || '-'}</div>
                </div>
                <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Category</div>
                  <div>{productDetails.categoryName || '-'}</div>
                </div>
                <div style={{ minWidth: 140, flex: '1 1 140px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Supplier</div>
                  <div>{productDetails.supplierName || '-'}</div>
                </div>
                <div style={{ minWidth: 100, flex: '1 1 100px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Pack Size</div>
                  <div style={{ fontWeight: 600, color: '#1976d2' }}>{productDetails.packSize || '-'}</div>
                </div>
                <div style={{ minWidth: 100, flex: '1 1 100px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Bin Location</div>
                  <div>{productDetails.binLocation || '-'}</div>
                </div>
                <div style={{ minWidth: 80, flex: '1 1 80px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Min Stock</div>
                  <div>{productDetails.minStock ?? '-'}</div>
                </div>
                <div style={{ minWidth: 80, flex: '1 1 80px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Max Stock</div>
                  <div>{productDetails.maxStock ?? '-'}</div>
                </div>
                <div style={{ minWidth: 100, flex: '1 1 100px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Total Stock</div>
                  <div style={{ fontWeight: 600, color: productDetails.totalStock > 0 ? '#2e7d32' : '#c62828' }}>{productDetails.totalStock ?? 0}</div>
                </div>
                <div style={{ minWidth: 110, flex: '1 1 110px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Expiry Date</div>
                  <div>{productDetails.expiryDate || '-'}</div>
                </div>
                {productDetails.patientInstructions && (
                  <div style={{ minWidth: 240, flex: '1 1 240px' }}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>Patient Instructions</div>
                    <div style={{ fontStyle: 'italic' }}>{productDetails.patientInstructions}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <h3>Inventory Summary</h3>
            {inventorySummary.length === 0 ? (
              <div>No inventory buckets for this product.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Batch</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Stock</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: 8, border: '1px solid #ddd' }}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {inventorySummary.map(b => (
                    <tr key={b.batchNo}>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.batchNo || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.stock}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.price || '-'}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{b.costPrice || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>Recent Movements</h3>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>ID</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>From</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>To</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>Qty</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>Document</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>By</th>
                      <th style={{ padding: 10, border: '1px solid #ccc' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>No transactions found for this product.</td></tr>
                    ) : (
                      transactions.map(t => {
                        // ...existing code for rendering rows...
                        let docLabel = '-';
                        if (t.referenceType && t.referenceId) {
                          if (t.referenceType === 'BILL' || t.referenceType === 'BILLING') docLabel = `Bill #${t.referenceId}`;
                          else if (t.referenceType === 'GRN') docLabel = `GRN #${t.referenceId}`;
                          else if (t.referenceType === 'INVENTORY_RETURN') docLabel = `Return #${t.referenceId}`;
                          else if (t.referenceType === 'BILLING_DELETE') docLabel = `Deleted Bill #${t.referenceId}`;
                          else if (t.referenceType === 'PRODUCT_UPDATE' || t.referenceType === 'MANUAL_INVENTORY') docLabel = 'Manual Inventory Change';
                          else docLabel = `${t.referenceType} #${t.referenceId}`;
                        }
                        return (
                          <tr key={t.id} style={t.fromBin === 'INVENTORY' && t.toBin === 'INVENTORY' ? { background: '#fffbe6' } : {}}>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.id}</td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.fromBin}</td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.toBin}</td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.quantity}</td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>
                              {t.referenceType && t.referenceId ? (
                                <button style={{ color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                  onClick={async () => {
                                    // ...existing code for document modal...
                                    let doc = null;
                                    let relatedMovements = [];
                                    let grnDetails = null;
                                    try {
                                      if (t.referenceType === 'BILL' || t.referenceType === 'BILLING') {
                                        let bill = null;
                                        try {
                                          bill = await api(`/api/billings/by-number/${t.referenceId}`, { token });
                                        } catch (e) {
                                          try {
                                            bill = await api(`/api/billings/${t.referenceId}`, { token });
                                          } catch {}
                                        }
                                        doc = bill;
                                        if (bill && bill.billingId) {
                                          relatedMovements = await api(`/api/billings/${bill.billingId}/movements`, { token });
                                        }
                                        if (bill && Array.isArray(bill.items)) {
                                          for (const item of bill.items) {
                                            if (item.grnId || item.grnCode) {
                                              try {
                                                grnDetails = await api(`/api/grns/${item.grnId || item.grnCode}`, { token });
                                                break;
                                              } catch {}
                                            }
                                          }
                                        }
                                      } else if (t.referenceType === 'GRN') {
                                        let grn = null;
                                        try {
                                          grn = await api(`/api/grns/by-code/${t.referenceId}`, { token });
                                        } catch (e) {
                                          try {
                                            grn = await api(`/api/grns/${t.referenceId}`, { token });
                                          } catch {}
                                        }
                                        doc = grn;
                                        if (grn && grn.id) {
                                          relatedMovements = await api(`/api/grns/${grn.id}/movements`, { token });
                                        }
                                      } else if (t.referenceType === 'INVENTORY_RETURN') {
                                        doc = await api(`/api/inventory-returns/${t.referenceId}`, { token });
                                      } else if (t.referenceType === 'BILLING_DELETE') {
                                        let bill = null;
                                        try {
                                          bill = await api(`/api/billings/by-number/${t.referenceId}`, { token });
                                        } catch (e) {
                                          try {
                                            bill = await api(`/api/billings/${t.referenceId}`, { token });
                                          } catch {}
                                        }
                                        doc = bill;
                                      } else if (t.referenceType === 'PRODUCT_UPDATE') {
                                        doc = t;
                                      } else if (t.referenceType === 'MANUAL_INVENTORY') {
                                        doc = t;
                                      } else {
                                        doc = { type: t.referenceType, id: t.referenceId };
                                      }
                                      setViewDoc({ doc, relatedMovements, grnDetails });
                                    } catch (e) {
                                      setViewDoc({ error: 'Failed to fetch document', type: t.referenceType, id: t.referenceId });
                                    }
                                  }}
                                >
                                  {docLabel}
                                </button>
                              ) : (
                                docLabel
                              )}
                            </td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.performedBy}</td>
                            <td style={{ padding: 10, border: '1px solid #ccc' }}>{t.createdAt}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} style={{ padding: '6px 16px' }}>Prev</button>
                  <span>Page {page + 1} of {totalPages}</span>
                  <button onClick={() => handlePageChange(page + 1)} disabled={page + 1 >= totalPages} style={{ padding: '6px 16px' }}>Next</button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 32, color: '#888' }}>Select a product to view its transactions.</div>
      )}
      {viewDoc && (
        viewDoc.doc && (viewDoc.doc.billingNumber || viewDoc.doc.billingId) ? (
          <BillDetailsModal bill={viewDoc.doc} onClose={() => setViewDoc(null)} storeSettings={{ storeName: 'PHARMACY' }} />
        ) : viewDoc.doc && (viewDoc.doc.grnCode || viewDoc.doc.purchaseOrderCode) ? (
          <GrnDetailsModal grn={viewDoc.doc} onClose={() => setViewDoc(null)} />
        ) : viewDoc.doc && (viewDoc.doc.returnId && (viewDoc.doc.returnType === 'FROM_CUSTOMER' || viewDoc.doc.returnType === 'TO_SUPPLIER')) ? (
          <InventoryReturnDetailsModal ret={viewDoc.doc} onClose={() => setViewDoc(null)} />
        ) : viewDoc.doc && viewDoc.doc.type === 'PRODUCT_UPDATE' ? (
          <ManualInventoryChangeModal movement={viewDoc.doc} onClose={() => setViewDoc(null)} />
        ) : (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 8, minWidth: 320, maxWidth: 900, boxShadow: '0 2px 12px #0002', position: 'relative', overflow: 'auto', maxHeight: '90vh' }}>
              <h3>Document Details</h3>
              {viewDoc.error ? (
                <div style={{ color: 'crimson' }}>{viewDoc.error}</div>
              ) : (
                <>
                  <h4>Document Details</h4>
                  <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, fontSize: 15, maxHeight: 300, overflow: 'auto' }}>
                    {JSON.stringify(viewDoc.doc, null, 2)}
                  </pre>
                  {viewDoc.grnDetails && (
                    <>
                      <h4>Related GRN Details</h4>
                      <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, fontSize: 15, maxHeight: 300, overflow: 'auto' }}>
                        {JSON.stringify(viewDoc.grnDetails, null, 2)}
                      </pre>
                    </>
                  )}
                  {Array.isArray(viewDoc.relatedMovements) && viewDoc.relatedMovements.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <h4>Related Inventory Movements</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                          <tr style={{ background: '#f0f0f0' }}>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>ID</th>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>From</th>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>To</th>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>Qty</th>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>By</th>
                            <th style={{ padding: 8, border: '1px solid #ccc' }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewDoc.relatedMovements.map(m => (
                            <tr key={m.id}>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.id}</td>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.fromBin}</td>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.toBin}</td>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.quantity}</td>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.performedBy}</td>
                              <td style={{ padding: 8, border: '1px solid #ccc' }}>{m.createdAt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              <button onClick={() => setViewDoc(null)} style={{ marginTop: 16, background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 18px' }}>Close</button>
            </div>
          </div>
        )
      )}
      <button style={{ marginTop: 20 }}>Export Audit</button>
    </div>
  );
};

export default ProductBin;