import React, { useState } from 'react';
import { Edit2, Plus, Check, X } from 'lucide-react';

export default function DivisionProgressTable({ 
  divisions = [], 
  canManage = false,
  onAddDivision,
  onUpdateDivision 
}) {
  const [editDivId, setEditDivId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBobot, setEditBobot] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBobot, setNewBobot] = useState(0);

  // Totals
  const totalBobot = divisions.reduce((sum, d) => sum + (d.bobot || 0), 0);
  const totalWeightedPlan = divisions.reduce((sum, d) => sum + (d.weightedPlan || 0), 0);
  const totalWeightedActual = divisions.reduce((sum, d) => sum + (d.weightedActual || 0), 0);
  const totalDeviasi = totalWeightedActual - totalWeightedPlan;

  const handleStartEdit = (d) => {
    setEditDivId(d.id);
    setEditName(d.divisionName);
    setEditBobot(d.bobot);
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return alert('Nama divisi tidak boleh kosong');
    const bobotVal = parseFloat(editBobot);
    if (isNaN(bobotVal) || bobotVal <= 0) return alert('Bobot harus berupa angka positif');
    try {
      await onUpdateDivision(id, { divisionName: editName, bobot: bobotVal });
      setEditDivId(null);
    } catch (err) {
      alert(err.message || 'Gagal memperbarui divisi');
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return alert('Nama divisi tidak boleh kosong');
    const bobotVal = parseFloat(newBobot);
    if (isNaN(bobotVal) || bobotVal <= 0) return alert('Bobot harus berupa angka positif');
    try {
      await onAddDivision({ divisionName: newName, bobot: bobotVal });
      setIsAdding(false);
      setNewName('');
      setNewBobot(0);
    } catch (err) {
      alert(err.message || 'Gagal menambahkan divisi');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
          Progres Fisik per Divisi Pekerjaan
        </h4>
        {canManage && (
          <button 
            type="button"
            className="btn btn-secondary btn-xs" 
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus size={12} /> Tambah Divisi
          </button>
        )}
      </div>

      {isAdding && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg)' }}>
          <input 
            type="text" 
            placeholder="Nama Divisi Baru" 
            className="form-input" 
            style={{ flex: 2, padding: '6px 10px', fontSize: 12.5 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input 
            type="number" 
            placeholder="Bobot %" 
            className="form-input" 
            style={{ width: 100, padding: '6px 10px', fontSize: 12.5 }}
            value={newBobot || ''}
            onChange={(e) => setNewBobot(e.target.value)}
          />
          <button type="button" className="btn btn-primary btn-xs" onClick={handleAdd}>Simpan</button>
          <button type="button" className="btn btn-secondary btn-xs" onClick={() => setIsAdding(false)}>Batal</button>
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Divisi Pekerjaan</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 100 }}>Bobot</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 90 }}>Rencana</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 90 }}>Aktual</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 180 }}>Visual Progres</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 100 }}>Deviasi</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, width: 140 }}>Kontribusi (W)</th>
              {canManage && <th style={{ padding: '12px 16px', fontWeight: 700, width: 80 }}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {divisions.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  Belum ada divisi pekerjaan yang terdaftar. Tambahkan divisi terlebih dahulu.
                </td>
              </tr>
            ) : (
              divisions.map((d, index) => {
                const isEditMode = editDivId === d.id;
                const devColor = d.deviasi >= 0 ? '#137333' : '#C5221F';
                const devBg = d.deviasi >= 0 ? '#E6F4EA' : '#FCE8E6';

                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 600 }}>
                      {isEditMode ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', padding: '4px 8px', fontSize: 12.5 }}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        `${index + 1}. ${d.divisionName}`
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {isEditMode ? (
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: 80, padding: '4px 8px', fontSize: 12.5 }}
                          value={editBobot}
                          onChange={(e) => setEditBobot(e.target.value)}
                        />
                      ) : (
                        `${d.bobot.toFixed(2)}%`
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>{(d.plan || 0).toFixed(1)}%</td>
                    <td style={{ padding: '10px 16px' }}>{(d.actual || 0).toFixed(1)}%</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, width: 12, color: 'var(--text-muted)' }}>P</span>
                          <div style={{ height: 4, flex: 1, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.plan || 0}%`, background: '#93C5FD' }} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 9, width: 12, color: 'var(--text-muted)' }}>A</span>
                          <div style={{ height: 4, flex: 1, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.actual || 0}%`, background: 'var(--blue)' }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: 4, 
                        fontSize: 10.5, 
                        fontWeight: 700, 
                        color: devColor, 
                        background: devBg 
                      }}>
                        {d.deviasi >= 0 ? `+${(d.deviasi || 0).toFixed(1)}%` : `${(d.deviasi || 0).toFixed(1)}%`}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-subtle)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 11 }}>
                        <span>P: {(d.weightedPlan || 0).toFixed(2)}%</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>A: {(d.weightedActual || 0).toFixed(2)}%</span>
                      </div>
                    </td>
                    {canManage && (
                      <td style={{ padding: '10px 16px' }}>
                        {isEditMode ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="btn btn-primary btn-xs" style={{ padding: 4 }} onClick={() => handleSaveEdit(d.id)}>
                              <Check size={12} />
                            </button>
                            <button type="button" className="btn btn-secondary btn-xs" style={{ padding: 4 }} onClick={() => setEditDivId(null)}>
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="btn btn-secondary btn-xs" style={{ padding: 4 }} onClick={() => handleStartEdit(d)}>
                            <Edit2 size={12} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
            
            {/* Summary Row */}
            {divisions.length > 0 && (
              <tr style={{ background: '#f8fafc', fontWeight: 800, borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--navy)' }}>Total Weighted Average</td>
                <td style={{ padding: '12px 16px' }}>{totalBobot.toFixed(2)}%</td>
                <td style={{ padding: '12px 16px' }} colSpan={2}>-</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, width: 12 }}>P</span>
                      <div style={{ height: 4, flex: 1, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${totalWeightedPlan}%`, background: '#93C5FD' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, width: 12 }}>A</span>
                      <div style={{ height: 4, flex: 1, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${totalWeightedActual}%`, background: 'var(--blue)' }} />
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: 4, 
                    fontSize: 10.5, 
                    fontWeight: 800, 
                    color: totalDeviasi >= 0 ? '#137333' : '#C5221F', 
                    background: totalDeviasi >= 0 ? '#E6F4EA' : '#FCE8E6' 
                  }}>
                    {totalDeviasi >= 0 ? `+${totalDeviasi.toFixed(2)}%` : `${totalDeviasi.toFixed(2)}%`}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--navy)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: 11 }}>
                    <span>P: {totalWeightedPlan.toFixed(2)}%</span>
                    <span>A: {totalWeightedActual.toFixed(2)}%</span>
                  </div>
                </td>
                {canManage && <td style={{ padding: '12px 16px' }}>-</td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalBobot > 0 && Math.abs(totalBobot - 100) > 0.05 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#C5221F', background: '#FCE8E6', padding: '8px 12px', borderRadius: 6, fontWeight: 600 }}>
          <span>Warning: Total bobot saat ini {totalBobot.toFixed(2)}%. Untuk kalkulasi progres yang akurat, pastikan total bobot = 100%.</span>
        </div>
      )}
    </div>
  );
}
