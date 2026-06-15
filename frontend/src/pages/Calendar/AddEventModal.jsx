import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddEventModal({ event, projects = [], onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [projectId, setProjectId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      // Edit Mode
      setTitle(event.title || '');
      setEventType(event.meta?.event_type || event.eventType || 'meeting');
      setProjectId(event.project_id || event.projectId || '');
      setEventDate(event.date || '');
      setEventTime(event.meta?.event_time || event.eventTime || '');
      setEndDate(event.end_date || event.endDate || '');
      setDescription(event.meta?.description || event.description || '');
    } else {
      // Create Mode
      setTitle('');
      setEventType('meeting');
      setProjectId('');
      
      // Default date to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setEventDate(`${yyyy}-${mm}-${dd}`);
      
      setEventTime('');
      setEndDate('');
      setDescription('');
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Judul event wajib diisi!');
      return;
    }
    if (!eventDate) {
      alert('Tanggal event wajib diisi!');
      return;
    }

    const payload = {
      project_id: projectId || null,
      title: title.trim(),
      description: description.trim() || null,
      event_type: eventType,
      event_date: eventDate,
      event_time: eventTime || null,
      end_date: endDate || null
    };

    onSubmit(payload);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1070,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            {event ? 'Edit Event Manual' : 'Tambah Event Baru'}
          </h3>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24, overflowY: 'auto', maxHeight: '80vh' }}>
          
          {/* Judul Event */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Judul Event *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Rapat Koordinasi Mingguan..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%'
              }}
            />
          </div>

          {/* Row 1: Tipe Event & Proyek Terkait */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Tipe Event *</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="meeting">Rapat</option>
                <option value="site_visit">Site Visit</option>
                <option value="inspection">Inspeksi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Proyek Terkait</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  padding: '10px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tidak ada proyek (General)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_code || 'PRJ'} • {p.project_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Tanggal & Waktu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Tanggal Mulai *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{
                  padding: '9px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  width: '100%'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Waktu Kegiatan</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                style={{
                  padding: '9px 14px',
                  fontSize: 13.5,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  outline: 'none',
                  background: '#fff',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Row 3: Tanggal Selesai (Opsional untuk multi-hari) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Tanggal Selesai (Opsional)</label>
            <input
              type="date"
              value={endDate}
              min={eventDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '9px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%'
              }}
            />
          </div>

          {/* Deskripsi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Deskripsi / Catatan</label>
            <textarea
              placeholder="Tambahkan detail kegiatan atau catatan rapat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                width: '100%',
                height: 80,
                resize: 'none',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
              Simpan Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
