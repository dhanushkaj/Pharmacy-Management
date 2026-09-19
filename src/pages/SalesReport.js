import React, { useState, useEffect } from 'react';
import api from '../utill/api';

const SalesReport = () => {
  const [billings, setBillings] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [search, setSearch] = useState({ date: '', product: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      setLoading(true);
      // Fetch all billings with pagination (large size to get all records)
      const response = await api.get('/billing?page=0&size=10000');
      const data = response.data && response.data.content ? response.data.content : (Array.isArray(response.data) ? response.data : []);
      console.log('Fetched billings:', data); // Debug log
      setBillings(data);
      filterAndProcessBillings(data, search);
      setError('');
    } catch (err) {
      setError('Failed to load sales report data');
      console.error('Error fetching billings:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndProcessBillings = (bills, searchParams) => {
    const processed = bills.filter(billing => {
      const billingDate = new Date(billing.billingDate).toISOString().split('T')[0];
      if (!searchParams.date || billingDate === searchParams.date) {
        if (!searchParams.product) return true;
        // Check if any item matches product search
        return billing.items && billing.items.some(item => 
          item.productName.toLowerCase().includes(searchParams.product.toLowerCase())
        );
      }
      return false;
    }).map(billing => ({
      billingId: billing.billingId,
      billingNumber: billing.billingNumber,
      date: new Date(billing.billingDate).toISOString().split('T')[0],
      customerName: billing.customerName,
      itemCount: billing.items ? billing.items.length : 0,
      subtotal: Number(billing.subtotal || 0),
      productDiscounts: (() => {
        return billing.items && billing.items.length > 0 ? billing.items.reduce((sum, item) => {
          if (item.appliedDiscount && item.appliedDiscount > 0) {
            return sum + (item.quantity * item.unitPrice * item.appliedDiscount) / 100;
          }
          return sum;
        }, 0) : 0;
      })(),
      customerDiscount: (() => {
        const productDisc = billing.items && billing.items.length > 0 ? billing.items.reduce((sum, item) => {
          if (item.appliedDiscount && item.appliedDiscount > 0) {
            return sum + (item.quantity * item.unitPrice * item.appliedDiscount) / 100;
          }
          return sum;
        }, 0) : 0;
        return Number(billing.discountAmount || 0) - productDisc;
      })(),
      discountPercentage: Number(billing.discountPercentage || 0),
      totalDiscount: Number(billing.discountAmount || 0),
      grandTotal: Number(billing.grandTotal || 0),
      amountReceived: Number(billing.amountReceived || 0)
    }));
    setFilteredItems(processed);
  };

  const handleSearch = (e) => {
    const updatedSearch = { ...search, [e.target.name]: e.target.value };
    setSearch(updatedSearch);
    filterAndProcessBillings(billings, updatedSearch);
  };

  const getTotalSummary = () => {
    const summary = filteredItems.reduce((acc, item) => {
      acc.totalSubtotal += item.subtotal;
      acc.totalProductDiscount += item.productDiscounts;
      acc.totalCustomerDiscount += item.customerDiscount;
      acc.totalDiscount += item.totalDiscount;
      acc.totalNetAmount += item.grandTotal;
      acc.totalPaid += item.amountReceived;
      acc.billCount += 1;
      return acc;
    }, { totalSubtotal: 0, totalProductDiscount: 0, totalCustomerDiscount: 0, totalDiscount: 0, totalNetAmount: 0, totalPaid: 0, billCount: 0 });
    return summary;
  };

  const summary = getTotalSummary();

  return (
    <div style={{ padding: 24 }}>
      <h2>Sales Report</h2>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <input 
          type="date" 
          name="date"
          value={search.date} 
          onChange={handleSearch}
          placeholder="Date" 
          style={{ padding: 8 }} 
        />
        <input 
          type="text" 
          name="product"
          value={search.product} 
          onChange={handleSearch}
          placeholder="Product Name" 
          style={{ padding: 8 }} 
        />
      </div>

      {loading ? (
        <div>Loading sales data...</div>
      ) : filteredItems.length === 0 ? (
        <div>No sales records found</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #333' }}>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Bill No</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Customer</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Items</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Subtotal</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Product Disc</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Customer Disc</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Total Discount</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontWeight: 'bold' }}>Final Amount</th>
                  <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.billingNumber}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.date}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.customerName}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{item.itemCount}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {item.subtotal.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {item.productDiscounts.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {item.customerDiscount.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {item.totalDiscount.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontWeight: 'bold', background: '#e8f5e9' }}>Rs. {item.grandTotal.toFixed(2)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {item.amountReceived.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#e8f5e9', borderTop: '2px solid #333', fontWeight: 'bold' }}>
                  <td colSpan={4} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>TOTAL:</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.productDiscounts, 0).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.customerDiscount, 0).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.totalDiscount, 0).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.grandTotal, 0).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Rs. {filteredItems.reduce((sum, item) => sum + item.amountReceived, 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            <h3>Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <strong>Total Subtotal:</strong><br/>Rs. {summary.totalSubtotal.toFixed(2)}
              </div>
              <div>
                <strong>Total Product Discounts:</strong><br/>Rs. {summary.totalProductDiscount.toFixed(2)}
              </div>
              <div>
                <strong>Total Customer Discounts:</strong><br/>Rs. {summary.totalCustomerDiscount.toFixed(2)}
              </div>
              <div>
                <strong>Total Discounts:</strong><br/>Rs. {summary.totalDiscount.toFixed(2)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 12 }}>
              <div>
                <strong>Total Sales (Final Amount):</strong><br/>Rs. {summary.totalNetAmount.toFixed(2)}
              </div>
              <div>
                <strong>Total Amount Paid:</strong><br/>Rs. {summary.totalPaid.toFixed(2)}
              </div>
              <div>
                <strong>Total Bills:</strong><br/>{summary.billCount}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesReport;
