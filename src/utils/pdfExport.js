/**
 * pdfExport.js
 * Generates a professional A4 landscape cost estimation report via browser print.
 * No external library required — uses the same pattern as Schedule.jsx.
 */

const formatCurrency = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

/**
 * @param {Object} options
 * @param {Object} options.project - The project object { name, code, ... }
 * @param {Array}  options.wbsData - Array of { id, category, items: [...] }
 * @param {Object} options.calculations - { baseCost, overheadCost, profitCost, taxCost, grandTotal }
 * @param {Object} options.params - { overhead, profit, tax }
 * @param {number} options.currentRevision - current revision number
 * @param {string} options.createdBy - name of user printing
 */
export function printCostEstimationReport({ project, wbsData, calculations, params, currentRevision, createdBy }) {
  const { baseCost, overheadCost, profitCost, subtotalBeforeTax, taxCost, grandTotal } = calculations;
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const revLabel = currentRevision > 0 ? `Rev ${currentRevision}` : 'Draft';

  // ─── WBS Table Rows ────────────────────────────────────────────────────────
  let wbsRows = '';
  let sectionNum = 0;

  wbsData.forEach((section) => {
    sectionNum++;
    const sectionTotal = section.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unitPrice)), 0);

    wbsRows += `
      <tr class="section-row">
        <td colspan="7" class="section-header">${sectionNum}.0 &nbsp; ${section.category}</td>
      </tr>`;

    section.items.forEach((item, idx) => {
      const subtotal = Number(item.quantity) * Number(item.unitPrice);
      wbsRows += `
        <tr>
          <td class="center">${sectionNum}.${idx + 1}</td>
          <td class="code">${item.code || '—'}</td>
          <td>${item.description || '—'}</td>
          <td class="center">${Number(item.quantity).toLocaleString('id-ID')}</td>
          <td class="center">${item.unit || '—'}</td>
          <td class="number">${formatCurrency(item.unitPrice)}</td>
          <td class="number total-col">${formatCurrency(subtotal)}</td>
        </tr>`;
    });

    wbsRows += `
      <tr class="subtotal-row">
        <td colspan="6" class="subtotal-label">Subtotal — ${section.category}</td>
        <td class="number subtotal-val">${formatCurrency(sectionTotal)}</td>
      </tr>`;
  });

  const printHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Cost Estimation — ${project?.name || ''}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 8px; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    /* Header */
    .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid #1e3a5f; }
    .company-name { font-size: 14px; font-weight: 900; color: #1e3a5f; }
    .doc-title { font-size: 10px; font-weight: 700; color: #64748b; margin-top: 2px; }
    .report-meta { text-align: right; }
    .report-meta p { font-size: 8px; color: #64748b; line-height: 1.5; }
    .report-meta .rev { font-size: 10px; font-weight: 900; color: #1e3a5f; }

    /* Project Info */
    .project-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 8px; }
    .info-card .label { font-size: 7px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-card .value { font-size: 9px; font-weight: 900; color: #1e293b; margin-top: 2px; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    th { background: #1e3a5f; color: white; font-size: 7px; font-weight: 700; text-transform: uppercase; padding: 4px 6px; letter-spacing: 0.05em; text-align: left; }
    td { padding: 3px 6px; font-size: 7.5px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .section-row td { }
    .section-header { font-size: 8px; font-weight: 900; color: #1e3a5f; background: #dbeafe !important; padding: 4px 6px; }
    .subtotal-row td { background: #f1f5f9 !important; }
    .subtotal-label { font-weight: 700; font-size: 7.5px; text-align: right; color: #475569; padding-right: 10px; }
    .subtotal-val { font-weight: 900; color: #1e3a5f; }
    .center { text-align: center; }
    .code { font-weight: 700; color: #475569; }
    .number { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .total-col { background: #f8fafc; }

    /* Summary */
    .summary-section { display: flex; justify-content: flex-end; margin-top: 6px; }
    .summary-table { width: 340px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
    .summary-table td { padding: 4px 10px; font-size: 8px; }
    .summary-table .s-label { color: #64748b; font-weight: 600; }
    .summary-table .s-val { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .grand-total-row td { background: #1e3a5f; color: white; font-size: 10px; font-weight: 900; padding: 6px 10px; }

    /* Signature */
    .signature-section { display: flex; justify-content: space-between; margin-top: 16px; }
    .sig-box { width: 30%; text-align: center; }
    .sig-line { border-top: 1px solid #1e3a5f; margin-top: 32px; margin-bottom: 4px; }
    .sig-label { font-size: 7.5px; color: #64748b; }
    .sig-name { font-size: 8px; font-weight: 700; color: #1e293b; margin-top: 2px; }

    /* Footer */
    .report-footer { margin-top: 8px; padding-top: 4px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 7px; color: #94a3b8; font-style: italic; }
    .footer-page { font-size: 7px; color: #94a3b8; }
  </style>
</head>
<body>

  <!-- Report Header -->
  <div class="report-header">
    <div>
      <div class="company-name">PROMAN</div>
      <div class="doc-title">COST ESTIMATION ENGINE — BILL OF QUANTITY (BOQ)</div>
    </div>
    <div class="report-meta">
      <p class="rev">${revLabel}</p>
      <p>Project: <strong>${project?.name || '—'}</strong></p>
      <p>Code: ${project?.code || '—'}</p>
      <p>Printed: ${now}</p>
      <p>By: ${createdBy || '—'}</p>
    </div>
  </div>

  <!-- Project Info Cards -->
  <div class="project-info">
    <div class="info-card">
      <div class="label">Project Name</div>
      <div class="value">${project?.name || '—'}</div>
    </div>
    <div class="info-card">
      <div class="label">Project Code</div>
      <div class="value">${project?.code || '—'}</div>
    </div>
    <div class="info-card">
      <div class="label">Revision</div>
      <div class="value">${revLabel}</div>
    </div>
    <div class="info-card">
      <div class="label">Print Date</div>
      <div class="value">${now}</div>
    </div>
  </div>

  <!-- WBS Table -->
  <table>
    <thead>
      <tr>
        <th style="width:30px;">No.</th>
        <th style="width:60px;">Code</th>
        <th>Description / Work Item</th>
        <th style="width:55px;" class="center">Qty</th>
        <th style="width:35px;" class="center">Unit</th>
        <th style="width:110px;" class="center">Unit Price (Rp)</th>
        <th style="width:120px;" class="center">Total (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${wbsRows}
    </tbody>
  </table>

  <!-- Financial Summary -->
  <div class="summary-section">
    <table class="summary-table">
      <tbody>
        <tr>
          <td class="s-label">Base Cost</td>
          <td class="s-val">${formatCurrency(baseCost)}</td>
        </tr>
        <tr>
          <td class="s-label">Overhead (${params.overhead}%)</td>
          <td class="s-val">${formatCurrency(overheadCost)}</td>
        </tr>
        <tr>
          <td class="s-label">Profit (${params.profit}%)</td>
          <td class="s-val">${formatCurrency(profitCost)}</td>
        </tr>
        <tr>
          <td class="s-label">Subtotal Before Tax</td>
          <td class="s-val">${formatCurrency(subtotalBeforeTax)}</td>
        </tr>
        <tr>
          <td class="s-label">VAT/PPN (${params.tax}%)</td>
          <td class="s-val">${formatCurrency(taxCost)}</td>
        </tr>
        <tr class="grand-total-row">
          <td>GRAND TOTAL</td>
          <td style="text-align:right;">${formatCurrency(grandTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Signatures -->
  <div class="signature-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Prepared By</div>
      <div class="sig-name">${createdBy || '( __________ )'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Checked By</div>
      <div class="sig-name">Senior Project Manager</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Approved By</div>
      <div class="sig-name">Director</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <span class="footer-note">* This document is computer-generated. All values are estimates and subject to change upon formal approval.</span>
    <span class="footer-page">PROMAN — Cost Estimation Engine</span>
  </div>

</body>
</html>`;

  const pw = window.open('', '_blank');
  if (!pw) { alert('Popup diblokir browser. Izinkan popup untuk halaman ini.'); return; }
  pw.document.write(printHTML);
  pw.document.close();
  pw.focus();
  setTimeout(() => pw.print(), 700);
}
