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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
      setHighlightedIndex(-1);
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
    console.log('Product selected in dropdown:', product);
    console.log('Has productId:', !!product.productId, 'Value:', product.productId);
    setQuery(product.productCode + ' — ' + product.name);
    setOpen(false);
    setHighlightedIndex(-1);
    if (onSelect) onSelect(product);
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: 300 }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ padding: 8, width: '100%' }}
      />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#fff', border: '1px solid #ddd', maxHeight: 260, overflow: 'auto' }}>
          {results.map((r, idx) => (
            <div 
              key={r.productId} 
              onClick={() => handleSelect(r)} 
              onMouseEnter={() => setHighlightedIndex(idx)}
              style={{ 
                padding: 10, 
                borderBottom: '1px solid #f0f0f0', 
                cursor: 'pointer',
                background: highlightedIndex === idx ? '#e3f2fd' : '#fff'
              }}
            >
              <div style={{ fontWeight: 600 }}>{r.productCode} — {r.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Stock: {r.totalStock ?? '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
