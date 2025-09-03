
import React, { useState } from 'react';

// SuggestionItem component for dropdown suggestions
const SuggestionItem = ({ product, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        padding: 8,
        cursor: 'pointer',
        background: hover ? '#e3f2fd' : '#fff',
        borderBottom: '1px solid #90caf9'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {product.name}
    </div>
  );
};

const mockProducts = [
  { id: 1, name: "Paracetamol 500mg", price: 15.00, stock: 120 },
  { id: 2, name: "Amoxicillin 250mg", price: 30.00, stock: 80 },
  { id: 3, name: "Vitamin C 100mg", price: 12.00, stock: 200 },
];

function Billing() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', address: '', existing: false });
  const [customerList] = useState([
    { name: 'John Doe', address: '123 Main St' },
    { name: 'Jane Smith', address: '456 Market Rd' },
  ]);
  const [suggestions, setSuggestions] = useState([]);

  // ...existing code...

  // Product search logic
  const products = mockProducts.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      (p.generic && p.generic.toLowerCase().includes(s)) ||
      (p.category && p.category.toLowerCase().includes(s)) ||
      (p.code && p.code.toLowerCase().includes(s))
    );
  });

  // ...existing code...

  // Suggestion logic with qty*searchText support
  const handleSearchChange = e => {
    const val = e.target.value;
    setSearch(val);
    let searchText = val;
    // Check for qty*searchText pattern
    let qty = 1;
    const match = val.match(/^(\d+)\*(.*)$/);
    if (match) {
      qty = parseInt(match[1], 10);
      searchText = match[2].trim();
    }
    if (searchText.length > 0) {
      setSuggestions(mockProducts.filter(p =>
        p.name.toLowerCase().startsWith(searchText.toLowerCase()) ||
        (p.generic && p.generic.toLowerCase().startsWith(searchText.toLowerCase())) ||
        (p.category && p.category.toLowerCase().startsWith(searchText.toLowerCase())) ||
        (p.code && p.code.toLowerCase().startsWith(searchText.toLowerCase()))
      ).map(p => ({ ...p, _qty: qty })));
    } else {
      setSuggestions([]);
    }
  };

  // ...existing code...

  // Add product to cart, supporting custom qty
  const addToCart = (product) => {
    const qtyToAdd = product._qty || 1;
    setCart(prev => {
      const found = prev.find(item => item.id === product.id);
      if (found) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + qtyToAdd }
            : item
        );
      }
      return [...prev, { ...product, qty: qtyToAdd }];
    });
    setSearch('');
    setSuggestions([]);
  };

  // ...existing code...

  // Remove product from cart
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // ...existing code...

  // Adjust quantity
  const adjustQty = (id, qty) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
  };

  // ...existing code...

  // Customer search/fill logic
  const handleCustomerName = e => {
    const val = e.target.value;
    setCustomer(c => {
      const found = customerList.find(cust => cust.name.toLowerCase() === val.toLowerCase());
      if (found) {
        return { name: found.name, address: found.address, existing: true };
      }
      return { ...c, name: val, existing: false };
    });
  };
  const handleCustomerAddress = e => setCustomer(c => ({ ...c, address: e.target.value }));

  // ...existing code...

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // ...existing code...

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: 24 }}>
      {/* Left: Billing Section */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <h2>Billing</h2>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <h3>Selected Products</h3>
          <table style={{ width: '100%', marginBottom: 12 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Adjust</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>Rs. {item.price.toFixed(2)}</td>
                  <td>Rs. {(item.price * item.qty).toFixed(2)}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={e => adjustQty(item.id, Number(e.target.value))}
                      style={{ width: 60, padding: 4 }}
                    />
                  </td>
                  <td><button onClick={() => removeFromCart(item.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 'bold', fontSize: 18, textAlign: 'right' }}>
            Total: Rs. {total.toFixed(2)}
          </div>
          <button style={{ marginTop: 20, float: 'right' }}>Process Payment</button>
        </div>
      </div>

      {/* Right: Customer Section & Product Search */}
      <div style={{ flex: 1, minWidth: 320 }}>
        <h2>Customer</h2>
        <form style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Name:</label>
            <input
              type="text"
              value={customer.name}
              onChange={handleCustomerName}
              style={{ marginLeft: 8, padding: 8, minWidth: 180 }}
              placeholder="Enter or select customer"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Address:</label>
            <input
              type="text"
              value={customer.address}
              onChange={handleCustomerAddress}
              style={{ marginLeft: 8, padding: 8, minWidth: 180 }}
              placeholder="Customer address"
              disabled={customer.existing}
            />
          </div>
        </form>
        {/* Product Search Section */}
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
          <h3>Product Search & Add</h3>
          <input
            type="text"
            placeholder="Search by name, generic, category, code..."
            value={search}
            onChange={handleSearchChange}
            style={{ padding: 8, width: '100%', marginBottom: 8, border: '1px solid #90caf9' }}
          />
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #90caf9', borderRadius: 4, maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
              {suggestions.map(s => (
                <SuggestionItem key={s.id} product={s} onClick={() => addToCart(s)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Billing;