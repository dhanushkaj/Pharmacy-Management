# Frontend Audit Components Implementation Plan

## Overview
This document outlines the frontend React components needed to implement audit functionality in your Pharmacy Management System.

## Required Frontend Components

### 1. API Layer (auditApi.js) ✅ Created
**Purpose**: Handle all audit-related API calls
**Location**: `src/utill/auditApi.js`
**Functions**:
- `getAuditLogs(filters, token)` - Fetch paginated audit logs
- `getEntityHistory(entityType, entityId, token)` - Get history for specific entity
- `getUserActivity(username, startDate, endDate, token)` - Get user activity
- `getAuditStats(period, token)` - Get audit statistics
- `exportAuditLogs(filters, token)` - Export audit logs to CSV

### 2. Main Audit Pages

#### A. Audit Trail Page (`src/pages/AuditTrail.js`)
**Purpose**: Main page to view and filter audit logs
**Features**:
- Comprehensive filtering (entity type, user, date range, actions)
- Paginated table view of audit logs
- Export to CSV functionality
- Real-time search and filtering
- Action type color coding

**UI Components**:
```javascript
// Filter section with dropdowns and date pickers
// Data table with columns:
// - Timestamp
// - Action (CREATE/UPDATE/DELETE with color badges)
// - Entity Type & ID
// - User
// - IP Address
// - Before/After values (truncated)
// - Description
// Pagination controls
// Export button
```

#### B. Entity History Modal (`src/components/EntityHistory.js`)
**Purpose**: Show detailed change history for specific entity
**Features**:
- Timeline view of all changes
- Before/after value comparison
- User attribution for each change
- Expandable JSON diff view

#### C. User Activity Dashboard (`src/pages/UserActivityDashboard.js`)
**Purpose**: Admin view of user actions and statistics
**Features**:
- User activity summary
- Activity charts and graphs
- Most active users
- Activity by entity type
- Date range filtering

### 3. Enhanced Entity Management Pages

#### Update Existing Pages to Include Audit Features:

**A. Product Management Enhancement**
```javascript
// Add "View History" button to each product row
// When clicked, opens EntityHistory modal for that product
// Shows audit trail of price changes, stock updates, etc.
```

**B. Customer Management Enhancement**
```javascript
// Add audit trail for customer data changes
// Track customer profile updates
// Show history of transactions
```

**C. Supplier Management Enhancement**
```javascript
// Track supplier information changes
// Audit supplier contact updates
// History of purchase orders from supplier
```

**D. GRN Management Enhancement**
```javascript
// Track GRN approvals and modifications
// Audit inventory adjustments from GRN
// Show approval workflow history
```

### 4. Navigation Updates

#### Update Sidebar (`src/components/Sidebar.js`)
```javascript
// Add new menu items under "Reports & Alerts":
// - Audit Trail (admin/manager only)
// - User Activity (admin only)
// - Data History (manager/admin only)

// Add audit icon to existing pages (small history icon)
```

### 5. Component Implementations

#### A. AuditBadge Component (`src/components/AuditBadge.js`)
```javascript
// Small component to show audit status
// Shows last modified date/user on hover
// Can be added to any entity display
```

#### B. ChangeIndicator Component (`src/components/ChangeIndicator.js`)
```javascript
// Visual indicator when data has recently changed
// Shows "Recently Updated" badge
// Configurable time threshold
```

#### C. AuditSummary Component (`src/components/AuditSummary.js`)
```javascript
// Dashboard widget showing audit statistics
// Total changes today/week/month
// Most active users
// Recent critical changes
```

## Implementation Steps

### Phase 1: Core Infrastructure
1. ✅ Create audit API functions (`auditApi.js`)
2. Create basic AuditTrail page with simple table
3. Add "Audit Trail" menu item to sidebar (admin only)
4. Test basic audit log fetching

### Phase 2: Enhanced Filtering & UI
1. Add comprehensive filters to AuditTrail page
2. Implement pagination
3. Add export functionality
4. Style with existing theme

### Phase 3: Entity Integration
1. Add "View History" buttons to entity management pages
2. Create EntityHistory modal component
3. Integrate with Product, Customer, Supplier pages
4. Test entity-specific audit trails

