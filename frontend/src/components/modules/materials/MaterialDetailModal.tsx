import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MaterialDetailModal({ material, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('specs');
  if (!isOpen || !material) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={onClose} />
      <div style={{ 
        position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 900, 
        maxHeight: '90vh', background: 'var(--surface)', borderRadius: 12, zIndex: 1001, display: 'flex', flexDirection: 'column' 
      }}>
        <div className="flex-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '12px 12px 0 0' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              {material.name}
              <span className={`badge ${material.approvalStatus === 'APPROVED' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 11 }}>
                {material.approvalStatus}
              </span>
            </h2>
            <p className="text-xs text-muted" style={{ margin: '4px 0 0' }}>{material.code} • {material.category}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar: Image & QR */}
          <div style={{ borderRight: '1px solid var(--border)', background: 'var(--bg)', padding: 20, overflowY: 'auto' }}>
             <div style={{ background: '#f8fafc', border: '1px dashed var(--border)', borderRadius: 8, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
               <span className="text-xs text-muted">No Image</span>
             </div>
             
             <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16, textAlign: 'center', marginBottom: 20 }}>
                <QRCodeSVG value={`PROMAN-MAT-${material.code}`} size={120} />
                <p className="text-xs text-muted" style={{ marginTop: 10 }}>Scan for Details</p>
             </div>

             <div className="card" style={{ padding: 14 }}>
               <span className="text-xs text-muted" style={{ display: 'block', marginBottom: 8 }}>STOCK HEALTH</span>
               {material.availableStock <= material.minimumStock ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontWeight: 600, fontSize: 13 }}>
                   <AlertTriangle size={16} /> Low Stock ({material.availableStock} {material.unitType})
                 </div>
               ) : (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--emerald)', fontWeight: 600, fontSize: 13 }}>
                   <CheckCircle2 size={16} /> Healthy ({material.availableStock} {material.unitType})
                 </div>
               )}
             </div>
          </div>

          {/* Right Content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', padding: '0 20px' }}>
              {['specs', 'technical', 'finance', 'history'].map(t => (
                <button 
                  key={t} onClick={() => setActiveTab(t)}
                  style={{ 
                    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: activeTab === t ? '2px solid var(--blue)' : '2px solid transparent',
                    color: activeTab === t ? 'var(--blue)' : 'var(--text-subtle)',
                    fontWeight: 600, fontSize: 13, textTransform: 'capitalize'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {activeTab === 'specs' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>MANUFACTURING</h4>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Brand:</span> {material.brand || '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Manufacturer:</span> {material.manufacturer || '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Origin:</span> {material.countryOfOrigin || '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Supplier:</span> {material.supplier || '-'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>PHYSICAL</h4>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Color:</span> {material.color || '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Size/Dim:</span> {material.size || material.dimension || '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Weight:</span> {material.weight ? `${material.weight} kg` : '-'}</p>
                    <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Grade:</span> {material.grade || '-'}</p>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>DOCUMENTS</h4>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {material.datasheetUrl && <a href={material.datasheetUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14}/> Datasheet</a>}
                      {material.safetySheetUrl && <a href={material.safetySheetUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14}/> Safety Sheet</a>}
                      {!material.datasheetUrl && !material.safetySheetUrl && <p className="text-xs text-muted">No documents attached.</p>}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'technical' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Technical Specs:</span> {material.technicalSpecs || '-'}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Performance:</span> {material.performanceSpecs || '-'}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Load Rating:</span> {material.loadRating || '-'}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Fire Resistance:</span> {material.fireResistance || '-'}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Certifications:</span> {material.certification || '-'}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Warranty:</span> {material.warrantyInfo || '-'}</p>
                </div>
              )}
              {activeTab === 'finance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Unit Price:</span> Rp. {(material.unitPrice || 0).toLocaleString('id-ID')}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Estimated Cost:</span> Rp. {(material.estimatedCost || 0).toLocaleString('id-ID')}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Actual Cost:</span> Rp. {(material.actualCost || 0).toLocaleString('id-ID')}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Tax:</span> Rp. {(material.tax || 0).toLocaleString('id-ID')}</p>
                  <p className="text-sm" style={{ marginBottom: 4 }}><span className="text-muted">Shipping Cost:</span> Rp. {(material.shippingCost || 0).toLocaleString('id-ID')}</p>
                </div>
              )}
              {activeTab === 'history' && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 16 }}>ACTIVITY TIMELINE</h4>
                  {material.history?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {material.history.map(h => (
                        <div key={h.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', marginTop: 6 }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600 }}>{h.action}</p>
                            <p style={{ fontSize: 12, color: 'var(--text)' }}>{h.description}</p>
                            <p className="text-xs text-muted" style={{ marginTop: 2 }}>{new Date(h.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm">No history records found. (Wait for data to populate)</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
