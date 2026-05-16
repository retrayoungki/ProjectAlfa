import React, { useState } from 'react';

const ChatList = ({ conversations, activeConversation, setActiveConversation, currentUser, workers, systemUsers, onNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    // Search by group name
    if (conv.type === 'group' && conv.name?.toLowerCase().includes(searchLower)) return true;
    
    // Search by participant name
    if (conv.participantNames) {
      return Object.values(conv.participantNames).some(name => name.toLowerCase().includes(searchLower));
    }
    
    return false;
  });

  const getChatName = (conv) => {
    if (conv.type === 'group') return conv.name || 'Unnamed Group';
    
    // For direct messages, find the other person's name
    const otherParticipantId = conv.participants.find(id => id !== currentUser.id);
    return conv.participantNames?.[otherParticipantId] || 'Unknown User';
  };

  const getChatInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full md:w-[320px] lg:w-[380px] bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-64px)] shrink-0">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline-md text-primary font-black">Messages</h2>
          <button 
            onClick={onNewChat}
            className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
            title="New Chat"
          >
            <span className="material-symbols-outlined text-sm">edit_square</span>
          </button>
        </div>
        
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input 
            type="text" 
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold italic text-sm">
            No conversations found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredConversations.map(conv => {
              const isActive = activeConversation?.id === conv.id;
              const chatName = getChatName(conv);
              const initials = getChatInitials(chatName);
              const isGroup = conv.type === 'group';
              
              // Unread logic (placeholder if no unread logic yet)
              const hasUnread = false; // Add real logic if we track last read timestamp per conversation
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors hover:bg-slate-50 ${isActive ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm
                      ${isGroup ? 'bg-emerald-500' : 'bg-primary'}`}
                    >
                      {isGroup ? <span className="material-symbols-outlined text-xl">group</span> : initials}
                    </div>
                    {hasUnread && (
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-bold text-sm truncate pr-2 ${isActive ? 'text-primary' : 'text-slate-900'}`}>
                        {chatName}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {conv.updatedAt ? new Date(conv.updatedAt.toDate ? conv.updatedAt.toDate() : conv.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMessage ? (
                        <>
                          <span className="font-bold text-slate-700">
                            {conv.lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                          </span>
                          {conv.lastMessage.text}
                        </>
                      ) : (
                        <span className="italic text-slate-400">No messages yet</span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
