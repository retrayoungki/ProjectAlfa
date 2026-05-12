import * as XLSX from 'xlsx';

export const exportToExcel = (items) => {
  const ws = XLSX.utils.json_to_sheet(items.map(item => ({
    Code: item.code,
    Category: item.category,
    Description: item.description,
    Unit: item.unit,
    UnitPrice: item.unitPrice,
    Status: item.status,
    Notes: item.notes,
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AHSP Library');
  XLSX.writeFile(wb, `AHSP_Library_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const parseExcelImport = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to our DB schema
        const mappedItems = json.map(row => ({
          code: String(row.Code || row.code || ''),
          category: String(row.Category || row.category || 'General'),
          description: String(row.Description || row.description || ''),
          unit: String(row.Unit || row.unit || 'Ls'),
          unitPrice: Number(row['Unit Price'] || row.UnitPrice || row.price || row.unitPrice) || 0,
          status: String(row.Status || row.status || 'Active'),
          notes: String(row.Notes || row.notes || ''),
          materials: [],
          labor: [],
          equipment: [],
        })).filter(item => item.code && item.description);

        resolve(mappedItems);
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Make sure it matches the required format.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading failed.'));
    reader.readAsArrayBuffer(file);
  });
};

export const printAHSPReport = (items, createdBy) => {
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatCurrency = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  let rows = '';
  items.forEach((item, idx) => {
    rows += `
      <tr>
        <td class="center">${idx + 1}</td>
        <td class="code">${item.code || '—'}</td>
        <td>${item.category || '—'}</td>
        <td>${item.description || '—'}</td>
        <td class="center">${item.unit || '—'}</td>
        <td class="number">${formatCurrency(item.unitPrice)}</td>
        <td class="center">${item.status}</td>
      </tr>`;
  });

  const printHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>AHSP Library Report</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 8px; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #1e3a5f; }
    .company-name { font-size: 14px; font-weight: 900; color: #1e3a5f; }
    .doc-title { font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px; }
    .report-meta { text-align: right; }
    .report-meta p { font-size: 8px; color: #64748b; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    th { background: #1e3a5f; color: white; font-size: 7px; font-weight: 700; text-transform: uppercase; padding: 4px 6px; letter-spacing: 0.05em; text-align: left; }
    td { padding: 4px 6px; font-size: 7.5px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .center { text-align: center; }
    .code { font-weight: 700; color: #475569; }
    .number { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .footer-note { margin-top: 8px; font-size: 7px; color: #94a3b8; font-style: italic; }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="company-name">PROMAN</div>
      <div class="doc-title">AHSP MASTER LIBRARY</div>
    </div>
    <div class="report-meta">
      <p>Printed: ${now}</p>
      <p>By: ${createdBy || '—'}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:30px;">No.</th>
        <th style="width:80px;">Code</th>
        <th style="width:100px;">Category</th>
        <th>Description</th>
        <th style="width:40px;" class="center">Unit</th>
        <th style="width:90px;" class="center">Unit Price (Rp)</th>
        <th style="width:60px;" class="center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer-note">* This document is computer-generated from the live AHSP database.</div>
</body>
</html>`;

  const pw = window.open('', '_blank');
  if (!pw) { alert('Popup blocked. Allow popups for this site.'); return; }
  pw.document.write(printHTML);
  pw.document.close();
  pw.focus();
  setTimeout(() => pw.print(), 700);
};
