import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

export default function Billing() {
  const { token } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer Section
  const [customerSearch, setCustomerSearch] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  // Product Section
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Cart Section
  const [cartItems, setCartItems] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Load customers and products on mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api('/api/customers', { token });
      console.log('Fetched customers:', data);
      // Handle paginated response or direct array
      const customers = data?.content ? data.content : Array.isArray(data) ? data : [];
      console.log('Setting customers:', customers);
      setAllCustomers(customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Failed to load customers: ' + err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api('/api/products', { token });
      console.log('Fetched products:', data);
      // Handle paginated response or direct array
      const products = data?.content ? data.content : Array.isArray(data) ? data : [];
      console.log('Setting products:', products);
      setAllProducts(products);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products: ' + err.message);
    }
  };

  // Customer search filter
  useEffect(() => {
    console.log('Customer search triggered:', customerSearch, 'Total customers:', allCustomers.length);
    if (!customerSearch.trim()) {
      setFilteredCustomers([]);
      return;
    }
    const lower = customerSearch.toLowerCase();
    const filtered = allCustomers.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        c.phone?.toLowerCase().includes(lower) ||
        c.address?.toLowerCase().includes(lower)
    );
    console.log('Filtered customers:', filtered);
    setFilteredCustomers(filtered);
  }, [customerSearch, allCustomers]);

  // Product search filter
  useEffect(() => {
    console.log('Product search triggered:', productSearch, 'Total products:', allProducts.length);
    if (!productSearch.trim()) {
      setFilteredProducts([]);
      return;
    }
    const lower = productSearch.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        p.productName?.toLowerCase().includes(lower) ||
        p.genericName?.toLowerCase().includes(lower) ||
        p.category?.categoryName?.toLowerCase().includes(lower) ||
        p.productCode?.toLowerCase().includes(lower)
    );
    console.log('Filtered products:', filtered);
    setFilteredProducts(filtered);
  }, [productSearch, allProducts]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDiscountPercentage(customer.discountPercentage || 0);
    setCustomerSearch('');
    setFilteredCustomers([]);
  };

  const handleAddNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      alert('Name and Phone are required!');
      return;
    }
    try {
      const created = await api('/api/customers', {
        method: 'POST',
        body: newCustomer,
        token,
      });
      setSelectedCustomer(created);
      setDiscountPercentage(created.discountPercentage || 0);
      setShowNewCustomerModal(false);
      setNewCustomer({ name: '', phone: '' });
      fetchCustomers(); // refresh list
    } catch (err) {
      alert('Failed to add customer: ' + (err.message || 'Error'));
    }
  };

  // Parse quantity multiplier (e.g., "12*" means 12 units)
  const parseQuantityMultiplier = (text) => {
    const match = text.trim().match(/^(\d+)\*$/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleProductSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Check if input is quantity multiplier
      const qty = parseQuantityMultiplier(productSearch);
      if (qty !== null) {
        // If last search result exists, add it with this quantity
        if (filteredProducts.length > 0) {
          addProductToCart(filteredProducts[0], qty);
          setProductSearch('');
          setFilteredProducts([]);
        }
      }
    }
  };

  const addProductToCart = (product, quantity = 1) => {
    // Validate quantity is positive
    if (quantity <= 0) {
      alert('Quantity must be positive!');
      return;
    }

    // Check if product already in cart
    const existingIndex = cartItems.findIndex((item) => item.product.productId === product.productId);
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCartItems(updated);
    } else {
      // Add new item
      const unitPrice = product.retailPrice || 0;
      setCartItems([
        ...cartItems,
        {
          product,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
        },
      ]);
    }
    setProductSearch('');
    setFilteredProducts([]);
  };

  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeCartItem(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQuantity;
    updated[index].subtotal = newQuantity * updated[index].unitPrice;
    setCartItems(updated);
  };

  const removeCartItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const grandTotal = subtotal - discountAmount;

  const handleProceedToConfirmation = () => {
    // Validation
    if (!selectedCustomer) {
      alert('Please select or add a customer!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }
    if (grandTotal < 0) {
      alert('Grand total cannot be negative!');
      return;
    }

    // Navigate to confirmation page with state
    // (For now, we'll just show a confirmation here - in production, use React Router navigate)
    const confirmProceed = window.confirm(
      `Confirm billing for ${selectedCustomer.name}?\n\n` +
        `Subtotal: Rs. ${subtotal.toFixed(2)}\n` +
        `Discount: ${discountPercentage}% (Rs. ${discountAmount.toFixed(2)})\n` +
        `Grand Total: Rs. ${grandTotal.toFixed(2)}\n` +
        `Payment: ${paymentMethod}`
    );

    if (confirmProceed) {
      submitBilling();
    }
  };

  const submitBilling = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = {
        customerId: selectedCustomer.customerId,
        items: cartItems.map((item) => ({
          productId: item.product.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNo: item.product.batchNo || '',
        })),
        discountPercentage: parseFloat(discountPercentage) || 0,
        paymentMethod,
        notes: notes.trim() || null,
      };

      const response = await api('/api/billings', {
        method: 'POST',
        body: request,
        token,
      });

      alert(`Billing created successfully!\nBilling Number: ${response.billingNumber}\n\n(Auto-print will be implemented)`);

      // Reset form
      setSelectedCustomer(null);
      setCartItems([]);
      setDiscountPercentage(0);
      setPaymentMethod('CASH');
      setNotes('');
      setCustomerSearch('');
      setProductSearch('');
    } catch (err) {
      setError(err.message || 'Failed to create billing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Billing / Sales</h2>

      {error && <div style={{ color: 'red', marginBottom: 12, padding: 10, background: '#fee', border: '1px solid red' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
        {/* LEFT SIDE: Customer + Product Search */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 16, borderRadius: 8, background: '#fafafa' }}>
          <h3>Customer Section</h3>
          {!selectedCustomer ? (
            <>
              <input
                type="text"
                placeholder="Search customer by name, phone, address..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }}
              />
              {filteredCustomers.length > 0 && (
                <div style={{ border: '1px solid #ccc', background: '#fff', maxHeight: 200, overflowY: 'auto' }}>
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.customerId}
                      onClick={() => handleSelectCustomer(c)}
                      style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #eee' }}
                    >
                      <strong>{c.name}</strong> - {c.phone} {c.address && `(${c.address})`}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowNewCustomerModal(true)}
                style={{
                  marginTop: 12,
                  padding: '10px 16px',
                  background: '#4caf50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                + Add New Customer
              </button>
            </>
          ) : (
            <div style={{ padding: 12, background: '#e8f5e9', border: '1px solid #4caf50', borderRadius: 4 }}>
              <p style={{ margin: 0 }}>
                <strong>Selected:</strong> {selectedCustomer.name}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Phone:</strong> {selectedCustomer.phone}
              </p>
              {selectedCustomer.address && (
                <p style={{ margin: 0 }}>
                  <strong>Address:</strong> {selectedCustomer.address}
                </p>
              )}
              <p style={{ margin: 0 }}>
                <strong>Default Discount:</strong> {selectedCustomer.discountPercentage || 0}%
              </p>
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setDiscountPercentage(0);
                }}
                style={{ marginTop: 8, padding: '6px 12px', background: '#ff9800', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Change Customer
              </button>
            </div>
          )}

          <hr style={{ margin: '24px 0' }} />

          <h3>Product Search & Add</h3>
          <input
            type="text"
            placeholder="Search product (name, code, category) or enter qty multiplier (e.g., 12*)"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
            style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }}
          />
          <small style={{ color: '#666' }}>Tip: Type product name, then press Enter. Or type "12*" and press Enter to add 12 units of the last searched product.</small>
          {filteredProducts.length > 0 && (
            <div style={{ border: '1px solid #ccc', background: '#fff', maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
              {filteredProducts.map((p) => (
                <div
                  key={p.productId}
                  onClick={() => addProductToCart(p, 1)}
                  style={{ padding: 10, cursor: 'pointer', borderBottom: '1px solid #eee' }}
                >
                  <strong>{p.productName}</strong> ({p.productCode}) - Rs. {p.retailPrice?.toFixed(2) || '0.00'}
                  <br />
                  <small>
                    Generic: {p.genericName || 'N/A'} | Category: {p.category?.categoryName || 'N/A'} | Stock: {p.currentStock || 0}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Cart + Totals + Payment */}
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 16, borderRadius: 8, background: '#fafafa' }}>
          <h3>Cart ({cartItems.length} items)</h3>
          {cartItems.length === 0 ? (
            <p style={{ color: '#999' }}>No items added yet</p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {cartItems.map((item, idx) => (
                <div key={idx} style={{ padding: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{item.product.productName}</strong> ({item.product.productCode})
                      <br />
                      <small>
                        Unit Price: Rs. {item.unitPrice.toFixed(2)} | Qty:{' '}
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(idx, parseInt(e.target.value, 10) || 1)}
                          style={{ width: 60, padding: 4 }}
                        />
                      </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>Rs. {item.subtotal.toFixed(2)}</strong>
                      <br />
                      <button
                        onClick={() => removeCartItem(idx)}
                        style={{ marginTop: 4, padding: '4px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr style={{ margin: '16px 0' }} />

          <div style={{ padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Subtotal:</span>
              <strong>Rs. {subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>Discount (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                style={{ width: 80, padding: 4 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Discount Amount:</span>
              <span>-Rs. {discountAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: 8 }}>
              <span>Grand Total:</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <hr style={{ margin: '16px 0' }} />

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Payment Method:</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: 8 }}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE_PAYMENT">Mobile Payment</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Notes (optional):</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" style={{ width: '100%', padding: 8 }} placeholder="Any notes..."></textarea>
          </div>

          <button
            onClick={handleProceedToConfirmation}
            disabled={loading || !selectedCustomer || cartItems.length === 0}
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: 16,
              fontWeight: 'bold',
              background: loading || !selectedCustomer || cartItems.length === 0 ? '#ccc' : '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: loading || !selectedCustomer || cartItems.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : 'Confirm & Create Billing'}
          </button>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowNewCustomerModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 400 }}>
            <h3>Add New Customer</h3>
            <form onSubmit={handleAddNewCustomer}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Phone *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowNewCustomerModal(false)} style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: 4 }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4 }}>
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}