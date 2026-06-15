import React, { useState, useEffect } from 'react';
import { Project } from '../../../services/projectService';
import { useClientsQuery } from '../../../hooks/useClients';

interface ProjectFormProps {
  initialData?: Project | null;
  onSubmit: (data: Omit<Project, 'id'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ProjectForm({ initialData, onSubmit, onCancel, isSubmitting }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(0);
  const [status, setStatus] = useState<'PREPARATION' | 'DESIGN_RAB' | 'EXECUTION' | 'HAND_OVER'>('PREPARATION');

  // Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch Live Clients
  const { data: clients } = useClientsQuery();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setClientId(initialData.clientId || '');
      setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '');
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '');
      setBudget(initialData.budget);
      setStatus(initialData.status);
    } else {
      // Set default dates
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(nextMonth);
      setName('');
      setClientId('');
      setBudget(0);
      setStatus('PREPARATION');
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!endDate) {
      newErrors.endDate = 'End date is required';
    } else if (startDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date cannot be before start date';
    }

    if (budget < 0) {
      newErrors.budget = 'Budget cannot be a negative value';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      clientId: clientId.trim() || null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      budget: Number(budget),
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name Input */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Project Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: errors.name ? '1px solid #EF4444' : '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        {errors.name && <span style={{ color: '#EF4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.name}</span>}
      </div>

      {/* Client ID Input */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Client</label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
          }}
        >
          <option value="">No Client (Internal Project)</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.company} ({client.name})
            </option>
          ))}
        </select>
      </div>

      {/* Date Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: errors.startDate ? '1px solid #EF4444' : '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {errors.startDate && <span style={{ color: '#EF4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.startDate}</span>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>End Date *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: errors.endDate ? '1px solid #EF4444' : '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {errors.endDate && <span style={{ color: '#EF4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.endDate}</span>}
        </div>
      </div>

      {/* Budget & Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Budget (Rp.) *</label>
          <input
            type="text"
            value={budget === 0 ? '' : budget.toLocaleString('id-ID')}
            onChange={(e) => {
              const rawValue = e.target.value.replace(/\D/g, '');
              setBudget(rawValue ? Number(rawValue) : 0);
            }}
            placeholder="0"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: errors.budget ? '1px solid #EF4444' : '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {errors.budget && <span style={{ color: '#EF4444', fontSize: 11, marginTop: 4, display: 'block' }}>{errors.budget}</span>}
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' }}>Status *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="PREPARATION">Preparation</option>
            <option value="DESIGN_RAB">Design - RAB</option>
            <option value="EXECUTION">Execution</option>
            <option value="HAND_OVER">Hand Over</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 13 }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-sm"
          style={{ fontSize: 13 }}
        >
          {isSubmitting ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </form>
  );
}
