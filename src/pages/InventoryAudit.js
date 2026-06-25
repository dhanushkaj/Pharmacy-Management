import React, { useState, useEffect } from 'react';
import { Button, Card, Table, Modal, Select, Upload, Spin, message, Popconfirm, Tabs, Empty } from 'antd';
import { UploadOutlined, DeleteOutlined, RollbackOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { api } from '../utill/api';
import './InventoryAudit.css';

const InventoryAudit = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [audits, setAudits] = useState([]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [auditDetails, setAuditDetails] = useState([]);
  const [variances, setVariances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileData, setFileData] = useState([]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    loadHistory();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api('/api/categories');
      const categoryList = Array.isArray(data) ? data : [];
      setCategories(categoryList);
    } catch (error) {
      console.error('Failed to load categories', error);
      message.error('Failed to load categories: ' + error.message);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api('/api/inventory-audits/history?limit=50');
      if (data?.success && Array.isArray(data.audits)) {
        setAudits(data.audits);
        console.log('Loaded audits:', data.audits.length);
      } else if (Array.isArray(data)) {
        // Fallback if response is direct array
        setAudits(data);
      } else {
        setAudits([]);
      }
    } catch (error) {
      console.error('Failed to load audit history', error);
      message.error('Failed to load audit history: ' + error.message);
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  // SECTION 1: EXPORT BY CATEGORY
  const handleExport = async () => {
    if (!selectedCategory) {
      message.warning('Please select a category');
      return;
    }

    try {
      setLoading(true);
      const notes = 'Exported on ' + new Date().toLocaleString();
      const response = await api(`/api/inventory-audits/export-by-category?categoryId=${selectedCategory}&notes=${encodeURIComponent(notes)}`, {
        method: 'POST'
      });

      if (response?.success) {
        const audit = response.audit;
        setCurrentAudit(audit);
        setAuditDetails(audit.details || []);
        message.success(`Exported ${audit.details?.length || 0} products`);
        
        // Refresh history
        loadHistory();
      }
    } catch (error) {
      console.error('Export failed', error);
      message.error('Export failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Download exported data as Excel
  const handleDownloadExcel = () => {
    if (!auditDetails || auditDetails.length === 0) {
      message.warning('No data to download');
      return;
    }

    const worksheetData = auditDetails.map((item, index) => ({
      'Product ID': item.productId,
      'Product Code': item.productCode,
      'Product Name': item.productName,
      'System Qty': item.systemQtyAtExport,
      'Physical Qty': '', // Empty for manual entry
      'Cost Price': item.costPrice,
      'Sell Price': item.sellPrice,
      'Notes': item.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Audit');
    
    const fileName = `Inventory_Audit_${currentAudit?.auditId || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success('Excel file downloaded');
  };

  // SECTION 2: UPLOAD & PROCESS
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Parse and validate data
        const processedData = jsonData.map((row) => ({
          productId: Number(row['Product ID']),
          physicalQty: Number(row['Physical Qty']) || 0,
          notes: row['Notes'] || ''
        })).filter(item => item.productId);

        setFileData(processedData);
        message.success(`Loaded ${processedData.length} products from file`);
      } catch (error) {
        console.error('File parse error', error);
        message.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleProcessUpload = async () => {
    if (!currentAudit || !fileData || fileData.length === 0) {
      message.warning('No audit data or file data to process');
      return;
    }

    // Show confirmation dialog
    Modal.confirm({
      title: 'Confirm File Upload',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p><strong>Are you sure you want to upload this file?</strong></p>
          <p>This will:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '12px' }}>
            <li>Process {fileData.length} products from the Excel file</li>
            <li>Calculate inventory variances</li>
            <li>Automatically adjust inventory quantities</li>
            <li>Create permanent stock movement records</li>
          </ul>
          <p style={{ color: '#f5222d', fontWeight: '600' }}>
            ⚠️ This action cannot be undone without rolling back the entire audit!
          </p>
        </div>
      ),
      okText: 'Yes, Upload',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await performUpload();
      }
    });
  };

  const performUpload = async () => {
    try {
      setUploading(true);
      const response = await api(`/api/inventory-audits/${currentAudit.auditId}/upload`, {
        method: 'POST',
        body: fileData
      });

      if (response?.success) {
        const result = response.result;
        message.success(
          `✅ Upload Successful!\n` +
          `Processed: ${result.totalAdjustments} adjustments ` +
          `(+${result.positiveAdjustments} added, -${result.negativeAdjustments} removed)`
        );
        
        // Refresh audit and history
        loadAuditDetails(currentAudit.auditId);
        loadHistory();
        setUploadModalVisible(false);
        setFileData([]);
      }
    } catch (error) {
      console.error('Upload failed', error);
      message.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // SECTION 3: HISTORY & DETAILS
  const loadAuditDetails = async (auditId) => {
    try {
      setLoading(true);
      const data = await api(`/api/inventory-audits/${auditId}`);
      if (data?.success) {
        const audit = data.audit;
        setCurrentAudit(audit);
        setAuditDetails(audit.details || []);
      }
    } catch (error) {
      console.error('Failed to load audit details', error);
      message.error('Failed to load audit details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVarianceReport = async (auditId) => {
    try {
      setLoading(true);
      const data = await api(`/api/inventory-audits/${auditId}/variance-report`);
      if (data?.success) {
        setVariances(data.variances || []);
        setViewModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to load variance report', error);
      message.error('Failed to load variance report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (auditId) => {
    try {
      setLoading(true);
      const response = await api(`/api/inventory-audits/${auditId}/rollback`, {
        method: 'POST'
      });
      if (response?.success) {
        message.success('Audit rolled back successfully');
        loadHistory();
        setCurrentAudit(null);
        setAuditDetails([]);
      }
    } catch (error) {
      console.error('Rollback failed', error);
      message.error('Rollback failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // TABLE COLUMNS
  const detailColumns = [
    { title: 'Product Code', dataIndex: 'productCode', key: 'productCode', width: 120 },
    { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
    { title: 'System Qty', dataIndex: 'systemQtyAtExport', key: 'systemQty', width: 100 },
    { title: 'Physical Qty', dataIndex: 'physicalQty', key: 'physicalQty', width: 100 },
    { 
      title: 'Variance', 
      dataIndex: 'variance', 
      key: 'variance',
      width: 100,
      render: (variance) => (
        <span style={{ color: variance > 0 ? '#52c41a' : variance < 0 ? '#f5222d' : '#000' }}>
          {variance > 0 ? '+' : ''}{variance}
        </span>
      )
    },
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice', width: 100 },
    { title: 'Sell Price', dataIndex: 'sellPrice', key: 'sellPrice', width: 100 }
  ];

  const historyColumns = [
    {
      title: 'Audit ID',
      dataIndex: 'auditId',
      key: 'auditId',
      width: 80,
      render: (id) => `#${id}`
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName'
    },
    {
      title: 'Exported By',
      dataIndex: 'exportedByName',
      key: 'exportedByName'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{
          color: status === 'COMPLETED' ? '#52c41a' : 
                 status === 'UPLOADED' ? '#1890ff' : '#faad14'
        }}>
          {status}
        </span>
      )
    },
    {
      title: 'Items',
      dataIndex: 'itemsAdjusted',
      key: 'itemsAdjusted'
    },
    {
      title: 'Exported',
      dataIndex: 'exportedAt',
      key: 'exportedAt',
      width: 160,
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedByName',
      key: 'uploadedByName',
      width: 120,
      render: (name) => name || '-'
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="action-buttons">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => loadAuditDetails(record.auditId)}
          >
            View
          </Button>
          <Button 
            size="small" 
            onClick={() => loadVarianceReport(record.auditId)}
          >
            Variance
          </Button>
          {record.status === 'COMPLETED' && (
            <Popconfirm
              title="Rollback Audit?"
              description="This will reverse all adjustments"
              onConfirm={() => handleRollback(record.auditId)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                danger 
                size="small" 
                icon={<RollbackOutlined />}
              >
                Rollback
              </Button>
            </Popconfirm>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="inventory-audit-container">
      <h1>Physical Inventory Audit & Reconciliation</h1>

      <Tabs
        items={[
          {
            label: '1. Export by Category',
            key: 'export',
            children: (
              <Card loading={loading}>
                <div className="export-section">
                  <p>Select a category to export current inventory snapshot</p>
                  <div className="form-group">
                    <label>Category:</label>
                    <Select
                      placeholder="Select category"
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      options={categories.map(cat => ({
                        label: cat.name || `Category ${cat.categoryId}`,
                        value: cat.categoryId
                      }))}
                      style={{ width: '300px' }}
                    />
                  </div>
                  <div className="button-group">
                    <Button 
                      type="primary" 
                      size="large"
                      onClick={handleExport}
                      loading={loading}
                    >
                      Export Category
                    </Button>
                  </div>
                </div>

                {auditDetails.length > 0 && (
                  <div className="export-result">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      padding: '12px',
                      background: '#e6f7ff',
                      borderRadius: '4px'
                    }}>
                      <div>
                        <h3 style={{ margin: 0, marginBottom: '4px' }}>Exported Data ({auditDetails.length} products)</h3>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Audit #{currentAudit?.auditId} • Exported: {new Date(currentAudit?.exportedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                        By: {currentAudit?.exportedByName || 'N/A'}
                      </div>
                    </div>
                    <Button 
                      type="default" 
                      icon={<UploadOutlined />}
                      onClick={handleDownloadExcel}
                    >
                      Download as Excel
                    </Button>
                    <Table
                      columns={detailColumns}
                      dataSource={auditDetails.map((item, idx) => ({ ...item, key: idx }))}
                      size="small"
                      pagination={{ pageSize: 10 }}
                      style={{ marginTop: '20px' }}
                    />
                  </div>
                )}
              </Card>
            )
          },
          {
            label: '2. Upload & Process',
            key: 'upload',
            children: (
              <Card loading={uploading}>
                <div className="upload-section">
                  <div style={{
                    marginBottom: '24px',
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: '4px',
                    borderLeft: '4px solid #1890ff'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>File Upload Instructions</h4>
                    <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                      <li>Export a category from Tab 1</li>
                      <li>Download the Excel file</li>
                      <li>Fill in the "Physical Qty" column with actual warehouse counts</li>
                      <li>Upload the updated file here</li>
                      <li>System will automatically calculate variances and adjust inventory</li>
                    </ol>
                  </div>

                  <div className="form-group">
                    <label>Select Audit (Optional):</label>
                    <Select
                      placeholder="Select an audit to upload results for"
                      value={currentAudit?.auditId || null}
                      onChange={(auditId) => {
                        const selected = audits.find(a => a.auditId === auditId);
                        if (selected) setCurrentAudit(selected);
                      }}
                      options={audits.map(audit => ({
                        label: `Audit #${audit.auditId} - ${audit.categoryName} (${new Date(audit.exportedAt).toLocaleDateString()}) ${audit.status === 'COMPLETED' ? '✓' : ''}`,
                        value: audit.auditId
                      }))}
                      style={{ width: '100%' }}
                      optionLabelProp="label"
                      maxTagCount="responsive"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Total audits: {audits.length}
                    </div>
                  </div>

                  {currentAudit && (
                    <div style={{
                      marginBottom: '16px',
                      padding: '12px',
                      background: '#e6f7ff',
                      borderRadius: '4px'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        <strong>Current Audit:</strong> #{currentAudit.auditId} - {currentAudit.categoryName} 
                        <br/>
                        <strong>Exported:</strong> {new Date(currentAudit.exportedAt).toLocaleString()} by {currentAudit.exportedByName}
                      </p>
                    </div>
                  )}

                  <div className="form-group">
                    <label style={{ marginBottom: '12px', display: 'block', fontWeight: '600', color: '#1890ff' }}>
                      📄 Upload Excel File:
                    </label>
                    <p style={{ 
                      margin: '8px 0', 
                      color: '#666', 
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      Click to select or drag and drop Excel file (.xlsx, .xls)
                    </p>
                    <Upload
                      maxCount={1}
                      accept=".xlsx,.xls"
                      beforeUpload={handleFileUpload}
                      className="upload-area"
                      style={{ marginTop: '8px' }}
                    >
                      <Button 
                        icon={<UploadOutlined />}
                        style={{
                          height: '40px',
                          fontSize: '14px',
                          padding: '8px 16px'
                        }}
                      >
                        Select Excel File
                      </Button>
                    </Upload>
                  </div>

                  {fileData.length > 0 && (
                    <div className="file-preview">
                      <p>{fileData.length} products loaded from file</p>
                      {currentAudit && (
                        <Button 
                          type="primary" 
                          size="large"
                          onClick={handleProcessUpload}
                          loading={uploading}
                        >
                          Process Adjustments
                        </Button>
                      )}
                      {!currentAudit && (
                        <p style={{ color: '#f5222d' }}>⚠️ Please select an audit first</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )
          },
          {
            label: '3. History & Rollback',
            key: 'history',
            children: (
              <Card loading={loading}>
                <div className="history-section">
                  <h3>Audit History</h3>
                  <Table
                    columns={historyColumns}
                    dataSource={audits}
                    size="small"
                    pagination={{ pageSize: 20 }}
                    rowKey="auditId"
                  />
                </div>
              </Card>
            )
          }
        ]}
      />

      {/* View Details Modal */}
      <Modal
        title={`Audit #${currentAudit?.auditId} Details`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={1000}
        footer={null}
      >
        <Spin spinning={loading}>
          <Table
            columns={detailColumns}
            dataSource={auditDetails.map((item, idx) => ({ ...item, key: idx }))}
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Modal>

      {/* Variance Report Modal */}
      <Modal
        title={`Variance Report - Audit #${currentAudit?.auditId}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={1000}
        footer={null}
      >
        <Spin spinning={loading}>
          <Table
            columns={[
              { title: 'Product Code', dataIndex: 'productCode', key: 'productCode' },
              { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
              { title: 'System Qty', dataIndex: 'systemQtyAtExport', key: 'systemQty' },
              { title: 'Physical Qty', dataIndex: 'physicalQty', key: 'physicalQty' },
              { 
                title: 'Variance', 
                dataIndex: 'variance', 
                key: 'variance',
                render: (variance) => (
                  <span style={{ color: variance > 0 ? '#52c41a' : '#f5222d' }}>
                    {variance > 0 ? '+' : ''}{variance}
                  </span>
                )
              }
            ]}
            dataSource={variances.map((item, idx) => ({ ...item, key: idx }))}
            size="small"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default InventoryAudit;
