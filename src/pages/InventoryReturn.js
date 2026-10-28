import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';
import '../App.css';

const InventoryReturn = ({ hideTitle = false }) => {
  const { token } = useContext(AuthContext);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Return items being added
  const [returnItems, setReturnItems] = useState([]);

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [selectedReturnDetails, setSelectedReturnDetails] = useState(null); // For viewing return details modal
  const productDropdownRef = useRef(null);

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadSuppliers();
    loadReturns();
  }, [currentPage]);

  // Filter products based on search (extract quantity if present)
  useEffect(() => {
    if (!productSearch || !productSearch.trim()) {
      setFilteredProducts([]);
      setSelectedProductIndex(-1);
      return;
    }

    // Check if search contains quantity prefix (e.g., "15*Panadol")
    let searchName = productSearch.replace(/^\s*\d+\s*\*\s*/, '').trim().toLowerCase();
    if (!searchName) {
      setFilteredProducts([]);
      setSelectedProductIndex(-1);
      return;
    }

    // Escape regex special characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeSearchName = escapeRegex(searchName);

    // 1. Exact match
    let filtered = products.filter(
      (p) => p.name?.toLowerCase() === safeSearchName || p.genericName?.toLowerCase() === safeSearchName
    );

    // 2. Word boundary match
    if (filtered.length === 0) {
      const wordBoundary = new RegExp(`\\b${safeSearchName}\\b`, 'i');
      filtered = products.filter((p) => wordBoundary.test(p.name) || wordBoundary.test(p.genericName));
    }

    // 3. Prefix match
    if (filtered.length === 0) {
      filtered = products.filter(
        (p) => p.name?.toLowerCase().startsWith(safeSearchName) || p.genericName?.toLowerCase().startsWith(safeSearchName)
      );
    }

    // 4. Partial match
    if (filtered.length === 0) {
      filtered = products.filter(
        (p) =>
          p.name?.toLowerCase().includes(safeSearchName) ||
          p.genericName?.toLowerCase().includes(safeSearchName) ||
          p.productCode?.toLowerCase().includes(safeSearchName)
      );
    }

    setFilteredProducts(filtered);
    setSelectedProductIndex(-1);
  }, [productSearch, products]);

  // Handle keyboard navigation in dropdown
  useEffect(() => {
    if (filteredProducts.length > 0 && selectedProductIndex >= 0) {
      if (productDropdownRef.current) {
        const dropdown = productDropdownRef.current;
        const items = dropdown.querySelectorAll('div[data-product-index]');
        if (items[selectedProductIndex]) {
          const item = items[selectedProductIndex];
          const itemOffsetTop = item.offsetTop;
          const itemOffsetBottom = itemOffsetTop + item.offsetHeight;
          const currentScrollTop = dropdown.scrollTop;
          const dropdownHeight = dropdown.clientHeight;
          const viewportBottom = currentScrollTop + dropdownHeight;

          if (itemOffsetTop < currentScrollTop) {
            dropdown.scrollTop = Math.max(0, itemOffsetTop - 5);
          } else if (itemOffsetBottom > viewportBottom) {
            dropdown.scrollTop = itemOffsetBottom - dropdownHeight + 5;
          }
        }
      }
    }
  }, [selectedProductIndex, filteredProducts]);

  const loadProducts = async () => {
    try {
      const data = await api('/api/products', { token });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await api('/api/suppliers', { token });
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const loadReturns = async () => {
    try {
      const data = await api(`/api/supplier-returns?page=${currentPage}&size=20`, { token });
      setReturns(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to load returns:', err);
      setError('Failed to load returns');
    }
  };

  /**
   * Extract quantity from search string like "15*Panadol"
   */
  const extractQuantity = (searchStr) => {
    const match = searchStr.match(/^(\d+)\s*\*/);
    return match ? parseInt(match[1]) : 1;
  };

  /**
   * Handle product selection from dropdown
   */
  const handleSelectProduct = async (product) => {
    const quantity = extractQuantity(productSearch);

    // Validate quantity
    if (!quantity || quantity <= 0) {
      setError('Invalid quantity. Please enter a valid number.');
      return;
    }

    try {
      // Fetch the latest selling price for this product from backend
      const priceResponse = await api(`/api/products/${product.productId}/latest-price`, { token });
      
      if (!priceResponse.latestPrice) {
        setError(`Product ${product.name} has no price information available`);
        return;
      }

      const latestPrice = parseFloat(priceResponse.latestPrice);

      // Check if product already in return items
      const existingItem = returnItems.find((item) => item.product.productId === product.productId);
      if (existingItem) {
        // Update quantity instead of duplicating
        const updated = returnItems.map((item) =>
          item.product.productId === product.productId
            ? { ...item, quantity: existingItem.quantity + quantity }
            : item
        );
        setReturnItems(updated);
      } else {
        // Add new item with latest price
        setReturnItems([
          ...returnItems,
          {
            product,
            quantity,
            unitPrice: latestPrice,
            batchNo: product.batchNo || '',
            notes: ''
          }
        ]);
      }

      // Clear search
      setProductSearch('');
      setFilteredProducts([]);
      setSelectedProductIndex(-1);
      setSuccess(`Added ${quantity}x ${product.name} (Rs. ${latestPrice.toFixed(2)}) to return list`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(`Failed to fetch price for ${product.name}: ${err.message}`);
      console.error('Price fetch error:', err);
    }
  };

  /**
   * Handle keyboard in product search
   */
  const handleProductSearchKeyDown = (e) => {
    if (!filteredProducts || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedProductIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
          handleSelectProduct(filteredProducts[selectedProductIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setFilteredProducts([]);
        setSelectedProductIndex(-1);
        break;
      default:
        break;
    }
  };

  /**
   * Remove item from return list
   */
  const removeReturnItem = (productId) => {
    setReturnItems((prev) => prev.filter((item) => item.product.productId !== productId));
    setSuccess('Item removed from return list');
    setTimeout(() => setSuccess(''), 1500);
  };

  /**
   * Calculate total return amount
   */
  const calculateTotalReturnAmount = () => {
    return returnItems.reduce((sum, item) => {
      const itemTotal = item.quantity * parseFloat(item.unitPrice);
      return sum + itemTotal;
    }, 0);
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    if (!supplierId) {
      setError('Please select a supplier');
      return false;
    }
    if (returnItems.length === 0) {
      setError('Please add at least one product to return');
      return false;
    }

    // Validate each item
    for (let item of returnItems) {
      if (!item.quantity || item.quantity <= 0) {
        setError(`Invalid quantity for ${item.product.name}`);
        return false;
      }
      if (!item.unitPrice || parseFloat(item.unitPrice) <= 0) {
        setError(`Invalid unit price for ${item.product.name}`);
        return false;
      }
    }

    return true;
  };

  /**
   * Submit supplier return
   */
  const handleSubmitReturn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        supplierId: parseInt(supplierId),
        returnItems: returnItems.map((item) => ({
          productId: item.product.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice),
          batchNo: item.batchNo.trim() || null,
          notes: item.notes.trim() || null
        })),
        notes: notes.trim() || null
      };

      const response = await api('/api/supplier-returns', {
        method: 'POST',
        body: payload,
        token
      });

      setSuccess(`Supplier return ${response.returnNumber} recorded successfully!`);
      resetForm();
      loadReturns();
      setShowConfirmation(false);
    } catch (err) {
      const errorMsg = err?.message || 'Failed to record supplier return';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSupplierId('');
    setProductSearch('');
    setNotes('');
    setReturnItems([]);
    setFilteredProducts([]);
    setSelectedProductIndex(-1);
  };

  /**
   * View full details of a supplier return
   */
  const handleViewDetails = (returnRecord) => {
    setSelectedReturnDetails(returnRecord);
  };

  /**
   * Close the details modal
   */
  const handleCloseDetails = () => {
    setSelectedReturnDetails(null);
  };

  /**
   * Print supplier return details
   */
  const handlePrintReturn = () => {
    if (!selectedReturnDetails) return;

    const printWindow = window.open('', '', 'height=600,width=400');
    const ret = selectedReturnDetails;
    
    // Thermal printer format (80mm width)
    const itemsHTML = ret.returnItems
      .map(
        (item) => `
        <div style="font-family: monospace; font-size: 11px; line-height: 1.4;">
          <div>${item.productName}</div>
          <div>Code: ${item.productCode} | Qty: ${item.quantity}</div>
          <div>@Rs. ${parseFloat(item.unitPrice).toFixed(2)} = Rs. ${parseFloat(item.itemTotal).toFixed(2)}</div>
          ${item.batchNo ? `<div>Batch: ${item.batchNo}</div>` : ''}
          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Return #${ret.returnNumber}</title>
        <style>
          body { 
            font-family: monospace; 
            margin: 0; 
            padding: 10px; 
            width: 80mm;
            font-size: 11px;
          }
          .receipt { width: 100%; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .header h2 { margin: 0; font-size: 12px; }
          .details { margin: 5px 0; font-size: 10px; }
          .item-line { display: flex; justify-content: space-between; font-size: 10px; margin: 3px 0; }
          .separator { border-top: 1px dashed #000; margin: 5px 0; }
          .total-line { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 3px 0; margin: 5px 0; text-align: right; }
          .footer { text-align: center; font-size: 9px; margin-top: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h2>SUPPLIER RETURN</h2>
            <div>Ref: ${ret.returnNumber}</div>
          </div>

          <div class="details">
            <div>Date: ${new Date(ret.returnDate).toLocaleDateString()}</div>
            <div>Time: ${new Date(ret.returnDate).toLocaleTimeString()}</div>
            <div>Supplier: ${ret.supplierName}</div>
          </div>

          <div class="separator"></div>

          <div style="font-size: 10px; margin: 5px 0;">
            ${itemsHTML}
          </div>

          <div class="separator"></div>

          <div class="total-line">
            TOTAL: Rs. ${parseFloat(ret.totalReturnAmount).toFixed(2)}
          </div>

          ${ret.notes ? `<div style="font-size: 9px; margin: 5px 0; border: 1px solid #ccc; padding: 3px;">Note: ${ret.notes}</div>` : ''}

          <div class="footer">
            <div>Printed: ${new Date().toLocaleString()}</div>
            <div style="margin-top: 10px;">Thank You</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Auto-trigger print after content loads
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const totalReturnAmount = calculateTotalReturnAmount();

  return (
    <div className="inventory-return-container" style={{ padding: '20px' }}>
      {!hideTitle && (
        <>
          <h2>Supplier Returns</h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Process product returns to suppliers and reduce inventory automatically
          </p>
        </>
      )}

      {/* Return Form */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Create Return Transaction</h3>

        {error && (
          <div style={{ color: '#d32f2f', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ color: '#2e7d32', marginBottom: '10px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
            {success}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* Select Supplier */}
          <div>
            <label style={{ fontWeight: 600 }}>Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.supplierId} value={s.supplierId}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontWeight: 600 }}>Notes</label>
            <input
              type="text"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        {/* Product Search */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <label style={{ fontWeight: 600 }}>Search Product (Format: quantity*name)</label>
          <small style={{ display: 'block', color: '#666', marginBottom: '8px' }}>
            Example: <strong>15*Panadol</strong> to return 15 units of Panadol
          </small>
          <input
            type="text"
            placeholder="e.g., 12*Paracetamol or 5*Vitamin C"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: 14 }}
          />

          {/* Filtered Products Dropdown */}
          {filteredProducts.length > 0 && productSearch.trim() && (
            <div
              ref={productDropdownRef}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderTop: 'none',
                maxHeight: 260,
                overflowY: 'auto',
                zIndex: 1000,
                borderRadius: '0 0 4px 4px'
              }}
            >
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.productId}
                  data-product-index={idx}
                  onClick={() => handleSelectProduct(product)}
                  onMouseEnter={() => setSelectedProductIndex(idx)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: idx === selectedProductIndex ? '#e3f2fd' : '#fff',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1976d2' }}>{product.name}</div>
                  {product.genericName && (
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Generic: {product.genericName}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    Code: {product.productCode} | Price: Rs. {product.lastPrice || '-'} | Stock: {product.totalStock || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Return Items List */}
        {returnItems.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Return Items ({returnItems.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Product</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Qty</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Unit Price (Rs.)</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Total (Rs.)</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {returnItems.map((item) => {
                  const itemTotal = item.quantity * parseFloat(item.unitPrice);
                  return (
                    <tr key={item.product.productId}>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                        <small style={{ color: '#666' }}>Code: {item.product.productCode}</small>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                        {item.quantity}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                        {parseFloat(item.unitPrice).toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                        {itemTotal.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeReturnItem(item.product.productId)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: 16
              }}
            >
              Total Return Amount: Rs. {totalReturnAmount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              if (returnItems.length === 0) {
                setError('Please add at least one product before submitting');
                return;
              }
              setShowConfirmation(true);
            }}
            disabled={loading || returnItems.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: returnItems.length > 0 ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: returnItems.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            {loading ? 'Saving...' : 'Save Return'}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#999',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: 500,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ marginBottom: '15px', color: '#1976d2' }}>Confirm Supplier Return</h3>
            <p style={{ marginBottom: '20px', lineHeight: 1.6, color: '#333' }}>
              Are you sure you want to save this supplier return transaction?
            </p>

            {/* Summary */}
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '4px',
                marginBottom: '20px',
                fontSize: 14
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <strong>Supplier:</strong> {suppliers.find((s) => s.supplierId === parseInt(supplierId))?.name}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Items:</strong> {returnItems.length} product(s)
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Total Amount:</strong> Rs. {totalReturnAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ color: '#d32f2f', fontSize: 12, marginBottom: '20px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
              ⚠️ This will reduce inventory for all selected products.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {loading ? 'Saving...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReturn;
