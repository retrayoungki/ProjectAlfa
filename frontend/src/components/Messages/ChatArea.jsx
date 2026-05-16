import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, deleteConversation } from '../../services/messageService';

const ChatArea = ({ activeConversation, messages, currentUser, onBack }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    setIsSending(true);
    try {
      await sendMessage(activeConversation.id, currentUser, inputText);
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConversation) return;

    // Very basic Base64 file handling for demonstration without Storage
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('File too large. Max 2MB for current setup.');
      return;
    }

    setIsSending(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const attachment = {
          name: file.name,
          type: file.type,
          data: reader.result // Base64
        };
        await sendMessage(activeConversation.id, currentUser, '', attachment);
      } catch (err) {
        console.error('Failed to send file:', err);
      } finally {
        setIsSending(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset input
  };

  const handleDeleteChat = async () => {
    if (!activeConversation) return;
    const isGroup = activeConversation.type === 'group';
    const confirmMsg = isGroup 
      ? `Are you sure you want to end and delete the group chat "${getChatName()}" for everyone?` 
      : `Are you sure you want to end this chat with ${getChatName()}?`;
      
    if (window.confirm(confirmMsg)) {
      try {
        await deleteConversation(activeConversation.id);
        if (onBack) onBack(); // Go back to list
      } catch (err) {
        console.error('Failed to delete chat:', err);
        alert('Failed to delete chat. Please try again.');
      }
    }
  };

  if (!activeConversation) {
    return (
      <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-8">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-50 text-slate-400">forum</span>
        <h3 className="font-headline-md text-slate-500 font-bold mb-1">Your Messages</h3>
        <p className="text-sm">Select a chat from the left panel to start messaging.</p>
      </div>
    );
  }

  const getChatName = () => {
    if (activeConversation.type === 'group') return activeConversation.name || 'Unnamed Group';
    const otherParticipantId = activeConversation.participants.find(id => id !== currentUser.id);
    return activeConversation.participantNames?.[otherParticipantId] || 'Unknown User';
  };

  const formatMessageTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] h-[calc(100vh-64px)] min-w-0 relative">
      {/* Chat Header */}
      <div className="h-16 px-4 md:px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-slate-500 hover:text-slate-800 p-1">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline-md text-slate-900 font-black">{getChatName()}</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              {activeConversation.type === 'group' ? 'Group Chat' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button 
            onClick={handleDeleteChat}
            title="End Chat"
            className="w-8 h-8 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === currentUser.id;
          const showName = !isMine && activeConversation.type === 'group' && (idx === 0 || messages[idx-1].senderId !== msg.senderId);

          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                {showName && (
                  <span className="text-[10px] font-bold text-slate-500 mb-1 ml-2">{msg.senderName}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm relative group
                  ${isMine 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-sm'}`}
                >
                  {msg.attachment && (
                    <div className="mb-2">
                      {msg.attachment.type.startsWith('image/') ? (
                        <img src={msg.attachment.data} alt="attachment" className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" />
                      ) : (
                        <a href={msg.attachment.data} download={msg.attachment.name} className="flex items-center gap-2 p-3 bg-black/10 rounded-lg text-sm hover:bg-black/20 transition-colors">
                          <span className="material-symbols-outlined">description</span>
                          <span className="truncate max-w-[150px] font-bold">{msg.attachment.name}</span>
                        </a>
                      )}
                    </div>
                  )}
                  {msg.text && (
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  <span className={`text-[9px] font-bold block mt-1 text-right 
                    ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                    {formatMessageTime(msg.createdAt)}
                    {isMine && <span className="material-symbols-outlined text-[12px] ml-1 align-bottom">done_all</span>}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-50 p-2 border border-slate-200 rounded-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-primary transition-colors shrink-0"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx"
          />
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-2 px-2 text-sm max-h-32 min-h-[40px] custom-scrollbar"
            rows="1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          
          <button 
            type="submit"
            disabled={!inputText.trim() && !isSending}
            className="p-2 bg-primary text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all shrink-0 mb-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
