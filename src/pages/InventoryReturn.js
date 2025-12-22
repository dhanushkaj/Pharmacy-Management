import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';
import '../App.css';

const InventoryReturn = () => {
  const { token } = useContext(AuthContext);

  // Form state
  const [returnType, setReturnType] = useState('FROM_CUSTOMER');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [reason, setReason] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Data state
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [returns, setReturns] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('ALL');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load products, customers and suppliers
  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadSuppliers();
    loadReturns();
  }, [currentPage, filter]);

  // Filter products based on search
  useEffect(() => {
    if (productSearch.trim()) {
      const searchLower = productSearch.toLowerCase();
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.genericName?.toLowerCase().includes(searchLower) ||
        p.productCode.toLowerCase().includes(searchLower)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  const loadProducts = async () => {
    try {
      const data = await api('/api/products', { token });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await api('/api/customers', { token });
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
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
      let url = `/api/inventory-returns?page=${currentPage}&size=20`;
      if (filter !== 'ALL') {
        url = `/api/inventory-returns/type/${filter}?page=${currentPage}&size=20`;
      }
      const data = await api(url, { token });
      setReturns(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error('Failed to load returns:', err);
      setError('Failed to load returns');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!productId) {
      setError('Please select a product');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (!unitPrice || unitPrice <= 0) {
      setError('Please enter a valid unit price');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter a reason');
      return;
    }
    if (returnType === 'FROM_CUSTOMER') {
      if (isNewCustomer && !customerName.trim()) {
        setError('Customer name is required for new customer');
        return;
      }
      if (!isNewCustomer && !customerId) {
        setError('Please select a customer or choose "New Customer"');
        return;
      }
    }
    if (returnType === 'TO_SUPPLIER' && !supplierId) {
      setError('Please select a supplier for supplier returns');
      return;
    }

    try {
      // Get customer name - either from dropdown or typed new customer
      let finalCustomerName = null;
      if (returnType === 'FROM_CUSTOMER') {
        if (isNewCustomer) {
          finalCustomerName = customerName.trim();
        } else {
          const selectedCustomer = customers.find(c => c.customerId === parseInt(customerId));
          finalCustomerName = selectedCustomer ? selectedCustomer.name : null;
        }
      }

      const payload = {
        productId: parseInt(productId),
        returnType,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        reason: reason.trim(),
        batchNo: batchNo.trim() || null,
        customerName: finalCustomerName,
        supplierId: returnType === 'TO_SUPPLIER' ? parseInt(supplierId) : null,
        notes: notes.trim() || null
      };

      await api('/api/inventory-returns', {
        method: 'POST',
        body: JSON.stringify(payload),
        token
      });

      setSuccess('Inventory return recorded successfully!');
      resetForm();
      loadReturns();
    } catch (err) {
      setError(err.message || 'Failed to record inventory return');
    }
  };

  const resetForm = () => {
    setProductId('');
    setProductSearch('');
    setQuantity('');
    setUnitPrice('');
    setReason('');
    setBatchNo('');
    setCustomerId('');
    setCustomerName('');
    setIsNewCustomer(false);
    setSupplierId('');
    setNotes('');
  };

  const handleProductChange = (e) => {
    const pid = e.target.value;
    setProductId(pid);
    
    // Auto-populate unit price based on product
    const product = products.find(p => p.productId === parseInt(pid));
    if (product && product.price) {
      setUnitPrice(product.price);
    }
  };

  return (
    <div className="inventory-return-container" style={{ padding: '20px' }}>
      <h2>Inventory Returns</h2>

      {/* Return Form */}
      <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>Record Return</h3>
        
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {/* Return Type */}
            <div>
              <label>Return Type *</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="FROM_CUSTOMER">From Customer (Add to Stock)</option>
                <option value="TO_SUPPLIER">To Supplier (Reduce Stock)</option>
              </select>
            </div>

            {/* Product Search */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Search Product</label>
              <input
                type="text"
                placeholder="Search by name, generic name, or code..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            {/* Product */}
            <div>
              <label>Product *</label>
              <select
                value={productId}
                onChange={handleProductChange}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">-- Select Product --</option>
                {filteredProducts.map(p => (
                  <option key={p.productId} value={p.productId}>
                    {p.productCode} - {p.name}
                  </option>
                ))}
              </select>
              {productId && (
                <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                  Selected: {filteredProducts.find(p => p.productId === parseInt(productId))?.name}
                </small>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            {/* Unit Price */}
            <div>
              <label>Unit Price *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            {/* Batch No */}
            <div>
              <label>Batch No</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            {/* Conditional fields based on return type */}
            {returnType === 'FROM_CUSTOMER' && (
              <>
                <div>
                  <label>Customer *</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={isNewCustomer}
                        onChange={(e) => {
                          setIsNewCustomer(e.target.checked);
                          if (e.target.checked) {
                            setCustomerId('');
                          } else {
                            setCustomerName('');
                          }
                        }}
                      />
                      New Customer
                    </label>
                  </div>
                </div>
                
                {!isNewCustomer ? (
                  <div>
                    <label>Select Customer *</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => (
                        <option key={c.customerId} value={c.customerId}>
                          {c.name} {c.phoneNumber ? `- ${c.phoneNumber}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      placeholder="Enter new customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>
                )}
              </>
            )}

            {returnType === 'TO_SUPPLIER' && (
              <div>
                <label>Supplier *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reason */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="2"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Record Return
            </button>
            <button type="button" onClick={resetForm} style={{ padding: '10px 20px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Returns List */}
      <div>
        <h3>Return History</h3>
        
        {/* Filter */}
        <div style={{ marginBottom: '15px' }}>
          <label>Filter: </label>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(0);
            }}
            style={{ padding: '8px', marginLeft: '10px' }}
          >
            <option value="ALL">All Returns</option>
            <option value="FROM_CUSTOMER">From Customer</option>
            <option value="TO_SUPPLIER">To Supplier</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Product</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Type</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Quantity</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Unit Price</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Total</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Customer/Supplier</th>
              <th style={{ border: '1px solid #ddd', padding: '10px' }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {returns.map(ret => (
              <tr key={ret.returnId}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {new Date(ret.returnDate).toLocaleDateString()}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {ret.productCode} - {ret.productName}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: ret.returnType === 'FROM_CUSTOMER' ? '#d4edda' : '#f8d7da',
                    color: ret.returnType === 'FROM_CUSTOMER' ? '#155724' : '#721c24'
                  }}>
                    {ret.returnType === 'FROM_CUSTOMER' ? 'From Customer' : 'To Supplier'}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                  {ret.quantity}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                  ${ret.unitPrice.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                  ${ret.totalAmount.toFixed(2)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {ret.customerName || ret.supplierName || '-'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {ret.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{ padding: '8px 16px', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '8px' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              style={{ padding: '8px 16px', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryReturn;
