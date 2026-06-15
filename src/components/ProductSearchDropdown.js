import React, { useState, useEffect, useRef, useContext } from 'react';
import { api } from '../utill/api';
import { AuthContext } from './AuthContext';

const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

export default function ProductSearchDropdown({ categoryId, onSelect, placeholder = 'Search product...' }) {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = async (q, catId) => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }
    try {
      const catParam = catId ? `&categoryId=${catId}` : '';
      const res = await api(`/api/products/search?q=${encodeURIComponent(q)}${catParam}`, { token });
      setResults(res || []);
      setOpen(true);
    } catch (e) {
      console.error('Product search error', e.message);
      setResults([]);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounced = useRef(debounce((q, cat) => doSearch(q, cat), 300)).current;

  useEffect(() => {
    if (query && query.length > 0) debounced(query, categoryId);
    else setResults([]);
  }, [query, categoryId, debounced]);

  const handleSelect = (product) => {
    setQuery(product.productCode + ' — ' + product.name);
    setOpen(false);
    if (onSelect) onSelect(product);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: 300 }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        placeholder={placeholder}
        style={{ padding: 8, width: '100%' }}
      />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #ddd', maxHeight: 260, overflow: 'auto' }}>
          {results.map(r => (
            <div key={r.productId} onClick={() => handleSelect(r)} style={{ padding: 10, borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>
              <div style={{ fontWeight: 600 }}>{r.productCode} — {r.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Stock: {r.totalStock ?? '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
