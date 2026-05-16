import React, { useState, useEffect } from 'react';
import ChatList from '../components/Messages/ChatList';
import ChatArea from '../components/Messages/ChatArea';
import ContextPanel from '../components/Messages/ContextPanel';
import { 
  subscribeToConversations, 
  subscribeToMessages, 
  markConversationAsRead,
  getOrCreateDirectConversation,
  createGroupConversation
} from '../services/messageService';

const Messages = ({ currentUser, projects = [], workers = [], systemUsers = [] }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showMobileList, setShowMobileList] = useState(true);
  
  // New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatType, setChatType] = useState('direct'); // 'direct' or 'group'
  const [selectedUser, setSelectedUser] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = subscribeToConversations(currentUser.id, (data) => {
      setConversations(data);
      // Update active conversation reference if it changed
      if (activeConversation) {
        const updatedActive = data.find(c => c.id === activeConversation.id);
        if (updatedActive) setActiveConversation(updatedActive);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeConversation.id, (data) => {
      setMessages(data);
      markConversationAsRead(activeConversation.id, currentUser.id, data);
    });

    // Hide mobile list when a chat is selected
    setShowMobileList(false);

    return () => unsubscribe();
  }, [activeConversation, currentUser]);

  const handleBackToList = () => {
    setActiveConversation(null);
    setShowMobileList(true);
  };

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (chatType === 'direct') {
      const targetUser = systemUsers.find(u => u.id === selectedUser);
      if (!targetUser) return;
      const conv = await getOrCreateDirectConversation(currentUser, targetUser);
      setActiveConversation(conv);
    } else {
      if (!groupName.trim() || selectedGroupUsers.length === 0) return;
      const participantsList = systemUsers.filter(u => selectedGroupUsers.includes(u.id));
      const conv = await createGroupConversation(currentUser, groupName, participantsList, selectedProject);
      setActiveConversation(conv);
    }
    setShowNewChatModal(false);
    setGroupName('');
    setSelectedUser('');
    setSelectedGroupUsers([]);
    setSelectedProject('');
  };

  // Only system users can log in, so only they should be available for chatting
  const chatUsers = systemUsers.filter(u => u.id !== currentUser.id && u.status === 'Active');

  return (
    <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Mobile/Desktop Chat List */}
      <div className={`md:flex shrink-0 ${!showMobileList ? 'hidden' : 'flex w-full'}`}>
        <ChatList 
          conversations={conversations}
          activeConversation={activeConversation}
          setActiveConversation={setActiveConversation}
          currentUser={currentUser}
          workers={workers}
          systemUsers={systemUsers}
          onNewChat={() => setShowNewChatModal(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 min-w-0 ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
        <ChatArea 
          activeConversation={activeConversation}
          messages={messages}
          currentUser={currentUser}
          onBack={handleBackToList}
        />
      </div>

      {/* Right Context Panel */}
      <ContextPanel 
        activeConversation={activeConversation}
        currentUser={currentUser}
        projects={projects}
        workers={workers}
      />

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-headline-md text-primary">New Conversation</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleStartChat} className="p-6 space-y-4">
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input type="radio" checked={chatType === 'direct'} onChange={() => setChatType('direct')} className="accent-primary" />
                  Direct Message
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input type="radio" checked={chatType === 'group'} onChange={() => setChatType('group')} className="accent-primary" />
                  Group Chat
                </label>
              </div>

              {chatType === 'direct' ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select User</label>
                  <select 
                    value={selectedUser} 
                    onChange={e => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded focus:border-primary outline-none text-sm"
                    required
                  >
                    <option value="">Select a team member...</option>
                    {chatUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.username} - {u.role}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Group Name</label>
                    <input 
                      type="text" 
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="e.g. Site A Engineering"
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-primary outline-none text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Related Project (Optional)</label>
                    <select 
                      value={selectedProject} 
                      onChange={e => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-primary outline-none text-sm"
                    >
                      <option value="">No Project Linked</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Select Members</label>
                    <select 
                      multiple 
                      value={selectedGroupUsers} 
                      onChange={e => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedGroupUsers(values);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:border-primary outline-none text-sm min-h-[120px]"
                      required
                    >
                      {chatUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.username} - {u.role}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewChatModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:brightness-110">Start Chat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
