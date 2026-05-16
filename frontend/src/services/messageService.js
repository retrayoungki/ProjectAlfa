import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

/**
 * Creates or gets an existing direct message conversation
 */
export const getOrCreateDirectConversation = async (currentUser, targetUser) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('type', '==', 'direct'),
    where('participants', 'array-contains', currentUser.id)
  );

  const snapshot = await getDocs(q);
  let existingConv = null;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.participants.includes(targetUser.id) && data.participants.length === 2) {
      existingConv = { id: doc.id, ...data };
    }
  });

  if (existingConv) return existingConv;

  // Create new conversation
  const newConvRef = doc(collection(db, CONVERSATIONS_COLLECTION));
  const newConv = {
    id: newConvRef.id,
    type: 'direct',
    participants: [currentUser.id, targetUser.id],
    participantNames: {
      [currentUser.id]: currentUser.name || currentUser.username,
      [targetUser.id]: targetUser.name || targetUser.username
    },
    updatedAt: serverTimestamp(),
    lastMessage: null,
    readBy: [currentUser.id]
  };

  await setDoc(newConvRef, newConv);
  return newConv;
};

/**
 * Creates a new group conversation
 */
export const createGroupConversation = async (currentUser, groupName, participantsList, projectId = null) => {
  const newConvRef = doc(collection(db, CONVERSATIONS_COLLECTION));

  const participantIds = [currentUser.id, ...participantsList.map(p => p.id)];
  const participantNames = {
    [currentUser.id]: currentUser.name || currentUser.username
  };

  participantsList.forEach(p => {
    participantNames[p.id] = p.name || p.username;
  });

  const newConv = {
    id: newConvRef.id,
    type: 'group',
    name: groupName,
    projectId: projectId,
    participants: participantIds,
    participantNames: participantNames,
    createdBy: currentUser.id,
    updatedAt: serverTimestamp(),
    lastMessage: null,
    readBy: [currentUser.id]
  };

  await setDoc(newConvRef, newConv);
  return newConv;
};

/**
 * Subscribe to all conversations for a user
 */
export const subscribeToConversations = (userId, callback) => {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const convs = [];
    snapshot.forEach(doc => {
      convs.push({ id: doc.id, ...doc.data() });
    });
    // Sort client-side to avoid composite index requirement
    convs.sort((a, b) => {
      const getMillis = (t) => {
        if (!t) return 0;
        if (typeof t.toMillis === 'function') return t.toMillis();
        if (t.seconds) return t.seconds * 1000 + (t.nanoseconds || 0) / 1000000;
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'string' || typeof t === 'number') return new Date(t).getTime();
        return 0;
      };
      return getMillis(b.updatedAt) - getMillis(a.updatedAt);
    });
    callback(convs);
  });
};

/**
 * Subscribe to messages in a specific conversation
 */
export const subscribeToMessages = (conversationId, callback) => {
  if (!conversationId) return () => { };

  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = [];
    snapshot.forEach(doc => {
      msgs.push({ id: doc.id, ...doc.data() });
    });
    // Sort client-side to avoid composite index requirement
    msgs.sort((a, b) => {
      const getMillis = (t) => {
        if (!t) return 0;
        if (typeof t.toMillis === 'function') return t.toMillis();
        if (t.seconds) return t.seconds * 1000 + (t.nanoseconds || 0) / 1000000;
        if (t instanceof Date) return t.getTime();
        if (typeof t === 'string' || typeof t === 'number') return new Date(t).getTime();
        return 0;
      };
      return getMillis(a.createdAt) - getMillis(b.createdAt);
    });
    callback(msgs);
  });
};

/**
 * Send a new message
 */
export const sendMessage = async (conversationId, currentUser, text, attachment = null) => {
  const msgRef = doc(collection(db, MESSAGES_COLLECTION));

  const messageData = {
    id: msgRef.id,
    conversationId,
    senderId: currentUser.id,
    senderName: currentUser.name || currentUser.username,
    text: text || '',
    attachment: attachment || null,
    createdAt: serverTimestamp(),
    readBy: [currentUser.id]
  };

  await setDoc(msgRef, messageData);

  // Update last message in conversation
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(convRef, {
    lastMessage: {
      text: text ? text : (attachment ? 'Sent an attachment' : ''),
      senderId: currentUser.id,
      createdAt: new Date().toISOString()
    },
    updatedAt: serverTimestamp(),
    readBy: [currentUser.id]
  });

  return messageData;
};

/**
 * Mark all messages in a conversation as read by user
 */
export const markConversationAsRead = async (conversationId, userId, messages) => {
  const unreadMsgs = messages.filter(m => !m.readBy?.includes(userId));

  if (unreadMsgs.length > 0) {
    const promises = unreadMsgs.map(msg => {
      const msgRef = doc(db, MESSAGES_COLLECTION, msg.id);
      return updateDoc(msgRef, {
        readBy: [...(msg.readBy || []), userId]
      });
    });
    
    // Also mark conversation as read
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    promises.push(getDoc(convRef).then(docSnap => {
      if (docSnap.exists()) {
        const convData = docSnap.data();
        if (!convData.readBy?.includes(userId)) {
          return updateDoc(convRef, {
            readBy: [...(convData.readBy || []), userId]
          });
        }
      }
    }));
    
    await Promise.all(promises);
  } else {
    // If no unread messages, just ensure conversation is marked read
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(convRef);
    if (docSnap.exists()) {
      const convData = docSnap.data();
      if (!convData.readBy?.includes(userId)) {
        await updateDoc(convRef, {
          readBy: [...(convData.readBy || []), userId]
        });
      }
    }
  }
};

/**
 * Deletes a conversation
 */
export const deleteConversation = async (conversationId) => {
  if (!conversationId) return;
  await deleteDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId));
};
