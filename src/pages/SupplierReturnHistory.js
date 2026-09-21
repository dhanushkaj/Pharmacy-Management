import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';
import '../App.css';

const SupplierReturnHistory = () => {
  const { token } = useContext(AuthContext);

  // Filter state
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Data state
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedReturnDetails, setSelectedReturnDetails] = useState(null);

  // Load initial data
  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  // Load returns whenever page or filters change
  useEffect(() => {
    loadReturns();
  }, [currentPage, supplierFilter, dateFromFilter, dateToFilter, productFilter]);

  const loadSuppliers = async () => {
    try {
      const list = await api('/api/suppliers', { token });
      setSuppliers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load suppliers', e);
      setSuppliers([]);
    }
  };

  const loadProducts = async () => {
    try {
      const list = await api('/api/products', { token });
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load products', e);
      setProducts([]);
    }
  };

  const loadReturns = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('size', 20);

      let url = '/api/supplier-returns?' + params.toString();

      const response = await api(url, { token });
      let data = response.content || [];

      // Client-side filtering based on selected criteria
      if (supplierFilter) {
        data = data.filter((ret) => ret.supplierId === parseInt(supplierFilter));
      }

      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        data = data.filter((ret) => new Date(ret.returnDate) >= fromDate);
      }

      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        data = data.filter((ret) => new Date(ret.returnDate) <= toDate);
      }

      if (productFilter) {
        data = data.filter((ret) =>
          ret.returnItems && ret.returnItems.some((item) => item.productId === parseInt(productFilter))
        );
      }

      setFilteredReturns(data);
      setTotalPages(response.totalPages || 1);
    } catch (e) {
      console.error('Failed to load returns', e);
      setFilteredReturns([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const handleViewDetails = (returnRecord) => {
    setSelectedReturnDetails(returnRecord);
  };

  const handleCloseDetails = () => {
    setSelectedReturnDetails(null);
  };

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

  const handleClearFilters = () => {
    setSupplierFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setProductFilter('');
    setCurrentPage(0);
  };

  const isFiltersActive = supplierFilter || dateFromFilter || dateToFilter || productFilter;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Supplier Return History</h2>
      <p style={{ color: '#666', fontSize: 14 }}>Search and view historical supplier returns</p>

      {/* Filters Section */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Search & Filter</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          {/* Supplier Filter */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setCurrentPage(0);
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: 14
              }}
            >
              <option value="">-- All Suppliers --</option>
              {suppliers.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Date From</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => {
                setDateFromFilter(e.target.value);
                setCurrentPage(0);
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: 14
              }}
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Date To</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => {
                setDateToFilter(e.target.value);
                setCurrentPage(0);
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: 14
              }}
            />
          </div>

          {/* Product Filter */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px' }}>Product</label>
            <select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value);
                setCurrentPage(0);
              }}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: 14
              }}
            >
              <option value="">-- All Products --</option>
              {products.map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isFiltersActive && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Section */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading...</div>
      ) : filteredReturns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No returns found matching your criteria</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Return No.</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Date</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Supplier</th>
                <th style={{ border: '1px solid #ddd', padding: '10px' }}>Items</th>
                <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((ret) => (
                <tr
                  key={ret.returnId}
                  onClick={() => handleViewDetails(ret)}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ border: '1px solid #ddd', padding: '10px', fontWeight: 600, color: '#1976d2' }}>
                    {ret.returnNumber}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                    {new Date(ret.returnDate).toLocaleDateString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{ret.supplierName}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    {ret.returnItems?.length || 0}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                    Rs. {ret.totalReturnAmount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                style={{ padding: '8px 16px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span>
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                style={{ padding: '8px 16px', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Return Details Modal */}
      {selectedReturnDetails && (
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
            zIndex: 3000
          }}
          onClick={handleCloseDetails}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: 800,
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1976d2' }}>Supplier Return Details</h3>
              <button
                onClick={handleCloseDetails}
                style={{
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}
            >
              <div>
                <strong>Return Number:</strong>
                <div style={{ color: '#1976d2', fontSize: 14, marginTop: 4 }}>{selectedReturnDetails.returnNumber}</div>
              </div>
              <div>
                <strong>Date:</strong>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {new Date(selectedReturnDetails.returnDate).toLocaleString()}
                </div>
              </div>
              <div>
                <strong>Supplier:</strong>
                <div style={{ fontSize: 14, marginTop: 4 }}>{selectedReturnDetails.supplierName}</div>
              </div>
              <div>
                <strong>Total Amount:</strong>
                <div style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>
                  Rs. {selectedReturnDetails.totalReturnAmount?.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Returned Items</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'left' }}>Product Name</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Code</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>Total</th>
                  <th style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>Batch</th>
                </tr>
              </thead>
              <tbody>
                {selectedReturnDetails.returnItems && selectedReturnDetails.returnItems.length > 0 ? (
                  selectedReturnDetails.returnItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #ddd', padding: '10px' }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: 12 }}>
                        {item.productCode}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                        {item.quantity}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right' }}>
                        Rs. {parseFloat(item.unitPrice).toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'right', fontWeight: 600 }}>
                        Rs. {parseFloat(item.itemTotal).toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center', fontSize: 12 }}>
                        {item.batchNo || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', color: '#999' }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {selectedReturnDetails.notes && (
              <div style={{ padding: '15px', backgroundColor: '#fffbea', borderRadius: '4px', marginBottom: '20px' }}>
                <strong>Notes:</strong> {selectedReturnDetails.notes}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handlePrintReturn}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                🖨️ Print
              </button>
              <button
                onClick={handleCloseDetails}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierReturnHistory;
