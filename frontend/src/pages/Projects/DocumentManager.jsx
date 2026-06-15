import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Folder, ChevronDown, ChevronRight, 
  Download, Eye, Trash2, FolderPlus, Upload, X, FileText
} from 'lucide-react';
import { 
  fetchProjectDocuments, deleteProjectDocument, fetchProjectFolders, 
  createProjectFolder, deleteProjectFolder, uploadProjectDocument 
} from '../../services/projectService';
import NewFolderModal from './NewFolderModal';
import UploadFileModal from './UploadFileModal';

const FOLDER_COLORS = {
  blue: { primary: '#3B82F6', light: '#EFF6FF' },
  amber: { primary: '#F59E0B', light: '#FFFBEB' },
  green: { primary: '#10B981', light: '#ECFDF5' },
  purple: { primary: '#8B5CF6', light: '#F3E8FF' },
  red: { primary: '#EF4444', light: '#FEF2F2' },
  gray: { primary: '#6B7280', light: '#F3F4F6' }
};

const FILE_TYPE_EMOJIS = {
  pdf: '📄',
  xlsx: '📊',
  xls: '📊',
  docx: '📝',
  doc: '📝',
  dwg: '📐',
  jpg: '🖼',
  jpeg: '🖼',
  png: '🖼',
  zip: '📦',
  other: '📎'
};

