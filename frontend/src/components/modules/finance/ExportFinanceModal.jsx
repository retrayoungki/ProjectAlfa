import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExportFinanceModal({ isOpen, onClose, data, periodLabel }) {
  const [format, setFormat] = useState('excel'); // excel | pdf
  const [content, setContent] = useState({
    termins: true,
    outstanding: true,
    retensi: true,
    cashflow: true,
    pajak: true
  });

  if (!isOpen || !data) return null;

  const handleCheckboxChange = (key) => {
    setContent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const applyCurrencyFormatToSheet = (ws) => {
    if (!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (cell && cell.t === 'n') {
          // Custom currency format for SheetJS
          cell.z = '"Rp"#,##0';
        }
      }
    }
  };

  const handleExport = () => {
    if (format === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Semua Tagihan / Termin
    if (content.termins && data.termins) {
      const wsData = data.termins.map(t => ({
        'Proyek': t.project_name,
        'Kode Proyek': t.project_code,
        'Client': t.client_name,
        'Termin': t.termin_label,
        'Nilai Termin': t.nilai_termin,
        'Retensi': t.retensi_amount,
        'Netto Cair': t.netto_cair,
        'Tgl Diajukan': t.submitted_date ? new Date(t.submitted_date).toLocaleDateString('id-ID') : '-',
        'Tgl Bayar': t.paid_date ? new Date(t.paid_date).toLocaleDateString('id-ID') : '-',
        'Status': t.status.toUpperCase(),
        'Jatuh Tempo': t.is_overdue ? 'YA' : 'TIDAK'
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      applyCurrencyFormatToSheet(ws);
      XLSX.utils.book_append_sheet(wb, ws, 'Semua Tagihan');
    }

    // 2. Rekap Outstanding per Client
    if (content.outstanding && data.outstanding) {
      const wsData = [];
      data.outstanding.forEach(client => {
        client.termins.forEach(t => {
          wsData.push({
            'Nama Client': client.client_name,
            'Total Outstanding Client': client.total_outstanding,
            'Proyek': t.project_name,
            'Termin': t.termin_label,
            'Netto Cair': t.netto_cair,
            'Tgl Pengajuan': t.submitted_date ? new Date(t.submitted_date).toLocaleDateString('id-ID') : '-',
            'Status': t.status.toUpperCase(),
            'Jatuh Tempo': t.is_overdue ? 'YA' : 'TIDAK'
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(wsData);
      applyCurrencyFormatToSheet(ws);
      XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Client');
    }

    // 3. Tracking Retensi
    if (content.retensi && data.retensi) {
      const wsData = data.retensi.map(r => ({
        'Proyek': r.project_name,
        'Client': r.client_name,
        'Total Retensi': r.retensi_total,
        'Sudah Cair': r.retensi_cair,
        'Sisa Retensi': r.retensi_sisa,
        'Deadline Kontrak': r.contract_end_date ? new Date(r.contract_end_date).toLocaleDateString('id-ID') : '-',
        'Estimasi Cair': r.estimasi_cair_date ? new Date(r.estimasi_cair_date).toLocaleDateString('id-ID') : '-',
        'Status': r.status_retensi.toUpperCase().replace('_', ' ')
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      applyCurrencyFormatToSheet(ws);
      XLSX.utils.book_append_sheet(wb, ws, 'Tracking Retensi');
    }

    // 4. Cash Flow Bulanan
    if (content.cashflow && data.cashflow) {
      const wsData = data.cashflow.map(c => ({
        'Bulan': c.month_label,
        'Kas Masuk (Paid)': c.kas_masuk,
        'Kas Keluar (Expenses)': c.kas_keluar,
        'Net Cashflow': c.net_cashflow
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      applyCurrencyFormatToSheet(ws);
      XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow Bulanan');
    }

    // 5. Estimasi Pajak
    if (content.pajak && data.pajak && data.pajak.per_project) {
      const wsData = data.pajak.per_project.map(p => ({
        'Proyek': p.project_name,
        'Client': p.client_name,
        'Nilai Kontrak': p.nilai_kontrak,
        'PPh Final (3.5%)': p.pph_final,
        'PPN (11%)': p.ppn,
        'PPh 23 Subkon (2%x20%)': p.pph23_subkon,
        'Total Estimasi Pajak': p.total_pajak
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      applyCurrencyFormatToSheet(ws);
      XLSX.utils.book_append_sheet(wb, ws, 'Estimasi Pajak');
    }

    // Write file
    const fileLabel = periodLabel ? periodLabel.replace(/\s+/g, '_') : 'Dashboard';
    XLSX.writeFile(wb, `Laporan_Keuangan_ProMan_${fileLabel}.xlsx`);
    onClose();
  };

  const exportToPDF = () => {
    // Dynamically build a print container
    const printContainer = document.createElement('div');
    printContainer.id = 'proman-print-portal';
    printContainer.style.fontFamily = 'Inter, sans-serif';
    printContainer.style.color = '#1e293b';
    printContainer.style.padding = '20px';

    // Style for print page
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body > * {
          display: none !important;
        }
        #proman-print-portal {
          display: block !important;
          width: 100% !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
        }
        .page-break {
          page-break-before: always;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9 !important;
          font-weight: 700;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8fafc;
        }
      }
      #proman-print-portal {
        display: none;
      }
    `;
    document.head.appendChild(style);

    // Title / Header
    let htmlContent = `
      <div style="border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 20px;">
        <h1 style="font-size: 20px; margin: 0; color: #0f172a;">REKAPITULASI LAPORAN KEUANGAN PROMAN</h1>
        <p style="font-size: 12px; margin: 4px 0 0 0; color: #475569;">Periode Laporan: <strong>${periodLabel || '-'}</strong></p>
      </div>
    `;

    // 1. Tagihan / Termins Table
    if (content.termins && data.termins) {
      htmlContent += `
        <h2 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">1. Semua Tagihan / Termin Lintas Proyek</h2>
        <table>
          <thead>
            <tr>
              <th>Proyek</th>
              <th>Client</th>
              <th>Termin</th>
              <th>Nilai Termin</th>
              <th>Retensi</th>
              <th>Netto Cair</th>
              <th>Tgl Pengajuan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.termins.map(t => `
              <tr>
                <td><strong>${t.project_name}</strong><br/><span style="color:#64748b; font-size:9px;">${t.project_code}</span></td>
                <td>${t.client_name}</td>
                <td>${t.termin_label}</td>
                <td>${formatRupiah(t.nilai_termin)}</td>
                <td style="color:#ef4444;">-${formatRupiah(t.retensi_amount)}</td>
                <td style="color:#10b981; font-weight:600;">${formatRupiah(t.netto_cair)}</td>
                <td>${t.submitted_date ? new Date(t.submitted_date).toLocaleDateString('id-ID') : '-'}</td>
                <td>${t.status.toUpperCase()} ${t.is_overdue ? '<span style="color:#ef4444; font-weight:bold;">(OVERDUE)</span>' : ''}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>${formatRupiah(data.termins.reduce((s, t) => s + t.nilai_termin, 0))}</td>
              <td>-${formatRupiah(data.termins.reduce((s, t) => s + t.retensi_amount, 0))}</td>
              <td>${formatRupiah(data.termins.reduce((s, t) => s + t.netto_cair, 0))}</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      `;
    }

    // 2. Outstanding Table
    if (content.outstanding && data.outstanding) {
      htmlContent += `
        <div class="page-break"></div>
        <h2 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">2. Rekap Outstanding per Client</h2>
        <table>
          <thead>
            <tr>
              <th>Client / Proyek</th>
              <th>Termin</th>
              <th>Netto Cair</th>
              <th>Tgl Pengajuan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.outstanding.map(client => `
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td colspan="2">${client.client_name}</td>
                <td colspan="3" style="text-align: right; color: #b45309;">Total: ${formatRupiah(client.total_outstanding)}</td>
              </tr>
              ${client.termins.map(t => `
                <tr>
                  <td style="padding-left: 20px;">${t.project_name}</td>
                  <td>${t.termin_label}</td>
                  <td>${formatRupiah(t.netto_cair)}</td>
                  <td>${t.submitted_date ? new Date(t.submitted_date).toLocaleDateString('id-ID') : '-'}</td>
                  <td>${t.status.toUpperCase()} ${t.is_overdue ? '<span style="color:#ef4444; font-weight:bold;">(OVERDUE)</span>' : ''}</td>
                </tr>
              `).join('')}
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 3. Retensi Table
    if (content.retensi && data.retensi) {
      htmlContent += `
        <div class="page-break"></div>
        <h2 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">3. Tracking Retensi Kontrak Proyek</h2>
        <table>
          <thead>
            <tr>
              <th>Proyek</th>
              <th>Client</th>
              <th>Total Retensi</th>
              <th>Sudah Cair</th>
              <th>Sisa Retensi</th>
              <th>Deadline Kontrak</th>
              <th>Estimasi Cair</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.retensi.map(r => `
              <tr>
                <td><strong>${r.project_name}</strong></td>
                <td>${r.client_name}</td>
                <td>${formatRupiah(r.retensi_total)}</td>
                <td>${formatRupiah(r.retensi_cair)}</td>
                <td style="font-weight: 600; color: ${r.retensi_sisa > 0 ? '#b45309' : '#1e293b'}">${formatRupiah(r.retensi_sisa)}</td>
                <td>${r.contract_end_date ? new Date(r.contract_end_date).toLocaleDateString('id-ID') : '-'}</td>
                <td>${r.estimasi_cair_date ? new Date(r.estimasi_cair_date).toLocaleDateString('id-ID') : '-'}</td>
                <td>${r.status_retensi.toUpperCase().replace('_', ' ')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 4. Cash Flow Table
    if (content.cashflow && data.cashflow) {
      htmlContent += `
        <h2 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">4. Cash Flow Bulanan</h2>
        <table>
          <thead>
            <tr>
              <th>Bulan</th>
              <th>Kas Masuk (Termin Paid)</th>
              <th>Kas Keluar (Realisasi Biaya)</th>
              <th>Net Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            ${data.cashflow.map(c => `
              <tr>
                <td>${c.month_label}</td>
                <td style="color: #10b981; font-weight: 600;">${formatRupiah(c.kas_masuk)}</td>
                <td style="color: #ef4444;">-${formatRupiah(c.kas_keluar)}</td>
                <td style="font-weight: 700; color: ${c.net_cashflow >= 0 ? '#10b981' : '#ef4444'}">
                  ${c.net_cashflow >= 0 ? '+' : ''}${formatRupiah(c.net_cashflow)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // 5. Pajak Table
    if (content.pajak && data.pajak && data.pajak.per_project) {
      htmlContent += `
        <div class="page-break"></div>
        <h2 style="font-size: 14px; color: #0f172a; margin-top: 24px; margin-bottom: 8px;">5. Estimasi Pajak Konstruksi Lintas Proyek</h2>
        <table>
          <thead>
            <tr>
              <th>Proyek</th>
              <th>Client</th>
              <th>Nilai Kontrak</th>
              <th>PPh Final (3.5%)</th>
              <th>PPN (11%)</th>
              <th>PPh 23 Subkon</th>
              <th>Total Pajak</th>
            </tr>
          </thead>
          <tbody>
            ${data.pajak.per_project.map(p => `
              <tr>
                <td><strong>${p.project_name}</strong></td>
                <td>${p.client_name}</td>
                <td>${formatRupiah(p.nilai_kontrak)}</td>
                <td>${formatRupiah(p.pph_final)}</td>
                <td>${formatRupiah(p.ppn)}</td>
                <td>${formatRupiah(p.pph23_subkon)}</td>
                <td style="font-weight: 600;">${formatRupiah(p.total_pajak)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td>${formatRupiah(data.pajak.per_project.reduce((s, p) => s + p.nilai_kontrak, 0))}</td>
              <td>${formatRupiah(data.pajak.totals.total_pph_final)}</td>
              <td>${formatRupiah(data.pajak.totals.total_ppn)}</td>
              <td>${formatRupiah(data.pajak.totals.total_pph23)}</td>
              <td>${formatRupiah(data.pajak.totals.grand_total_pajak)}</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    printContainer.innerHTML = htmlContent;
    document.body.appendChild(printContainer);

    // Run print dialog
    setTimeout(() => {
      window.print();
      // Clean up after print dialog finishes
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
    }, 100);

    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ width: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16.5, fontWeight: 800, color: 'var(--navy)' }}>Export Data Finance</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Format Selection */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
              PILIH FORMAT EKSPOR
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: format === 'excel' ? '2px solid var(--blue)' : '1px solid var(--border)',
                  background: format === 'excel' ? 'var(--blue-light)' : 'var(--surface)',
                  color: format === 'excel' ? 'var(--blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                <FileSpreadsheet size={16} /> Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: format === 'pdf' ? '2px solid var(--blue)' : '1px solid var(--border)',
                  background: format === 'pdf' ? 'var(--blue-light)' : 'var(--surface)',
                  color: format === 'pdf' ? 'var(--blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13
                }}
              >
                <FileText size={16} /> PDF / Cetak
              </button>
            </div>
          </div>

          {/* Content Checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
              PILIH KONTEN LAPORAN
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
              {[
                { key: 'termins', label: 'Semua Tagihan / Termin' },
                { key: 'outstanding', label: 'Rekap Outstanding per Client' },
                { key: 'retensi', label: 'Tracking Retensi Kontrak' },
                { key: 'cashflow', label: 'Cash Flow Bulanan' },
                { key: 'pajak', label: 'Estimasi Pajak Konstruksi' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={content[item.key]}
                    onChange={() => handleCheckboxChange(item.key)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Batal
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', gap: 6 }}
              onClick={handleExport}
              disabled={!Object.values(content).some(Boolean)}
            >
              <Download size={14} /> Ekspor Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
