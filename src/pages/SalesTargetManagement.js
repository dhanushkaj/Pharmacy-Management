import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../components/AuthContext';
import { api } from '../utill/api';

const SalesTargetManagement = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Current selected month/year
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  // Targets data for each day
  const [targets, setTargets] = useState({});

  // Get days in selected month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);

  // Fetch targets for selected month
  useEffect(() => {
    fetchTargets();
  }, [selectedYear, selectedMonth]);

  const fetchTargets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api(`/api/sales-targets/${selectedYear}/${selectedMonth}`);
      
      // Convert array to object keyed by day
      const targetsMap = {};
      if (Array.isArray(data)) {
        data.forEach(t => {
          targetsMap[t.day] = t.targetAmount;
        });
      }
      setTargets(targetsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (day, value) => {
    setTargets(prev => ({
      ...prev,
      [day]: value === '' ? '' : parseFloat(value) || 0
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Build array of targets
      const targetsList = [];
      for (let day = 1; day <= daysInMonth; day++) {
        if (targets[day] !== undefined && targets[day] !== '' && targets[day] > 0) {
          targetsList.push({
            day: day,
            targetAmount: parseFloat(targets[day])
          });
        }
      }

      await api(`/api/sales-targets/${selectedYear}/${selectedMonth}`, {
        method: 'POST',
        body: targetsList
      });

      setSuccess('Targets saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Apply same value to all days
  const [applyAllValue, setApplyAllValue] = useState('');
  const handleApplyToAll = () => {
    if (applyAllValue === '' || isNaN(parseFloat(applyAllValue))) return;
    const newTargets = {};
    for (let day = 1; day <= daysInMonth; day++) {
      newTargets[day] = parseFloat(applyAllValue);
    }
    setTargets(newTargets);
  };

  // Calculate totals
  const totalTarget = Object.values(targets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate year options (current year -2 to +2)
  const yearOptions = [];
  for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 2; y++) {
    yearOptions.push(y);
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>🎯</span>
        Sales Target Management
      </h2>

      {/* Month/Year Selector */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24, 
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: 16,
        background: '#f5f5f5',
        borderRadius: 8
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 13 }}>Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{ padding: '8px 16px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 13 }}>Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{ padding: '8px 16px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 13 }}>Apply to all days:</label>
            <input
              type="number"
              value={applyAllValue}
              onChange={(e) => setApplyAllValue(e.target.value)}
              placeholder="Amount"
              style={{ padding: 8, fontSize: 14, borderRadius: 4, border: '1px solid #ccc', width: 120 }}
            />
          </div>
          <button
            onClick={handleApplyToAll}
            style={{
              padding: '8px 16px',
              background: '#ff9800',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{ padding: 12, background: '#ffebee', color: '#c62828', borderRadius: 4, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: 12, background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, marginBottom: 16 }}>
          ✅ {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : (
        <>
          {/* Targets Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: 12,
            marginBottom: 24
          }}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const date = new Date(selectedYear, selectedMonth - 1, day);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = day === today.getDate() && 
                             selectedMonth === today.getMonth() + 1 && 
                             selectedYear === today.getFullYear();

              return (
                <div
                  key={day}
                  style={{
                    padding: 12,
                    background: isToday ? '#e3f2fd' : isWeekend ? '#fff3e0' : '#fff',
                    border: isToday ? '2px solid #1976d2' : '1px solid #ddd',
                    borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 8
                  }}>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: 16,
                      color: isToday ? '#1976d2' : '#333'
                    }}>
                      Day {day}
                    </span>
                    <span style={{ 
                      fontSize: 11, 
                      color: isWeekend ? '#e65100' : '#666',
                      fontWeight: isWeekend ? 'bold' : 'normal'
                    }}>
                      {dayName}
                    </span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ 
                      position: 'absolute', 
                      left: 8, 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#666',
                      fontSize: 13
                    }}>
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={targets[day] ?? ''}
                      onChange={(e) => handleTargetChange(day, e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 32px',
                        fontSize: 14,
                        border: '1px solid #ccc',
                        borderRadius: 4,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary & Save */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 16,
            background: '#e8f5e9',
            borderRadius: 8,
            marginTop: 20
          }}>
            <div>
              <span style={{ fontSize: 14, color: '#666' }}>Total Monthly Target:</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 12, color: '#2e7d32' }}>
                Rs. {totalTarget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: '12px 32px',
                background: saving ? '#ccc' : '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: 16,
                boxShadow: '0 2px 8px rgba(76,175,80,0.3)'
              }}
            >
              {saving ? 'Saving...' : '💾 Save All Targets'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesTargetManagement;
