import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Calendar } from 'lucide-react';

export default function OutstandingAccordion({ data, onActionClick, canManage }) {
  const [expandedClients, setExpandedClients] = useState({});

  if (!data || data.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-subtle)', margin: 0 }}>
          Tidak ada tagihan outstanding saat ini. Semua tagihan telah lunas dibayar!
        </p>
      </div>
    );
  }

  const toggleClient = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getStatusBadge = (status, isOverdue) => {
    let cls = 'badge-gray';
    let text = status.toUpperCase();

    if (status === 'submitted') {
      cls = 'badge-amber';
      text = 'DIAJUKAN';
    } else if (status === 'approved') {
      cls = 'badge-blue';
      text = 'DISETUJUI';
    } else if (status === 'draft') {
      cls = 'badge-gray';
      text = 'DRAFT';
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span className={`badge ${cls}`}>{text}</span>
        {isOverdue && (
          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <AlertCircle size={10} /> Jatuh Tempo
          </span>
        )}
      </div>
    );
  };

  const renderActionButtons = (t) => {
    if (!canManage) return '—';

    const actStyle = { padding: '4px 8px', fontSize: '11px', fontWeight: 700 };

    if (t.status === 'draft') {
      return (
        <button 
          className="btn btn-secondary btn-sm" 
          style={actStyle}
          onClick={() => onActionClick(t, 'submitted')}
        >
          Ajukan
        </button>
      );
    }
    if (t.status === 'submitted') {
      return (
        <button 
          className="btn btn-secondary btn-sm" 
          style={{ ...actStyle, color: 'var(--blue)', borderColor: '#93C5FD' }}
          onClick={() => onActionClick(t, 'approved')}
        >
          Approve
        </button>
      );
    }
    if (t.status === 'approved') {
      return (
        <button 
          className="btn btn-secondary btn-sm" 
          style={{ ...actStyle, color: '#059669', borderColor: '#A7F3D0' }}
          onClick={() => onActionClick(t, 'paid')}
        >
          Tandai Paid
        </button>
      );
    }
    if (t.is_overdue) {
      return (
        <button 
          className="btn btn-secondary btn-sm" 
          style={{ ...actStyle, color: 'var(--red)', borderColor: '#FCA5A5' }}
          onClick={() => alert(`Hubungi client ${t.client_name || ''} untuk tagihan ${t.termin_label}`)}
        >
          Follow Up
        </button>
      );
    }
    return '—';
  };

  const totalOutstandingAll = data.reduce((sum, c) => sum + c.total_outstanding, 0);
  const totalClientsCount = data.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Accordion items */}
      {data.map(client => {
        const isExpanded = !!expandedClients[client.client_id];
        return (
          <div 
            key={client.client_id} 
            className="card" 
            style={{ 
              borderRadius: 10, 
              border: '1px solid var(--border)', 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-sm)',
              background: 'var(--surface)'
            }}
          >
            {/* Header Accordion */}
            <div 
              onClick={() => toggleClient(client.client_id)}
              style={{ 
                padding: '14px 18px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                background: isExpanded ? 'var(--bg)' : 'transparent',
                transition: 'background 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--navy)' }}>
                  {client.client_name}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-subtle)' }}>
                  ({client.termins.length} tagihan)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--amber)' }}>
                  {formatRupiah(client.total_outstanding)}
                </span>
                {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
              </div>
            </div>

            {/* Expandable Body */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border)' }} className="table-wrap">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Proyek</th>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Termin</th>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Netto Cair</th>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Tgl Pengajuan</th>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '10px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.termins.map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--navy)' }}>{t.project_name}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 500 }}>{t.termin_label}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--amber)' }}>{formatRupiah(t.netto_cair)}</td>
                        <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>
                          {t.submitted_date ? formatDateIndo(t.submitted_date) : '-'}
                        </td>
                        <td style={{ padding: '12px 18px' }}>{getStatusBadge(t.status, t.is_overdue)}</td>
                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>{renderActionButtons(t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary footer */}
      <div 
        style={{ 
          marginTop: 8, 
          padding: '14px 18px', 
          background: 'var(--surface)', 
          border: '1.5px dashed var(--amber)', 
          borderRadius: 8, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          fontWeight: 700,
          fontSize: 13.5
        }}
      >
        <span style={{ color: 'var(--text-subtle)' }}>Total Outstanding Keseluruhan:</span>
        <span style={{ color: 'var(--amber)', fontSize: 15, fontWeight: 800 }}>
          {formatRupiah(totalOutstandingAll)} dari {totalClientsCount} client
        </span>
      </div>
    </div>
  );
}
