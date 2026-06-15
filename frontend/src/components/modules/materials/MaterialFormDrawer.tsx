import React, { useState, useEffect } from 'react';
import { X, Save, Box, Layers, ShieldCheck, DollarSign, Archive, Paperclip } from 'lucide-react';

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: Box },
  { id: 'specs', label: 'Specifications', icon: Layers },
  { id: 'technical', label: 'Technical', icon: ShieldCheck },
  { id: 'costing', label: 'Costing', icon: DollarSign },
  { id: 'inventory', label: 'Inventory', icon: Archive },
  { id: 'docs', label: 'Docs & QC', icon: Paperclip },
];

export default function MaterialFormDrawer({ isOpen, onClose, onSubmit, initialData = null, projectId }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ projectId, unitType: 'pcs', currency: 'IDR', approvalStatus: 'PENDING', qcStatus: 'UNINSPECTED' });
      }
      setActiveTab('basic');
    }
  }, [initialData, isOpen, projectId]);

  if (!isOpen) return null;

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const InputField = ({ label, field, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: 16 }}>
      <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>{label}</label>
      <input 
        type={type} 
        className="input-field" 
        value={formData[field] || ''}
        onChange={(e) => handleChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 800, background: 'var(--surface)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column'
    }}>
      <div className="flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
          {initialData ? 'Edit Material' : 'Add New Material'}
        </h2>
        <button className="btn-icon" onClick={onClose}><X size={20} /></button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        {TABS.map(tab => (
          <button 
            key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid var(--blue)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--blue)' : 'var(--text-subtle)',
              fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <form id="materialForm" onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Material Name *" field="name" />
              <InputField label="Category" field="category" />
              <InputField label="Sub Category" field="subCategory" />
              <InputField label="Brand" field="brand" />
              <InputField label="Manufacturer" field="manufacturer" />
              <InputField label="Supplier" field="supplier" />
              <InputField label="Country of Origin" field="countryOfOrigin" />
              <InputField label="SKU / Internal Code" field="sku" />
            </div>
          )}
          {activeTab === 'specs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <InputField label="Colour / Color" field="color" />
              <InputField label="Finish Type" field="finishType" />
              <InputField label="Material Type" field="materialType" />
              <InputField label="Grade / Quality" field="grade" />
              <InputField label="Size" field="size" />
              <InputField label="Dimension" field="dimension" />
              <InputField label="Thickness" field="thickness" type="number" />
              <InputField label="Length" field="length" type="number" />
              <InputField label="Width" field="width" type="number" />
              <InputField label="Height" field="height" type="number" />
              <InputField label="Diameter" field="diameter" type="number" />
              <InputField label="Weight" field="weight" type="number" />
              <InputField label="Volume" field="volume" type="number" />
              <InputField label="Density" field="density" type="number" />
              <InputField label="Texture" field="texture" />
              <InputField label="Surface Type" field="surfaceType" />
            </div>
          )}
          {activeTab === 'technical' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Technical Specs" field="technicalSpecs" />
              <InputField label="Performance Specs" field="performanceSpecs" />
              <InputField label="Tolerance" field="tolerance" />
              <InputField label="Capacity" field="capacity" />
              <InputField label="Load Rating" field="loadRating" />
              <InputField label="Pressure Rating" field="pressureRating" />
              <InputField label="Electrical Rating" field="electricalRating" />
              <InputField label="Fire Resistance" field="fireResistance" />
              <InputField label="Waterproof Level" field="waterproofLevel" />
              <InputField label="Temperature Resistance" field="temperatureResistance" />
              <InputField label="Durability Rating" field="durabilityRating" />
              <InputField label="Certification" field="certification" />
              <InputField label="Compliance Standard" field="complianceStandard" />
              <InputField label="Warranty Info" field="warrantyInfo" />
            </div>
          )}
          {activeTab === 'costing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <InputField label="Unit Price" field="unitPrice" type="number" />
              <InputField label="Estimated Cost" field="estimatedCost" type="number" />
              <InputField label="Actual Cost" field="actualCost" type="number" />
              <div style={{ marginBottom: 16 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>Currency</label>
                <select className="select-field" value={formData.currency || 'IDR'} onChange={(e) => handleChange('currency', e.target.value)}>
                  <option value="IDR">IDR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <InputField label="Tax" field="tax" type="number" />
              <InputField label="Shipping Cost" field="shippingCost" type="number" />
              <InputField label="Last Purchase Price" field="lastPurchasePrice" type="number" />
              <InputField label="Average Cost" field="averageCost" type="number" />
            </div>
          )}
          {activeTab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>Unit Type</label>
                <select className="select-field" value={formData.unitType || 'pcs'} onChange={(e) => handleChange('unitType', e.target.value)}>
                  <option value="pcs">pcs</option>
                  <option value="meter">meter</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="box">box</option>
                  <option value="roll">roll</option>
                  <option value="set">set</option>
                  <option value="sheet">sheet</option>
                  <option value="unit">unit</option>
                </select>
              </div>
              <InputField label="Current Stock" field="currentStock" type="number" />
              <InputField label="Reserved Stock" field="reservedStock" type="number" />
              <InputField label="Incoming Stock" field="incomingStock" type="number" />
              <InputField label="Damaged Stock" field="damagedStock" type="number" />
              <InputField label="Minimum Stock" field="minimumStock" type="number" />
              <InputField label="Reorder Level" field="reorderLevel" type="number" />
              <InputField label="Warehouse Location" field="warehouseLocation" />
              <InputField label="Rack Position" field="rackPosition" />
            </div>
          )}
          {activeTab === 'docs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>Approval Status</label>
                <select className="select-field" value={formData.approvalStatus || 'PENDING'} onChange={(e) => handleChange('approvalStatus', e.target.value)}>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <InputField label="Approved By" field="approvedBy" />
              
              <div style={{ marginBottom: 16 }}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 6 }}>QC Status</label>
                <select className="select-field" value={formData.qcStatus || 'UNINSPECTED'} onChange={(e) => handleChange('qcStatus', e.target.value)}>
                  <option value="UNINSPECTED">UNINSPECTED</option>
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CONDITIONAL">CONDITIONAL</option>
                </select>
              </div>
              <InputField label="Inspection Result" field="inspectionResult" />
              
              <InputField label="Technical Drawing URL" field="technicalDrawingUrl" />
              <InputField label="Datasheet URL" field="datasheetUrl" />
              <InputField label="Safety Sheet URL" field="safetySheetUrl" />
              <InputField label="Product Catalogue URL" field="productCatalogueUrl" />
            </div>
          )}
        </form>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" type="submit" form="materialForm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={16} /> {initialData ? 'Save Changes' : 'Create Material'}
        </button>
      </div>
    </div>
  );
}
