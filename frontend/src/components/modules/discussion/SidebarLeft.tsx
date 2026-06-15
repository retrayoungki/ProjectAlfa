import React, { useState } from 'react';
import { Hash, Plus, Users, User, ShieldAlert } from 'lucide-react';
import { discussionService } from '../../../services/discussionService';

export default function SidebarLeft({ 
  channels, 
  activeChannel, 
  setActiveChannel, 
  users, 
  currentUser, 
  setCurrentUser,
  projectId,
  refetchChannels
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [channelType, setChannelType] = useState('PUBLIC');

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      await discussionService.createChannel({
        projectId,
        name: newChannelName.trim(),
        type: channelType,
        createdBy: currentUser.name
      });
      setNewChannelName('');
      setShowCreateModal(false);
      refetchChannels();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ 
      background: '#1e293b', 
      color: '#f8fafc', 
      display: 'flex', 
      flexDirection: 'column', 
      borderRight: '1px solid #334155',
      minHeight: 0
    }}>
      {/* Simulation Box */}
      <div style={{ padding: 16, borderBottom: '1px solid #334155', background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ShieldAlert size={14} color="#f59e0b" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Simulation Console</span>
        </div>
        <label style={{ display: 'block', fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Chatting As:</label>
        <select 
          value={currentUser.id} 
          onChange={(e) => {
            const selected = users.find(u => u.id === e.target.value);
            if (selected) setCurrentUser(selected);
          }}
          style={{ 
            width: '100%', 
            background: '#1e293b', 
            border: '1px solid #475569', 
            color: '#fff', 
            padding: '6px 8px', 
            borderRadius: 4, 
            fontSize: 12,
            outline: 'none'
          }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
          ))}
        </select>
      </div>

      {/* Channels List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, minHeight: 0 }}>
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>CHANNELS</span>
          <button 
            onClick={() => setShowCreateModal(true)} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
            title="Create Custom Channel"
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {channels.map(ch => {
            const isActive = activeChannel?.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: isActive ? '#334155' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  transition: 'background 0.2s'
                }}
              >
                <Hash size={15} color={isActive ? '#fff' : '#94a3b8'} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
              </button>
            );
          })}
        </div>

        {/* Online Members section */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Users size={12} color="#94a3b8" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>ONLINE TEAM ({users.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#cbd5e1' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: '#475569', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff'
                  }}>
                    {u.name.charAt(0)}
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    bottom: -1, 
                    right: -1, 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    background: '#10b981', 
                    border: '1.5px solid #1e293b' 
                  }} />
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>{u.role.replace('_', ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{ 
            background: 'var(--surface)', 
            padding: 24, 
            borderRadius: 8, 
            width: 380, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid var(--border)',
            color: 'var(--text)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Create New Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Channel Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newChannelName} 
                  onChange={e => setNewChannelName(e.target.value)}
                  placeholder="e.g. site-inspection"
                  required
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Channel Type</label>
                <select 
                  className="select-field" 
                  value={channelType} 
                  onChange={e => setChannelType(e.target.value)}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
