import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Pin, FileText, CheckCircle2, MessageSquare, AlertTriangle, 
  HelpCircle, Volume2, Mic, Play, Pause, Plus, Link, Trash2, Smile
} from 'lucide-react';
import { useMessages, useCreateMessage } from '../../../hooks/useDiscussion';
import { useMaterialsQuery } from '../../../hooks/useMaterials';
import { socketService } from '../../../services/socket';
import { discussionService } from '../../../services/discussionService';

export default function ChatWindow({ 
  activeChannel, 
  currentUser, 
  users, 
  onOpenThread,
  searchQuery,
  activeFilter,
  projectId
}) {
  const channelId = activeChannel?.id;
  const { data: initialMessages = [], refetch } = useMessages(channelId);
  const { data: dbMaterials = [] } = useMaterialsQuery(projectId);

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [simulatedVoiceNote, setSimulatedVoiceNote] = useState<any>(null);

  // Link Dialog states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [selectedLinkType, setSelectedLinkType] = useState('MATERIAL');
  const [selectedLinkId, setSelectedLinkId] = useState('');

  // Upload Dialog states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Sync React Query data to local state
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Connect WebSockets
  useEffect(() => {
    if (!channelId) return;

    const socket = socketService.connect();
    socketRef.current = socket;

    socket.emit('join_channel', channelId);

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    });

    socket.on('user_typing', (data) => {
      if (data.userId === currentUser.id) return;
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    });

    socket.on('message_pinned', () => {
      refetch();
    });

    return () => {
      socket.emit('leave_channel', channelId);
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('message_pinned');
    };
  }, [channelId, currentUser.id, refetch]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Typing indicator trigger
  const handleTextChange = (e) => {
    setText(e.target.value);
    if (socketRef.current && channelId) {
      socketRef.current.emit('typing', {
        channelId,
        userId: currentUser.id,
        userName: currentUser.name,
        isTyping: e.target.value.length > 0
      });
    }
  };

  // REST Submit
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && linkedItems.length === 0 && attachedFiles.length === 0 && !simulatedVoiceNote) return;

    try {
      let msgType = 'TEXT';
      if (simulatedVoiceNote) msgType = 'VOICE';
      else if (attachedFiles.length > 0) msgType = 'FILE';

      const payload = {
        userId: currentUser.id,
        content: text.trim() || (simulatedVoiceNote ? 'Voice Note' : 'Shared files'),
        type: msgType,
        attachments: [
          ...attachedFiles,
          ...(simulatedVoiceNote ? [simulatedVoiceNote] : [])
        ],
        links: linkedItems.map(item => ({
          entityType: item.type,
          entityId: item.id
        }))
      };

      await discussionService.createMessage(channelId, payload);
      
      // Reset inputs
      setText('');
      setLinkedItems([]);
      setAttachedFiles([]);
      setSimulatedVoiceNote(null);
      
      // Stop typing
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          channelId,
          userId: currentUser.id,
          userName: currentUser.name,
          isTyping: false
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Pinned
  const handleTogglePin = async (msg) => {
    try {
      await discussionService.togglePin(msg.id, !msg.isPinned);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert to Decision Log
  const handleConvertToDecision = async (msg) => {
    const title = window.prompt("Enter Official Decision Title:", "Agreed specification revision");
    if (!title) return;
    try {
      await discussionService.createMessage(channelId, {
        userId: currentUser.id,
        content: `**OFFICIAL DECISION:** ${title}\n\n*Description:* ${msg.content}`,
        type: 'DECISION'
      });
      alert('Official Decision logged and posted successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Link Smart Item helper
  const addSmartLink = () => {
    if (!selectedLinkId) return;
    let name = '';
    if (selectedLinkType === 'MATERIAL') {
      const mat = dbMaterials.find(m => m.id === selectedLinkId);
      name = mat ? mat.name : 'Selected Material';
    } else {
      name = `Task ID: ${selectedLinkId}`;
    }

    setLinkedItems(prev => [...prev, {
      type: selectedLinkType,
      id: selectedLinkId,
      name
    }]);
    setShowLinkModal(false);
  };

  // Simulate File Uploading
  const handleSimulatedUpload = () => {
    setShowUploadModal(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAttachedFiles([{
            fileName: 'Structure_Ceiling_Plan_V2.dwg',
            fileUrl: '#',
            fileType: 'DWG',
            size: 4850000
          }]);
          setShowUploadModal(false);
          return 100;
        }
        return prev + 30;
      });
    }, 300);
  };

  // Simulate Voice recording
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      setSimulatedVoiceNote({
        fileName: 'Voice_Note_Coordination.mp3',
        fileUrl: '#',
        fileType: 'VOICE',
        size: 320000
      });
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      if (!m.content.toLowerCase().includes(term) && !m.user.name.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (activeFilter === 'pinned') return m.isPinned;
    if (activeFilter === 'decisions') return m.type === 'DECISION';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)', minHeight: 0 }}>
      {/* Channel Header */}
      <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>#{activeChannel?.name || 'Loading'}</h3>
          <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
            Real-time Construction Coordination Hub
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        {filteredMessages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-subtle)', padding: 40 }}>
            <MessageSquare size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 13 }}>No messages in #{activeChannel?.name || 'channel'}.</p>
            <p style={{ fontSize: 11, opacity: 0.7 }}>Be the first to send a message!</p>
          </div>
        ) : (
          filteredMessages.map((m, idx) => {
            const isDecision = m.type === 'DECISION';
            return (
              <div 
                key={m.id} 
                className="chat-bubble-container"
                style={{ 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'flex-start',
                  background: isDecision ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                  border: isDecision ? '1px dashed var(--emerald)' : 'none',
                  borderRadius: 8,
                  padding: isDecision ? 12 : 4
                }}
              >
                {/* Avatar */}
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: 'var(--blue-light)', 
                  color: 'var(--blue)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 12
                }}>
                  {m.user?.name.charAt(0)}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>{m.user?.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{m.user?.role.replace('_', ' ')}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString()}</span>
                    {m.isPinned && <Pin size={10} color="var(--amber)" fill="var(--amber)" />}
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>

                  {/* Render Voice Player simulation if type is VOICE */}
                  {m.type === 'VOICE' && (
                    <div style={{ 
                      marginTop: 8, 
                      background: 'var(--bg)', 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      border: '1px solid var(--border)',
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      width: 240
                    }}>
                      <button className="btn-icon" style={{ background: 'var(--blue)', color: '#fff', borderRadius: '50%', width: 28, height: 28 }}><Play size={12} fill="#fff" /></button>
                      <div style={{ flex: 1, height: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[...Array(12)].map((_, i) => (
                          <div key={i} style={{ flex: 1, background: 'var(--blue)', height: `${Math.random() * 100}%`, minHeight: 4, borderRadius: 2 }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>0:18</span>
                    </div>
                  )}

                  {/* Smart links rendering */}
                  {m.links?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {m.links.map(l => (
                        <div key={l.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 6, 
                          background: 'var(--blue-light)', 
                          color: 'var(--blue)', 
                          padding: '3px 8px', 
                          borderRadius: 12, 
                          fontSize: 10.5,
                          fontWeight: 600,
                          border: '1px solid var(--blue)'
                        }}>
                          <Link size={10} />
                          {l.entityType}: {l.entityId.slice(0, 8)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attachments rendering */}
                  {m.attachments?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {m.attachments.map(att => (
                        <div key={att.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 8, 
                          background: 'var(--bg)', 
                          padding: '6px 12px', 
                          borderRadius: 6, 
                          border: '1px solid var(--border)',
                          width: 'max-content',
                          fontSize: 12
                        }}>
                          <FileText size={14} color="var(--blue)" />
                          <span style={{ fontWeight: 500 }}>{att.fileName}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({(att.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action hover tools */}
                  <div className="message-actions" style={{ display: 'flex', gap: 12, marginTop: 6, opacity: 0.7 }}>
                    <button 
                      onClick={() => onOpenThread(m)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <MessageSquare size={12} /> Reply Thread ({m._count?.replies || 0})
                    </button>
                    <button 
                      onClick={() => handleTogglePin(m)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-subtle)' }}
                    >
                      {m.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    {currentUser.role === 'PROJECT_MANAGER' && (
                      <button 
                        onClick={() => handleConvertToDecision(m)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}
                      >
                        Official Decision
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '0 20px 8px', fontSize: 11, color: 'var(--text-subtle)' }}>
          {typingUsers.map(u => u.userName).join(', ')} typing...
        </div>
      )}

      {/* Linked Items Bar before submission */}
      {linkedItems.length > 0 && (
        <div style={{ padding: '8px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {linkedItems.map((item, i) => (
            <div key={i} style={{ background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 4, fontSize: 11, border: '1px solid var(--blue)' }}>
              <span>[{item.type}] {item.name}</span>
              <button 
                onClick={() => setLinkedItems(prev => prev.filter((_, idx) => idx !== i))}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 0 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Bar before submission */}
      {attachedFiles.length > 0 && (
        <div style={{ padding: '8px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          {attachedFiles.map((file, i) => (
            <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, fontSize: 12 }}>
              <FileText size={14} color="var(--blue)" />
              <span>{file.fileName}</span>
              <button 
                onClick={() => setAttachedFiles([])}
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Voice Note Bar before submission */}
      {simulatedVoiceNote && (
        <div style={{ padding: '8px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: 'var(--red)', padding: '4px 8px', borderRadius: 4, fontSize: 11 }}>
            <Mic size={12} />
            <span>Voice Note Ready to send</span>
          </div>
          <button 
            onClick={() => setSimulatedVoiceNote(null)}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* Bottom Rich Input Bar */}
      <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button 
          type="button" 
          className="btn-icon" 
          onClick={handleSimulatedUpload}
          title="Attach Files"
        >
          <Paperclip size={18} />
        </button>

        <button 
          type="button" 
          className="btn-icon" 
          onClick={() => setShowLinkModal(true)}
          title="Link Project Item"
        >
          <Link size={18} />
        </button>

        <button 
          type="button" 
          className={`btn-icon ${isRecording ? 'pulse' : ''}`} 
          onClick={toggleRecording}
          style={{ color: isRecording ? 'var(--red)' : 'var(--text-subtle)' }}
          title={isRecording ? "Stop Recording" : "Record Voice Note"}
        >
          {isRecording ? <Pause size={18} color="var(--red)" /> : <Mic size={18} />}
        </button>

        <input 
          type="text" 
          className="input-field" 
          placeholder={`Message #${activeChannel?.name || 'channel'}...`}
          value={text}
          onChange={handleTextChange}
          style={{ flex: 1 }}
        />

        <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>
          <Send size={16} />
        </button>
      </form>

      {/* Smart Linking Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 8, width: 380, border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Link Project Element</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Type</label>
              <select className="select-field" value={selectedLinkType} onChange={e => setSelectedLinkType(e.target.value)}>
                <option value="MATERIAL">Project Material</option>
                <option value="TASK">Scope / Task ID</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Select Element</label>
              <select className="select-field" value={selectedLinkId} onChange={e => setSelectedLinkId(e.target.value)}>
                <option value="">-- Choose Element --</option>
                {selectedLinkType === 'MATERIAL' ? (
                  dbMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                  ))
                ) : (
                  <>
                    <option value="T-101"> Suspension framwork [T-101]</option>
                    <option value="T-102"> Power cable pulling [T-102]</option>
                    <option value="T-103"> Closet fittings [T-103]</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addSmartLink}>Link Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated File Uploading Progress Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: 'var(--surface)', padding: 20, borderRadius: 8, width: 300, textAlign: 'center', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Uploading structure drawing...</h4>
            <div style={{ background: 'var(--bg)', borderRadius: 10, height: 8, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ background: 'var(--blue)', height: '100%', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{uploadProgress}% completed</span>
          </div>
        </div>
      )}
    </div>
  );
}
