import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { socketService } from '../../../services/socket';

export default function ThreadPanel({ parentMessage, currentUser, onClose }) {
  const [replies, setReplies] = useState<any[]>([]);
  const [text, setText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Load thread replies
  useEffect(() => {
    const loadReplies = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/discussions/messages/${parentMessage.id}/replies`);
        setReplies(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadReplies();
  }, [parentMessage.id]);

  // WebSocket listeners for thread
  useEffect(() => {
    const socket = socketService.connect();
    socketRef.current = socket;

    socket.on('receive_message', (msg) => {
      if (msg.threadId === parentMessage.id) {
        setReplies(prev => {
          if (prev.some(r => r.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [parentMessage.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [replies]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const payload = {
        userId: currentUser.id,
        content: text.trim(),
        type: 'TEXT',
        threadId: parentMessage.id
      };
      const res = await axios.post(`http://localhost:5000/api/discussions/channels/${parentMessage.channelId}/messages`, payload);
      
      // Update locally immediately
      setReplies(prev => [...prev, res.data]);
      setText('');
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      right: 0, 
      bottom: 0, 
      width: 320, 
      background: 'var(--surface)', 
      borderLeft: '2px solid var(--blue)', 
      boxShadow: '-4px 0 16px rgba(0,0,0,0.1)', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 100
    }}>
      {/* Thread Header */}
      <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={16} color="var(--blue)" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Thread Discussion</span>
        </div>
        <button className="btn-icon" onClick={onClose}><X size={16} /></button>
      </div>

      {/* Parent message focus */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{parentMessage.user?.name}</span>
          <span style={{ fontSize: 9.5, color: 'var(--text-subtle)' }}>{parentMessage.user?.role.replace('_', ' ')}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>{parentMessage.content}</p>
      </div>

      {/* Replies Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {replies.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>No replies in thread yet.</p>
        ) : (
          replies.map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 8, flexDirection: 'column', background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--navy)' }}>{r.user?.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleTimeString()}</span>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text)', margin: 0, whiteSpace: 'pre-wrap' }}>{r.content}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Thread reply input */}
      <form onSubmit={handleSend} style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: 8 }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Reply in thread..." 
          value={text} 
          onChange={e => setText(e.target.value)}
          style={{ fontSize: 12, padding: '6px 10px', flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '6px 10px' }}><Send size={13} /></button>
      </form>
    </div>
  );
}
