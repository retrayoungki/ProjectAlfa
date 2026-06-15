import { useState, useCallback, useMemo } from 'react';

const genId = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const DEFAULT_SCOPES = [
  { id: genId(), code: '1.0', name: 'Preliminaries', items: [] },
  { id: genId(), code: '2.0', name: 'Ceiling Work',  items: [] },
  { id: genId(), code: '3.0', name: 'Wall Finishing', items: [] },
  { id: genId(), code: '4.0', name: 'MEP Works',     items: [] },
  { id: genId(), code: '5.0', name: 'Flooring',      items: [] },
];

const makeItem = (overrides = {}) => ({
  id: genId(),
  description: '',
  qty: 1,
  unit: 'm²',
  materialCost: 0,
  laborCost: 0,
  equipmentCost: 0,
  materials: [],
  labors: [],
  equipments: [],
  notes: '',
  ...overrides,
});

export function useCostEstimation() {
  const [scopes, setScopes]           = useState(DEFAULT_SCOPES);
  const [activeScopeId, setActiveScopeId] = useState(DEFAULT_SCOPES[0]?.id || null);
  const [profitRate, setProfitRate]   = useState(10);
  const [vatRate, setVatRate]         = useState(11);
  const [revisionStatus, setRevisionStatus] = useState('Draft');
  const [revisionHistory, setRevisionHistory] = useState([]);

  // ── SCOPE CRUD ──────────────────────────────────────────────
  const addScope = useCallback(() => {
    const num = scopes.length + 1;
    const newScope = { id: genId(), code: `${num}.0`, name: `Scope ${num}`, items: [] };
    setScopes(prev => [...prev, newScope]);
    setActiveScopeId(newScope.id);
  }, [scopes.length]);

  const deleteScope = useCallback((scopeId) => {
    setScopes(prev => {
      const remaining = prev.filter(s => s.id !== scopeId);
      if (activeScopeId === scopeId && remaining.length > 0) {
        setActiveScopeId(remaining[0].id);
      }
      return remaining;
    });
  }, [activeScopeId]);

  const renameScope = useCallback((scopeId, name) => {
    setScopes(prev => prev.map(s => s.id === scopeId ? { ...s, name } : s));
  }, []);

  // ── ITEM CRUD ────────────────────────────────────────────────
  const addItem = useCallback((scopeId) => {
    const newItem = makeItem();
    setScopes(prev => prev.map(s =>
      s.id === scopeId ? { ...s, items: [...s.items, newItem] } : s
    ));
    return newItem.id;
  }, []);

  const updateItem = useCallback((scopeId, itemId, patch) => {
    setScopes(prev => prev.map(s => {
      if (s.id !== scopeId) return s;
      return {
        ...s,
        items: s.items.map(it => {
          if (it.id !== itemId) return it;
          const updated = { ...it, ...patch };
          // Auto-recalculate breakdown totals
          const matTotal = (updated.materials || []).reduce((a, m) => a + (m.qty * m.unitPrice), 0);
          const labTotal = (updated.labors || []).reduce((a, l) => a + (l.qty * l.dailyRate * l.duration), 0);
          const eqpTotal = (updated.equipments || []).reduce((a, e) => a + (e.rentalCost * e.duration), 0);
          if (patch.materials !== undefined) updated.materialCost = matTotal;
          if (patch.labors    !== undefined) updated.laborCost    = labTotal;
          if (patch.equipments !== undefined) updated.equipmentCost = eqpTotal;
          return updated;
        }),
      };
    }));
  }, []);

  const deleteItem = useCallback((scopeId, itemId) => {
    setScopes(prev => prev.map(s =>
      s.id === scopeId ? { ...s, items: s.items.filter(it => it.id !== itemId) } : s
    ));
  }, []);

  // ── CALCULATIONS ─────────────────────────────────────────────
  const getScopeSubtotal = useCallback((scope) =>
    scope.items.reduce((acc, it) => {
      const unitPrice = it.materialCost + it.laborCost + it.equipmentCost;
      return acc + (unitPrice * it.qty);
    }, 0),
  []);

  const calculations = useMemo(() => {
    const totalCost   = scopes.reduce((acc, s) => acc + getScopeSubtotal(s), 0);
    const profitAmt   = totalCost * profitRate / 100;
    const vatBase     = totalCost + profitAmt;
    const vatAmt      = vatBase * vatRate / 100;
    const nettTotal   = vatBase + vatAmt;
    return { totalCost, profitAmt, vatAmt, nettTotal };
  }, [scopes, profitRate, vatRate, getScopeSubtotal]);

  // ── REVISION ─────────────────────────────────────────────────
  const saveRevision = useCallback((notes = '') => {
    const snapshot = {
      id: genId(),
      date: new Date().toLocaleString('id-ID'),
      user: 'Alex Kumar',
      status: revisionStatus,
      notes: notes || 'Manual save',
      scopes: JSON.parse(JSON.stringify(scopes)),
      calculations,
    };
    setRevisionHistory(prev => [snapshot, ...prev]);
    setRevisionStatus('Saved');
  }, [scopes, revisionStatus, calculations]);

  const activeScope = scopes.find(s => s.id === activeScopeId) || scopes[0];

  return {
    scopes, activeScope, activeScopeId, setActiveScopeId,
    addScope, deleteScope, renameScope,
    addItem, updateItem, deleteItem,
    profitRate, setProfitRate,
    vatRate, setVatRate,
    revisionStatus, setRevisionStatus,
    revisionHistory, saveRevision,
    calculations, getScopeSubtotal,
  };
}