### Phase 4: Advanced Features
1. Create UserActivityDashboard page
2. Add audit statistics and charts
3. Implement real-time updates
4. Add audit alerts for critical changes

### Phase 5: Enhanced UX
1. Add visual change indicators
2. Create audit summary widgets
3. Implement audit data caching
4. Add keyboard shortcuts and accessibility

## Sample Code Snippets

### Adding History Button to Product Management
```javascript
// In ProductManagement.js, add to each product row:
<button 
  onClick={() => setHistoryModal({show: true, entityType: 'Product', entityId: product.id})}
  style={{padding: '4px 8px', background: '#e3f2fd', border: 'none', borderRadius: 4}}
>
  📋 History
</button>

// Add modal state:
const [historyModal, setHistoryModal] = useState({show: false, entityType: '', entityId: null});

// Add modal component:
{historyModal.show && 
  <EntityHistory 
    entityType={historyModal.entityType}
    entityId={historyModal.entityId}
    onClose={() => setHistoryModal({show: false, entityType: '', entityId: null})}
  />
}
```

### Sidebar Menu Update
```javascript
// In Sidebar.js, add to reports submenu:
<li>
  <NavLink to="/audit-trail" 
    style={({isActive}) => ({
      color: isActive ? '#90caf9' : '#fff', 
      textDecoration: 'none', 
      display: 'block', 
      padding: '8px 0'
    })}
  >
    Audit Trail
  </NavLink>
</li>
```

## Integration with Backend

### Required Backend Endpoints (Already Created)
- `GET /api/audit/logs` - Paginated audit logs
- `GET /api/audit/entity/{type}/{id}` - Entity history
- `GET /api/audit/user-activity` - User activity data  
- `GET /api/audit/stats` - Audit statistics
- `GET /api/audit/export` - CSV export

### Authentication
All audit endpoints require JWT token in Authorization header.
Only admin/manager roles can access audit data.

## Security Considerations

### Frontend Security
1. **Role-based Access**: Only show audit features to authorized users
2. **Data Sanitization**: Sanitize audit data display to prevent XSS
3. **Token Management**: Ensure JWT tokens are properly handled
4. **Sensitive Data**: Mask sensitive fields in audit displays

### Example Role Check
```javascript
const role = localStorage.getItem('role');
const canViewAudit = role === 'admin' || role === 'manager';

// Only render audit components if authorized
{canViewAudit && <AuditTrailButton />}
```

## Testing Strategy

### Unit Tests
- Test audit API functions
- Test component rendering
- Test filtering logic
- Test pagination

### Integration Tests  
- Test audit log fetching
- Test entity history loading
- Test export functionality
- Test role-based access

### User Acceptance Tests
- Verify audit data accuracy
- Test user workflow for viewing history
- Validate export file format
- Check performance with large datasets

## Performance Optimization

### Frontend Performance
1. **Pagination**: Load audit data in pages
2. **Caching**: Cache audit data locally
3. **Lazy Loading**: Load audit components on demand
4. **Virtualization**: Use virtual scrolling for large datasets

### Data Management
1. **Debounced Search**: Prevent excessive API calls
2. **Memoization**: Cache expensive calculations  
3. **Selective Loading**: Only load visible data
4. **Background Refresh**: Update data periodically

## Deployment Checklist

### Pre-deployment
- [ ] All audit components created and tested
- [ ] Backend audit endpoints working
- [ ] Database migration completed
- [ ] Role-based access implemented
- [ ] Export functionality tested

### Post-deployment
- [ ] Verify audit logging is working
- [ ] Test audit trail display
- [ ] Validate user permissions
- [ ] Monitor performance
- [ ] Train users on audit features

## Next Steps

1. **Execute Database Migration**: Run the audit schema SQL
2. **Start Backend**: Test audit endpoints are working
3. **Create Basic Audit Page**: Simple version first
4. **Add Menu Navigation**: Update sidebar
5. **Test End-to-End**: Complete audit workflow
6. **Enhance UI**: Add advanced features
7. **User Training**: Document audit features

This comprehensive audit implementation will provide full traceability and compliance for your pharmacy management system.