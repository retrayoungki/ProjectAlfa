import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Load all active/inactive AHSP items. 
 * We don't load soft-deleted items unless specified.
 */
export async function loadAHSPItems() {
  try {
    const q = query(
      collection(db, 'ahsp_library'),
      where('deletedAt', '==', null)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error('Error loading AHSP:', error);
    throw error;
  }
}

/**
 * Check if an AHSP code already exists (excluding the current item ID)
 */
export async function isAHSPCodeDuplicate(code, excludeId = null) {
  const q = query(collection(db, 'ahsp_library'), where('code', '==', code), where('deletedAt', '==', null));
  const snap = await getDocs(q);
  
  if (snap.empty) return false;
  if (!excludeId) return true;
  
  // If excluding, check if the only match is the excluded ID
  return snap.docs.some(doc => doc.id !== excludeId);
}

/**
 * Add a new AHSP item
 */
export async function addAHSPItem(data, currentUser) {
  const isDup = await isAHSPCodeDuplicate(data.code);
  if (isDup) throw new Error(`AHSP Code ${data.code} already exists.`);

  const ref = await addDoc(collection(db, 'ahsp_library'), {
    ...data,
    unitPrice: Number(data.unitPrice) || 0,
    status: data.status || 'Active',
    deletedAt: null,
    createdBy: currentUser?.name || 'System',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    id: ref.id,
    ...data,
    status: data.status || 'Active',
  };
}

/**
 * Update an AHSP item
 */
export async function updateAHSPItem(id, data, currentUser) {
  const isDup = await isAHSPCodeDuplicate(data.code, id);
  if (isDup) throw new Error(`AHSP Code ${data.code} already exists.`);

  const ref = doc(db, 'ahsp_library', id);
  await updateDoc(ref, {
    ...data,
    unitPrice: Number(data.unitPrice) || 0,
    updatedBy: currentUser?.name || 'System',
    updatedAt: serverTimestamp()
  });
}

/**
 * Soft delete an AHSP item
 */
export async function deleteAHSPItem(id) {
  const ref = doc(db, 'ahsp_library', id);
  await updateDoc(ref, { deletedAt: serverTimestamp() });
}

/**
 * Batch insert multiple AHSP items (for Excel Import)
 */
export async function importAHSPItems(itemsArray, currentUser) {
  const batch = writeBatch(db);
  const collectionRef = collection(db, 'ahsp_library');
  let importedCount = 0;

  // We should ideally check duplicates in batch, but for simplicity we assume the excel is clean
  // Or we fetch existing codes first
  const existingQ = query(collection(db, 'ahsp_library'), where('deletedAt', '==', null));
  const existingSnap = await getDocs(existingQ);
  const existingCodes = new Set(existingSnap.docs.map(d => d.data().code));

  for (const item of itemsArray) {
    if (!item.code || existingCodes.has(item.code)) {
      continue; // Skip invalid or duplicate codes
    }
    
    const docRef = doc(collectionRef);
    batch.set(docRef, {
      ...item,
      status: 'Active',
      deletedAt: null,
      createdBy: currentUser?.name || 'System Import',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    existingCodes.add(item.code);
    importedCount++;
  }

  if (importedCount > 0) {
    await batch.commit();
  }
  
  return importedCount;
}
