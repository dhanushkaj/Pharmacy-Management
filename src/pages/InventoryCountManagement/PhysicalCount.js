import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import StockCountGrid from './StockCountGrid';
import '../../css/InventoryCount.css';

const PhysicalCount = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    
    // Check if navigated from All Counts Report with a DRAFT session
    if (location.state?.draftSession) {
      const draftSession = location.state.draftSession;
      setSelectedCategory(draftSession.categoryId);
      setSession(draftSession);
      // Clear location state after loading
      navigate('/inventory-count', { replace: true });
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    }
  };

  const handleCategorySelect = async (categoryId) => {
    if (!categoryId) {
      setSelectedCategory(null);
      setSession(null);
      return;
    }

    setSelectedCategory(categoryId);
    setLoading(true);
    setError(null);

    try {
      // FIRST: Check if a DRAFT session already exists for this category
      try {
        const draftResponse = await axios.get(`/api/inventory-count/sessions/category/${categoryId}/draft`);
        setSession(draftResponse.data);
        setLoading(false);
        return;
      } catch (draftErr) {
        // No DRAFT exists, continue to create new one
        if (draftErr.response?.status !== 404) {
          throw draftErr;
        }
      }

      // SECOND: If no DRAFT found, create new session
      const response = await axios.post('/api/inventory-count/sessions', {
        categoryId: categoryId
      });
      setSession(response.data);
    } catch (err) {
      console.error('Error with category selection:', err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create count session';
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to create count session');
      setSelectedCategory(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-count-container">
      <div className="inventory-count-header">
        <h1>📦 Physical Inventory Count</h1>
        <p>Enter physical quantities for stock reconciliation</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="category-selector">
        <label htmlFor="category-select">Select Category:</label>
        <select
          id="category-select"
          value={selectedCategory || ''}
          onChange={(e) => handleCategorySelect(e.target.value ? parseInt(e.target.value) : null)}
          disabled={loading}
        >
          <option value="">-- Choose a category --</option>
          {categories.map((cat) => (
            <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading-spinner">Creating count session...</div>}

      {session && (
        <StockCountGrid session={session} onSessionUpdate={setSession} />
      )}
    </div>
  );
};

export default PhysicalCount;