export default function DocumentManager({ projectId, loadProjectDetailData }) {
  const [folders, setFolders] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  // Accordion state (expanded folder IDs)
  const [expandedFolders, setExpandedFolders] = useState({});

  // Lightbox preview state
  const [previewImage, setPreviewImage] = useState(null);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load documents & folders
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await fetchProjectDocuments(projectId, {
        file_type: selectedType,
        search: searchQuery
      });
      setFolders(data.folders || []);
      setRecentFiles(data.recent_files || []);
      setAllFiles(data.files || []);
    } catch (err) {
      console.error('Failed to load project documents:', err);
      setErrorMsg(err.message || 'Gagal memuat dokumen proyek.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId, searchQuery, selectedType]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = async (folderData) => {
    try {
      await createProjectFolder(projectId, folderData);
      setIsFolderModalOpen(false);
      loadData();
      if (loadProjectDetailData) loadProjectDetailData();
    } catch (err) {
      alert(err.message || 'Gagal membuat folder.');
    }
  };

  const handleDeleteFolder = async (e, folderId, fileCount) => {
    e.stopPropagation(); // prevent expand trigger
    if (fileCount > 0) {
      alert(`Folder masih berisi ${fileCount} file. Pindahkan atau hapus file terlebih dahulu.`);
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus folder ini?')) {
      try {
        await deleteProjectFolder(projectId, folderId);
        loadData();
        if (loadProjectDetailData) loadProjectDetailData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus folder.');
      }
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    loadData();
    if (loadProjectDetailData) loadProjectDetailData();
  };

  const handleDeleteDocument = async (docId, fileName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus dokumen "${fileName}" secara permanen?`)) {
      try {
        await deleteProjectDocument(projectId, docId);
        loadData();
        if (loadProjectDetailData) loadProjectDetailData();
      } catch (err) {
        alert(err.message || 'Gagal menghapus dokumen.');
      }
    }
  };

  const formatFileSize = (sizeKb) => {
    if (!sizeKb) return '0 KB';
    if (sizeKb < 1024) {
      return `${sizeKb} KB`;
    } else {
      const sizeMb = sizeKb / 1024;
      return `${sizeMb.toFixed(1)} MB`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleFileAction = (doc, action) => {
    if (action === 'download') {
      window.open(doc.fileUrl, '_blank');
    } else if (action === 'view') {
      const isImg = ['jpg', 'jpeg', 'png'].includes(doc.fileType?.toLowerCase());
      if (doc.fileType?.toLowerCase() === 'pdf') {
        window.open(doc.fileUrl, '_blank');
      } else if (isImg) {
        setPreviewImage(doc);
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Document Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--surface)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 280 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Search size={16} /></span>
            <input
              type="text"
              placeholder="Cari file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid var(--border)',
                outline: 'none',
                background: 'var(--bg)'
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 6,
                border: '1px solid var(--border)',
                outline: 'none',
                background: 'var(--bg)',
                cursor: 'pointer'
              }}
            >
              <option value="all">Semua Tipe</option>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="word">Word</option>
              <option value="gambar">Gambar</option>
              <option value="dwg">DWG</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsFolderModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: '#f1f5f9',
              color: 'var(--navy)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={16} /> Folder Baru
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: 'var(--blue)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
            }}
          >
            <Upload size={16} /> Upload File
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-subtle)' }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Memuat berkas proyek...</p>
        </div>
      ) : errorMsg ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--red)', background: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2' }}>
          {errorMsg}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section: Folders accordion */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Folder Proyek</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {folders.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-subtle)', fontStyle: 'italic', background: 'var(--surface)' }}>
                  Belum ada folder. Klik "+ Folder Baru" untuk membuat struktur folder.
                </div>
              ) : (
                folders.map(fold => {
                  const foldColor = FOLDER_COLORS[fold.folderColor] || FOLDER_COLORS.blue;
                  const isExpanded = !!expandedFolders[fold.id];
                  const folderFiles = allFiles.filter(f => f.folderId === fold.id);

                  return (
                    <div key={fold.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                      {/* Folder Row */}
                      <div 
                        onClick={() => toggleFolder(fold.id)}
                        style={{ 
                          padding: '14px 18px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? '#f8fafc' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {isExpanded ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
                          <div 
                            style={{ 
                              background: foldColor.light, 
                              color: foldColor.primary, 
                              padding: 8, 
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Folder size={18} />
                          </div>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>{fold.folderName}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: '#f1f5f9', padding: '2px 8px', borderRadius: 10 }}>
                            {fold.fileCount} file
                          </span>
                          <button
                            onClick={(e) => handleDeleteFolder(e, fold.id, fold.fileCount)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="Hapus Folder"
                          >
                            <Trash2 size={15} style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </div>

                      {/* Folder Files Grid (Expanded) */}
                      {isExpanded && (
                        <div style={{ padding: 18, borderTop: '1px solid var(--border)', background: '#fafbfc' }}>
                          {folderFiles.length === 0 ? (
                            <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                              Folder ini kosong. Silakan upload file ke folder ini.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                              {folderFiles.map(file => {
                                const emoji = FILE_TYPE_EMOJIS[file.fileType?.toLowerCase()] || FILE_TYPE_EMOJIS.other;
                                const isImgOrPdf = ['pdf', 'jpg', 'jpeg', 'png'].includes(file.fileType?.toLowerCase());
                                return (
                                  <div 
                                    key={file.id} 
                                    style={{ 
                                      background: '#fff', 
                                      border: '1px solid var(--border)', 
                                      borderRadius: 8, 
                                      padding: 12,
                                      boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: 10
                                    }}
                                  >
                                    <div style={{ display: 'flex', gap: 10 }}>
                                      <span style={{ fontSize: 24 }} role="img" aria-label="file-type">{emoji}</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span 
                                          style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                                          title={file.fileName}
                                        >
                                          {file.fileName}
                                        </span>
                                        <span style={{ fontSize: 10.5, color: 'var(--text-subtle)', marginTop: 2 }}>
                                          {file.fileType?.toUpperCase()} &middot; {formatFileSize(file.fileSizeKb)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                        Oleh: {file.uploadedName || 'System'} pada {formatDate(file.createdAt)}
                                      </span>
                                      
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        {isImgOrPdf && (
                                          <button 
                                            onClick={() => handleFileAction(file, 'view')}
                                            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                                            title="Lihat Preview"
                                          >
                                            <Eye size={13} style={{ color: 'var(--blue)' }} />
                                          </button>
                                        )}
                                        <button 
                                          onClick={() => handleFileAction(file, 'download')}
                                          style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                                          title="Unduh Berkas"
                                        >
                                          <Download size={13} style={{ color: '#10B981' }} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteDocument(file.id, file.fileName)}
                                          style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--text-muted)' }}
                                          title="Hapus"
                                        >
                                          <Trash2 size={13} style={{ color: '#EF4444' }} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Recent Files */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Berkas Terbaru</h4>
            {recentFiles.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10, color: 'var(--text-subtle)', background: 'var(--surface)', fontStyle: 'italic' }}>
                Belum ada berkas yang diunggah.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(250px, 1fr))', gap: 16, flexWrap: 'wrap' }}>
                {recentFiles.map(file => {
                  const emoji = FILE_TYPE_EMOJIS[file.fileType?.toLowerCase()] || FILE_TYPE_EMOJIS.other;
                  const isImgOrPdf = ['pdf', 'jpg', 'jpeg', 'png'].includes(file.fileType?.toLowerCase());
                  return (
                    <div 
                      key={file.id} 
                      className="card"
                      style={{ 
                        background: 'var(--surface)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 10, 
                        padding: 16,
                        boxShadow: 'var(--shadow)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 28 }} role="img" aria-label="file-type">{emoji}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                          <span 
                            style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                            title={file.fileName}
                          >
                            {file.fileName}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                            {file.fileType?.toUpperCase()} &middot; {formatFileSize(file.fileSizeKb)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            Oleh: {file.uploadedName || 'System'}
                          </span>
                          <span style={{ fontSize: 9.5, color: 'var(--text-subtle)', marginTop: 1 }}>
                            {formatDate(file.createdAt)}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isImgOrPdf && (
                            <button 
                              onClick={() => handleFileAction(file, 'view')}
                              style={{ background: '#3B82F610', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: 'var(--blue)' }}
                              title="Lihat Preview"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleFileAction(file, 'download')}
                            style={{ background: '#10B98110', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#10B981' }}
                            title="Unduh Berkas"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDocument(file.id, file.fileName)}
                            style={{ background: '#EF444410', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', color: '#EF4444' }}
                            title="Hapus Berkas"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox / Preview modal for image files */}
      {previewImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{previewImage.fileName}</span>
            <button 
              onClick={() => setPreviewImage(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff' }}
            >
              <X size={24} />
            </button>
          </div>
          <img 
            src={previewImage.fileUrl} 
            alt={previewImage.fileName} 
            style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', border: '2px solid rgba(255,255,255,0.1)', borderRadius: 8 }} 
          />
        </div>
      )}

      {/* Folder Creation Modal */}
      {isFolderModalOpen && (
        <NewFolderModal
          onSubmit={handleCreateFolder}
          onClose={() => setIsFolderModalOpen(false)}
        />
      )}

      {/* File Upload Modal */}
      {isUploadModalOpen && (
        <UploadFileModal
          projectId={projectId}
          folders={folders}
          onSuccess={handleFileAction} // pass callback
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </div>
  );
}
