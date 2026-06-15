import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

// Register dayjs relativeTime plugin and set default locale to Indonesian
dayjs.extend(relativeTime);
dayjs.locale('id');

export default function ActivityLog({ logs }) {
  const getDotStyle = (actionText) => {
    const txt = (actionText || '').toLowerCase();
    if (txt.includes('done') || txt.includes('selesai') || txt.includes('m1') || txt.includes('m2')) {
      return { background: '#10B981', boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)' }; // Green
    }
    if (txt.includes('in_progress') || txt.includes('proses') || txt.includes('mulai')) {
      return { background: 'var(--blue)', boxShadow: '0 0 6px rgba(58, 123, 255, 0.4)' }; // Blue
    }
    if (txt.includes('tugas') || txt.includes('tambah') || txt.includes('dokumen') || txt.includes('upload')) {
      return { background: '#F59E0B', boxShadow: '0 0 6px rgba(245, 158, 11, 0.4)' }; // Amber
    }
    return { background: '#94A3B8' }; // Muted Gray
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {logs.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--text-subtle)', textAlign: 'center', padding: '16px 0' }}>
          Belum ada aktivitas yang tercatat.
        </p>
      ) : (
        logs.map((log, index) => {
          const dotStyle = getDotStyle(log.action);
          const relativeTimeStr = dayjs(log.createdAt).fromNow();

          return (
            <div key={log.id || index} className="activity-item">
              {/* Dynamic activity dot */}
              <div 
                className="activity-dot" 
                style={{ 
                  ...dotStyle, 
                  width: 8, 
                  height: 8, 
                  marginTop: 6 
                }} 
              />
              
              {/* Activity details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
                <p style={{ fontSize: 12.5, lineHeight: 1.4, color: 'var(--text)', margin: 0 }}>
                  <strong style={{ color: 'var(--navy)' }}>{log.userName || 'System'}</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{log.action}</span>
                </p>
                <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', fontWeight: 500 }}>
                  {relativeTimeStr}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
