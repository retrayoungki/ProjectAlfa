import { createNotification } from './prService';

const STORAGE_KEY = 'alfa_work_updates';

// Get all work updates from local storage
export const getAllWorkUpdates = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error parsing work updates:", error);
    return [];
  }
};

// Save a new or existing work update
export const saveWorkUpdate = (update) => {
  const updates = getAllWorkUpdates();
  const existingIndex = updates.findIndex(u => u.id === update.id);
  
  const payload = {
    ...update,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    updates[existingIndex] = payload;
  } else {
    // New update
    payload.id = `WU-${Date.now()}`;
    payload.createdAt = new Date().toISOString();
    updates.unshift(payload);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  return payload;
};

// Delete a work update by ID
export const deleteWorkUpdate = (id) => {
  const updates = getAllWorkUpdates();
  const filtered = updates.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Get work updates filtered by the user's role and identity
export const getWorkUpdatesByRole = (currentUser, projects) => {
  const allUpdates = getAllWorkUpdates();
  
  if (!currentUser) return [];

  // Everyone sees all updates now so they can comment on them, and so it shows on the global dashboard chart.
  // Editing and deleting is restricted at the component level to the actual owner.
  return allUpdates;
};

// Add a comment to an update
export const addWorkUpdateComment = (updateId, user, commentText, replyTo = null) => {
  const updates = getAllWorkUpdates();
  const index = updates.findIndex(u => u.id === updateId);
  
  if (index >= 0) {
    const comment = {
      id: `C-${Date.now()}`,
      userName: user.name || user.username,
      text: commentText,
      replyTo: replyTo ? { id: replyTo.id, userName: replyTo.userName, text: replyTo.text } : null,
      createdAt: new Date().toISOString()
    };
    
    if (!updates[index].comments) {
      updates[index].comments = [];
    }
    
    updates[index].comments.push(comment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
    
    const targetUpdate = updates[index];
    
    // Notify the owner of the work update if they are not the one commenting
    if (targetUpdate.userId && targetUpdate.userId !== user.id) {
      createNotification({
        type: 'work_update_comment',
        workUpdateId: targetUpdate.id,
        workUpdateTitle: targetUpdate.taskTitle,
        commenterName: user.name || user.username,
        recipientId: targetUpdate.userId,
      });
    }
    
    return targetUpdate;
  }
  return null;
};

// Mark all comments on a work update as read by a user
export const markCommentsAsRead = (updateId, userId) => {
  const updates = getAllWorkUpdates();
  const index = updates.findIndex(u => u.id === updateId);
  if (index >= 0 && updates[index].comments) {
    let changed = false;
    updates[index].comments.forEach(c => {
      if (!c.readBy) c.readBy = [];
      if (!c.readBy.includes(userId)) {
        c.readBy.push(userId);
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
    }
  }
};
