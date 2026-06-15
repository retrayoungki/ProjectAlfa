import React, { useState } from 'react';
import { 
  Pin, ShieldCheck, Link, Award, FileText, Search, Filter, AlertOctagon, HelpCircle
} from 'lucide-react';
import { usePinnedMessages } from '../../../hooks/useDiscussion';

export default function RightSidebar({ 
  projectId,
  users,
  activeChannel,
  onOpenThread,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter
}) {
  const { data: pinnedMessages = [] } = usePinnedMessages(projectId);

  // We can filter decisions from pinned messages or show simulated decision logs
  const decisions = pinnedMessages.filter(m => m.type === 'DECISION');

  return (
    <div style={{ 
      background: 'var(--surface)', 
      borderLeft: '1px solid var(--border)', 
      display: 'flex', 
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      minHeight: 0
    }}>
      {/* Search & Filter Header */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', marginBottom: 12 }}>
          <Search size={14} color="var(--text-subtle)" style={{ marginRight: 8 }} />
          <input 
            type="text" 
            placeholder="Search discussion..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 'all', label: 'All Messages', icon: HelpCircle },
            { id: 'pinned', label: 'Pinned Messages', icon: Pin },
            { id: 'decisions', label: 'Official Decisions', icon: ShieldCheck }
          ].map(f => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(isActive ? 'all' : f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: isActive ? 'var(--blue-light)' : 'transparent',
                  color: isActive ? 'var(--blue)' : 'var(--text-subtle)',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500
                }}
              >
                <f.icon size={13} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Decision Log System */}
      <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ShieldCheck size={14} color="var(--emerald)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)' }}>OFFICIAL DECISIONS</span>
        </div>
        
        {decisions.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No converted decisions recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decisions.map(d => (
              <div key={d.id} style={{ 
                background: 'rgba(16, 185, 129, 0.04)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: 6, 
                padding: 10,
                fontSize: 11.5
              }}>
                <div style={{ fontWeight: 600, color: 'var(--emerald)', marginBottom: 2 }}>
                  {d.content.match(/\*\*OFFICIAL DECISION:\*\* (.*)/)?.[1] || 'Specification Revision'}
                </div>
                <div style={{ color: 'var(--text-subtle)', whiteSpace: 'pre-wrap', marginBottom: 4 }}>
                  {d.content.replace(/\*\*OFFICIAL DECISION:\*\* .*\n\n\*Description:\* /, '')}
                </div>
                <span style={{ display: 'block', fontSize: 9, color: 'var(--text-muted)' }}>
                  By {d.user?.name} on {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Board */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Pin size={14} color="var(--amber)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)' }}>PIN BOARD</span>
        </div>

        {pinnedMessages.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No pinned announcements.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pinnedMessages.map(p => (
              <div key={p.id} style={{ 
                background: 'var(--bg)', 
                border: '1px solid var(--border)', 
                borderRadius: 6, 
                padding: 10,
                fontSize: 11.5,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{p.user?.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>#{p.channel?.name}</span>
                </div>
                <div style={{ color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {p.content}
                </div>
                <button 
                  onClick={() => onOpenThread(p)}
                  style={{ 
                    marginTop: 6, 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--blue)', 
                    fontSize: 10, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  View Discussion
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
