import { useState, useEffect, useCallback } from 'react';
import { loadAHSPItems, addAHSPItem, updateAHSPItem, deleteAHSPItem, importAHSPItems } from '../services/ahspService';

export function useAHSP(currentUser) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAHSPItems();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (data) => {
    try {
      const newItem = await addAHSPItem(data, currentUser);
      setItems(prev => [...prev, newItem].sort((a, b) => a.code.localeCompare(b.code)));
      showToast('AHSP Item added successfully');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateAHSPItem(id, data, currentUser);
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item).sort((a, b) => a.code.localeCompare(b.code)));
      showToast('AHSP Item updated successfully');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAHSPItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      showToast('AHSP Item deleted');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleImport = async (dataArray) => {
    try {
      const count = await importAHSPItems(dataArray, currentUser);
      if (count > 0) {
        await fetchItems();
        showToast(`Successfully imported ${count} items`);
      } else {
        showToast('No new items imported. Check for duplicates.', 'error');
      }
      return count;
    } catch (err) {
      showToast(err.message, 'error');
      return 0;
    }
  };

  return {
    items,
    loading,
    error,
    toast,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleImport,
    refreshItems: fetchItems
  };
}
