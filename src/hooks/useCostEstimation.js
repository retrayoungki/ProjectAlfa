/**
 * useCostEstimation — Custom React hook
 * Manages all state and operations for the Cost Estimation Engine.
 * Connects CostManagement.jsx to the Firestore service layer.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadEstimation,
  initializeProjectEstimation,
  updateParams,
  addSection,
  deleteSection as deleteSectionSvc,
  addItem,
  updateItem,
  softDeleteItem,
  saveRevision as saveRevisionSvc,
  loadRevisions,
  loadRevisionSnapshot,
} from '../services/costEstimationService';

export function useCostEstimation(projectId, currentUser) {
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [params, setParamsState] = useState({ overhead: 5, profit: 10, tax: 11 });
  const [currentRevision, setCurrentRevision] = useState(0);
  const [revisions, setRevisions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'dirty' | 'saving'
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // ─── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ─── Mark dirty ────────────────────────────────────────────────────────────
  const markDirty = useCallback(() => setSaveStatus('dirty'), []);

  // ─── Load data when project changes ──────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSaveStatus('saved');

      try {
        let data = await loadEstimation(projectId);

        if (data.isNew) {
          // First time for this project — initialize with template
          try {
            data = await initializeProjectEstimation(projectId);
          } catch (initErr) {
            if (initErr.message === "ALREADY_INITIALIZED") {
              // Concurrency caught: it was just initialized by another call (Strict Mode race)
              data = await loadEstimation(projectId);
            } else {
              throw initErr;
            }
          }
        }

        if (!cancelled) {
          setSections(data.sections);
          setItems(data.items);
          setParamsState(data.params);
          setCurrentRevision(data.currentRevision || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          showToast('error', 'Gagal memuat data estimasi. Cek koneksi Firestore.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectId, showToast]);

  // ─── Load revisions separately ────────────────────────────────────────────
  const refreshRevisions = useCallback(async () => {
    if (!projectId) return;
    try {
      const revs = await loadRevisions(projectId);
      setRevisions(revs);
    } catch (err) {
      console.error('loadRevisions error:', err);
    }
  }, [projectId]);

  useEffect(() => { refreshRevisions(); }, [refreshRevisions]);

  // ─── Auto-save params after 1.5s of inactivity ──────────────────────────
  useEffect(() => {
    if (saveStatus !== 'dirty' || !projectId) return;
    const t = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateParams(projectId, params);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('dirty');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [saveStatus, params, projectId]);

  // ─── Calculations (memoized) ──────────────────────────────────────────────
  const calculations = useMemo(() => {
    const baseCost = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
    const overheadCost = baseCost * (Number(params.overhead) / 100);
    const profitCost = baseCost * (Number(params.profit) / 100);
    const subtotalBeforeTax = baseCost + overheadCost + profitCost;
    const taxCost = subtotalBeforeTax * (Number(params.tax) / 100);
    const grandTotal = subtotalBeforeTax + taxCost;
    return { baseCost, overheadCost, profitCost, subtotalBeforeTax, taxCost, grandTotal };
  }, [items, params]);

  // ─── Items grouped by section (for display) ───────────────────────────────
  const wbsData = useMemo(() => {
    return sections.map(sec => ({
      ...sec,
      items: items.filter(i => i.sectionId === sec.id).sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));
  }, [sections, items]);

  // ─── Params handler ───────────────────────────────────────────────────────
  const handleParamChange = useCallback((field, value) => {
    setParamsState(prev => ({ ...prev, [field]: value }));
    markDirty();
  }, [markDirty]);

  // ─── Section handlers ─────────────────────────────────────────────────────
  const handleAddSection = useCallback(async (categoryName) => {
    if (!projectId || !categoryName.trim()) return;
    try {
      const order = sections.length;
      const newSec = await addSection(projectId, categoryName.trim(), order);
      setSections(prev => [...prev, newSec]);
      showToast('success', `Kategori "${categoryName}" berhasil ditambahkan.`);
    } catch (err) {
      showToast('error', 'Gagal menambah kategori.');
    }
  }, [projectId, sections.length, showToast]);

  const handleDeleteSection = useCallback(async (sectionId) => {
    if (!projectId) return;
    try {
      await deleteSectionSvc(sectionId, projectId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setItems(prev => prev.filter(i => i.sectionId !== sectionId));
      showToast('success', 'Kategori berhasil dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus kategori.');
    }
  }, [projectId, showToast]);

  // ─── Item handlers ────────────────────────────────────────────────────────
  const handleAddItem = useCallback(async (sectionId, itemData) => {
    if (!projectId) return;
    try {
      const existingInSection = items.filter(i => i.sectionId === sectionId).length;
      const newItem = await addItem(projectId, sectionId, itemData, existingInSection);
      setItems(prev => [...prev, newItem]);
      showToast('success', 'Item berhasil ditambahkan.');
    } catch (err) {
      showToast('error', 'Gagal menambah item.');
    }
  }, [projectId, items, showToast]);

  const handleUpdateItem = useCallback(async (itemId, itemData) => {
    try {
      await updateItem(itemId, itemData);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...itemData } : i));
      showToast('success', 'Item berhasil diperbarui.');
    } catch (err) {
      showToast('error', 'Gagal memperbarui item.');
    }
  }, [showToast]);

  const handleDeleteItem = useCallback(async (itemId) => {
    try {
      await softDeleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast('success', 'Item berhasil dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus item.');
    }
  }, [showToast]);

  // Inline cell update (for direct spreadsheet editing)
  const handleInlineItemChange = useCallback((itemId, field, value) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
    markDirty();
  }, [markDirty]);

  const handleInlineItemBlur = useCallback(async (itemId, field, value) => {
    const finalValue = (field === 'quantity' || field === 'unitPrice')
      ? Math.max(0, parseFloat(value) || 0)
      : value;
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: finalValue } : i));
    try {
      await updateItem(itemId, { [field]: finalValue });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('dirty');
    }
  }, []);

  // ─── Save Revision ────────────────────────────────────────────────────────
  const handleSaveRevision = useCallback(async (notes) => {
    if (!projectId) return;
    try {
      const result = await saveRevisionSvc(projectId, {
        sections,
        items,
        params,
        notes,
        createdBy: currentUser?.name || 'Unknown',
        currentRevision,
      });
      setCurrentRevision(result.revNumber);
      await refreshRevisions();
      showToast('success', `${result.label} berhasil disimpan.`);
      return result;
    } catch (err) {
      showToast('error', 'Gagal menyimpan revisi.');
      throw err;
    }
  }, [projectId, sections, items, params, currentUser, currentRevision, refreshRevisions, showToast]);

  // ─── Restore Revision ─────────────────────────────────────────────────────
  const handleRestoreRevision = useCallback(async (revId) => {
    if (!projectId) return;
    try {
      const snapshot = await loadRevisionSnapshot(revId);
      if (!snapshot) { showToast('error', 'Snapshot tidak ditemukan.'); return; }
      setSections(snapshot.sections || []);
      setItems(snapshot.items || []);
      setParamsState(snapshot.params || { overhead: 5, profit: 10, tax: 11 });
      showToast('success', 'Revisi berhasil dipulihkan. Simpan sebagai revisi baru jika ingin mengkonfirmasi.');
    } catch (err) {
      showToast('error', 'Gagal memuat snapshot revisi.');
    }
  }, [projectId, showToast]);

  return {
    // State
    sections, items, params, wbsData, calculations,
    currentRevision, revisions,
    loading, error, saveStatus, toast,

    // Handlers
    handleParamChange,
    handleAddSection,
    handleDeleteSection,
    handleAddItem,
    handleUpdateItem,
    handleDeleteItem,
    handleInlineItemChange,
    handleInlineItemBlur,
    handleSaveRevision,
    handleRestoreRevision,
    refreshRevisions,
  };
}
