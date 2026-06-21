import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

export default function Billing() {
  const { token, hasRole } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Customer Section
  const [customerSearch, setCustomerSearch] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDropdownIndex, setCustomerDropdownIndex] = useState(0);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ title: '', name: '', phone: '', email: '', address: '', discountPercentage: '0', birthday: '' });

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
  const [originalCustomerDiscount, setOriginalCustomerDiscount] = useState(0); // Store original customer discount
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  // Bill Preview Modal
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [createdBilling, setCreatedBilling] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [isDirectPrintMode, setIsDirectPrintMode] = useState(false);

  // Track manual discount input
  const [isDiscountManual, setIsDiscountManual] = useState(false);

  // Refs for focus management
  const customerDiscountPercentRef = useRef(null);

  // Customer billing history (Ctrl+H)
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);
  const [customerBills, setCustomerBills] = useState([]);
  const [selectedHistoryBill, setSelectedHistoryBill] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyBillIndex, setHistoryBillIndex] = useState(0);
  const [historyItemIndex, setHistoryItemIndex] = useState(0);
  const [historySearch, setHistorySearch] = useState('');

  // Billing return (Ctrl+R)
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnProcessing, setReturnProcessing] = useState(false);

  // Payment Modal (F key)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaymentReady, setIsPaymentReady] = useState(false);

  // Quick Price Modal
  const [showQuickPriceModal, setShowQuickPriceModal] = useState(false);
  const [quickPriceCartIdx, setQuickPriceCartIdx] = useState(null);
  const [quickPriceInput, setQuickPriceInput] = useState('');
  const [quickPriceValidation, setQuickPriceValidation] = useState('');

  // Sales Target Dashboard (Mini Widget)
  const [salesTargetData, setSalesTargetData] = useState(null);
  const [salesTargetLoading, setSalesTargetLoading] = useState(true);

  // Mini Progress Bar Component for Sales Target
  const MiniProgressBar = ({ value, max, color }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const isOverTarget = value > max && max > 0;
    
    return (
      <div style={{ 
        height: 8, 
        background: '#e0e0e0', 
        borderRadius: 4, 
        overflow: 'hidden',
        marginTop: 4
      }}>
        <div style={{ 
          width: `${Math.min(percentage, 100)}%`, 
          height: '100%', 
          background: isOverTarget ? '#4caf50' : color,
          borderRadius: 4,
          transition: 'width 0.5s ease'
        }} />
      </div>
    );
  };

  // Fetch Sales Target Dashboard Data
  const fetchSalesTargetData = async () => {
    setSalesTargetLoading(true);
    try {
      const res = await fetch('/api/sales-targets/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesTargetData(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales target data:', error);
    } finally {
      setSalesTargetLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('storeSettings');
    if (saved) {
      setStoreSettings(JSON.parse(saved));
    }
    
    fetchCustomers();
    fetchProducts();
    
    // Fetch sales target data initially
    fetchSalesTargetData();
    
    // Auto-refresh sales target data every 5 minutes (300000ms)
    const salesTargetInterval = setInterval(() => {
      fetchSalesTargetData();
    }, 300000);
    
    return () => {
      clearInterval(salesTargetInterval);
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
      
      // Don't pre-fetch inventory for all products - this causes N+1 query problem!
      // Inventory will be fetched on-demand when a product is selected
      setAllProducts(products);
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
    setCustomerDropdownIndex(0);
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
    // Store the original customer discount
    const custDisc = customer.discountPercentage || 0;
    setOriginalCustomerDiscount(custDisc);
    
    // If CARD payment, cap to 2%; otherwise use full customer discount
    const effectiveDisc = paymentMethod === 'CARD' ? Math.min(custDisc, 2) : custDisc;
    setDiscountPercentage(effectiveDisc);
    
    // Set discountAmount to use only Customer Discount Base for first time
    if (cartItems.length > 0) {
      // Only use customer discount base (items without product discount, excluding returns)
      const customerDiscountBase = cartItems.filter(i => !i.isReturn).reduce((sum, item) => {
        if (!item.productDiscount || item.productDiscount === 0) {
          return sum + (item.unitPrice * item.quantity);
        }
        return sum;
      }, 0);
      const customerDiscountTotal = customerDiscountBase * (effectiveDisc / 100);
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
        body: {
          title: newCustomer.title?.trim() || null,
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email?.trim() || null,
          address: newCustomer.address?.trim() || null,
          discountPercentage: parseFloat(newCustomer.discountPercentage) || 0,
          birthday: newCustomer.birthday || null,
        },
        token,
      });
      setSelectedCustomer(created);
      setDiscountPercentage(created.discountPercentage || 0);
      setShowNewCustomerModal(false);
      setNewCustomer({ title: '', name: '', phone: '', email: '', address: '', discountPercentage: '0', birthday: '' });
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
    
    // Fetch inventory on-demand for this product (lazy loading)
    await fetchInventoryForProduct(product, quantity);
    
    // Clear search box after processing
    setProductSearch('');
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

  // Enhanced: Show all price levels FIFO (latest first, even if stock is zero)
  //           Prepare for keyboard navigation in modal
  const fetchInventoryForProduct = async (product, quantity) => {
    if (!product || !product.productId) {
      console.error('Invalid product in fetchInventoryForProduct:', product);
      return;
    }
    try {
      let data = await api(`/api/products/${product.productId}/inventory`, { token });
      if (!data || data.length === 0) {
        alert('No inventory found for this product! Please add inventory first.');
        return;
      }
      // Sort inventory by createdAt ascending (FIFO: oldest first)
      data = data.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      // Group by selling price and track latest date for each price group
      const priceGroups = {};
      data.forEach(item => {
        const price = parseFloat(item.price) || 0;
        if (!priceGroups[price]) {
          priceGroups[price] = {
            price,
            totalStock: 0,
            items: [],
            latestDate: item.createdAt ? new Date(item.createdAt) : new Date(0)
          };
        }
        priceGroups[price].totalStock += item.stock || 0;
        priceGroups[price].items.push(item);
        // Track latest date for this price group
        if (item.createdAt && new Date(item.createdAt) > priceGroups[price].latestDate) {
          priceGroups[price].latestDate = new Date(item.createdAt);
        }
      });
      // Sort price options: latest date first (FIFO), then by price desc
      let options = Object.values(priceGroups).sort((a, b) => {
        if (b.latestDate - a.latestDate !== 0) return b.latestDate - a.latestDate;
        return b.price - a.price;
      });
      // Always show all price levels, even if stock is zero
      options = options.map(opt => ({ ...opt, quantity }));
      if (options.length === 1) {
        addProductToCart(product, quantity, options[0].price);
      } else {
        setPriceOptions(options);
        setSelectedProduct(product);
        setShowPriceOptions(true);
        setSelectedPriceOptionIndex(0); // default to first
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      alert('Failed to fetch inventory: ' + err.message);
    }
  };

  // Keyboard navigation for price modal
  const [selectedPriceOptionIndex, setSelectedPriceOptionIndex] = useState(0);
  const priceModalRef = useRef(null);
  const handleSelectPriceOption = (priceOption, idx = null) => {
    if (!selectedProduct) {
      console.error('No product selected');
      setShowPriceOptions(false);
      setPriceOptions([]);
      return;
    }
    // If called from keyboard, use selectedPriceOptionIndex
    const option = idx !== null ? priceOptions[idx] : priceOption;
    addProductToCart(selectedProduct, option.quantity, option.price);
    setShowPriceOptions(false);
    setPriceOptions([]);
    setSelectedProduct(null);
    setProductSearch('');
    setSelectedPriceOptionIndex(0);
  };

  // Focus the price modal when it opens (must be at top level, not inside a function)
  useEffect(() => {
    if (showPriceOptions && priceModalRef.current) {
      priceModalRef.current.focus();
    }
  }, [showPriceOptions]);

  // Focus the discount input when payment modal opens
  useEffect(() => {
    if (showPaymentModal && customerDiscountPercentRef.current) {
      customerDiscountPercentRef.current.focus();
    }
  }, [showPaymentModal]);

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

    // Check if product already in cart with same price (only match non-return items)
    const existingIndex = cartItems.findIndex((item) => 
      item && item.product && !item.isReturn && item.product.productId === product.productId && item.unitPrice === finalPrice
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
      // Only use items with NO product discount for customer discount base (excluding returns)
      const customerDiscountBase = newCartItems.filter(i => !i.isReturn).reduce((sum, item) => {
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
  // Separate normal items and return items for calculations
  const normalCartItems = cartItems.filter(item => !item.isReturn);
  const returnCartItems = cartItems.filter(item => item.isReturn);

  // Product discounts only apply if customer discount is also applied
  const hasCustomerDiscount = discountPercentage > 0;

  const productLevelDiscounts = normalCartItems.map(item => {
    if (hasCustomerDiscount && item.productDiscount && item.productDiscount > 0) {
      return Math.min(item.unitPrice * item.quantity * (item.productDiscount / 100), item.unitPrice * item.quantity);
    }
    return 0;
  });
  const totalProductLevelDiscount = productLevelDiscounts.reduce((sum, d) => sum + d, 0);

  const subtotalAfterProductDiscounts = normalCartItems.reduce((sum, item, idx) => {
    if (hasCustomerDiscount && item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity - productLevelDiscounts[idx]);
    }
    return sum + (item.unitPrice * item.quantity);
  }, 0);

  const customerDiscountBase = normalCartItems.reduce((sum, item) => {
    if (!hasCustomerDiscount || !item.productDiscount || item.productDiscount === 0) {
      return sum + (item.unitPrice * item.quantity);
    }
    return sum;
  }, 0);
  const customerDiscountTotal = customerDiscountBase * (discountPercentage / 100);

  // Subtotal already has product discounts applied
  const subtotal = Number(normalCartItems.reduce((sum, item) => {
    if (hasCustomerDiscount && item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity - item.unitPrice * item.quantity * (item.productDiscount / 100));
    }
    return sum + (item.unitPrice * item.quantity);
  }, 0).toFixed(2));

  const productDiscountTotal = normalCartItems.reduce((sum, item) => {
    if (hasCustomerDiscount && item.productDiscount && item.productDiscount > 0) {
      return sum + (item.unitPrice * item.quantity * (item.productDiscount / 100));
    }
    return sum;
  }, 0);

  const calculatedDiscount = Number((productDiscountTotal + customerDiscountTotal).toFixed(2));
  const validDiscount = (discountAmount !== null && discountAmount !== undefined && discountAmount !== '' && parseFloat(discountAmount) >= 0)
    ? Math.min(Number(parseFloat(discountAmount).toFixed(2)), subtotal)
    : customerDiscountTotal;
  const grandTotal = Number((subtotal - validDiscount).toFixed(2));

  // Return refund total (positive number representing total refund to customer)
  const returnRefundTotal = Number(returnCartItems.reduce((sum, item) => sum + Math.abs(item.subtotal), 0).toFixed(2));
  // Net payable = what the customer actually pays (sale total minus return refunds)
  const netPayable = Number((grandTotal - returnRefundTotal).toFixed(2));

  // Open Payment Modal (F key or button)
  const handleOpenPaymentModal = () => {
    // Validation
    if (!selectedCustomer || !selectedCustomer.customerId || selectedCustomer.customerId === '' || selectedCustomer.customerId === null || selectedCustomer.customerId === undefined || selectedCustomer.customerId === 0) {
      alert('Please select or add a customer!');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one product!');
      return;
    }

    const hasNormalItems = cartItems.some(item => !item.isReturn);

    // Only block negative grand total if there are normal sale items
    if (hasNormalItems && grandTotal < 0) {
      alert('Grand total cannot be negative!');
      return;
    }

    setIsPaymentReady(false);
    setShowPaymentModal(true);
  };

  // Close Payment Modal (F1 or Back button) - keep cart intact
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setIsPaymentReady(false);
    // Don't call resetForm() - this keeps cart, customer, and all data intact
    setAmountReceived('');
    setNotes('');
    setCreatedBilling(null);
  };

  // Clear cart with confirmation
  const handleClearCart = () => {
    if (cartItems.length === 0) {
      alert('Cart is already empty!');
      return;
    }
    if (window.confirm('Are you sure you want to clear the entire cart and customer selection? This cannot be undone.')) {
      resetForm(true); // true = clear customer too
    }
  };

  // Quick Price Add Handlers
  const openQuickPriceModal = (cartIdx) => {
    setQuickPriceCartIdx(cartIdx);
    setQuickPriceInput('');
    setQuickPriceValidation('');
    setShowQuickPriceModal(true);
  };

  const closeQuickPriceModal = () => {
    setShowQuickPriceModal(false);
    setQuickPriceCartIdx(null);
    setQuickPriceInput('');
    setQuickPriceValidation('');
  };

  const handleQuickPriceSubmit = async () => {
    if (!quickPriceInput.trim()) {
      setQuickPriceValidation('Price cannot be empty');
      return;
    }

    const newPrice = parseFloat(quickPriceInput);
    if (isNaN(newPrice) || newPrice <= 0) {
      setQuickPriceValidation('Price must be a valid positive number');
      return;
    }

    const cartItem = cartItems[quickPriceCartIdx];
    if (!cartItem) {
      setQuickPriceValidation('Cart item not found');
      return;
    }

    const productId = cartItem.product.productId;

    // Check if price already exists in the product's inventory levels
    const priceExists = cartItem.product.inventoryLevels?.some(inv => 
      parseFloat(inv.price) === newPrice
    );

    if (priceExists) {
      setQuickPriceValidation(`Price Rs. ${newPrice.toFixed(2)} already exists for this product`);
      return;
    }

    // Show confirmation BEFORE making the API call
    if (!window.confirm(`Add new price Rs. ${newPrice.toFixed(2)} to cart for ${cartItem.product.name}?`)) {
      return;
    }

    try {
      // Call backend to add the new price
      const response = await api(`/api/products/${productId}/inventory/quick-price-add`, {
        method: 'POST',
        body: {
          price: newPrice
        },
        token
      });

      if (response) {
        // Update cart item with new price
        const updated = [...cartItems];
        updated[quickPriceCartIdx].unitPrice = newPrice;
        setCartItems(updated);

        // Show success and close modal
        alert(`✓ Price Rs. ${newPrice.toFixed(2)} added successfully!`);
        closeQuickPriceModal();
      }
    } catch (err) {
      setQuickPriceValidation(`Error: ${err.message}`);
    }
  };

  // Direct submit and print (after clicking Shift+plus and Enter)
  const handleDirectSubmitAndPrint = async () => {
    if (!isPaymentReady) {
      alert('Please press Shift+(+) first to confirm!');
      return;
    }
    await submitBilling(true); // true = direct print mode
  };

  const submitBilling = async (directPrintMode = false) => {
    setLoading(true);
    setError(null);
    try {
      // Always send the sum of product + customer discount unless manually overridden
      const calculatedDiscount = Number((productDiscountTotal + customerDiscountTotal).toFixed(2));
      const discountToSave = (isDiscountManual && discountAmount !== null && discountAmount !== undefined && discountAmount !== '' && parseFloat(discountAmount) >= 0)
        ? Math.min(Number(parseFloat(discountAmount).toFixed(2)), subtotal)
        : calculatedDiscount;
      
      // Parse amount received - for non-CASH, use grandTotal automatically
      const parsedAmountReceived = paymentMethod === 'CASH' 
        ? (amountReceived !== '' ? parseFloat(amountReceived) : 0)
        : grandTotal;

      // Separate return items from normal items
      const normalItems = cartItems.filter(item => !item.isReturn);
      const returnItems = cartItems.filter(item => item.isReturn);

      // Only submit billing if there are normal (non-return) items
      let response = null;
      if (normalItems.length > 0) {
        const request = {
          customerId: selectedCustomer.customerId,
          items: normalItems.map((item) => ({
            productId: item.product.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            batchNo: item.product.batchNo || '',
          })),
          discountPercentage: parseFloat(discountPercentage) || 0,
          totalDiscount: discountToSave,
          discountAmount: discountToSave,
          paymentMethod,
          notes: notes.trim() || null,
          amountReceived: parsedAmountReceived,
        };

        response = await api('/api/billings', {
          method: 'POST',
          body: request,
          token,
        });
        if (response) {
          response.discountAmount = validDiscount;
        }
      }

      // Now process return items on backend (inventory restore + bin movement)
      const returnResults = [];
      for (const retItem of returnItems) {
        try {
          const retResponse = await api('/api/billings/return', {
            method: 'POST',
            body: {
              billingItemId: retItem.billingItemId,
              returnQty: retItem.returnQty,
            },
            token,
          });
          returnResults.push(retResponse);
        } catch (retErr) {
          console.error('Return processing failed for item:', retItem, retErr);
          setError((prev) => (prev ? prev + '\n' : '') + `Return failed for ${retItem.product.name}: ${retErr.message}`);
        }
      }

      if (response) {
        // Attach return info to billing response for display
        response.returnItems = returnResults;
        response.returnRefundTotal = returnRefundTotal;
        response.netPayable = netPayable;
        response.returnCartItems = returnItems.map(ri => ({
          productName: ri.product.name,
          productCode: ri.product.productCode,
          quantity: Math.abs(ri.quantity),
          unitPrice: ri.unitPrice,
          refundAmount: Math.abs(ri.subtotal),
          originalBill: ri.originalBill,
          discountPercentage: ri.productDiscount || 0,
        }));
        setCreatedBilling(response);
        
        // Refresh sales target data after successful billing
        fetchSalesTargetData();
        
        // Direct print mode: set flag and let useEffect handle printing
        if (directPrintMode) {
          setIsDirectPrintMode(true);
        } else {
          setShowBillPreview(true);
        }
      } else if (returnResults.length > 0) {
        // Only returns, no normal sale items — still show a receipt
        const returnOnlyBilling = {
          billingNumber: 'RETURN',
          billingDate: new Date().toISOString(),
          customerName: selectedCustomer?.name || '',
          customerPhone: selectedCustomer?.phone || '',
          items: [],
          subtotal: 0,
          grandTotal: 0,
          discountPercentage: 0,
          paymentMethod: 'RETURN',
          amountReceived: 0,
          balanceAmount: 0,
          notes: notes || '',
          returnItems: returnResults,
          returnRefundTotal: returnRefundTotal,
          netPayable: -returnRefundTotal,
          returnCartItems: returnItems.map(ri => ({
            productName: ri.product.name,
            productCode: ri.product.productCode,
            quantity: Math.abs(ri.quantity),
            unitPrice: ri.unitPrice,
            refundAmount: Math.abs(ri.subtotal),
            originalBill: ri.originalBill,
            discountPercentage: ri.productDiscount || 0,
          })),
        };
        setCreatedBilling(returnOnlyBilling);
        
        // Direct print mode for return-only bills
        if (directPrintMode) {
          setIsDirectPrintMode(true);
        } else {
          setShowBillPreview(true);
        }
      } else {
        setError('No items to process.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create billing');
    } finally {
      setLoading(false);
      // Reset ready state after submission
      setIsPaymentReady(false);
    }
  };

  const handlePrintAndClose = () => {
    window.onafterprint = () => {
      window.onafterprint = null;
      resetForm();
      setShowBillPreview(false);
      setShowPaymentModal(false);
    };
    window.print();
  };

  const handleCloseWithoutPrint = () => {
    resetForm();
    setShowBillPreview(false);
    setShowPaymentModal(false);
  };

  // Effect: Handle direct print when thermal print div becomes available
  useEffect(() => {
    if (isDirectPrintMode && createdBilling) {
      // Wait for DOM to render the thermal print div
      const timer = setTimeout(() => {
        const printElement = document.getElementById('billing-thermal-print');
        if (printElement) {
          console.log('Printing thermal bill...');
          
          // Set up onafterprint handler to reset form when print dialog closes
          window.onafterprint = () => {
            window.onafterprint = null;
            resetForm();
            setShowBillPreview(false);
            setShowPaymentModal(false);
            setIsDirectPrintMode(false);
          };
          
          // Trigger print
          window.print();
        } else {
          console.error('Thermal print element not found');
          setIsDirectPrintMode(false);
        }
      }, 150); // Delay for DOM rendering
      
      return () => clearTimeout(timer);
    }
  }, [isDirectPrintMode, createdBilling]);

  const resetForm = (clearCustomer = true) => {
    if (clearCustomer) setSelectedCustomer(null);
    setCartItems([]);
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setIsDiscountManual(false);
    setPaymentMethod('CASH');
    setNotes('');
    setAmountReceived('');
    setCustomerSearch('');
    setProductSearch('');
    setCreatedBilling(null);
    setIsPaymentReady(false);
  };

  // --- Ctrl+H: Customer billing history ---
  const fetchCustomerBills = async () => {
    if (!selectedCustomer || !selectedCustomer.customerId) {
      alert('Please select a customer first!');
      return;
    }
    setHistoryLoading(true);
    try {
      const data = await api(`/api/billings/customer/${selectedCustomer.customerId}?page=0&size=50`, { token });
      const bills = data?.content ? data.content : Array.isArray(data) ? data : [];
      setCustomerBills(bills);
      setSelectedHistoryBill(null);
      setSelectedHistoryItem(null);
      setHistoryBillIndex(0);
      setHistoryItemIndex(0);
      setHistorySearch('');
      setShowCustomerHistory(true);
    } catch (err) {
      console.error('Failed to load customer billing history:', err);
      alert('Failed to load billing history: ' + (err.message || 'Error'));
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Ctrl+R: open return popup for selected history item ---
  const openReturnForItem = (bill, item) => {
    const alreadyReturned = item.returnedQty || 0;
    const maxReturnable = item.quantity - alreadyReturned;
    if (maxReturnable <= 0) {
      alert('All units for this item have already been returned.');
      return;
    }
    setReturnItem({
      ...item,
      billingNumber: bill.billingNumber,
      billingId: bill.billingId,
      discountPercentage: bill.discountPercentage || 0,
      maxReturnable,
    });
    setReturnQty(1);
    setShowReturnModal(true);
  };

  // --- Process return ---
  const handleProcessReturn = async () => {
    if (!returnItem) return;
    if (returnQty <= 0 || returnQty > returnItem.maxReturnable) {
      alert(`Return quantity must be between 1 and ${returnItem.maxReturnable}`);
      return;
    }

    // Calculate refund amount locally (same logic as backend)
    const discPct = returnItem.discountPercentage || 0;
    const itemGross = returnItem.unitPrice * returnQty;
    const discDeducted = itemGross * (discPct / 100);
    const refundAmount = itemGross - discDeducted;

    const product = allProducts.find(p => p.productId === returnItem.productId) || {
      productId: returnItem.productId,
      productCode: returnItem.productCode,
      name: returnItem.productName,
    };

    // Only add to cart — backend return is processed when billing is submitted
    setCartItems(prev => [
      ...prev,
      {
        product,
        quantity: -returnQty,
        unitPrice: returnItem.unitPrice,
        productDiscount: discPct,
        subtotal: -refundAmount,
        isReturn: true,
        originalBill: returnItem.billingNumber,
        billingItemId: returnItem.billingItemId,
        returnQty: returnQty,
      },
    ]);

    alert(`Return added to cart: ${returnQty} x ${returnItem.productName}\nRefund: Rs. ${refundAmount.toFixed(2)} (after ${discPct}% discount deduction)\n\nReturn will be processed when you confirm the billing.`);
    setShowReturnModal(false);
    setReturnItem(null);
    // Clear selected item so Enter from alert dismissal doesn't re-trigger return
    setSelectedHistoryItem(null);
    setHistoryItemIndex(-1);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // --- Payment Modal keyboard handlers ---
      if (showPaymentModal && !showBillPreview) {
        // F1: close payment modal and reset form
        if (e.key === 'F1') {
          e.preventDefault();
          handleClosePaymentModal();
          return;
        }

        // + key (plus): set ready state - only on Shift+Plus combination
        if ((e.key === '+' || e.key === '=') && e.shiftKey) {
          e.preventDefault();
          
          // Validate based on payment method
          if (paymentMethod === 'CASH') {
            // For CASH: Amount Received is mandatory and must be a valid positive number
            if (!amountReceived || amountReceived === '' || isNaN(parseFloat(amountReceived))) {
              alert('For CASH payments, please enter the amount received!');
              return;
            }
          }
          // For other payment methods, amount is auto-set to grandTotal
          
          setIsPaymentReady(true);
          return;
        }

        // Enter: submit and print if ready
        if (e.key === 'Enter' && isPaymentReady && !loading) {
          e.preventDefault();
          handleDirectSubmitAndPrint();
          return;
        }

        // Don't process other shortcuts while in payment modal
        return;
      }

      // F key (not F1-F12): open payment modal
      if (e.key === 'f' || e.key === 'F') {
        // Don't trigger if user is typing in an input
        const activeElement = document.activeElement;
        const isTyping = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' || 
          activeElement.tagName === 'SELECT'
        );
        if (!isTyping && !showPaymentModal && !showBillPreview && !showCustomerHistory && !showReturnModal) {
          e.preventDefault();
          handleOpenPaymentModal();
          return;
        }
      }

      // Ctrl+H: open customer billing history
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        if (selectedCustomer) {
          fetchCustomerBills();
        } else {
          alert('Please select a customer first to view billing history.');
        }
        return;
      }

      // --- History modal keyboard navigation ---
      if (showCustomerHistory && !showReturnModal) {

        // Escape: close modal or go back
        if (e.key === 'Escape') {
          e.preventDefault();
          if (selectedHistoryBill) {
            // Go back to bills list
            setSelectedHistoryBill(null);
            setSelectedHistoryItem(null);
            setHistoryItemIndex(0);
          } else {
            // Close modal
            setShowCustomerHistory(false);
            setSelectedHistoryItem(null);
          }
          return;
        }

        // Backspace: go back from items to bills list
        if (e.key === 'Backspace' && selectedHistoryBill) {
          e.preventDefault();
          setSelectedHistoryBill(null);
          setSelectedHistoryItem(null);
          setHistoryItemIndex(0);
          return;
        }

        // --- Bills list navigation (no bill selected yet) ---
        if (!selectedHistoryBill && customerBills.length > 0) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHistoryBillIndex(prev => Math.min(prev + 1, customerBills.length - 1));
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHistoryBillIndex(prev => Math.max(prev - 1, 0));
            return;
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            const bill = customerBills[historyBillIndex];
            if (bill) {
              setSelectedHistoryBill(bill);
              setHistoryItemIndex(0);
              // Auto-select first item
              const items = bill.items || [];
              setSelectedHistoryItem(items.length > 0 ? items[0] : null);
            }
            return;
          }
        }

        // --- Items list navigation (bill selected, viewing items) ---
        if (selectedHistoryBill) {
          const items = selectedHistoryBill.items || [];

          if (e.key === 'ArrowDown' && items.length > 0) {
            e.preventDefault();
            const newIdx = Math.min(historyItemIndex + 1, items.length - 1);
            setHistoryItemIndex(newIdx);
            setSelectedHistoryItem(items[newIdx]);
            return;
          }
          if (e.key === 'ArrowUp' && items.length > 0) {
            e.preventDefault();
            const newIdx = Math.max(historyItemIndex - 1, 0);
            setHistoryItemIndex(newIdx);
            setSelectedHistoryItem(items[newIdx]);
            return;
          }

          // Ctrl+R or Enter: open return for selected item
          if ((e.ctrlKey && e.key === 'r') || e.key === 'Enter') {
            e.preventDefault();
            if (selectedHistoryItem) {
              const returned = selectedHistoryItem.returnedQty || 0;
              const returnable = selectedHistoryItem.quantity - returned;
              if (returnable > 0) {
                openReturnForItem(selectedHistoryBill, selectedHistoryItem);
              } else {
                alert('All units for this item have already been returned.');
              }
            }
            return;
          }
        }
      }

      // Ctrl+R outside of history modal context (fallback)
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedCustomer, token, showCustomerHistory, showReturnModal, selectedHistoryBill, selectedHistoryItem, customerBills, historyBillIndex, historyItemIndex, showPaymentModal, showBillPreview, isPaymentReady, loading, cartItems, amountReceived, paymentMethod]);

  // Also, when cartItems change, update discountAmount if it was set by customer discount

  // Always recalculate discountAmount using only Customer Discount Base when cart changes, if not manually overridden
  useEffect(() => {
    if (selectedCustomer && !isDiscountManual) {
      // If CARD, cap to 2%
      const effectivePercentage = paymentMethod === 'CARD' ? Math.min(selectedCustomer.discountPercentage || 0, 2) : (selectedCustomer.discountPercentage || 0);
      if (paymentMethod === 'CARD' && discountPercentage > 2) {
        setDiscountPercentage(2);
      }
      const customerDiscountBase = cartItems.filter(i => !i.isReturn).reduce((sum, item) => {
        if (!item.productDiscount || item.productDiscount === 0) {
          return sum + (item.unitPrice * item.quantity);
        }
        return sum;
      }, 0);
      const customerDiscountTotal = customerDiscountBase * (effectivePercentage / 100);
      setDiscountAmount(Number(customerDiscountTotal.toFixed(2)));
    }
  }, [cartItems, selectedCustomer, isDiscountManual, paymentMethod]);

  // Update discount amount when items are added or removed from cart. If no items remain, clear the discount amount.

  return (
    <div style={{ padding: 16, fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Billing / Sales</h2>

      {error && <div style={{ color: 'red', marginBottom: 10, padding: 8, background: '#fee', border: '1px solid red', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'nowrap', height: 'calc(100vh - 120px)' }}>
        {/* LEFT SIDE: Cart + Totals + Payment */}
        <div style={{ flex: '1.5 1 400px', minWidth: 380, border: '1px solid #ccc', padding: 16, borderRadius: 8, background: '#fafafa', boxSizing: 'border-box', overflowY: 'auto' }}>
          <h3>Cart ({cartItems.length} items)</h3>
          {cartItems.length === 0 ? (
            <p style={{ color: '#999' }}>No items added yet</p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {cartItems.filter(item => item && item.product).map((item, idx) => (
                <div key={idx} style={{ padding: 6, background: item.isReturn ? '#ffebee' : '#fff', border: item.isReturn ? '1px solid #ef9a9a' : '1px solid #ddd', borderRadius: 4, marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 'bold', wordWrap: 'break-word', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: item.isReturn ? '#c62828' : 'inherit' }}>
                        {item.isReturn ? '↩ ' : ''}{item.product.name}
                        {item.isReturn && item.originalBill && (
                          <span style={{ marginLeft: 6, color: '#e65100', fontSize: 11 }}>(Bill: {item.originalBill})</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                        <span style={{ fontSize: 12 }}>Rs. {item.unitPrice.toFixed(2)}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>×</span>
                        {item.isReturn ? (
                          <span style={{ fontSize: 12, fontWeight: 'bold', color: '#c62828' }}>{Math.abs(item.quantity)}</span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItemQuantity(idx, parseInt(e.target.value, 10) || 1)}
                            style={{ width: 50, padding: 2, fontSize: 12 }}
                          />
                        )}
                        {/* Inline product discount — only visible when customer discount is active */}
                        {!item.isReturn && discountPercentage > 0 && (
                          <>
                            <span style={{ fontSize: 11, color: '#999' }}>Disc:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.productDiscount || ''}
                              onChange={e => {
                                const val = e.target.value === '' ? 0 : Number(parseFloat(e.target.value).toFixed(2));
                                const updated = [...cartItems];
                                updated[idx].productDiscount = val;
                                setCartItems(updated);
                              }}
                              style={{ width: 45, padding: 2, fontSize: 11 }}
                            />
                            <span style={{ fontSize: 11, color: '#999' }}>%</span>
                          </>
                        )}
                        {!item.isReturn && (
                          <button
                            onClick={() => openQuickPriceModal(idx)}
                            title="Add or change price for this item"
                            style={{
                              padding: '2px 6px',
                              background: '#2196f3',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 3,
                              cursor: 'pointer',
                              fontSize: 10,
                              fontWeight: 'bold'
                            }}
                          >
                            Quick Price
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 80, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 'bold', color: item.isReturn ? '#c62828' : '#2196f3' }}>
                        {item.isReturn ? '-' : ''}Rs. {Math.abs(
                          item.isReturn
                            ? item.subtotal
                            : (discountPercentage > 0 && item.productDiscount && item.productDiscount > 0
                              ? (item.unitPrice * item.quantity - item.unitPrice * item.quantity * (item.productDiscount / 100))
                              : item.unitPrice * item.quantity)
                        ).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeCartItem(idx)}
                        style={{ padding: '3px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clear Cart Button */}
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 12,
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
              onMouseOver={(e) => e.target.style.background = '#d32f2f'}
              onMouseOut={(e) => e.target.style.background = '#f44336'}
            >
              🗑️ Clear Cart & Customer
            </button>
          )}

          <hr style={{ margin: '16px 0' }} />

          {/* Cart Summary - Grand Total only */}
          <div style={{ padding: 12, background: '#fff', border: '1px solid #ddd', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Subtotal:</span>
              <strong>Rs. {subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: 8 }}>
              <span>Grand Total:</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>
            {returnCartItems.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#c62828', fontWeight: 'bold' }}>
                  <span>↩ Return Refund ({returnCartItems.length} item{returnCartItems.length > 1 ? 's' : ''}):</span>
                  <span>- Rs. {returnRefundTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 'bold', borderTop: '2px solid #e65100', paddingTop: 8, marginTop: 8, color: '#e65100' }}>
                  <span>NET PAYABLE:</span>
                  <span>Rs. {netPayable.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <hr style={{ margin: '16px 0' }} />

          {/* Proceed to Payment Button */}
          <button
            onClick={handleOpenPaymentModal}
            disabled={loading || !selectedCustomer || cartItems.length === 0}
            style={{
              width: '100%',
              padding: '16px 0',
              fontSize: 18,
              fontWeight: 'bold',
              background: loading || !selectedCustomer || cartItems.length === 0 ? '#ccc' : '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading || !selectedCustomer || cartItems.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: loading || !selectedCustomer || cartItems.length === 0 ? 'none' : '0 4px 12px rgba(76,175,80,0.3)',
            }}
          >
            <span style={{ fontSize: 22 }}>💳</span>
            <span>Proceed to Payment</span>
            <span style={{ 
              background: 'rgba(255,255,255,0.3)', 
              padding: '4px 12px', 
              borderRadius: 4, 
              fontSize: 14,
              fontWeight: 'normal'
            }}>(F)</span>
          </button>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#888' }}>
            Press <strong>F</strong> key or click button to open payment window
          </div>
        </div>

        {/* RIGHT SIDE: Product Search (top) + Customer (bottom) */}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box', overflowY: 'auto' }}>

          {/* RIGHT TOP: Product Search & Add */}
          <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8, background: '#fafafa' }}>
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>Product Search & Add</h3>
            <input
              type="text"
              placeholder="Type product name... (e.g., 'paracetamol' or 'paracetamol 12*' for 12 units)"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              onKeyDown={handleProductSearchKeyDown}
              style={{ width: '100%', padding: 10, fontSize: 14, marginBottom: 8, boxSizing: 'border-box' }}
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
                            {p.category?.name || 'N/A'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 16, minWidth: 120 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#d32f2f' }}>
                            Rs. {p.lastPrice || '-'}
                          </div>
                          <div style={{ fontSize: 12, color: '#2e7d32', marginTop: 2 }}>
                            Stock: {p.totalStock || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT BOTTOM: Customer Section */}
          <div style={{ border: '1px solid #ccc', padding: 12, borderRadius: 8, background: '#fafafa', marginTop: 16 }}>
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>Customer Section</h3>
            {!selectedCustomer ? (
              <>
                <input
                  type="text"
                  placeholder="Search customer... (↑↓ Enter)"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (filteredCustomers.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setCustomerDropdownIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setCustomerDropdownIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const c = filteredCustomers[customerDropdownIndex];
                        if (c) handleSelectCustomer(c);
                      }
                    }
                    if (e.key === 'Escape') {
                      setCustomerSearch('');
                      setFilteredCustomers([]);
                    }
                  }}
                  style={{ width: '100%', padding: 8, fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
                />
                {filteredCustomers.length > 0 && (
                  <div style={{ border: '1px solid #ccc', background: '#fff', maxHeight: 180, overflowY: 'auto' }}>
                    {filteredCustomers.map((c, idx) => (
                      <div
                        key={c.customerId}
                        onClick={() => handleSelectCustomer(c)}
                        onMouseEnter={() => setCustomerDropdownIndex(idx)}
                        style={{
                          padding: 8,
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          fontSize: 13,
                          background: idx === customerDropdownIndex ? '#e3f2fd' : '#fff',
                        }}
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
                <button
                  onClick={fetchCustomerBills}
                  style={{ marginTop: 8, marginLeft: 8, padding: '6px 12px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  title="Ctrl+H"
                >
                  📋 History (Ctrl+H)
                </button>
              </div>
            )}
          </div>

          {/* Mini Sales Target Widget */}
          <div style={{ 
            border: '1px solid #1976d2', 
            padding: 12, 
            borderRadius: 8, 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            marginTop: 16 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: 13, margin: 0, color: '#1565c0', display: 'flex', alignItems: 'center', gap: 6 }}>
                📊 Today's Target
              </h4>
              <button 
                onClick={fetchSalesTargetData}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: 12,
                  color: '#1976d2',
                  padding: '2px 6px',
                  borderRadius: 4
                }}
                title="Refresh (auto-refreshes every 5 min)"
              >
                🔄
              </button>
            </div>
            
            {salesTargetLoading ? (
              <div style={{ textAlign: 'center', padding: 8, color: '#666', fontSize: 12 }}>Loading...</div>
            ) : salesTargetData ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 2 }}>
                  <span>Sales</span>
                  <span style={{ fontWeight: 'bold', color: '#2196f3' }}>
                    Rs. {(parseFloat(salesTargetData.todaySales) || 0).toLocaleString()}
                  </span>
                </div>
                <MiniProgressBar
                  value={parseFloat(salesTargetData.todaySales) || 0}
                  max={parseFloat(salesTargetData.todayTarget) || 0}
                  color="#2196f3"
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 8,
                  fontSize: 10,
                  color: '#666'
                }}>
                  <span>Target: Rs. {(parseFloat(salesTargetData.todayTarget) || 0).toLocaleString()}</span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: parseFloat(salesTargetData.todayProgress) >= 100 ? '#4caf50' : 
                           parseFloat(salesTargetData.todayProgress) >= 80 ? '#ff9800' : '#f44336'
                  }}>
                    {(parseFloat(salesTargetData.todayProgress) || 0).toFixed(1)}%
                  </span>
                </div>
                {/* Status indicator */}
                <div style={{ 
                  marginTop: 8, 
                  padding: '4px 8px', 
                  borderRadius: 4,
                  textAlign: 'center',
                  fontSize: 10,
                  fontWeight: 'bold',
                  background: parseFloat(salesTargetData.todayProgress) >= 100 ? '#e8f5e9' : 
                             parseFloat(salesTargetData.todayProgress) >= 80 ? '#fff3e0' : '#ffebee',
                  color: parseFloat(salesTargetData.todayProgress) >= 100 ? '#2e7d32' : 
                         parseFloat(salesTargetData.todayProgress) >= 80 ? '#e65100' : '#c62828'
                }}>
                  {parseFloat(salesTargetData.todayProgress) >= 100 ? '🎉 Target Achieved!' : 
                   parseFloat(salesTargetData.todayProgress) >= 80 ? '💪 Almost There!' : '⚠️ Keep Pushing!'}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 8, color: '#666', fontSize: 11 }}>
                No target set for today
              </div>
            )}
          </div>

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
                <label style={{ display: 'block', marginBottom: 4 }}>Title</label>
                <select
                  value={newCustomer.title}
                  onChange={(e) => setNewCustomer({ ...newCustomer, title: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="">Select...</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                  <option value="Rev.">Rev.</option>
                  <option value="Other">Other</option>
                </select>
              </div>
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
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
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
          <div
            ref={priceModalRef}
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 500 }}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedPriceOptionIndex(prev => (prev < priceOptions.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedPriceOptionIndex(prev => (prev > 0 ? prev - 1 : 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelectPriceOption(null, selectedPriceOptionIndex);
              }
            }}
          >
            <h3>Select Selling Price</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>
              This product has multiple selling prices in inventory. Please select one:
            </p>
            <div style={{ marginBottom: 16 }}>
              {priceOptions.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPriceOption(option, idx)}
                  style={{
                    padding: 16,
                    border: selectedPriceOptionIndex === idx ? '3px solid #1976d2' : '2px solid #2196f3',
                    borderRadius: 8,
                    marginBottom: 12,
                    cursor: 'pointer',
                    background: selectedPriceOptionIndex === idx ? '#e3f2fd' : '#f0f8ff',
                  }}
                  tabIndex={0}
                  onMouseEnter={() => setSelectedPriceOptionIndex(idx)}
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

      {/* Payment Modal (F key) */}
      {showPaymentModal && (
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
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              width: '95%',
              maxWidth: 500,
              maxHeight: '95vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: 16,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: '#fff',
                textAlign: 'center',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>
                💳 Payment Confirmation
              </div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                Customer: {selectedCustomer?.name || 'N/A'}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: 20 }}>
              {/* Summary Section */}
              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Subtotal:</span>
                  <strong>Rs. {subtotal.toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Customer Discount Base:</span>
                  <span>Rs. {customerDiscountBase.toFixed(2)}</span>
                </div>

                {/* Customer Discount Input */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <span>Customer Discount (%):</span>
                  <input
                    ref={customerDiscountPercentRef}
                    type="number"
                    min="0"
                    max={paymentMethod === 'CARD' ? 2 : 100}
                    step="0.01"
                    value={discountPercentage}
                    onChange={e => {
                      let newPercentage = parseFloat(e.target.value) || 0;
                      if (paymentMethod === 'CARD' && newPercentage > 2) {
                        newPercentage = 2;
                        alert('Maximum discount for card payment is 2%');
                      }
                      setDiscountPercentage(newPercentage);
                      const newDiscountAmount = customerDiscountBase * newPercentage / 100;
                      setDiscountAmount(newDiscountAmount);
                      setIsDiscountManual(false);
                      setIsPaymentReady(false); // Reset ready state
                    }}
                    style={{ width: 80, padding: 6, fontSize: 14 }}
                  />
                </div>

                {/* Discount Amount Input */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <span>or Discount Amount:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                        setIsPaymentReady(false); // Reset ready state
                      }}
                      style={{ width: 100, padding: 6, fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setDiscountAmount(''); setIsDiscountManual(false); setIsPaymentReady(false); }}
                      style={{ padding: '4px 8px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                      title="Clear Discount Amount"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Product Discounts */}
                {discountPercentage > 0 && productDiscountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Product Discounts:</span>
                    <span>-Rs. {productDiscountTotal.toFixed(2)}</span>
                  </div>
                )}

                {/* Total Discount Applied */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>Total Discount Applied:</span>
                  <span>-Rs. {(
                    isDiscountManual
                      ? (productDiscountTotal + (discountAmount ? Number(parseFloat(discountAmount).toFixed(2)) : 0))
                      : (productDiscountTotal + customerDiscountTotal)
                  ).toFixed(2)}</span>
                </div>

                {/* Grand Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: 12, marginTop: 8 }}>
                  <span>Grand Total:</span>
                  <span style={{ color: '#1976d2' }}>Rs. {grandTotal.toFixed(2)}</span>
                </div>

                {/* Return Refund */}
                {returnCartItems.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#c62828', fontWeight: 'bold' }}>
                      <span>↩ Return Refund ({returnCartItems.length} item{returnCartItems.length > 1 ? 's' : ''}):</span>
                      <span>- Rs. {returnRefundTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 'bold', borderTop: '2px solid #e65100', paddingTop: 12, marginTop: 8, color: '#e65100' }}>
                      <span>NET PAYABLE:</span>
                      <span>Rs. {netPayable.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>Payment Method:</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => {
                    const method = e.target.value;
                    setPaymentMethod(method);
                    
                    if (selectedCustomer) {
                      if (method === 'CARD') {
                        // When CARD is selected, cap discount to 2%
                        const cappedDiscount = Math.min(originalCustomerDiscount, 2);
                        setDiscountPercentage(cappedDiscount);
                        // Recalculate discount amount with capped percentage
                        const customerDiscountBase = cartItems.filter(i => !i.isReturn).reduce((sum, item) => {
                          if (!item.productDiscount || item.productDiscount === 0) {
                            return sum + (item.unitPrice * item.quantity);
                          }
                          return sum;
                        }, 0);
                        const newDiscountAmount = customerDiscountBase * cappedDiscount / 100;
                        setDiscountAmount(Number(newDiscountAmount.toFixed(2)));
                      } else {
                        // When switching away from CARD, restore original customer discount
                        setDiscountPercentage(originalCustomerDiscount);
                        // Recalculate discount amount with original percentage
                        const customerDiscountBase = cartItems.filter(i => !i.isReturn).reduce((sum, item) => {
                          if (!item.productDiscount || item.productDiscount === 0) {
                            return sum + (item.unitPrice * item.quantity);
                          }
                          return sum;
                        }, 0);
                        const newDiscountAmount = customerDiscountBase * originalCustomerDiscount / 100;
                        setDiscountAmount(Number(newDiscountAmount.toFixed(2)));
                      }
                    }
                    setIsPaymentReady(false); // Reset ready state
                  }} 
                  style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
                >
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

              {/* Amount Received */}
              <div style={{ marginBottom: 16, padding: 16, background: '#e3f2fd', borderRadius: 8, border: '1px solid #90caf9' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 'bold', fontSize: 14 }}>
                  Amount Received (Rs.): {paymentMethod === 'CASH' && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentMethod === 'CASH' ? amountReceived : grandTotal}
                  onChange={(e) => {
                    if (paymentMethod === 'CASH') {
                      setAmountReceived(e.target.value);
                      setIsPaymentReady(false);
                    }
                  }}
                  disabled={paymentMethod !== 'CASH'}
                  placeholder={paymentMethod === 'CASH' ? 'Enter amount given by customer' : 'Auto-set to grand total'}
                  required={paymentMethod === 'CASH'}
                  style={{ width: '100%', padding: 12, fontSize: 18, boxSizing: 'border-box', borderRadius: 6, border: paymentMethod === 'CASH' ? '2px solid #ff9800' : '1px solid #ccc', background: paymentMethod !== 'CASH' ? '#f5f5f5' : '#fff' }}
                />
                
                {/* Balance Display */}
                {((paymentMethod === 'CASH' && amountReceived !== '' && parseFloat(amountReceived) > 0) || paymentMethod !== 'CASH') && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: 20, 
                    fontWeight: 'bold',
                    padding: 12,
                    marginTop: 12,
                    background: paymentMethod === 'CASH' ? (parseFloat(amountReceived) >= (returnCartItems.length > 0 ? netPayable : grandTotal) ? '#c8e6c9' : '#ffcdd2') : '#c8e6c9',
                    borderRadius: 6,
                    color: paymentMethod === 'CASH' ? (parseFloat(amountReceived) >= (returnCartItems.length > 0 ? netPayable : grandTotal) ? '#2e7d32' : '#c62828') : '#2e7d32'
                  }}>
                    <span>{paymentMethod === 'CASH' ? (parseFloat(amountReceived) >= (returnCartItems.length > 0 ? netPayable : grandTotal) ? 'Balance to Return:' : 'Amount Due:') : 'Balance to Return:'}</span>
                    <span>Rs. {paymentMethod === 'CASH' ? Math.abs(parseFloat(amountReceived) - (returnCartItems.length > 0 ? netPayable : grandTotal)).toFixed(2) : '0.00'}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>Notes (optional):</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setIsPaymentReady(false); // Reset ready state
                  }} 
                  rows="1" 
                  style={{ width: '100%', padding: 6, fontSize: 12, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }} 
                  placeholder="Any notes..."
                />
              </div>

              {/* Ready Indicator & Instructions */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 6,
                padding: 8,
                background: isPaymentReady ? '#e8f5e9' : '#fff3e0',
                borderRadius: 12,
                border: isPaymentReady ? '2px solid #4caf50' : '2px dashed #ff9800',
                transition: 'all 0.3s ease',
              }}>
                {/* Tick indicator when ready */}
                {isPaymentReady ? (
                  <div style={{ 
                    fontSize: 32, 
                    color: '#4caf50',
                    animation: 'pulse 1s infinite',
                  }}>
                    ✓
                  </div>
                ) : (
                  <div style={{ fontSize: 20, color: '#ff9800' }}>
                    ⌨️
                  </div>
                )}

                {/* Instruction Text */}
                <div style={{ textAlign: 'center', fontSize: 12, color: isPaymentReady ? '#2e7d32' : '#e65100', fontWeight: 'bold' }}>
                  {isPaymentReady 
                    ? '✅ READY! Press Enter to confirm & print' 
                    : 'Press keyboard (+) key, then Enter to confirm'}
                </div>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', marginTop: 16, color: '#1976d2', fontWeight: 'bold' }}>
                  Processing... Please wait.
                </div>
              )}
            </div>

            {/* Footer with Back Button */}
            <div
              style={{
                padding: 16,
                borderTop: '1px solid #ddd',
                background: '#f9f9f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <button
                onClick={handleClosePaymentModal}
                style={{
                  padding: '10px 24px',
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                ← Back (F1)
              </button>
              <div style={{ fontSize: 12, color: '#888' }}>
                Press F1 to return to billing screen
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview Modal after successful billing creation */}
      {(showBillPreview || createdBilling) && createdBilling && !isDirectPrintMode && (
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
                {createdBilling.billingNumber === 'RETURN' ? 'Return Processed Successfully!' : 'Billing Created Successfully!'}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                {createdBilling.billingNumber === 'RETURN' ? 'Return Receipt' : `Bill #${createdBilling.billingNumber}`}
              </div>
            </div>

            {/* Thermal Bill Content shown in Modal - 60mm Format */}
            <div
              style={{
                width: '100%',
                maxWidth: 260,
                margin: '0 auto',
                padding: '0px 3px',
                fontFamily: 'monospace',
                fontSize: '9px',
                lineHeight: 1.2,
                background: '#fff',
                color: '#000',
                fontWeight: '600',
              }}
            >
              {/* Store Logo */}
              {/* Store Name Header - Logo Left, Name Right */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginBottom: 1, paddingLeft: '2px', paddingRight: '2px' }}>
                {/* Logo */}
                {storeSettings?.logo && (
                  <img
                    src={storeSettings.logo}
                    alt="Logo"
                    style={{ width: '65px', height: '65px', objectFit: 'contain', flexShrink: 0 }}
                  />
                )}
                {!storeSettings?.logo && (
                  <div style={{ width: '65px', height: '65px', backgroundColor: '#000', flexShrink: 0, borderRadius: '1px' }}></div>
                )}
                {/* Store Name - Right aligned, wrapped text */}
                <div style={{ textAlign: 'center', minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px', lineHeight: 1.0, marginBottom: 0, wordWrap: 'break-word' }}>
                    {(storeSettings?.storeName || 'PHARMACY').split(' ').slice(1).join(' ') || 'PHARMACY'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
                {storeSettings?.address || 'Store Address'}
              </div>
              {storeSettings?.phone && (
                <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: 1, lineHeight: 1.1, fontWeight: '700' }}>
                  Ph: {storeSettings.phone}
                </div>
              )}

              <div style={{ borderTop: '2px solid #000', margin: '2px 0' }}></div>

              {/* Bill Details */}
              <div style={{ fontSize: '9px', marginBottom: 1, lineHeight: 1.2, fontWeight: '600' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                  <span>Bill No:</span>
                  <span>{createdBilling.billingNumber}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                  <span>Date:</span>
                  <span>{new Date(createdBilling.billingDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                  <span>Cashier:</span>
                  <span>{createdBilling.cashierName || 'N/A'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
                  <span>Customer:</span>
                  <span>{createdBilling.customerName}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

              {/* Items List */}
              <div style={{ marginBottom: 0 }}>
                {createdBilling.items.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: 1, paddingBottom: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', wordBreak: 'break-word', marginBottom: 1, letterSpacing: '0.5px' }}>
                      {item.productName.substring(0, 22)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '30px 50px 1fr', gap: '0px', fontSize: '9px', fontWeight: '700', alignItems: 'center' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>Q:{item.quantity}</span>
                      <span style={{ whiteSpace: 'nowrap', paddingLeft: '2px' }}>P:{item.unitPrice.toFixed(2)}</span>
                      <span style={{ textAlign: 'right', fontWeight: '900', whiteSpace: 'nowrap', paddingLeft: '2px' }}>{item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Return items */}
                {createdBilling.returnCartItems && createdBilling.returnCartItems.length > 0 && (
                  <div style={{ marginTop: 1, paddingTop: 1, borderTop: '1px dashed #000' }}>
                    <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: 0 }}>↩ RETURNS:</div>
                    {createdBilling.returnCartItems.map((ri, idx) => (
                      <div key={`ret-${idx}`} style={{ fontSize: '9px', marginBottom: 1, fontWeight: '600' }}>
                        <div style={{ fontWeight: 'bold', wordBreak: 'break-word', marginBottom: 0 }}>
                          {ri.productName.substring(0, 22)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '30px 50px 1fr', gap: '0px', fontSize: '9px', fontWeight: '700', alignItems: 'center' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>Q:{ri.quantity}</span>
                          <span style={{ whiteSpace: 'nowrap', paddingLeft: '2px' }}>P:{ri.unitPrice.toFixed(2)}</span>
                          <span style={{ textAlign: 'right', fontWeight: '900', whiteSpace: 'nowrap', paddingLeft: '2px' }}>-{ri.refundAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

              {/* Totals */}
              <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                  <span>Subtotal</span>
                  <span style={{ textAlign: 'right' }}>{createdBilling.subtotal.toFixed(2)}</span>
                </div>
                {((productDiscountTotal + customerDiscountTotal) > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px', marginBottom: 0 }}>
                    <span>Discount ({((productDiscountTotal + customerDiscountTotal) / createdBilling.subtotal * 100).toFixed(0)}%)</span>
                    <span style={{ textAlign: 'right' }}>-{(productDiscountTotal + customerDiscountTotal).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 1, marginTop: 1 }}>
                  <span>TOTAL</span>
                  <span style={{ textAlign: 'right' }}>{(createdBilling.subtotal - (productDiscountTotal + customerDiscountTotal)).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

              {/* Payment Summary */}
              <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                  <span>Amount Paid</span>
                  <span style={{ textAlign: 'right' }}>{(createdBilling.amountReceived || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
                  <span>Balance</span>
                  <span style={{ textAlign: 'right' }}>{Math.abs((createdBilling.subtotal - (productDiscountTotal + customerDiscountTotal)) - (createdBilling.amountReceived || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

              {/* Footer */}
              <div style={{ textAlign: 'left', fontSize: '8px', marginTop: 0, marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
                <div>Items Sold: {createdBilling.items.length}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px', marginTop: 0 }}>Thank You Come Again!</div>
                <div style={{ textAlign: 'center', fontSize: '12px', marginTop: 0, fontWeight: 'bold' }}>Need Advice? Contact Us: {storeSettings?.phone || 'N/A'}</div>
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

      {/* Thermal Print Div for Direct Print Mode - Hidden from view but printable */}
      {isDirectPrintMode && createdBilling && (
        <div
          id="billing-thermal-print"
          style={{
            visibility: 'hidden',
            height: 0,
            overflow: 'hidden',
            width: '72mm',
            fontFamily: "'Courier New', monospace",
            fontSize: '9px',
            lineHeight: 1.3,
            background: '#fff',
            color: '#000',
            boxSizing: 'border-box',
          }}
        >
          {/* Store Name Header - Logo Left, Name Right */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3px', marginBottom: 1, paddingLeft: '2px', paddingRight: '2px' }}>
            {/* Logo */}
            {storeSettings?.logo && (
              <img
                src={storeSettings.logo}
                alt="Logo"
                style={{ width: '65px', height: '65px', objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            {!storeSettings?.logo && (
              <div style={{ width: '65px', height: '65px', backgroundColor: '#000', flexShrink: 0, borderRadius: '1px' }}></div>
            )}
            {/* Store Name - Right aligned, wrapped text */}
            <div style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: '12px', lineHeight: 1.0, marginBottom: 0, wordWrap: 'break-word' }}>
                {(storeSettings?.storeName || 'PHARMACY').split(' ').slice(1).join(' ') || 'PHARMACY'}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '9px', marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
            {storeSettings?.address || 'Store Address'}
          </div>
          {storeSettings?.phone && (
            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: 0, lineHeight: 1.1, fontWeight: '700' }}>
              Ph: {storeSettings.phone}
            </div>
          )}
          {storeSettings?.email && (
            <div style={{ textAlign: 'center', fontSize: '8px', marginBottom: 1, lineHeight: 1.1, fontWeight: '600' }}>
              {storeSettings.email}
            </div>
          )}

          <div style={{ borderTop: '2px solid #000', margin: '2px 0' }}></div>

          {/* Bill Details */}
          <div style={{ fontSize: '9px', marginBottom: 1, lineHeight: 1.2, fontWeight: '600' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
              <span>Bill No:</span>
              <span>{createdBilling.billingNumber}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
              <span>Date:</span>
              <span>{new Date(createdBilling.billingDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
              <span>Cashier:</span>
              <span>{createdBilling.cashierName || 'N/A'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '2px' }}>
              <span>Customer:</span>
              <span>{createdBilling.customerName}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

          {/* Items List */}
          <div style={{ marginBottom: 0 }}>
            {createdBilling.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: 1, paddingBottom: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '10px', wordBreak: 'break-word', marginBottom: 1, letterSpacing: '0.5px' }}>
                  {item.productName.substring(0, 22)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '30px 50px 1fr', gap: '0px', fontSize: '9px', fontWeight: '700', alignItems: 'center' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Q:{item.quantity}</span>
                  <span style={{ whiteSpace: 'nowrap', paddingLeft: '2px' }}>P:{item.unitPrice.toFixed(2)}</span>
                  <span style={{ textAlign: 'right', fontWeight: '900', whiteSpace: 'nowrap', paddingLeft: '2px' }}>{item.subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Return items */}
            {createdBilling.returnCartItems && createdBilling.returnCartItems.length > 0 && (
              <div style={{ marginTop: 1, paddingTop: 1, borderTop: '1px dashed #000' }}>
                <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: 0 }}>↩ RETURNS:</div>
                {createdBilling.returnCartItems.map((ri, idx) => (
                  <div key={`ret-${idx}`} style={{ fontSize: '9px', marginBottom: 1, fontWeight: '600' }}>
                    <div style={{ fontWeight: 'bold', wordBreak: 'break-word', marginBottom: 0 }}>
                      {ri.productName.substring(0, 22)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '30px 50px 1fr', gap: '0px', fontSize: '9px', fontWeight: '700', alignItems: 'center' }}>
                      <span style={{ whiteSpace: 'nowrap' }}>Q:{ri.quantity}</span>
                      <span style={{ whiteSpace: 'nowrap', paddingLeft: '2px' }}>P:{ri.unitPrice.toFixed(2)}</span>
                      <span style={{ textAlign: 'right', fontWeight: '900', whiteSpace: 'nowrap', paddingLeft: '2px' }}>-{ri.refundAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

          {/* Totals */}
          <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
              <span>Subtotal</span>
              <span style={{ textAlign: 'right' }}>{createdBilling.subtotal.toFixed(2)}</span>
            </div>
            {((productDiscountTotal + customerDiscountTotal) > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px', marginBottom: 0 }}>
                <span>Discount ({((productDiscountTotal + customerDiscountTotal) / createdBilling.subtotal * 100).toFixed(0)}%)</span>
                <span style={{ textAlign: 'right' }}>-{(productDiscountTotal + customerDiscountTotal).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px', fontSize: '10px', fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: 1, marginTop: 1 }}>
              <span>TOTAL</span>
              <span style={{ textAlign: 'right' }}>{(createdBilling.subtotal - (productDiscountTotal + customerDiscountTotal)).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

          {/* Payment Summary */}
          <div style={{ fontSize: '9px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
              <span>Amount Paid</span>
              <span style={{ textAlign: 'right' }}>{(createdBilling.amountReceived || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px', gap: '2px' }}>
              <span>Balance</span>
              <span style={{ textAlign: 'right' }}>{Math.abs((createdBilling.subtotal - (productDiscountTotal + customerDiscountTotal)) - (createdBilling.amountReceived || 0)).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #000', margin: '1px 0' }}></div>

          {/* Footer */}
          <div style={{ textAlign: 'left', fontSize: '8px', marginTop: 0, marginBottom: 0, lineHeight: 1.1, fontWeight: '600' }}>
            <div>Items Sold: {createdBilling.items.length}</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '9px', marginTop: 0 }}>Thank You Come Again!</div>
            <div style={{ textAlign: 'center', fontSize: '12px', marginTop: 0, fontWeight: 'bold' }}>Need Advice? Contact Us: {storeSettings?.phone || 'N/A'}</div>
          </div>
        </div>
      )}
      {showCustomerHistory && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
          }}
          onClick={() => { setShowCustomerHistory(false); setSelectedHistoryItem(null); }}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 900, width: '95%', maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📋 Billing History — {selectedCustomer?.name}</h3>
              <button onClick={() => { setShowCustomerHistory(false); setSelectedHistoryItem(null); }} style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>⌨ Use ↑↓ arrows to navigate, Enter to select, {selectedHistoryBill ? 'Ctrl+R / Enter to return item, Esc to go back' : 'Esc to close'}</div>
            {historyLoading ? (
              <div>Loading...</div>
            ) : customerBills.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', padding: 32 }}>No billing history found for this customer.</div>
            ) : (
              <>
                {!selectedHistoryBill ? (
                  <>
                  <div style={{ marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="🔍 Search by bill number..."
                      value={historySearch}
                      onChange={e => { setHistorySearch(e.target.value); setHistoryBillIndex(0); }}
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
                      autoFocus
                    />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Bill #</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Date</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Items</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Grand Total</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Discount %</th>
                        <th style={{ padding: 8, border: '1px solid #ddd' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerBills.filter(b => !historySearch || (b.billingNumber && b.billingNumber.toLowerCase().includes(historySearch.toLowerCase()))).map((bill, idx) => (
                        <tr key={bill.billingId}
                          onClick={() => { setHistoryBillIndex(idx); }}
                          onDoubleClick={() => { setHistoryBillIndex(idx); setSelectedHistoryBill(bill); setHistoryItemIndex(0); setSelectedHistoryItem((bill.items || [])[0] || null); }}
                          style={{ cursor: 'pointer', background: idx === historyBillIndex ? '#e3f2fd' : 'transparent' }}
                        >
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>{bill.billingNumber}</td>
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>{new Date(bill.billingDate).toLocaleDateString()}</td>
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>{bill.items?.length || 0}</td>
                          <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Rs. {bill.grandTotal?.toFixed(2)}</td>
                          <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{bill.discountPercentage || 0}%</td>
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>
                            <button
                              onClick={() => { setSelectedHistoryBill(bill); setHistoryItemIndex(0); setSelectedHistoryItem((bill.items || [])[0] || null); }}
                              style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}
                            >
                              View Items (Enter)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                ) : (
                  <div>
                    <button onClick={() => { setSelectedHistoryBill(null); setSelectedHistoryItem(null); }} style={{ marginBottom: 12, padding: '6px 16px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
                      ← Back to Bills
                    </button>
                    <h4 style={{ marginBottom: 8 }}>Bill #{selectedHistoryBill.billingNumber} — {new Date(selectedHistoryBill.billingDate).toLocaleDateString()} — Discount: {selectedHistoryBill.discountPercentage || 0}%</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f0f0f0' }}>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Product</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Code</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Qty Sold</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Returned</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Returnable</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Unit Price</th>
                          <th style={{ padding: 8, border: '1px solid #ddd' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedHistoryBill.items || []).map((item, idx) => {
                          const returned = item.returnedQty || 0;
                          const returnable = item.quantity - returned;
                          const isSelected = idx === historyItemIndex;
                          return (
                            <tr key={item.billingItemId}
                              onClick={() => { setHistoryItemIndex(idx); setSelectedHistoryItem(item); }}
                              style={{ cursor: 'pointer', background: isSelected ? '#e3f2fd' : 'transparent' }}
                            >
                              <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.productName}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.productCode}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center', color: returned > 0 ? '#c62828' : '#888' }}>{returned}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: returnable > 0 ? '#2e7d32' : '#888' }}>{returnable}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>Rs. {item.unitPrice?.toFixed(2)}</td>
                              <td style={{ padding: 8, border: '1px solid #ddd' }}>
                                {returnable > 0 ? (
                                  <button
                                    onClick={() => openReturnForItem(selectedHistoryBill, item)}
                                    style={{ background: '#e65100', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}
                                    title="Ctrl+R"
                                  >
                                    ↩ Return (Ctrl+R)
                                  </button>
                                ) : (
                                  <span style={{ color: '#888', fontSize: 12 }}>Fully returned</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Return Quantity Modal (Ctrl+R) */}
      {showReturnModal && returnItem && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
          }}
          onClick={() => setShowReturnModal(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 8, maxWidth: 480, width: '90%', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#e65100' }}>↩ Process Return</h3>
            <div style={{ marginBottom: 16, background: '#fff3e0', padding: 12, borderRadius: 6, border: '1px solid #ffe0b2' }}>
              <div><strong>Product:</strong> {returnItem.productName} ({returnItem.productCode})</div>
              <div><strong>From Bill:</strong> {returnItem.billingNumber}</div>
              <div><strong>Unit Price:</strong> Rs. {returnItem.unitPrice?.toFixed(2)}</div>
              <div><strong>Sold Qty:</strong> {returnItem.quantity}</div>
              <div><strong>Already Returned:</strong> {returnItem.returnedQty || 0}</div>
              <div><strong>Max Returnable:</strong> {returnItem.maxReturnable}</div>
              <div><strong>Original Bill Discount:</strong> {returnItem.discountPercentage}%</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>Return Quantity:</label>
              <input
                type="number"
                min="1"
                max={returnItem.maxReturnable}
                value={returnQty}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setReturnQty('');
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0 && num <= returnItem.maxReturnable) {
                      setReturnQty(num);
                    }
                  }
                }}
                onBlur={() => {
                  // Clamp on blur (when user leaves the field)
                  const num = parseInt(returnQty, 10);
                  if (isNaN(num) || num < 1) setReturnQty(1);
                  else if (num > returnItem.maxReturnable) setReturnQty(returnItem.maxReturnable);
                }}
                style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleProcessReturn(); }}
              />
            </div>

            {/* Refund calculation preview */}
            <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Gross Amount:</span>
                <span>Rs. {(returnItem.unitPrice * returnQty).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#c62828' }}>
                <span>Discount Deduction ({returnItem.discountPercentage}%):</span>
                <span>- Rs. {(returnItem.unitPrice * returnQty * returnItem.discountPercentage / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 16, borderTop: '2px solid #333', paddingTop: 8, marginTop: 4 }}>
                <span>Refund Amount:</span>
                <span>Rs. {(returnItem.unitPrice * returnQty * (1 - returnItem.discountPercentage / 100)).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReturnModal(false)}
                style={{ padding: '8px 20px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleProcessReturn}
                disabled={returnProcessing}
                style={{ padding: '8px 20px', background: returnProcessing ? '#ccc' : '#e65100', color: '#fff', border: 'none', borderRadius: 4, cursor: returnProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {returnProcessing ? 'Processing...' : `Confirm Return (${returnQty} units)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Price Modal */}
      {showQuickPriceModal && quickPriceCartIdx !== null && (
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
          onClick={closeQuickPriceModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 350,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ marginBottom: 16, color: '#333' }}>
              💰 Quick Price Add
            </h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              Add a new selling price for: <strong>{cartItems[quickPriceCartIdx]?.product?.name}</strong>
            </p>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: 13 }}>
              Selling Price (Rs.):
            </label>
            <input
              type="text"
              placeholder="e.g., 150.50"
              value={quickPriceInput}
              onChange={(e) => {
                // Allow only digits and decimals
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setQuickPriceInput(val);
                setQuickPriceValidation('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleQuickPriceSubmit();
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #2196f3',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />

            {quickPriceValidation && (
              <div style={{
                padding: 10,
                background: '#ffebee',
                border: '1px solid #ef5350',
                borderRadius: 4,
                color: '#c62828',
                fontSize: 12,
                marginBottom: 12,
                fontWeight: 'bold'
              }}>
                ⚠️ {quickPriceValidation}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={closeQuickPriceModal}
                style={{
                  padding: '10px 20px',
                  background: '#eee',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleQuickPriceSubmit}
                style={{
                  padding: '10px 20px',
                  background: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13
                }}
              >
                Add Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
