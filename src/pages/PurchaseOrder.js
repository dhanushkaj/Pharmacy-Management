import React, { useState } from 'react';

const suppliers = [
  { id: 1, name: 'HealthCorp' },
  { id: 2, name: 'MediSupply' },
];

const products = [
  { id: 1, name: 'Paracetamol' },
  { id: 2, name: 'Ibuprofen' },
];

const PurchaseOrder = () => {
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [product, setProduct] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [expire, setExpire] = useState('');
  const [productList, setProductList] = useState([]);

  const handleAddProduct = () => {
    if (!product || !costPrice || !sellPrice || !stock || !expire) return;
    setProductList([
      ...productList,
      {
        id: Date.now(),
        product,
        costPrice,
        sellPrice,
        stock,
        barcode,
        discount,
        discountAmount,
        expire,
      },
    ]);
    setProduct('');
    setCostPrice('');
    setSellPrice('');
    setStock('');
    setBarcode('');
    setDiscount('');
    setDiscountAmount('');
    setExpire('');
  };

  const handleDeleteProduct = (id) => {
    setProductList(productList.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save purchase order logic here
    alert('Purchase Order Submitted!');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Create Purchase Order</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label style={{ marginBottom: 6 }}>Supplier</label>
            <select value={supplier} onChange={e => setSupplier(e.target.value)} required style={{ padding: 8, textAlign: 'left' }}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label style={{ marginBottom: 6 }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label style={{ marginBottom: 6 }}>PO Number</label>
            <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="Auto-generated or enter manually" style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label style={{ marginBottom: 6 }}>Order Number</label>
            <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
        </div>
        <hr />
        <h3 style={{ marginTop: 32 }}>Add Products</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 180 }}>
            <label style={{ marginBottom: 6 }}>Product</label>
            <select value={product} onChange={e => setProduct(e.target.value)} style={{ padding: 8, textAlign: 'left' }}>
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 6 }}>Cost Price</label>
            <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 6 }}>Sell Price</label>
            <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
            <label style={{ marginBottom: 6 }}>Stock</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
            <label style={{ marginBottom: 6 }}>Barcode</label>
            <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140 }}>
            <label style={{ marginBottom: 6 }}>Expiry Date</label>
            <input type="date" value={expire} onChange={e => setExpire(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
            <label style={{ marginBottom: 6 }}>Discount (%)</label>
            <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 6 }}>Discount Amount</label>
            <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} style={{ padding: 8, textAlign: 'left' }} />
          </div>
        </div>
  {/* Only keep the green styled Add Product button below */}
        <button
          type="button"
          onClick={handleAddProduct}
          style={{ marginTop: 8, marginBottom: 16, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}
          disabled={!product || !costPrice || !sellPrice || !stock}
        >
          Add Product
        </button>
        <hr />
        <h3 style={{ marginTop: 32 }}>Products Added</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th>Product</th>
              <th>Cost Price</th>
              <th>Sell Price</th>
              <th>Stock</th>
              <th>Barcode</th>
              <th>Expiry Date</th>
              <th>Discount (%)</th>
              <th>Discount Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productList.map(p => (
              <tr key={p.id}>
                <td>{p.product}</td>
                <td>{p.costPrice}</td>
                <td>{p.sellPrice}</td>
                <td>{p.stock}</td>
                <td>{p.barcode}</td>
                <td>{p.expire}</td>
                <td>{p.discount}</td>
                <td>{p.discountAmount}</td>
                <td>
                  {/* Edit functionality can be added here */}
                  <button onClick={() => handleDeleteProduct(p.id)} style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '7px 14px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  <button type="submit" style={{ marginTop: 24, padding: '7px 18px', fontSize: 15, background: '#43ea7a', color: '#fff', border: 'none', borderRadius: 4 }}>Submit Purchase Order</button>
      </form>
    </div>
  );
};

export default PurchaseOrder;
