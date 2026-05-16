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

/**
 * Project Performance Tracking Report (Progress Weekly)
 * @param {Object} options
 * @param {Object} options.project - Project object
 * @param {Array}  options.breakdown - performanceBreakdown array
 * @param {string} options.createdBy - User name
 */
export function printProjectPerformanceReport({ project, breakdown, createdBy }) {
  const now = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatCur = (val) => new Intl.NumberFormat('id-ID').format(val || 0);

  const grandTotal = breakdown.reduce((s, i) => s + (i.price || 0), 0);
  
  let rows = '';
  let totalWeekNilai = [0, 0, 0, 0, 0];
  let totalGlobalNilai = 0;
  let totalGlobalBobot = 0;

  breakdown.forEach((item, idx) => {
    const itemBobot = grandTotal > 0 ? (item.price / grandTotal) * 100 : 0;
    const wp = item.weeklyProgress || [0, 0, 0, 0, 0];
    const totalProgBobot = wp.reduce((s, v) => s + v, 0);
    const totalProgNilai = (totalProgBobot / 100) * item.price;
    const finalBobot = (totalProgBobot / 100) * (itemBobot / 100) * 100;

    totalGlobalNilai += totalProgNilai;
    totalGlobalBobot += finalBobot;

    let weekCells = '';
    wp.forEach((val, wIdx) => {
      const weekNilai = (val / 100) * item.price;
      totalWeekNilai[wIdx] += weekNilai;
      weekCells += `
        <td class="center">${val}%</td>
        <td class="number">${formatCur(weekNilai)}</td>
      `;
    });

    rows += `
      <tr>
        <td class="center">${idx + 1}</td>
        <td class="bold">${item.category}</td>
        <td class="center">${item.quantity}</td>
        <td class="number">${formatCur(item.price)}</td>
        <td class="center bold">${itemBobot.toFixed(2)}%</td>
        ${weekCells}
        <td class="center bold bg-blue">${totalProgBobot.toFixed(2)}%</td>
        <td class="number bold bg-blue">${formatCur(totalProgNilai)}</td>
        <td class="center bold bg-orange">${finalBobot.toFixed(2)}%</td>
      </tr>
    `;
  });

  const printHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Performance Report — ${project?.name || ''}</title>
  <style>
    @page { size: A3 landscape; margin: 10mm; }
    body { font-family: 'Inter', sans-serif; font-size: 9px; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { margin-bottom: 20px; border-bottom: 2px solid #00355f; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
    .company { font-size: 18px; font-weight: 900; color: #00355f; }
    .title { font-size: 12px; font-weight: 700; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
    th { background: #00355f; color: white; padding: 6px 4px; font-size: 8px; border: 1px solid #002a4d; }
    td { padding: 6px 4px; border: 1px solid #e2e8f0; font-size: 9px; }
    .center { text-align: center; }
    .number { text-align: right; font-variant-numeric: tabular-nums; }
    .bold { font-weight: 700; }
    .bg-blue { background: #eff6ff !important; }
    .bg-orange { background: #fff7ed !important; }
    .footer-row { background: #f8fafc; font-weight: 900; }
    .grand-total { font-size: 11px; color: #00355f; }
    .signature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 40px; }
    .sig-box { text-align: center; }
    .sig-line { border-top: 1px solid #00355f; margin-top: 60px; padding-top: 5px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">PROMAN CMS</div>
      <div class="title">WEEKLY PROGRESS REPORT</div>
    </div>
    <div style="text-align:right; font-size: 10px;">
      <p>Project: <strong>${project?.name || ''}</strong></p>
      <p>Code: ${project?.code || '—'}</p>
      <p>Date: ${now}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th rowspan="2" style="width:30px;">NO</th>
        <th rowspan="2">ITEM DESCRIPTION</th>
        <th rowspan="2" style="width:50px;">QTY</th>
        <th rowspan="2" style="width:80px;">PRICE</th>
        <th rowspan="2" style="width:50px;">BOBOT</th>
        <th colspan="2">WEEK 1</th>
        <th colspan="2">WEEK 2</th>
        <th colspan="2">WEEK 3</th>
        <th colspan="2">WEEK 4</th>
        <th colspan="2">WEEK 5</th>
        <th colspan="2">TOTAL PROGRES</th>
        <th rowspan="2" style="width:50px;">TOTAL BOBOT</th>
      </tr>
      <tr>
        <th style="width:40px;">BOBOT</th><th style="width:80px;">NILAI</th>
        <th style="width:40px;">BOBOT</th><th style="width:80px;">NILAI</th>
        <th style="width:40px;">BOBOT</th><th style="width:80px;">NILAI</th>
        <th style="width:40px;">BOBOT</th><th style="width:80px;">NILAI</th>
        <th style="width:40px;">BOBOT</th><th style="width:80px;">NILAI</th>
        <th style="width:45px;">BOBOT</th><th style="width:85px;">NILAI</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="footer-row grand-total">
        <td colspan="3" class="center">TOTAL:</td>
        <td class="number">${formatCur(grandTotal)}</td>
        <td class="center">100.00%</td>
        <td class="center"></td><td class="number">${formatCur(totalWeekNilai[0])}</td>
        <td class="center"></td><td class="number">${formatCur(totalWeekNilai[1])}</td>
        <td class="center"></td><td class="number">${formatCur(totalWeekNilai[2])}</td>
        <td class="center"></td><td class="number">${formatCur(totalWeekNilai[3])}</td>
        <td class="center"></td><td class="number">${formatCur(totalWeekNilai[4])}</td>
        <td class="center"></td><td class="number">${formatCur(totalGlobalNilai)}</td>
        <td class="center" style="color:red; font-size:14px;">${totalGlobalBobot.toFixed(2)}%</td>
      </tr>
    </tfoot>
  </table>

  <div class="signature-grid">
    <div class="sig-box"><div class="sig-line">Prepared By</div><div>${createdBy}</div></div>
    <div class="sig-box"><div class="sig-line">Checked By</div><div>Senior Project Manager</div></div>
    <div class="sig-box"><div class="sig-line">Approved By</div><div>Director</div></div>
  </div>
</body>
</html>`;

  const pw = window.open('', '_blank');
  pw.document.write(printHTML);
  pw.document.close();
  pw.focus();
  setTimeout(() => pw.print(), 800);
}
