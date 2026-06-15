import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { uploadProjectDocument } from '../../services/projectService';

const ALLOWED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.dwg', '.jpg', '.jpeg', '.png', '.zip'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function UploadFileModal({ projectId, folders, onUploadSuccess, onClose }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [targetFolder, setTargetFolder] = useState('');
  const [description, setDescription] = useState('');
  
  // Upload status states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileIndex, setUploadingFileIndex] = useState(-1);
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadError('');

    if (files.length > 10) {
      setUploadError('Maksimal 10 file yang dapat diupload sekaligus.');
      return;
    }

    const validFiles = [];
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setUploadError(`Berkas "${file.name}" tidak diperbolehkan. Tipe file yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Ukuran berkas "${file.name}" melebihi 50 MB.`);
        return;
      }
      validFiles.push(file);
    }

    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadError('Silakan pilih minimal 1 file.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // Upload files sequentially to show individual progress
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadingFileIndex(i);
        setUploadProgress(10); // start initial progress

        // Simulate progress bar smooth transition while uploading
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 85) return prev;
            return prev + 15;
          });
        }, 100);

        const formData = new FormData();
        formData.append('file', file);
        if (targetFolder) formData.append('folder_id', targetFolder);
        if (description) formData.append('description', description);

        // Actual upload fetch call
        await uploadProjectDocument(projectId, formData);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300)); // smooth pause
      }

      // Success callback
      onUploadSuccess();
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Gagal mengunggah berkas.');
      setIsUploading(false);
    }
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
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: 24
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Upload File Proyek</h3>
          {!isUploading && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Upload Error Alert */}
        {uploadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 16 }}>
            {uploadError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* File Picker Area */}
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 10,
              padding: '24px 16px',
              textAlign: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              background: '#f8fafc',
              hover: { background: '#f1f5f9' },
              transition: 'background 0.2s'
            }}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            <div style={{ color: 'var(--blue)', display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Upload size={28} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', display: 'block' }}>
              {selectedFiles.length > 0 ? `${selectedFiles.length} berkas dipilih` : 'Klik untuk memilih file'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, display: 'block' }}>
              Format diizinkan: PDF, Excel, Word, Gambar, DWG, ZIP (Maks. 50 MB, maks. 10 file)
            </span>
          </div>

          {/* Selected Files List preview */}
          {selectedFiles.length > 0 && !isUploading && (
            <div style={{ maxHeight: 100, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: '#f8fafc' }}>
              {selectedFiles.map((f, i) => (
                <div key={i} style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', color: 'var(--text)' }}>
                  <FileText size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({(f.size / (1024*1024)).toFixed(2)} MB)</span>
                </div>
              ))}
            </div>
          )}

          {/* Folder Destination Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Folder Tujuan</label>
            <select
              value={targetFolder}
              onChange={(e) => setTargetFolder(e.target.value)}
              disabled={isUploading}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                cursor: isUploading ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">Akar Proyek (Tanpa Folder)</option>
              {folders.map(fold => (
                <option key={fold.id} value={fold.id}>{fold.folderName}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Deskripsi Berkas (Opsional)</label>
            <input
              type="text"
              placeholder="Tambahkan catatan singkat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              style={{
                padding: '10px 14px',
                fontSize: 13.5,
                borderRadius: 8,
                border: '1px solid var(--border)',
                outline: 'none',
                background: '#fff',
                cursor: isUploading ? 'not-allowed' : 'text'
              }}
            />
          </div>

          {/* Upload Progress Bar Section */}
          {isUploading && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                <span>Mengunggah file {uploadingFileIndex + 1} dari {selectedFiles.length}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--blue)', transition: 'width 0.15s ease-out' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginTop: 4 }}>
                {selectedFiles[uploadingFileIndex]?.name}
              </span>
            </div>
          )}

          {/* Actions */}
          {!isUploading && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 8 }}
              >
                Mulai Upload
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
