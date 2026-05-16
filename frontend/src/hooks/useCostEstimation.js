/**
 * useCostEstimation — Custom React hook
 * Manages all state and operations for the Cost Estimation Engine.
 * Connects CostManagement.jsx to the Firestore service layer.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
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

export function useCostEstimation(projectId, currentUser, onBudgetChange) {
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

  // ─── Sync Budget to Project ──────────────────────────────────────────────
  useEffect(() => {
    if (onBudgetChange && calculations.baseCost > 0) {
      // Budget = Base Cost - Profit % (as requested: 13.5M - 30% = 9.45M)
      const profitRate = Number(params.profit) / 100;
      const internalBudget = calculations.baseCost * (1 - profitRate);
      onBudgetChange(internalBudget);
    }
  }, [calculations.baseCost, params.profit, onBudgetChange]);

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

  // ─── Import Excel ──────────────────────────────────────────────────────────
  const handleImportExcel = useCallback(async (file) => {
    if (!projectId || !file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Find the header row by looking for a row containing 'ITEM DESCRIPTION' or 'NO'
      let headerIdx = -1;
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i].map(c => String(c).trim().toUpperCase());
        if (row.some(c => c.includes('ITEM DESCRIPTION') || c.includes('DESCRIPTION'))) {
          headerIdx = i;
          break;
        }
      }
      if (headerIdx === -1) {
        showToast('error', 'Format Excel tidak dikenali. Pastikan ada kolom "ITEM DESCRIPTION".');
        return;
      }

      // Detect column positions from header
      const headerRow = rows[headerIdx].map(c => String(c).trim().toUpperCase());
      const descCol = headerRow.findIndex(c => c.includes('ITEM DESCRIPTION') || c.includes('DESCRIPTION'));
      const qtyCol = headerRow.findIndex(c => c.includes('QUANTITY') || c === 'QTY');
      const priceCol = headerRow.findIndex(c => c.includes('PRICE') || c.includes('HARGA'));
      const unitCol = headerRow.findIndex(c => c.includes('UNIT') || c.includes('SATUAN'));

      if (descCol === -1) {
        showToast('error', 'Kolom "ITEM DESCRIPTION" tidak ditemukan.');
        return;
      }

      // Parse data rows
      const parsed = [];
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        const desc = String(row[descCol] || '').trim();
        if (!desc || desc.toUpperCase() === 'TOTAL' || desc.toUpperCase() === 'TOTAL:') continue;

        const qty = qtyCol >= 0 ? (parseFloat(String(row[qtyCol]).replace(/[^0-9.,]/g, '').replace(',', '.')) || 1) : 1;
        const price = priceCol >= 0 ? (parseFloat(String(row[priceCol]).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0) : 0;

        // Try to extract unit: either from a dedicated column, or from text between qty and price
        let unit = 'Ls';
        if (unitCol >= 0 && row[unitCol]) {
          unit = String(row[unitCol]).trim();
        } else if (qtyCol >= 0) {
          // Check the cell right after qty for unit text
          const nextCell = String(row[qtyCol + 1] || '').trim();
          if (nextCell && nextCell.length < 10 && isNaN(Number(nextCell))) {
            unit = nextCell;
          }
        }

        if (price > 0) {
          parsed.push({ description: desc, quantity: qty, unit, price });
        }
      }

      if (parsed.length === 0) {
        showToast('error', 'Tidak ada data valid yang ditemukan di file Excel.');
        return;
      }

      if (sections.length === 0) {
        showToast('error', 'Belum ada kategori WBS. Tambahkan kategori terlebih dahulu.');
        return;
      }

      // Smart fuzzy matching: match Excel row names to existing WBS categories
      const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

      const findMatchingSection = (desc) => {
        const normDesc = normalize(desc);

        // 1. Exact match
        const exact = sections.find(s => normalize(s.category) === normDesc);
        if (exact) return exact;

        // 2. One starts with the other (handles "Floor" → "Flooring", "Other" → "Others", "Preliminaris" → "Preliminaries")
        const prefix = sections.find(s => {
          const normCat = normalize(s.category);
          return normCat.startsWith(normDesc) || normDesc.startsWith(normCat);
        });
        if (prefix) return prefix;

        // 3. One contains the other (handles "Wall / partition" → "Wall")
        const contains = sections.find(s => {
          const normCat = normalize(s.category);
          return normDesc.includes(normCat) || normCat.includes(normDesc);
        });
        if (contains) return contains;

        // 4. First 3 chars match (handles typos like "Preliminaris" vs "Preliminaries")
        const shortMatch = sections.find(s => {
          const normCat = normalize(s.category);
          return normCat.length >= 3 && normDesc.length >= 3 && normCat.substring(0, 3) === normDesc.substring(0, 3);
        });
        if (shortMatch) return shortMatch;

        // 5. No match → put in last section (Others)
        return sections[sections.length - 1];
      };

      // Map each parsed row into the matching WBS section
      let importedCount = 0;
      for (const row of parsed) {
        const matchedSection = findMatchingSection(row.description);

        const existingInSection = items.filter(i => i.sectionId === matchedSection.id).length;
        const newItem = await addItem(projectId, matchedSection.id, {
          description: row.description,
          quantity: row.quantity,
          unit: row.unit,
          unitPrice: row.price,
          code: '',
          ahspRef: '',
          notes: 'Imported from Excel',
        }, existingInSection);
        setItems(prev => [...prev, newItem]);
        importedCount++;
      }

      showToast('success', `Berhasil import ${importedCount} item dari Excel.`);
    } catch (err) {
      console.error('[Import Excel Error]', err);
      showToast('error', 'Gagal membaca file Excel. Pastikan format file benar.');
    }
  }, [projectId, sections, items, showToast]);

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
    handleImportExcel,
    handleSaveRevision,
    handleRestoreRevision,
    refreshRevisions,
  };
}
