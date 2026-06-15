import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const UNITS = ['m²', 'm³', 'm', 'unit', 'ls', 'kg', 'ton', 'set', 'titik', 'hari'];

const Section = ({ id, title, children, action, openSection, setOpenSection }) => (
  <div style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
    <div onClick={() => setOpenSection(openSection === id ? null : id)} style={{ padding: '10px 14px', background: 'var(--bg)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {openSection === id && action}
        {openSection === id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>
    </div>
    {openSection === id && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
  </div>
);

export default function WorkItemModal({ item, onSave, onClose }) {
  const [form, setForm] = useState({
    description: '', qty: 1, unit: 'm²',
    materialCost: 0, laborCost: 0, equipmentCost: 0,
    materials: [], labors: [], equipments: [], notes: '',
    ...item,
  });
  const [openSection, setOpenSection] = useState('material');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Material rows
  const addMaterial = () => set('materials', [...form.materials, { id: genId(), name: '', qty: 1, unit: 'm²', unitPrice: 0 }]);
  const updMaterial = (id, k, v) => set('materials', form.materials.map(m => m.id === id ? { ...m, [k]: v } : m));
  const delMaterial = (id) => set('materials', form.materials.filter(m => m.id !== id));

  // Labor rows
  const addLabor = () => set('labors', [...form.labors, { id: genId(), workerType: '', qty: 1, dailyRate: 0, duration: 1 }]);
  const updLabor = (id, k, v) => set('labors', form.labors.map(l => l.id === id ? { ...l, [k]: v } : l));
  const delLabor = (id) => set('labors', form.labors.filter(l => l.id !== id));

  // Equipment rows
  const addEquipment = () => set('equipments', [...form.equipments, { id: genId(), name: '', rentalCost: 0, duration: 1 }]);
  const updEquipment = (id, k, v) => set('equipments', form.equipments.map(e => e.id === id ? { ...e, [k]: v } : e));
  const delEquipment = (id) => set('equipments', form.equipments.filter(e => e.id !== id));

  // Auto-calculate costs from breakdowns
  const matTotal  = form.materials.reduce((a, m) => a + (Number(m.qty) * Number(m.unitPrice)), 0);
  const labTotal  = form.labors.reduce((a, l) => a + (Number(l.qty) * Number(l.dailyRate) * Number(l.duration)), 0);
  const eqpTotal  = form.equipments.reduce((a, e) => a + (Number(e.rentalCost) * Number(e.duration)), 0);
  const unitPrice = matTotal + labTotal + eqpTotal;
  const lineTotal = unitPrice * form.qty;

  const handleSave = () => {
    if (!form.description.trim()) return alert('Item description is required');
    onSave({ ...form, materialCost: matTotal, laborCost: labTotal, equipmentCost: eqpTotal });
  };

  const inp = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: 'var(--text)', outline: 'none' };
  const th  = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid var(--border)' };
  const td  = { padding: '6px 8px', verticalAlign: 'middle' };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', width: '95%', maxWidth: 760, maxHeight: '92vh', borderRadius: 16, zIndex: 1051, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-md)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Work Item Detail</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Define material, labor, and equipment breakdown</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 22px' }}>

          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Item Description *</label>
              <input style={{ ...inp, width: '100%' }} placeholder="e.g. Gypsum Ceiling Installation" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Qty</label>
              <input style={{ ...inp, width: '100%', textAlign: 'center' }} type="number" min="0" value={form.qty} onChange={e => set('qty', Number(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Unit</label>
              <select style={{ ...inp, width: '100%' }} value={form.unit} onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Material Breakdown */}
          <Section id="material" title={`Material Breakdown (Rp ${matTotal.toLocaleString('id-ID')})`} openSection={openSection} setOpenSection={setOpenSection}
            action={<button onClick={e => { e.stopPropagation(); addMaterial(); }} className="btn btn-secondary btn-sm"><Plus size={12} /> Add</button>}>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead><tr><th style={th}>Material</th><th style={th}>Qty</th><th style={th}>Unit</th><th style={th}>Unit Price</th><th style={th}>Total</th><th style={th}></th></tr></thead>
                <tbody>
                  {form.materials.map(m => (
                    <tr key={m.id}>
                      <td style={td}><input style={{ ...inp, width: '100%' }} placeholder="Material name" value={m.name} onChange={e => updMaterial(m.id, 'name', e.target.value)} /></td>
                      <td style={td}><input style={{ ...inp, width: 60, textAlign: 'center' }} type="number" min="0" value={m.qty} onChange={e => updMaterial(m.id, 'qty', Number(e.target.value))} /></td>
                      <td style={td}><select style={{ ...inp }} value={m.unit} onChange={e => updMaterial(m.id, 'unit', e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td style={td}>
                        <input 
                          style={{ ...inp, width: 110, textAlign: 'right' }} 
                          type="text" 
                          placeholder="0"
                          value={m.unitPrice === 0 ? '' : m.unitPrice.toLocaleString('id-ID')} 
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            updMaterial(m.id, 'unitPrice', rawValue ? Number(rawValue) : 0);
                          }} 
                        />
                      </td>
                      <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>Rp {(m.qty * m.unitPrice).toLocaleString('id-ID')}</td>
                      <td style={td}><button onClick={() => delMaterial(m.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  {form.materials.length === 0 && <tr><td colSpan={6} style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No materials added yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Labor Breakdown */}
          <Section id="labor" title={`Labor Breakdown (Rp ${labTotal.toLocaleString('id-ID')})`} openSection={openSection} setOpenSection={setOpenSection}
            action={<button onClick={e => { e.stopPropagation(); addLabor(); }} className="btn btn-secondary btn-sm"><Plus size={12} /> Add</button>}>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
                <thead><tr><th style={th}>Worker Type</th><th style={th}>Qty</th><th style={th}>Daily Rate</th><th style={th}>Days</th><th style={th}>Total</th><th style={th}></th></tr></thead>
                <tbody>
                  {form.labors.map(l => (
                    <tr key={l.id}>
                      <td style={td}><input style={{ ...inp, width: '100%' }} placeholder="e.g. Tukang" value={l.workerType} onChange={e => updLabor(l.id, 'workerType', e.target.value)} /></td>
                      <td style={td}><input style={{ ...inp, width: 60, textAlign: 'center' }} type="number" min="0" value={l.qty} onChange={e => updLabor(l.id, 'qty', Number(e.target.value))} /></td>
                      <td style={td}>
                        <input 
                          style={{ ...inp, width: 110, textAlign: 'right' }} 
                          type="text" 
                          placeholder="0"
                          value={l.dailyRate === 0 ? '' : l.dailyRate.toLocaleString('id-ID')} 
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            updLabor(l.id, 'dailyRate', rawValue ? Number(rawValue) : 0);
                          }} 
                        />
                      </td>
                      <td style={td}><input style={{ ...inp, width: 60, textAlign: 'center' }} type="number" min="0" value={l.duration} onChange={e => updLabor(l.id, 'duration', Number(e.target.value))} /></td>
                      <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>Rp {(l.qty * l.dailyRate * l.duration).toLocaleString('id-ID')}</td>
                      <td style={td}><button onClick={() => delLabor(l.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  {form.labors.length === 0 && <tr><td colSpan={6} style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No labor entries yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Equipment Breakdown */}
          <Section id="equipment" title={`Equipment Breakdown (Rp ${eqpTotal.toLocaleString('id-ID')})`} openSection={openSection} setOpenSection={setOpenSection}
            action={<button onClick={e => { e.stopPropagation(); addEquipment(); }} className="btn btn-secondary btn-sm"><Plus size={12} /> Add</button>}>
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 400 }}>
                <thead><tr><th style={th}>Equipment</th><th style={th}>Rental/Day</th><th style={th}>Days</th><th style={th}>Total</th><th style={th}></th></tr></thead>
                <tbody>
                  {form.equipments.map(e => (
                    <tr key={e.id}>
                      <td style={td}><input style={{ ...inp, width: '100%' }} placeholder="e.g. Scaffolding" value={e.name} onChange={ev => updEquipment(e.id, 'name', ev.target.value)} /></td>
                      <td style={td}>
                        <input 
                          style={{ ...inp, width: 110, textAlign: 'right' }} 
                          type="text" 
                          placeholder="0"
                          value={e.rentalCost === 0 ? '' : e.rentalCost.toLocaleString('id-ID')} 
                          onChange={ev => {
                            const rawValue = ev.target.value.replace(/\D/g, '');
                            updEquipment(e.id, 'rentalCost', rawValue ? Number(rawValue) : 0);
                          }} 
                        />
                      </td>
                      <td style={td}><input style={{ ...inp, width: 60, textAlign: 'center' }} type="number" min="0" value={e.duration} onChange={ev => updEquipment(e.id, 'duration', Number(ev.target.value))} /></td>
                      <td style={{ ...td, fontWeight: 600, whiteSpace: 'nowrap' }}>Rp {(e.rentalCost * e.duration).toLocaleString('id-ID')}</td>
                      <td style={td}><button onClick={() => delEquipment(e.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  {form.equipments.length === 0 && <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No equipment entries yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Notes</label>
            <textarea style={{ ...inp, width: '100%', height: 60, resize: 'vertical' }} placeholder="Optional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg)', borderRadius: '0 0 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>Line Total: </span>
            <strong style={{ fontSize: 15 }}>Rp {lineTotal.toLocaleString('id-ID')}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({form.qty} {form.unit} × Rp {unitPrice.toLocaleString('id-ID')})</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn btn-primary">Save Item</button>
          </div>
        </div>
      </div>
    </>
  );
}
