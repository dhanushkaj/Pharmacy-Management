import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const CustomerDiscount = () => {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discountPercent, setDiscountPercent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [overlapProducts, setOverlapProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api('/api/products', { method: 'GET' });
      setProducts(res);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  // Check if date ranges overlap
  const checkDateOverlap = (start1, end1, start2, end2) => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    // Ranges overlap if: start1 <= end2 AND start2 <= end1
    return s1 <= e2 && s2 <= e1;
  };

  // Check if the selected product already has an overlapping discount date range
  const findOverlappingDiscounts = () => {
    if (!selectedProduct || !startDate || !endDate) return [];
    
    // Only check WITHIN the same product - if it already has discount dates that overlap with new dates
    if (selectedProduct.discountStartDate && selectedProduct.discountEndDate) {
      const hasOverlap = checkDateOverlap(startDate, endDate, selectedProduct.discountStartDate, selectedProduct.discountEndDate);
      if (hasOverlap) {
        return [selectedProduct]; // Return the product itself as having an overlap
      }
    }
    return [];
  };

  const filteredProducts = searchTerm
    ? products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleProductSelect = (product) => {
    console.log('Product selected:', product);
    setSelectedProduct(product);
    setSearchTerm('');
    setShowSuggestions(false);
    
    // Auto-fill discount percentage if product already has one
    if (product.maxDiscount && product.maxDiscount > 0) {
      setDiscountPercent(product.maxDiscount.toString());
    } else {
      setDiscountPercent('');
    }
    
    // Auto-fill dates if they exist, regardless of discount status
    // Handle both null/undefined and empty strings
    const hasStartDate = product.discountStartDate && product.discountStartDate.trim && product.discountStartDate.trim() !== '';
    const hasEndDate = product.discountEndDate && product.discountEndDate.trim && product.discountEndDate.trim() !== '';
    
    if (hasStartDate && hasEndDate) {
      console.log('Setting dates:', product.discountStartDate, product.discountEndDate);
      setStartDate(product.discountStartDate);
      setEndDate(product.discountEndDate);
    } else {
      console.log('No dates found, clearing');
      setStartDate('');
      setEndDate('');
    }
  };

  const clearFields = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setShowSuggestions(false);
    setDiscountPercent('');
    setStartDate('');
    setEndDate('');
  };

  const handleSave = () => {
    if (!selectedProduct || !discountPercent || !startDate || !endDate) {
      setMessage('❌ Please fill all fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if the same product already has overlapping discount dates
    const overlaps = findOverlappingDiscounts();
    if (overlaps.length > 0) {
      setOverlapProducts(overlaps);
      setShowOverlapWarning(true);
      return;
    }

    // Check if product already has a discount
    if (selectedProduct.maxDiscount && selectedProduct.maxDiscount > 0) {
      setShowConfirm(true);
    } else {
      proceedWithSave();
    }
  };

  const proceedWithSave = async () => {
    try {
      setShowConfirm(false);
      // Determine which endpoint to use based on whether product already has discount
      const endpoint = (selectedProduct.maxDiscount && selectedProduct.maxDiscount > 0)
        ? `/api/products/${selectedProduct.productId}/discount/overwrite`
        : `/api/products/${selectedProduct.productId}/discount`;
      
      await api(endpoint, {
        method: 'POST',
        body: {
          discountPercentage: parseFloat(discountPercent),
          startDate,
          endDate
        }
      });
      setMessage('✅ Product seasonal discount saved successfully!');
      setSelectedProduct(null);
      setDiscountPercent('');
      setStartDate('');
      setEndDate('');
      loadProducts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error saving discount');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: '#1976d2', marginBottom: 24, textAlign: 'center' }}>🎯 Product Seasonal Discount</h2>

      {message && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          background: message.includes('✅') ? '#c8e6c9' : '#ffcdd2',
          color: message.includes('✅') ? '#2e7d32' : '#c62828',
          borderRadius: 4,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            minWidth: 400,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#ff9800' }}>⚠️ Overwrite Existing Discount?</h3>
            <p style={{ margin: '0 0 12px 0', color: '#666' }}>
              This product already has a discount of <b>{selectedProduct?.maxDiscount}%</b>.
              <br />
              <br />
              Do you want to overwrite it with the new discount of <b>{discountPercent}%</b>?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '10px 20px',
                  background: '#bdbdbd',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={proceedWithSave}
                style={{
                  padding: '10px 20px',
                  background: '#ff6f00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Yes, Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlap Warning Dialog */}
      {showOverlapWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            minWidth: 450,
            maxHeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#d32f2f' }}>⚠️ Date Range Overlap Detected</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              The discount date range <b>{startDate} to {endDate}</b> overlaps with an existing discount on this product:
            </p>
            <div style={{ 
              background: '#fff3e0', 
              padding: 12, 
              borderRadius: 4, 
              marginBottom: 16,
              maxHeight: 250,
              overflowY: 'auto',
              border: '1px solid #ffb74d'
            }}>
              {overlapProducts.map((product) => (
                <div key={product.productId} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #ffe0b2' }}>
                  <div style={{ fontWeight: 'bold', color: '#e65100' }}>{product.name}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    Discount: {product.maxDiscount}% ({product.discountStartDate} to {product.discountEndDate})
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowOverlapWarning(false);
                  setOverlapProducts([]);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#bdbdbd',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowOverlapWarning(false);
                  setOverlapProducts([]);
                  // Check if product already has discount, then proceed
                  if (selectedProduct.maxDiscount && selectedProduct.maxDiscount > 0) {
                    setShowConfirm(true);
                  } else {
                    proceedWithSave();
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#d32f2f',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection with Autocomplete */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
          📦 Product Name
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Type product name..."
            value={selectedProduct ? selectedProduct.name : searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              if (selectedProduct && selectedProduct.name !== e.target.value) {
                setSelectedProduct(null);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          />

          {/* Suggestion Dropdown */}
          {showSuggestions && filteredProducts.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#fff',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              maxHeight: 250,
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {filteredProducts.map((product, idx) => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: idx % 2 === 0 ? '#fafafa' : '#fff',
                    borderBottom: idx < filteredProducts.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#e3f2fd'}
                  onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fafafa' : '#fff'}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      Price: Rs. {product.price?.toFixed(2)} 
                      {product.discountPercentage && product.discountPercentage > 0 && 
                        ` | Current Discount: ${product.discountPercentage}%`}
                    </div>
                  </div>
                  <span style={{ fontSize: 16 }}>→</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div style={{
            marginTop: 8,
            padding: 10,
            background: '#e3f2fd',
            border: '1px solid #1976d2',
            borderRadius: 4,
            fontSize: 13,
            color: '#1565c0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              ✓ Selected: <b>{selectedProduct.name}</b>
              {selectedProduct.discountPercentage && selectedProduct.discountPercentage > 0 && 
                <div style={{ fontSize: 12, marginTop: 4, color: '#ff6f00' }}>
                  ⚠️ Current discount: {selectedProduct.maxDiscount}% ({selectedProduct.discountStartDate} to {selectedProduct.discountEndDate})
                </div>
              }
            </div>
            <button
              onClick={clearFields}
              style={{
                padding: '6px 12px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 12,
                whiteSpace: 'nowrap',
                marginLeft: 12,
                flex: '0 0 auto'
              }}
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Discount Summary Card */}
      {selectedProduct && (
        <div style={{
          marginBottom: 24,
          padding: 16,
          background: '#e3f2fd',
          border: '2px solid #1976d2',
          borderRadius: 8,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Current Discount</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1565c0' }}>
              {selectedProduct.maxDiscount && selectedProduct.maxDiscount > 0 ? selectedProduct.maxDiscount : '—'}%
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {selectedProduct.discountStartDate ? `${selectedProduct.discountStartDate} to ${selectedProduct.discountEndDate}` : 'No discount set'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>New Discount</div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#388e3c' }}>
              {discountPercent || '—'}%
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              {startDate && endDate ? `${startDate} to ${endDate}` : 'Set date range below'}
            </div>
          </div>
        </div>
      )}

      {/* Discount Percentage */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
          % Discount (0-100)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          placeholder="Enter discount percentage"
          value={discountPercent}
          onChange={e => setDiscountPercent(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 14,
            border: '1px solid #ddd',
            borderRadius: 4,
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Date Range */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
            📅 Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 14 }}>
            📅 End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 4,
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px',
          background: '#388e3c',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
          marginBottom: 32
        }}
      >
        💾 Save Discount to Product
      </button>
    </div>
  );
};

export default CustomerDiscount;
