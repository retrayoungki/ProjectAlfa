import React, { useState } from 'react';
import { AlertTriangle, Eye, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export default function MaterialTable({ materials, onEdit, onView, onDelete }) {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!materials || materials.length === 0) {
    return <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>No materials found.</div>;
  }

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div className="table-wrap">
      <table style={{ fontSize: 13, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: 40 }}></th>
            <th>CODE</th>
            <th>MATERIAL NAME</th>
            <th>CATEGORY</th>
            <th>SUPPLIER</th>
            <th>STOCK</th>
            <th>EST. COST</th>
            <th>STATUS</th>
            <th style={{ textAlign: 'right' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => {
            const isLowStock = m.availableStock <= m.minimumStock;
            return (
              <React.Fragment key={m.id}>
                <tr style={{ background: expandedRow === m.id ? 'var(--blue-light)' : 'transparent', borderBottom: expandedRow === m.id ? 'none' : '1px solid var(--border)' }}>
                  <td onClick={() => toggleRow(m.id)} style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--blue)' }}>
                    {expandedRow === m.id ? '▼' : '▶'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{m.code}</td>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td>{m.category || '-'}</td>
                  <td>{m.supplier || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{m.availableStock} {m.unitType}</span>
                      {isLowStock && <AlertTriangle size={12} color="var(--red)" title="Low Stock" />}
                    </div>
                  </td>
                  <td>Rp. {(m.estimatedCost || 0).toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`badge ${m.approvalStatus === 'APPROVED' ? 'badge-green' : m.approvalStatus === 'REJECTED' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                      {m.approvalStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => onView(m)} title="View Detail"><Eye size={14} /></button>
                      <button className="btn-icon" onClick={() => onEdit(m)} title="Edit"><Edit2 size={14} /></button>
                      <button className="btn-icon" onClick={() => onDelete(m.id)} title="Delete" style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
                {/* Expanded Row for Quick Specs */}
                {expandedRow === m.id && (
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={9} style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <div>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>BRAND / ORIGIN</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{m.brand || '-'} / {m.countryOfOrigin || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>DIMENSION / SIZE</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{m.dimension || m.size || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>QC STATUS</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: m.qcStatus === 'PASSED' ? 'var(--emerald)' : 'var(--text)' }}>
                            {m.qcStatus === 'PASSED' && <CheckCircle2 size={12} style={{ marginRight: 4, display: 'inline' }}/>}
                            {m.qcStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>USAGE & WASTE</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {m.usageQuantity} {m.unitType} (Waste: {m.wastePercentage}%)
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
