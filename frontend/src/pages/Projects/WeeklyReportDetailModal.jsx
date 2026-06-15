import React from 'react';
import { X, Calendar, User, FileText } from 'lucide-react';

export default function WeeklyReportDetailModal({
  isOpen,
  onClose,
  report
}) {
  if (!isOpen || !report) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const details = report.details || [];
  let totalBobot = 0;
  let totalWeightedPlan = 0;
  let totalWeightedActual = 0;

  details.forEach(det => {
    const bobot = det.division?.bobot || 0;
    totalBobot += bobot;
    totalWeightedPlan += (bobot * det.progressPlan) / 100;
    totalWeightedActual += (bobot * det.progressActual) / 100;
  });

  const totalDeviasi = totalWeightedActual - totalWeightedPlan;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            Detail Laporan Mingguan: {report.weekLabel || `Minggu ${report.weekNumber}`}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <Calendar size={15} color="var(--blue)" />
                <span className="text-muted">Periode:</span>
                <span style={{ fontWeight: 700 }}>{formatDate(report.periodStart)} - {formatDate(report.periodEnd)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <User size={15} color="var(--blue)" />
                <span className="text-muted">Dilaporkan Oleh:</span>
                <span style={{ fontWeight: 700 }}>{report.user?.name || 'Administrator'}</span>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="text-muted" style={{ fontSize: 11, fontWeight: 600 }}>RANGKUMAN MINGGUAN</span>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <div>
                  <span style={{ fontSize: 10, display: 'block', color: 'var(--text-muted)' }}>Rencana</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)' }}>{totalWeightedPlan.toFixed(2)}%</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, display: 'block', color: 'var(--text-muted)' }}>Aktual</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--blue)' }}>{totalWeightedActual.toFixed(2)}%</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, display: 'block', color: 'var(--text-muted)' }}>Deviasi</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: totalDeviasi >= 0 ? '#137333' : '#C5221F' }}>
                    {totalDeviasi >= 0 ? `+${totalDeviasi.toFixed(2)}%` : `${totalDeviasi.toFixed(2)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Division Details Table */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 10 }}>Rincian Capaian per Divisi</h4>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 16px', fontWeight: 700 }}>Divisi Pekerjaan</th>
                    <th style={{ padding: '8px 16px', fontWeight: 700, width: 80 }}>Bobot</th>
                    <th style={{ padding: '8px 16px', fontWeight: 700, width: 95 }}>Rencana (%)</th>
                    <th style={{ padding: '8px 16px', fontWeight: 700, width: 95 }}>Aktual (%)</th>
                    <th style={{ padding: '8px 16px', fontWeight: 700, width: 95 }}>Deviasi (%)</th>
                    <th style={{ padding: '8px 16px', fontWeight: 700, width: 120 }}>Kontribusi (W)</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((det, idx) => {
                    const bobot = det.division?.bobot || 0;
                    const name = det.division?.divisionName || 'Divisi tidak dikenal';
                    const dev = det.progressActual - det.progressPlan;
                    const wPlan = (bobot * det.progressPlan) / 100;
                    const wActual = (bobot * det.progressActual) / 100;

                    return (
                      <tr key={det.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 16px', fontWeight: 600 }}>{idx + 1}. {name}</td>
                        <td style={{ padding: '8px 16px' }}>{bobot.toFixed(2)}%</td>
                        <td style={{ padding: '8px 16px' }}>{det.progressPlan.toFixed(1)}%</td>
                        <td style={{ padding: '8px 16px' }}>{det.progressActual.toFixed(1)}%</td>
                        <td style={{ padding: '8px 16px' }}>
                          <span style={{ 
                            fontWeight: 700, 
                            color: dev >= 0 ? '#137333' : '#C5221F'
                          }}>
                            {dev >= 0 ? `+${dev.toFixed(1)}` : dev.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '8px 16px', color: 'var(--text-subtle)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: 11 }}>
                            <span>P: {wPlan.toFixed(2)}%</span>
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>A: {wActual.toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Summary Totals */}
                  <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px' }}>Total Weighted Average</td>
                    <td style={{ padding: '10px 16px' }}>{totalBobot.toFixed(2)}%</td>
                    <td style={{ padding: '10px 16px' }} colSpan={2}>-</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ 
                        color: totalDeviasi >= 0 ? '#137333' : '#C5221F' 
                      }}>
                        {totalDeviasi >= 0 ? `+${totalDeviasi.toFixed(2)}` : totalDeviasi.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--navy)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 11 }}>
                        <span>P: {totalWeightedPlan.toFixed(2)}%</span>
                        <span>A: {totalWeightedActual.toFixed(2)}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {report.notes && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: '#fcfcfc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                <FileText size={14} /> CATATAN LAPORAN
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
                {report.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#F8FAFC' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
