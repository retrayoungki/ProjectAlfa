import React from 'react';
import { X, Clock, CheckCircle2, FileEdit } from 'lucide-react';

const STATUS_ICONS = { Saved: CheckCircle2, Draft: FileEdit, Approved: CheckCircle2, Revision: FileEdit };
const STATUS_CLS   = { Saved: 'badge-green', Draft: 'badge-gray', Approved: 'badge-blue', Revision: 'badge-amber' };

export default function HistoryModal({ history, onClose }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', width: '90%', maxWidth: 560, maxHeight: '80vh', borderRadius: 16, zIndex: 1051, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)' }}>
        
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Revision History</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{history.length} saved revision{history.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 22px' }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 13 }}>No revisions saved yet.</p>
              <p style={{ fontSize: 12 }}>Click "Save Revision" to create a snapshot.</p>
            </div>
          ) : (
            history.map((rev, i) => {
              const Icon = STATUS_ICONS[rev.status] || FileEdit;
              return (
                <div key={rev.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color="var(--blue)" />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Rev. {history.length - i}</span>
                      <span className={`badge ${STATUS_CLS[rev.status] || 'badge-gray'}`}>{rev.status}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px' }}>{rev.notes}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-subtle)' }}>
                      <span>👤 {rev.user}</span>
                      <span>🕐 {rev.date}</span>
                      <span>Rp {rev.calculations?.totalCost?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '0 0 16px 16px', textAlign: 'right' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">Close</button>
        </div>
      </div>
    </>
  );
}
