import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useClientOptionsQuery } from '../../hooks/useClients';
import { useTeamQuery } from '../../hooks/useTeam';

export default function ProjectFormModal({ isOpen, type, project, onClose, onSubmit, isSubmitting }) {
  // Queries for dropdowns
  const { data: clients = [] } = useClientOptionsQuery();
  const { data: teamUsers = [] } = useTeamQuery();

  // Filter users who can be PM
  const pmUsers = React.useMemo(() => {
    return teamUsers.filter(u => u.role === 'PROJECT_MANAGER' || u.role === 'SENIOR_PROJECT_MANAGER');
  }, [teamUsers]);

  // Form States
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('store');
  const [clientId, setClientId] = useState('');
  const [location, setLocation] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [status, setStatus] = useState('preparation');

  // Opsional
  const [contractValue, setContractValue] = useState(0);
  const [contractValueDisplay, setContractValueDisplay] = useState('');
  
  const [budget, setBudget] = useState(0);
  const [budgetDisplay, setBudgetDisplay] = useState('');
  
  const [assignedPm, setAssignedPm] = useState('');

  // Error States
  const [errors, setErrors] = useState({});

  // Populate form if editing
  useEffect(() => {
    if (type === 'edit' && project) {
      setProjectName(project.projectName || project.name || '');
      setProjectType(project.projectType || 'store');
      setClientId(project.clientId || '');
      setLocation(project.location || '');
      setContractStartDate(project.contractStartDate ? project.contractStartDate.split('T')[0] : '');
      setContractEndDate(project.contractEndDate ? project.contractEndDate.split('T')[0] : '');
      setStatus(project.status || 'preparation');
      
      const val = project.contractValue || 0;
      setContractValue(val);
      setContractValueDisplay(formatNumberString(val));
      
      const bgt = project.budget || 0;
      setBudget(bgt);
      setBudgetDisplay(formatNumberString(bgt));
      
      setAssignedPm(project.assignedPm || '');
    } else {
      // Reset
      setProjectName('');
      setProjectType('store');
      setClientId('');
      setLocation('');
      setContractStartDate('');
      setContractEndDate('');
      setStatus('preparation');
      setContractValue(0);
      setContractValueDisplay('');
      setBudget(0);
      setBudgetDisplay('');
      setAssignedPm('');
    }
    setErrors({});
  }, [type, project, isOpen]);

  // Format integer as decimal dots (e.g. 1.500.000)
  const formatNumberString = (num) => {
    if (!num) return '';
    return new Intl.NumberFormat("id-ID", {
      style: "decimal",
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleCurrencyChange = (value, setVal, setDisplay) => {
    const rawValue = value.replace(/[^0-9]/g, '');
    const num = rawValue ? parseInt(rawValue, 10) : 0;
    setVal(num);
    setDisplay(formatNumberString(num));
  };

  // Validations
  const validateForm = () => {
    const newErrors = {};

    if (!projectName.trim()) newErrors.projectName = 'Nama Proyek wajib diisi';
    if (!projectType) newErrors.projectType = 'Jenis Proyek wajib diisi';
    if (!clientId) newErrors.clientId = 'Client wajib diisi';
    if (!location.trim()) newErrors.location = 'Lokasi Proyek wajib diisi';
    if (!contractStartDate) newErrors.contractStartDate = 'Tanggal SPK wajib diisi';
    if (!contractEndDate) newErrors.contractEndDate = 'Tanggal Selesai wajib diisi';
    if (!status) newErrors.status = 'Status wajib diisi';

    if (contractStartDate && contractEndDate) {
      const start = new Date(contractStartDate);
      const end = new Date(contractEndDate);
      if (end < start) {
        newErrors.contractEndDate = 'Tanggal Selesai tidak boleh sebelum Tanggal SPK';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      projectName,
      projectType,
      clientId,
      location,
      contractStartDate,
      contractEndDate,
      status,
      contractValue,
      budget,
      assignedPm: assignedPm || null
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16
      }}
    >
      <div
        className="card"
        style={{
          width: '650px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--surface)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          className="flex-between"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
            {type === 'create' ? 'Create New Project' : 'Edit Project'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Read Only Project Code */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
              KODE PROYEK
            </label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-subtle)', fontWeight: 600 }}
              value={type === 'create' ? 'PRJ-YYYY-XXX (Auto-Generated)' : project?.projectCode || ''}
              readOnly
            />
          </div>

          {/* Row 1: Nama Proyek & Jenis Proyek */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Nama Proyek *
              </label>
              <input
                type="text"
                placeholder="Masukkan nama proyek"
                className={`form-input ${errors.projectName ? 'border-red' : ''}`}
                style={{ width: '100%' }}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              {errors.projectName && (
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.projectName}</span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Jenis Proyek *
              </label>
              <select
                className="form-input"
                style={{ width: '100%', height: 38 }}
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="store">Store Ritel</option>
                <option value="mall">Mall</option>
                <option value="office">Perkantoran</option>
                <option value="renovation">Renovasi</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Row 2: Client & Lokasi */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Client *
              </label>
              <select
                className={`form-input ${errors.clientId ? 'border-red' : ''}`}
                style={{ width: '100%', height: 38 }}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Pilih Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name || c.company} ({c.short_name || c.name})</option>
                ))}
              </select>
              {errors.clientId && (
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.clientId}</span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Lokasi Proyek *
              </label>
              <input
                type="text"
                placeholder="Masukkan lokasi proyek"
                className={`form-input ${errors.location ? 'border-red' : ''}`}
                style={{ width: '100%' }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {errors.location && (
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.location}</span>
              )}
            </div>
          </div>

          {/* Row 3: Tanggal SPK & Tanggal Selesai */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Tanggal SPK / Mulai *
              </label>
              <input
                type="date"
                className={`form-input ${errors.contractStartDate ? 'border-red' : ''}`}
                style={{ width: '100%', height: 38 }}
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
              />
              {errors.contractStartDate && (
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.contractStartDate}</span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Tanggal Selesai / Deadline *
              </label>
              <input
                type="date"
                className={`form-input ${errors.contractEndDate ? 'border-red' : ''}`}
                style={{ width: '100%', height: 38 }}
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
              />
              {errors.contractEndDate && (
                <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>{errors.contractEndDate}</span>
              )}
            </div>
          </div>

          {/* Row 4: Status & PM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Status Proyek *
              </label>
              <select
                className="form-input"
                style={{ width: '100%', height: 38 }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="preparation">Preparation</option>
                <option value="execution">Execution</option>
                <option value="testing">Testing</option>
                <option value="handover">Handover</option>
                <option value="maintenance">Maintenance</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Project Manager (PM)
              </label>
              <select
                className="form-input"
                style={{ width: '100%', height: 38 }}
                value={assignedPm}
                onChange={(e) => setAssignedPm(e.target.value)}
              >
                <option value="">Pilih PM</option>
                {pmUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Nilai Kontrak & Budget RAB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Nilai Kontrak (Rp)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)' }}>Rp.</span>
                <input
                  type="text"
                  placeholder="0"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 42 }}
                  value={contractValueDisplay}
                  onChange={(e) => handleCurrencyChange(e.target.value, setContractValue, setContractValueDisplay)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                Budget RAB (Rp)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)' }}>Rp.</span>
                <input
                  type="text"
                  placeholder="0"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: 42 }}
                  value={budgetDisplay}
                  onChange={(e) => handleCurrencyChange(e.target.value, setBudget, setBudgetDisplay)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              borderTop: '1px solid var(--border)',
              paddingTop: 20,
              marginTop: 12
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
