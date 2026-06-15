import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTeamQuery } from '../../hooks/useTeam';
import { useTimesheetsQuery } from '../../hooks/useTimesheet';
import { useProjectsQuery } from '../../hooks/useProjects';
import { Mail, Building, Briefcase, ChevronLeft, Clock, Calendar, CheckSquare } from 'lucide-react';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Aktivitas'); // Aktivitas, Overview

  // Fetch Team Users
  const { data: users = [], isLoading: loadingTeam } = useTeamQuery();
  const userMember = users.find(u => u.id === id);

  // Fetch Timesheets for current week for this user
  const currentWeekStr = `${dayjs().isoWeekYear()}-W${String(dayjs().isoWeek()).padStart(2, '0')}`;
  const { data: timesheetData, isLoading: loadingTimesheet } = useTimesheetsQuery({
    user_id: id,
    week: currentWeekStr
  });

  // Fetch Projects to see project names
  const { data: projectsPayload } = useProjectsQuery();
  const projects = projectsPayload?.data || [];

  if (loadingTeam) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data anggota...</div>;
  }

  if (!userMember) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--red)' }}>Anggota tidak ditemukan</h3>
        <button className="btn btn-ghost mt-4" onClick={() => navigate('/team')}>
          <ChevronLeft size={16} /> Kembali ke Direktori
        </button>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Calculate timesheet aggregates for this week
  const totalHours = timesheetData?.kpi?.total_hours_this_week || 0;
  const projectCount = (timesheetData?.hours_per_project || []).filter(p => p.project_id !== null).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/team')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ChevronLeft size={15} /> Kembali ke Direktori
        </button>
        <h1 className="page-title" style={{ fontSize: 22, fontWeight: 800 }}>Profil Anggota Tim</h1>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Side: Profile Card */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'var(--blue)', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 
          }}>
            {getInitials(userMember.name)}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{userMember.name}</h2>
            <span className="badge badge-blue" style={{ fontSize: 11, padding: '3px 8px' }}>
              {userMember.role}
            </span>
          </div>

          <hr style={{ width: '100%', border: '0', borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-muted)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={15} /> {userMember.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building size={15} /> Department: {userMember.department}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={15} /> Bergabung {new Date(userMember.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tab Selector */}
          <div className="btn-group" style={{ display: 'flex', background: 'var(--bg-light)', padding: 3, borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'Aktivitas' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ borderRadius: 6, padding: '4px 16px', fontSize: 12.5 }} 
              onClick={() => setActiveTab('Aktivitas')}
            >
              Aktivitas
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'Overview' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ borderRadius: 6, padding: '4px 16px', fontSize: 12.5 }} 
              onClick={() => setActiveTab('Overview')}
            >
              Overview
            </button>
          </div>

          {/* Tab Content */}
          <div className="card card-pad" style={{ minHeight: 250 }}>
            {activeTab === 'Aktivitas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color="var(--blue)" /> Ringkasan Aktivitas & Timesheet
                </h3>

                {loadingTimesheet ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Memuat ringkasan jam kerja...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 14, lineHeight: '1.6' }}>
                      {userMember.name} mencatat <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{totalHours} jam</span> minggu ini di <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{projectCount} proyek</span>.
                    </div>
                    
                    <Link 
                      to={`/timesheet?user_id=${userMember.id}`} 
                      className="btn btn-primary" 
                      style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, borderRadius: 6 }}
                    >
                      Buka Detail Timesheet <ArrowRight size={14} />
                    </Link>

                    {/* Weekly project breakdown */}
                    {totalHours > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>RINCIAN PROYEK MINGGU INI:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(timesheetData?.hours_per_project || []).map((p, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: 'var(--bg-light)', padding: '8px 12px', borderRadius: 6 }}>
                              <span>{p.project_name}</span>
                              <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{p.total_hours} jam</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  Informasi Tambahan
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Akun</span>
                    <span style={{ fontWeight: 600, color: 'var(--green)' }}>Aktif / Terverifikasi</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Department</span>
                    <span style={{ fontWeight: 600 }}>{userMember.department}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Terdaftar Pada</span>
                    <span style={{ fontWeight: 600 }}>{new Date(userMember.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Inline ArrowRight representation for convenience
function ArrowRight({ size = 16, color = 'currentColor' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  );
}
