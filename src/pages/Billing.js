import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

// Print styles for thermal printer
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #billing-thermal-print, #billing-thermal-print * {
      visibility: visible;
    }
    #billing-thermal-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 80mm !important;
      margin: 0;
      padding: 10mm !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export default function Billing() {
  const { token, hasRole } = useContext(AuthContext);
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [showPriceOptions, setShowPriceOptions] = useState(false);
  const [priceOptions, setPriceOptions] = useState([]);

  // Cart Section
  const [cartItems, setCartItems] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  // Bill Preview Modal
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [createdBilling, setCreatedBilling] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  // Track manual discount input
  const [isDiscountManual, setIsDiscountManual] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('storeSettings');
    if (saved) {
      setStoreSettings(JSON.parse(saved));
    }
    
    // Inject print styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);
    
    fetchCustomers();
    fetchProducts();
    
    return () => {
      if (styleEl.parentNode) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api('/api/customers', { token });
      // Handle paginated response or direct array
      const customers = data?.content ? data.content : Array.isArray(data) ? data : [];
      setAllCustomers(customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Failed to load customers: ' + err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api('/api/products', { token });
      // Handle paginated response or direct array
      const products = data?.content ? data.content : Array.isArray(data) ? data : [];
      
      // Fetch inventory for each product to get selling prices
      const productsWithPrices = await Promise.all(
        products.map(async (product) => {
          try {
            const inventory = await api(`/api/products/${product.productId}/inventory`, { token });
            // Get unique selling prices from inventory (price is returned as string, convert to number)
            const prices = [...new Set(inventory.map(item => parseFloat(item.price) || 0))].filter(p => p > 0);
            // Calculate total stock from all inventory items
            const totalStock = inventory.reduce((sum, item) => sum + (item.stock || 0), 0);
            return {
              ...product,
              sellingPrices: prices.length > 0 ? prices : null,
              hasMultiplePrices: prices.length > 1,
              totalStock: totalStock
            };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch inventory for product ${product.name}:`, err.message);
            return {
              ...product,
              sellingPrices: null,
              hasMultiplePrices: false,
              totalStock: 0
            };
          }
        })
      );
      
      setAllProducts(productsWithPrices);
    } catch (err) {
      console.error('❌ Failed to load products:', err);
      setError('Failed to load products: ' + err.message);
    }
  };

  // Customer search filter
  useEffect(() => {
    if (!customerSearch || !customerSearch.trim()) {
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
    setFilteredCustomers(filtered);
  }, [customerSearch, allCustomers]);

  // Product search filter (ignore quantity prefix like 14*panadol)
  useEffect(() => {
    if (!productSearch || !productSearch.trim()) {
      setFilteredProducts([]);
      setSelectedProductIndex(-1);
      return;
    }
    // Remove quantity prefix (e.g., '12*') for search
    let searchName = productSearch.replace(/^\s*\d+\s*\*\s*/, '').trim().toLowerCase();
    if (!searchName) {
      setFilteredProducts([]);
      setSelectedProductIndex(-1);
      return;
    }
    // Escape regex special characters in searchName
    const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeSearchName = escapeRegex(searchName);
    // 1. Exact match (full string)
    let filtered = allProducts.filter(p => p.name?.toLowerCase() === safeSearchName);
    // 2. Word boundary match (e.g., 'ATORVA' matches 'ATORVA 10MG', 'ATORVA TAB')
    if (filtered.length === 0) {
      const wordBoundary = new RegExp(`\\b${safeSearchName}\\b`, 'i');
      filtered = allProducts.filter(p => wordBoundary.test(p.name));
    }
    // 3. Prefix match
    if (filtered.length === 0) {
      filtered = allProducts.filter(p => p.name?.toLowerCase().startsWith(safeSearchName));
    }
    // 4. Fallback: includes in name, generic, category, code
    if (filtered.length === 0) {
      filtered = allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(safeSearchName) ||
          p.genericName?.toLowerCase().includes(safeSearchName) ||
          p.category?.name?.toLowerCase().includes(safeSearchName) ||
          p.productCode?.toLowerCase().includes(safeSearchName)
      );
    }
    setFilteredProducts(filtered);
    setSelectedProductIndex(-1);
  }, [productSearch, allProducts]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setDiscountPercentage(customer.discountPercentage || 0);
    // Set discountAmount to use only Customer Discount Base for first time
    if (cartItems.length > 0) {
      // Only use customer discount base (items without product discount)
      const customerDiscountBase = cartItems.reduce((sum, item) => {
        if (!item.productDiscount || item.productDiscount === 0) {
          return sum + (item.unitPrice * item.quantity);
        }
        return sum;
      }, 0);
      const customerDiscountTotal = customerDiscountBase * (customer.discountPercentage / 100);
      setDiscountAmount(Number(customerDiscountTotal.toFixed(2)));
      setIsDiscountManual(false);
    } else {
      setDiscountAmount(0);
      setIsDiscountManual(false);
    }
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

  // Parse quantity multiplier (e.g., "paracetamol *12" means 12 units)
  // Parse quantity multiplier (supports both '12*panadol' and 'panadol*12')
  const parseQuantityMultiplier = (text) => {
    if (!text) return 1;
    // Match '12*panadol' or 'panadol*12' or '12 * panadol' or 'panadol * 12'
    let match = text.trim().match(/^(\d+)\s*\*/);
    if (match) return parseInt(match[1], 10);
    match = text.trim().match(/\*(\d+)\s*$/);
    if (match) return parseInt(match[1], 10);
    return 1;
  };

  // Extract product name without quantity multiplier
  // Extract product name without quantity multiplier (supports both '12*panadol' and 'panadol*12')
  const getProductNameFromSearch = (text) => {
    if (!text) return '';
    // Remove '12*' from start or '*12' from end
    return text.trim().replace(/^(\d+)\s*\*/, '').replace(/\*\d+\s*$/, '').trim();
  };

  const handleSelectProductFromDropdown = async (product) => {
    // Validate product is not null
    if (!product || !product.productId) {
      console.error('Invalid product passed to handleSelectProductFromDropdown:', product);
      setFilteredProducts([]);
      setProductSearch('');
      return;
    }
    
    // Parse quantity from search box (if user typed "*12" etc)
    const quantity = parseQuantityMultiplier(productSearch);
    
    // Close dropdown immediately
    setFilteredProducts([]);
    setSelectedProductIndex(-1);
    
    // Check if product has inventory and prices
    if (!product.sellingPrices || product.sellingPrices.length === 0) {
      alert('No inventory found for this product! Please add inventory first.');
      setProductSearch('');
      return;
    }
    
    // If product has multiple prices, show price selection modal
    if (product.hasMultiplePrices && product.sellingPrices.length > 1) {
      await fetchInventoryForProduct(product, quantity);
      // Don't clear selectedProduct here - it's needed for the price modal
      setProductSearch('');
    } else {
      // Single price - add directly to cart
      const price = product.sellingPrices[0];
      addProductToCart(product, quantity, price);
      // Clear search box and selected product after adding to cart
      setProductSearch('');
      setSelectedProduct(null);
    }
  };

  const handleProductSearchKeyDown = async (e) => {
    // Handle arrow key navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        setSelectedProductIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
      }
      return;
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If a product is highlighted with arrow keys, select it
      if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
        handleSelectProductFromDropdown(filteredProducts[selectedProductIndex]);
        return;
      }
      
      const quantity = parseQuantityMultiplier(productSearch);
      const productName = getProductNameFromSearch(productSearch);
      
      // Find product by name
      let product = selectedProduct;
      if (!product) {
        product = allProducts.find(p => 
          p.name?.toLowerCase() === productName.toLowerCase()
        );
      }
      
      if (!product && filteredProducts.length > 0) {
        product = filteredProducts[0];
      }
      
      if (!product) {
        alert('Product not found! Please select a product from the dropdown first.');
        return;
      }
      
      // Fetch inventory items for this product to show price options
      await fetchInventoryForProduct(product, quantity);
    }
  };

  const fetchInventoryForProduct = async (product, quantity) => {
    if (!product || !product.productId) {
      console.error('Invalid product in fetchInventoryForProduct:', product);
      return;
    }
    
    try {
      const data = await api(`/api/products/${product.productId}/inventory`, { token });
      
      if (!data || data.length === 0) {
        alert('No inventory found for this product! Please add inventory first.');
        return;
      }
      
      // Group by selling price (price is returned as string, convert to number)
      const priceGroups = {};
      data.forEach(item => {
        const price = parseFloat(item.price) || 0;
        if (!priceGroups[price]) {
          priceGroups[price] = {
            price,
            totalStock: 0,
            items: []
          };
        }
        priceGroups[price].totalStock += item.stock || 0;
        priceGroups[price].items.push(item);
      });
      
      const options = Object.values(priceGroups);
      console.log('Price options:', options);
      
      if (options.length === 1) {
        // Only one price, add directly to cart
        addProductToCart(product, quantity, options[0].price);
      } else {
        // Multiple prices, show selection modal
        setPriceOptions(options.map(opt => ({ ...opt, quantity })));
        setSelectedProduct(product);
        setShowPriceOptions(true);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      alert('Failed to fetch inventory: ' + err.message);
    }
  };

  const handleSelectPriceOption = (priceOption) => {
    if (!selectedProduct) {
      console.error('No product selected');
      setShowPriceOptions(false);
      setPriceOptions([]);
      return;
    }
    addProductToCart(selectedProduct, priceOption.quantity, priceOption.price);
    setShowPriceOptions(false);
    setPriceOptions([]);
    setSelectedProduct(null);
    setProductSearch('');
  };

  const addProductToCart = (product, quantity = 1, unitPrice = null) => {
    console.log('Adding to cart:', product, 'Quantity:', quantity, 'Unit Price:', unitPrice);
    
    // Validate product is not null
    if (!product || !product.productId) {
      console.error('Invalid product:', product);
      alert('Error: Invalid product data. Please try again.');
      return;
    }
    
    // Validate quantity is positive
    if (quantity <= 0) {
      alert('Quantity must be positive!');
      return;
    }

    // Use provided price or fallback to product price
    const finalPrice = unitPrice !== null ? unitPrice : (product.retailPrice || product.sellingPrice || product.price || 0);
    console.log('Final price:', finalPrice, 'Product:', product);
    
    if (finalPrice === 0) {
      alert('Warning: Product has no price set! Please check product configuration.');
    }

    // Allow inventory to go negative: Commented out stock validation
    // if (product.totalStock !== undefined && product.totalStock < quantity) {
    //   alert(`Insufficient stock for product '${product.name}'. Available: ${product.totalStock}, Requested: ${quantity}`);
    //   return;
    // }

    // Check if product already in cart with same price
    const existingIndex = cartItems.findIndex((item) => 
      item && item.product && item.product.productId === product.productId && item.unitPrice === finalPrice
    );
    let newCartItems;
    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      // Keep productDiscount if already set
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      newCartItems = updated;
      setCartItems(updated);
    } else {
      // Use product.maxDiscount if available, else 0
      const maxDiscount = product.maxDiscount ? Number(product.maxDiscount) : 0;
      newCartItems = [
        ...cartItems,
        {
          product,
          quantity,
          unitPrice,
          productDiscount: maxDiscount,
          subtotal: quantity * unitPrice,
        },
      ];
      setCartItems(newCartItems);
    }
    // If customer is selected and discount is not manually overridden, recalculate discountAmount using only Customer Discount Base
    if (selectedCustomer && !isDiscountManual) {
      // Only use items with NO product discount for customer discount base
      const customerDiscountBase = newCartItems.reduce((sum, item) => {
        if (!item.productDiscount || item.productDiscount === 0) {
          return sum + (item.unitPrice * item.quantity);
        }
        return sum;
      }, 0);
      const customerDiscountTotal = customerDiscountBase * (selectedCustomer.discountPercentage / 100);
      setDiscountAmount(Number(customerDiscountTotal.toFixed(2)));
    }
    setProductSearch('');
    setFilteredProducts([]);
    setSelectedProduct(null);
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

  // Calculate product-level and customer discounts separately
  const productLevelDiscounts = cartItems.map(item => {
    if (item.productDiscount && item.productDiscount > 0) {
      // Product-specific discount: subtract from product price before subtotal
      return Math.min(item.unitPrice * item.quantity * (item.productDiscount / 100), item.unitPrice * item.quantity);
    }
    return 0;
  });
  const totalProductLevelDiscount = productLevelDiscounts.reduce((sum, d) => sum + d, 0);

  // Calculate subtotal after product discounts
  const subtotalAfterProductDiscounts = cartItems.reduce((sum, item, idx) => {
    if (item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity - productLevelDiscounts[idx]);
    }
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  // Customer discount only for items without product discount
  // Customer discount base: sum only items without product discount
  const customerDiscountBase = cartItems.reduce((sum, item) => {
    if (!item.productDiscount || item.productDiscount === 0) {
      return sum + (item.unitPrice * item.quantity);
    }
    return sum;
  }, 0);
  const customerDiscountTotal = customerDiscountBase * (discountPercentage / 100);

  // Subtotal for display (after product discounts)
  const subtotal = Number(cartItems.reduce((sum, item) => {
    if (item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity - item.unitPrice * item.quantity * (item.productDiscount / 100));
    }
    return sum + (item.unitPrice * item.quantity);
  }, 0).toFixed(2));
  // Product discount total: sum of all product-specific discounts
  const productDiscountTotal = cartItems.reduce((sum, item) => {
    if (item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity * (item.productDiscount / 100));
    }
    return sum;
  }, 0);
  // Customer discount total: always use only Customer Discount Base * discountPercentage
  // (already calculated above)
  const calculatedDiscount = Number((productDiscountTotal + customerDiscountTotal).toFixed(2));
  // Allow manual override of discountAmount
  const validDiscount = (discountAmount !== null && discountAmount !== undefined && discountAmount !== '' && parseFloat(discountAmount) >= 0)
    ? Math.min(Number(parseFloat(discountAmount).toFixed(2)), subtotal)
    : calculatedDiscount;
  const grandTotal = Number((subtotal - validDiscount).toFixed(2));

  const handleProceedToConfirmation = () => {
    // Validation
    if (!selectedCustomer || !selectedCustomer.customerId || selectedCustomer.customerId === '' || selectedCustomer.customerId === null || selectedCustomer.customerId === undefined || selectedCustomer.customerId === 0) {
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
      // Always send the sum of product + customer discount unless manually overridden
      const calculatedDiscount = Number((productDiscountTotal + customerDiscountTotal).toFixed(2));
      const discountToSave = (isDiscountManual && discountAmount !== null && discountAmount !== undefined && discountAmount !== '' && parseFloat(discountAmount) >= 0)
        ? Math.min(Number(parseFloat(discountAmount).toFixed(2)), subtotal)
        : calculatedDiscount;
      const request = {
        customerId: selectedCustomer.customerId,
        items: cartItems.map((item) => ({
          productId: item.product.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNo: item.product.batchNo || '',
        })),
        discountPercentage: parseFloat(discountPercentage) || 0,
        totalDiscount: discountToSave, // always send the correct total discount
        discountAmount: discountToSave, // always send the correct total discount
        paymentMethod,
        notes: notes.trim() || null,
      };

      const response = await api('/api/billings', {
        method: 'POST',
        body: request,
        token,
      });
      if (response) {
        response.discountAmount = validDiscount; // always use the manually adjusted Discount Amount for print
      }
      setCreatedBilling(response);
      setShowBillPreview(true);

    } catch (err) {
      setError(err.message || 'Failed to create billing');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAndClose = () => {
    // Auto-print with slight delay for modal to render
    setTimeout(() => {
      window.print();
    }, 300);
    
    // Close modal after print dialog (or immediate in kiosk mode)
    setTimeout(() => {
      resetForm();
      setShowBillPreview(false);
    }, 1000);
  };

  const handleCloseWithoutPrint = () => {
    resetForm();
    setShowBillPreview(false);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCartItems([]);
    setDiscountPercentage(0);
    setPaymentMethod('CASH');
    setNotes('');
    setCustomerSearch('');
    setProductSearch('');
    setCreatedBilling(null);
  };

  // Also, when cartItems change, update discountAmount if it was set by customer discount

  // Always recalculate discountAmount using only Customer Discount Base when cart changes, if not manually overridden
  useEffect(() => {
    if (selectedCustomer && !isDiscountManual) {
      const customerDiscountBase = cartItems.reduce((sum, item) => {
        if (!item.productDiscount || item.productDiscount === 0) {
          return sum + (item.unitPrice * item.quantity);
        }
        return sum;
      }, 0);
      const customerDiscountTotal = customerDiscountBase * (selectedCustomer.discountPercentage / 100);
      setDiscountAmount(Number(customerDiscountTotal.toFixed(2)));
    }
  }, [cartItems, selectedCustomer, isDiscountManual]);

  // Update discount amount when items are added or removed from cart. If no items remain, clear the discount amount.

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
            placeholder="Type product name... (e.g., 'paracetamol' or 'paracetamol 12*' for 12 units)"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
            style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8 }}
          />
          <small style={{ color: '#666', display: 'block', marginBottom: 8 }}>
            <strong>Quick Add Instructions:</strong><br />
            1. Type product name - dropdown appears<br />
            2. <strong>Click on product</strong> or use <strong>Arrow Keys + Enter</strong> to select<br />
            3. Product automatically added to cart (qty: 1)<br />
            4. For multiple units: Type <strong>*12</strong> before selecting for 12 units<br />
            5. If multiple prices available, a selection dialog will appear
            <br />
            <span style={{ fontSize: 10, color: '#999' }}>
              {allProducts.length} total products | {filteredProducts.length} filtered
            </span>
          </small>
          {filteredProducts.length > 0 && (
            <div style={{ border: '1px solid #ccc', background: '#fff', maxHeight: 300, overflowY: 'auto', marginTop: 8 }}>
              {filteredProducts.filter(p => p != null).map((p, idx) => {
                const isSelected = idx === selectedProductIndex;
                
                // If product has multiple prices, show each price as a separate row
                if (p.hasMultiplePrices && p.sellingPrices && p.sellingPrices.length > 1) {
                  return p.sellingPrices.map((price, priceIdx) => (
                    <div
                      key={`${p.productId}-${priceIdx}`}
                      onClick={() => handleSelectProductFromDropdown(p)}
                      style={{
                        padding: 12,
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        background: isSelected && priceIdx === 0 ? '#e3f2fd' : '#fff'
                      }}
                      onMouseEnter={() => setSelectedProductIndex(idx)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
                            {p.name || 'N/A'}
                          </div>
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            {p.category?.name || 'N/A'} | Stock: {p.totalStock || 0} units
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 16, minWidth: 100 }}>
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#4caf50' }}>
                            Rs. {price.toFixed(2)}
                          </div>
                          {priceIdx > 0 && (
                            <div style={{ fontSize: 10, color: '#999' }}>
                              Option {priceIdx + 1}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                }
                
                // Single price product - show in one row
                return (
                  <div
                    key={p.productId}
                    onClick={() => handleSelectProductFromDropdown(p)}
                    style={{
                      padding: 12,
                      cursor: 'pointer',
                      borderBottom: '1px solid #eee',
                      background: isSelected ? '#e3f2fd' : '#fff'
                    }}
                    onMouseEnter={() => setSelectedProductIndex(idx)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1976d2' }}>
                          {p.name || 'N/A'}
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                          {p.category?.name || 'N/A'} | Stock: {p.totalStock || 0} units
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 16, minWidth: 100 }}>
                        {p.sellingPrices && p.sellingPrices.length > 0 ? (
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#4caf50' }}>
                            Rs. {p.sellingPrices[0].toFixed(2)}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#ff9800' }}>
                            No Price
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
              {cartItems.filter(item => item && item.product).map((item, idx) => (
                <div key={idx} style={{ padding: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 'bold', marginBottom: 4, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>
                        Code: {item.product.productCode}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13 }}>Unit Price: Rs. {item.unitPrice.toFixed(2)}</span>
                        <span style={{ fontSize: 13 }}>|</span>
                        <span style={{ fontSize: 13 }}>Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(idx, parseInt(e.target.value, 10) || 1)}
                          style={{ width: 60, padding: 4, fontSize: 13 }}
                        />
                      </div>
                      {/* Product-level discount input, UI only */}
                      <div style={{ marginTop: 6 }}>
                        <label style={{ fontSize: 12, color: '#888' }}>Product Discount (%): </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.productDiscount || ''}
                          onChange={e => {
                            if (item.product.maxDiscount) return; // If maxDiscount is set, do not allow editing
                            const val = e.target.value === '' ? 0 : Number(parseFloat(e.target.value).toFixed(2));
                            const updated = [...cartItems];
                            updated[idx].productDiscount = val;
                            setCartItems(updated);
                          }}
                          style={{ width: 80, padding: 4, fontSize: 12, marginLeft: 4 }}
                          disabled={!!item.product.maxDiscount}
                        />
                        {item.product.maxDiscount && (
                          <span style={{ color: '#888', fontSize: 10, marginLeft: 8 }}>
                            (From Product Table)
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#2196f3', marginBottom: 8 }}>
                        Rs. {(
                          item.productDiscount && item.productDiscount > 0
                            ? (item.unitPrice * item.quantity - item.unitPrice * item.quantity * (item.productDiscount / 100))
                            : item.unitPrice * item.quantity
                        ).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeCartItem(idx)}
                        style={{ padding: '6px 12px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Customer Discount Base:</span>
              <span>Rs. {customerDiscountBase.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>Customer Discount (%):</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercentage}
                onChange={e => {
                  const newPercentage = parseFloat(e.target.value) || 0;
                  setDiscountPercentage(newPercentage);
                  // Recalculate discountAmount based on new percentage
                  const newDiscountAmount = customerDiscountBase * newPercentage / 100;
                  setDiscountAmount(newDiscountAmount);
                  setIsDiscountManual(false);
                }}
                style={{ width: 80, padding: 4, marginRight: 8 }}
              />
              <span>or Discount Amount:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.01"
                  value={discountAmount !== null && discountAmount !== undefined && discountAmount !== '' ? Number(parseFloat(discountAmount).toFixed(2)) : ''}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Number(parseFloat(e.target.value).toFixed(2));
                    setDiscountAmount(val);
                    setIsDiscountManual(true);
                  }}
                  style={{ width: 100, padding: 4 }}
                />
                <button
                  type="button"
                  onClick={() => { setDiscountAmount(''); setIsDiscountManual(false); }}
                  style={{ padding: '2px 8px', marginLeft: 4, background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                  title="Clear Discount Amount"
                >
                  ✕
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Product Discounts:</span>
              <span>-Rs. {productDiscountTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total Discount Applied:</span>
              <span>-Rs. {(
                isDiscountManual
                  ? (productDiscountTotal + (discountAmount ? Number(parseFloat(discountAmount).toFixed(2)) : 0))
                  : (productDiscountTotal + customerDiscountTotal)
              ).toFixed(2)}</span>
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
              <option value="ONLINE_TRANSFER">Online Transfer</option>
              <option value="CREDIT">Credit</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
              <option value="OLD_MANUAL">Old Manual</option>
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

      {/* Price Options Modal */}
      {showPriceOptions && (
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
          onClick={() => setShowPriceOptions(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 500 }}>
            <h3>Select Selling Price</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>
              This product has multiple selling prices in inventory. Please select one:
            </p>
            <div style={{ marginBottom: 16 }}>
              {priceOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPriceOption(option)}
                  style={{
                    padding: 16,
                    border: '2px solid #2196f3',
                    borderRadius: 8,
                    marginBottom: 12,
                    cursor: 'pointer',
                    background: '#f0f8ff',
                    // ':hover': { background: '#e3f2fd' } // Inline hover not supported in React
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2196f3' }}>
                        Rs. {option.price.toFixed(2)}
                      </div>
                      <div style={{ color: '#666', fontSize: 14 }}>
                        Available Stock: {option.totalStock} units
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        Quantity to add: {option.quantity}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#4caf50' }}>
                      Total: Rs. {(option.price * option.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowPriceOptions(false)}
              style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: 4, width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bill Preview Modal after successful billing creation */}
      {showBillPreview && createdBilling && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              maxWidth: 450,
              maxHeight: '95vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Success Header */}
            <div
              className="no-print"
              style={{
                padding: 20,
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                color: '#fff',
                textAlign: 'center',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                Billing Created Successfully!
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                Bill #{createdBilling.billingNumber}
              </div>
            </div>

            {/* Thermal Bill Content */}
            <div
              id="billing-thermal-print"
              style={{
                width: 320,
                margin: '0 auto',
                padding: '24px 20px',
                fontFamily: 'monospace',
                fontSize: 11,
                lineHeight: 1.5,
                background: '#fff',
              }}
            >
              {/* Store Header */}
              {storeSettings?.logo && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <img
                    src={storeSettings.logo}
                    alt="Logo"
                    style={{ maxWidth: 140, maxHeight: 70 }}
                  />
                </div>
              )}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                {storeSettings?.storeName || 'PHARMACY'}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                {storeSettings?.address || 'Store Address'}
              </div>
              <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                Tel: {storeSettings?.phone || 'N/A'}
              </div>
              {storeSettings?.email && (
                <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                  {storeSettings.email}
                </div>
              )}
              {storeSettings?.taxId && (
                <div style={{ textAlign: 'center', fontSize: 9, marginBottom: 2 }}>
                  Tax ID: {storeSettings.taxId}
                </div>
              )}

              <div style={{ borderTop: '2px solid #000', margin: '10px 0' }}></div>

              {/* Bill Details */}
              <div style={{ fontSize: 11, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Invoice #:</strong>
                  <span>{createdBilling.billingNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Date:</strong>
                  <span>{new Date(createdBilling.billingDate).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Customer:</strong>
                  <span>{createdBilling.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Phone:</strong>
                  <span>{createdBilling.customerPhone}</span>
                </div>
                {createdBilling.paymentMethod && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Payment:</strong>
                    <span>{createdBilling.paymentMethod}</span>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>

              {/* Items Table */}
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
                  {createdBilling.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '6px 0', fontSize: 10 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                        {item.productCode && (
                          <div style={{ fontSize: 8, color: '#666' }}>Code: {item.productCode}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '6px 0' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', padding: '6px 0' }}>
                        {item.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 'bold' }}>
                        {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>

              {/* Totals */}
              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>Subtotal:</span>
                  <span>Rs. {createdBilling.subtotal.toFixed(2)}</span>
                </div>
                {/* Show correct total discount: product + customer */}
                {((productDiscountTotal + customerDiscountTotal) > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Discount Applied:</span>
                    <span>- Rs. {(productDiscountTotal + customerDiscountTotal).toFixed(2)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '2px solid #000',
                    fontWeight: 'bold',
                    fontSize: 14,
                    marginTop: 6,
                  }}
                >
                  <span>GRAND TOTAL:</span>
                  <span>Rs. {(createdBilling.subtotal - (productDiscountTotal + customerDiscountTotal)).toFixed(2)}</span>
                </div>
              </div>

              {createdBilling.notes && (
                <>
                  <div style={{ borderTop: '1px dashed #333', margin: '10px 0' }}></div>
                  <div style={{ fontSize: 9, fontStyle: 'italic', wordWrap: 'break-word' }}>
                    <strong>Notes:</strong> {createdBilling.notes}
                  </div>
                </>
              )}

              <div style={{ borderTop: '2px solid #000', margin: '12px 0' }}></div>

              {/* Footer */}
              <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Thank You!</div>
                <div style={{ fontSize: 9 }}>Please keep this bill for warranty claims</div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 8, marginTop: 10, color: '#999' }}>
                Powered by Pharmacy Management System
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="no-print"
              style={{
                padding: 20,
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                background: '#f9f9f9',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <button
                onClick={handlePrintAndClose}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                  boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>🖨️</span>
                Print & Close
              </button>
              <button
                onClick={handleCloseWithoutPrint}
                style={{
                  padding: '12px 32px',
                  background: '#fff',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                Close Without Print
              </button>
              {hasRole && hasRole('admin') && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this billing? This action cannot be undone.')) {
                      try {
                        await api(`/api/billings/${createdBilling.billingId}`, {
                          method: 'DELETE',
                          token,
                        });
                        alert('Billing deleted successfully.');
                        setShowBillPreview(false);
                        setCreatedBilling(null);
                        resetForm();
                      } catch (err) {
                        alert('Failed to delete billing: ' + (err.message || 'Error'));
                      }
                    }
                  }}
                  style={{
                    padding: '12px 32px',
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Delete Billing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
