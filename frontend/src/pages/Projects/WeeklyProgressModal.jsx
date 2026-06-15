import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function WeeklyProgressModal({
  isOpen,
  onClose,
  onSubmit,
  divisions = [],
  weeklyReport = null,
  nextWeekNumber = 1
}) {
  const [weekNumber, setWeekNumber] = useState(nextWeekNumber);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [progressInputs, setProgressInputs] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (weeklyReport) {
        setWeekNumber(weeklyReport.weekNumber);
        setPeriodStart(weeklyReport.periodStart ? weeklyReport.periodStart.split('T')[0] : '');
        setPeriodEnd(weeklyReport.periodEnd ? weeklyReport.periodEnd.split('T')[0] : '');
        setNotes(weeklyReport.notes || '');

        const inputs = {};
        divisions.forEach(d => {
          const detail = weeklyReport.details?.find(det => det.divisionId === d.id);
          inputs[d.id] = {
            plan: detail ? detail.progressPlan : 0,
            actual: detail ? detail.progressActual : 0
          };
        });
        setProgressInputs(inputs);
      } else {
        setWeekNumber(nextWeekNumber);
        const start = new Date();
        const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
        setPeriodStart(start.toISOString().split('T')[0]);
        setPeriodEnd(end.toISOString().split('T')[0]);
        setNotes('');

        const inputs = {};
        divisions.forEach(d => {
          inputs[d.id] = {
            plan: d.plan || 0,
            actual: d.actual || 0
          };
        });
        setProgressInputs(inputs);
      }
    }
  }, [isOpen, weeklyReport, divisions, nextWeekNumber]);

  if (!isOpen) return null;

  const handleInputChange = (divId, field, val) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setProgressInputs(prev => ({
      ...prev,
      [divId]: {
        ...prev[divId],
        [field]: num
      }
    }));
  };

  let totalPlan = 0;
  let totalActual = 0;
  divisions.forEach(d => {
    const input = progressInputs[d.id] || { plan: 0, actual: 0 };
    totalPlan += (d.bobot * input.plan) / 100;
    totalActual += (d.bobot * input.actual) / 100;
  });

  const deviasiTotal = totalActual - totalPlan;

  const handleSave = () => {
    if (!periodStart || !periodEnd) {
      return alert('Tanggal periode awal dan akhir harus diisi');
    }
    
    const details = divisions.map(d => ({
      divisionId: d.id,
      progressPlan: progressInputs[d.id]?.plan || 0,
      progressActual: progressInputs[d.id]?.actual || 0
    }));

    onSubmit({
      weekNumber,
      periodStart,
      periodEnd,
      notes,
      details
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden', background: 'var(--surface)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            {weeklyReport ? `Edit Laporan Mingguan Ke-${weekNumber}` : `Input Laporan Mingguan Ke-${weekNumber}`}
          </h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>MINGGU KE-</label>
              <input 
                type="number" 
                className="form-input" 
                disabled={!!weeklyReport} 
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                value={weekNumber}
                onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>PERIODE AWAL</label>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>PERIODE AKHIR</label>
              <input 
                type="date" 
                className="form-input" 
                style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Table divisions inputs */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>PERSENTASE PROGRES KUMULATIF PER DIVISI</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 16px' }}>Divisi</th>
                    <th style={{ padding: '8px 16px', width: 80 }}>Bobot</th>
                    <th style={{ padding: '8px 16px', width: 120 }}>Rencana (%)</th>
                    <th style={{ padding: '8px 16px', width: 120 }}>Aktual (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {divisions.map(d => {
                    const inputs = progressInputs[d.id] || { plan: 0, actual: 0 };
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 16px', fontWeight: 600 }}>{d.divisionName}</td>
                        <td style={{ padding: '8px 16px' }}>{d.bobot.toFixed(2)}%</td>
                        <td style={{ padding: '8px 16px' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                            min={0}
                            max={100}
                            step={0.1}
                            value={inputs.plan}
                            onChange={(e) => handleInputChange(d.id, 'plan', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{ width: '100%', padding: '6px 10px', fontSize: 12.5 }}
                            min={0}
                            max={100}
                            step={0.1}
                            value={inputs.actual}
                            onChange={(e) => handleInputChange(d.id, 'actual', e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>CATATAN LAPORAN</label>
            <textarea 
              className="form-input" 
              placeholder="Tambahkan catatan lapangan, kendala cuaca, atau status material minggu ini..."
              style={{ width: '100%', height: 70, padding: 10, fontSize: 13, resize: 'none' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Live Preview Card */}
          <div style={{ background: '#F0F9FF', border: '1px solid #B9E6FE', borderRadius: 8, padding: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', display: 'block', marginBottom: 10 }}>LIVE PREVIEW PROGRESS FISIK PROYEK</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <span style={{ display: 'block', fontSize: 10, color: '#0369A1' }}>TOTAL RENCANA W-AVG</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)' }}>{totalPlan.toFixed(2)}%</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 10, color: '#0369A1' }}>TOTAL AKTUAL W-AVG</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue)' }}>{totalActual.toFixed(2)}%</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 10, color: '#0369A1' }}>DEVIASI TOTAL</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: deviasiTotal >= 0 ? '#137333' : '#C5221F' }}>
                  {deviasiTotal >= 0 ? `+${deviasiTotal.toFixed(2)}%` : `${deviasiTotal.toFixed(2)}%`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#F8FAFC' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleSave}>
            <Save size={14} /> Simpan Laporan
          </button>
        </div>
      </div>
    </div>
  );
}
