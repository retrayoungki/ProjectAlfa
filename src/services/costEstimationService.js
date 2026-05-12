/**
 * Cost Estimation Service
 * Data access layer for all Firestore operations related to the Cost Estimation Engine.
 * Collections: cost_estimations, cost_estimation_sections, cost_estimation_items, cost_estimation_revisions
 */
import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, getDocs,
  addDoc, serverTimestamp, writeBatch, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Default WBS Template ────────────────────────────────────────────────────
export const DEFAULT_WBS_TEMPLATE = [
  { category: 'Preparation', order: 0 },
  { category: 'Structural', order: 1 },
  { category: 'Architectural', order: 2 },
  { category: 'MEP (Mechanical, Electrical, Plumbing)', order: 3 },
];

export const DEFAULT_PARAMS = { overhead: 5, profit: 10, tax: 11 };

// ─── Load full estimation for a project ─────────────────────────────────────
export async function loadEstimation(projectId) {
  const pid = String(projectId); // Always string for Firestore
  try {
    const estRef = doc(db, 'cost_estimations', pid);
    const estSnap = await getDoc(estRef);

    let params = DEFAULT_PARAMS;
    let currentRevision = 0;

    if (estSnap.exists()) {
      const data = estSnap.data();
      params = data.params || DEFAULT_PARAMS;
      currentRevision = data.currentRevision || 0;
    }

    const sectionsQ = query(
      collection(db, 'cost_estimation_sections'),
      where('projectId', '==', pid)
    );
    const sectionsSnap = await getDocs(sectionsQ);
    const sections = sectionsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const itemsQ = query(
      collection(db, 'cost_estimation_items'),
      where('projectId', '==', pid)
    );
    const itemsSnap = await getDocs(itemsQ);
    const items = itemsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(item => !item.deletedAt)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return { params, sections, items, currentRevision, isNew: !estSnap.exists() };
  } catch (err) {
    console.error('[costEstimationService] loadEstimation error:', err);
    throw err;
  }
}

// ─── Initialize new project with default template ────────────────────────────
export async function initializeProjectEstimation(projectId) {
  const pid = String(projectId);
  const estRef = doc(db, 'cost_estimations', pid);

  return await runTransaction(db, async (transaction) => {
    const estSnap = await transaction.get(estRef);
    if (estSnap.exists()) {
      throw new Error("ALREADY_INITIALIZED");
    }

    transaction.set(estRef, {
      projectId: pid,
      params: DEFAULT_PARAMS,
      currentRevision: 0,
      // Cannot use serverTimestamp() inside transaction.set easily if it relies on client time or similar, but Firebase supports it.
      // Actually, serverTimestamp() works fine in transactions.
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const createdSections = [];
    for (const tmpl of DEFAULT_WBS_TEMPLATE) {
      const secRef = doc(collection(db, 'cost_estimation_sections'));
      transaction.set(secRef, {
        projectId: pid,
        category: tmpl.category,
        order: tmpl.order,
        createdAt: serverTimestamp(),
      });
      createdSections.push({ id: secRef.id, projectId: pid, ...tmpl });
    }

    return { params: DEFAULT_PARAMS, sections: createdSections, items: [], currentRevision: 0, isNew: false };
  });
}

// ─── Update global params ─────────────────────────────────────────────────────
export async function updateParams(projectId, params) {
  const pid = String(projectId);
  const estRef = doc(db, 'cost_estimations', pid);
  await setDoc(estRef, { params, updatedAt: serverTimestamp() }, { merge: true });
}

// ─── Section CRUD ─────────────────────────────────────────────────────────────
export async function addSection(projectId, category, order) {
  const pid = String(projectId);
  const secRef = await addDoc(collection(db, 'cost_estimation_sections'), {
    projectId: pid,
    category,
    order,
    createdAt: serverTimestamp(),
  });
  return { id: secRef.id, projectId: pid, category, order };
}

export async function deleteSection(sectionId, projectId) {
  const pid = String(projectId);
  const itemsQ = query(
    collection(db, 'cost_estimation_items'),
    where('sectionId', '==', sectionId)
  );
  const snap = await getDocs(itemsQ);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { deletedAt: serverTimestamp() }));
  batch.delete(doc(db, 'cost_estimation_sections', sectionId));
  await batch.commit();
}

// ─── Item CRUD ────────────────────────────────────────────────────────────────
export async function addItem(projectId, sectionId, itemData, order) {
  const pid = String(projectId);
  const ref = await addDoc(collection(db, 'cost_estimation_items'), {
    projectId: pid,
    sectionId,
    code: itemData.code || '',
    description: itemData.description || 'New Item',
    quantity: Number(itemData.quantity) || 0,
    unit: itemData.unit || 'Ls',
    unitPrice: Number(itemData.unitPrice) || 0,
    ahspRef: itemData.ahspRef || '',
    notes: itemData.notes || '',
    order: order || 0,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: ref.id, projectId: pid, sectionId, ...itemData,
    quantity: Number(itemData.quantity) || 0,
    unitPrice: Number(itemData.unitPrice) || 0,
    deletedAt: null, order: order || 0,
  };
}

export async function updateItem(itemId, itemData) {
  const ref = doc(db, 'cost_estimation_items', itemId);
  await updateDoc(ref, {
    ...itemData,
    quantity: Number(itemData.quantity) || 0,
    unitPrice: Number(itemData.unitPrice) || 0,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteItem(itemId) {
  const ref = doc(db, 'cost_estimation_items', itemId);
  await updateDoc(ref, { deletedAt: serverTimestamp() });
}

// ─── Revision Snapshots ───────────────────────────────────────────────────────
export async function saveRevision(projectId, { sections, items, params, notes, createdBy, currentRevision }) {
  const pid = String(projectId);
  const newRevNum = (currentRevision || 0) + 1;

  const revRef = await addDoc(collection(db, 'cost_estimation_revisions'), {
    projectId: pid,
    revNumber: newRevNum,
    label: `Rev ${newRevNum}`,
    snapshot: { sections, items, params },
    notes: notes || '',
    createdBy: createdBy || 'Unknown',
    createdAt: serverTimestamp(),
  });

  const estRef = doc(db, 'cost_estimations', pid);
  await setDoc(estRef, { currentRevision: newRevNum, updatedAt: serverTimestamp() }, { merge: true });

  return { id: revRef.id, revNumber: newRevNum, label: `Rev ${newRevNum}` };
}

export async function loadRevisions(projectId) {
  const pid = String(projectId);
  const q = query(
    collection(db, 'cost_estimation_revisions'),
    where('projectId', '==', pid)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toLocaleDateString('id-ID') || '—',
    }))
    .sort((a, b) => (b.revNumber || 0) - (a.revNumber || 0));
}

export async function loadRevisionSnapshot(revId) {
  const snap = await getDoc(doc(db, 'cost_estimation_revisions', revId));
  if (!snap.exists()) return null;
  return snap.data().snapshot;
}
