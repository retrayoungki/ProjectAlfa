const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// EXPENSES
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { category, amount, date, projectId } = req.body;
    if (!category || amount === undefined || !projectId) {
      return res.status(400).json({ error: 'category, amount, and projectId are required' });
    }
    const expense = await prisma.expense.create({
      data: {
        category,
        amount: Number(amount),
        date: date ? new Date(date) : undefined,
        projectId
      }
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// INVOICES
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({ 
      orderBy: { date: 'desc' },
      include: {
        client: true,
        items: true
      }
    });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { 
      invoiceNumber, clientId, projectId, scopeOfWork, date, dueDate, 
      currency, paymentTerms, subtotal, taxRate, taxAmount, discount, 
      totalAmount, status, attachmentUrl, items 
    } = req.body;

    if (totalAmount === undefined || !projectId) {
      return res.status(400).json({ error: 'totalAmount and projectId are required' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: clientId || null,
        projectId,
        scopeOfWork,
        date: date ? new Date(date) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        currency: currency || "IDR",
        paymentTerms,
        subtotal: Number(subtotal) || 0,
        taxRate: Number(taxRate) || 0,
        taxAmount: Number(taxAmount) || 0,
        discount: Number(discount) || 0,
        totalAmount: Number(totalAmount),
        status: status || 'DRAFT',
        attachmentUrl,
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            description: item.description,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total)
          }))
        } : undefined
      },
      include: { items: true, client: true }
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status }
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.invoice.delete({ where: { id } });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// CENTRALIZED FINANCE CONTROLLERS
// ==========================================

const isSuperAdmin = (user) => user && user.role === 'ADMIN';
const isPM = (user) => user && ['PROJECT_MANAGER', 'SENIOR_PROJECT_MANAGER'].includes(user.role);
const isFinance = (user) => user && (user.role === 'FINANCE' || user.role === 'finance' || user.department === 'FINANCE' || user.department === 'finance');

const checkFinanceReadAccess = (user) => {
  return isSuperAdmin(user) || isPM(user) || isFinance(user);
};

const checkFinanceWriteAccess = async (projectId, user) => {
  if (isSuperAdmin(user)) return true;
  
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  if (project && project.assignedPm === user.id) return true;
  
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      roleInProject: { in: ['pm', 'finance'] }
    }
  });
  return !!member;
};

// Helper to format Indonesian Dates
const formatDateIndo = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// 1. GET /api/finance/summary
exports.getFinanceSummary = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    let { period } = req.query;
    const now = new Date();
    
    // Default to current month if not specified
    if (!period) {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      period = `${year}-${month}`;
    }

    let startDate, endDate, periodLabel;
    
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [yearStr, monthStr] = period.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      const monthsIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      periodLabel = `${monthsIndo[month - 1]} ${year}`;
    } else if (/^\d{4}-Q[1-4]$/.test(period)) {
      const [yearStr, qStr] = period.split('-');
      const year = parseInt(yearStr);
      const q = parseInt(qStr.substring(1));
      if (q === 1) {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 2, 31, 23, 59, 59, 999);
      } else if (q === 2) {
        startDate = new Date(year, 3, 1);
        endDate = new Date(year, 5, 30, 23, 59, 59, 999);
      } else if (q === 3) {
        startDate = new Date(year, 6, 1);
        endDate = new Date(year, 8, 30, 23, 59, 59, 999);
      } else {
        startDate = new Date(year, 9, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      }
      periodLabel = `Q${q} ${year}`;
    } else if (/^\d{4}$/.test(period)) {
      const year = parseInt(period);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      periodLabel = `${year}`;
    } else {
      return res.status(400).json({ error: 'Format periode tidak valid. Gunakan YYYY-MM, YYYY-Q[1-4], atau YYYY.' });
    }

    // Load projects
    const projects = await prisma.project.findMany({
      where: { deletedAt: null }
    });

    // Load all termins
    const termins = await prisma.projectTermin.findMany({
      where: {
        project: { deletedAt: null }
      }
    });

    // Load expenses for period budgeting used
    const periodExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        project: { deletedAt: null }
      }
    });

    // Calculations
    const total_contract_value = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
    const total_budget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    
    // total_paid is from termin paidDate inside the period
    const total_paid = termins
      .filter(t => t.status === 'paid' && t.paidDate && new Date(t.paidDate) >= startDate && new Date(t.paidDate) <= endDate)
      .reduce((sum, t) => sum + (t.nettoCair || 0), 0);

    // total_outstanding is all unpaid termins all-time (cumulative outstanding)
    const total_outstanding = termins
      .filter(t => t.status !== 'paid')
      .reduce((sum, t) => sum + (t.nettoCair || 0), 0);

    const total_retensi = projects.reduce((sum, p) => sum + (p.retensiTotal || 0), 0);
    const total_retensi_cair = projects.reduce((sum, p) => sum + (p.retensiCair || 0), 0);

    // realisasi biaya in this period is the sum of expenses in the period
    const total_budget_used = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const posisi_cashflow = total_paid - total_budget_used;

    // Generate alerts
    const alerts = [];
    const overdueThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const t of termins) {
      if (['submitted', 'approved'].includes(t.status) && t.submittedDate && new Date(t.submittedDate) < overdueThreshold) {
        const project = projects.find(p => p.id === t.projectId);
        const daysOverdue = Math.floor((now - new Date(t.submittedDate)) / (1000 * 60 * 60 * 24));
        alerts.push({
          type: 'overdue',
          severity: 'critical',
          message: `Termin "${t.terminLabel || `Termin ${t.terminNumber}`}" terlambat ${daysOverdue} hari tanpa pembayaran`,
          project_id: t.projectId,
          project_name: project ? project.projectName : 'Unknown Project'
        });
      }
    }

    for (const p of projects) {
      const retTotal = p.retensiTotal || 0;
      const retCair = p.retensiCair || 0;
      const retSisa = retTotal - retCair;

      if (retSisa > 0 && p.contractEndDate) {
        const estCair = new Date(p.contractEndDate);
        estCair.setDate(estCair.getDate() + 180);
        if (estCair < now) {
          alerts.push({
            type: 'retensi_ready',
            severity: 'warning',
            message: `Retensi proyek "${p.projectName}" siap dicairkan (sejak ${formatDateIndo(estCair)})`,
            project_id: p.id,
            project_name: p.projectName
          });
        }
      }

      const budget = p.budget || 0;
      const budgetUsed = p.budgetUsed || 0;
      if (budget > 0 && budgetUsed > budget * 0.95) {
        const severity = budgetUsed > budget ? 'critical' : 'warning';
        alerts.push({
          type: 'over_budget',
          severity,
          message: `Realisasi biaya proyek "${p.projectName}" telah mencapai ${((budgetUsed / budget) * 100).toFixed(0)}% dari budget`,
          project_id: p.id,
          project_name: p.projectName
        });
      }
    }

    res.json({
      summary: {
        total_contract_value,
        total_paid,
        total_outstanding,
        total_retensi,
        total_retensi_cair,
        total_budget,
        total_budget_used,
        posisi_cashflow,
        period_label: periodLabel
      },
      alerts
    });
  } catch (error) {
    console.error('Error fetching finance summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. GET /api/finance/termins
exports.getFinanceTermins = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const { status, project_id, client_id, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;

    // Build conditions
    const whereConditions = {
      project: { deletedAt: null }
    };

    if (status) {
      whereConditions.status = status.toLowerCase();
    }
    if (project_id) {
      whereConditions.projectId = project_id;
    }
    if (client_id) {
      whereConditions.project = {
        ...whereConditions.project,
        clientId: client_id
      };
    }

    // Load matching termins with joins
    let allMatching = await prisma.projectTermin.findMany({
      where: whereConditions,
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    // Search filter in memory to match complex items
    if (search) {
      const q = search.toLowerCase();
      allMatching = allMatching.filter(t => {
        const pName = (t.project?.projectName || '').toLowerCase();
        const pCode = (t.project?.projectCode || '').toLowerCase();
        const cName = (t.project?.client?.companyName || t.project?.clientName || '').toLowerCase();
        const tLabel = (t.terminLabel || '').toLowerCase();
        return pName.includes(q) || pCode.includes(q) || cName.includes(q) || tLabel.includes(q);
      });
    }

    // Map `is_overdue` and format totals
    const today = new Date();
    const overdueThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    let total_nilai = 0;
    let total_retensi = 0;
    let total_netto = 0;

    const count_by_status = { draft: 0, submitted: 0, approved: 0, paid: 0 };

    const formattedTermins = allMatching.map(t => {
      const is_overdue = ['submitted', 'approved'].includes(t.status) && t.submittedDate && new Date(t.submittedDate) < overdueThreshold;
      
      total_nilai += t.nilaiTermin || 0;
      total_retensi += t.retensiAmount || 0;
      total_netto += t.nettoCair || 0;

      const s = t.status.toLowerCase();
      if (s in count_by_status) {
        count_by_status[s]++;
      }

      return {
        id: t.id,
        termin_number: t.terminNumber,
        termin_label: t.terminLabel,
        nilai_termin: t.nilaiTermin,
        retensi_amount: t.retensiAmount,
        netto_cair: t.nettoCair,
        submitted_date: t.submittedDate,
        approved_date: t.approvedDate,
        paid_date: t.paidDate,
        status: t.status,
        is_overdue,
        project_id: t.projectId,
        project_name: t.project?.projectName || 'Unknown Project',
        project_code: t.project?.projectCode || '',
        client_id: t.project?.client?.id || null,
        client_name: t.project?.client?.companyName || t.project?.clientName || 'No Client'
      };
    });

    // Sort termins: overdue first, then submitted/approved, then draft, then paid.
    // Within each group, sort by submittedDate ASC (oldest first). If submittedDate is null, sort by createdAt/id.
    formattedTermins.sort((a, b) => {
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;

      const getStatusPriority = (statusVal) => {
        const s = statusVal.toLowerCase();
        if (s === 'submitted' || s === 'approved') return 3;
        if (s === 'draft') return 2;
        if (s === 'paid') return 1;
        return 0;
      };

      const prioA = getStatusPriority(a.status);
      const prioB = getStatusPriority(b.status);

      if (prioA !== prioB) return prioB - prioA;

      const dateA = a.submitted_date ? new Date(a.submitted_date) : new Date(0);
      const dateB = b.submitted_date ? new Date(b.submitted_date) : new Date(0);
      return dateA - dateB;
    });

    // Paginate in memory
    const total = formattedTermins.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedTermins = formattedTermins.slice((page - 1) * limit, page * limit);

    res.json({
      termins: paginatedTermins,
      totals: {
        total_nilai,
        total_retensi,
        total_netto,
        count_by_status
      },
      pagination: {
        page,
        totalPages,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching finance termins:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3. GET /api/finance/outstanding
exports.getFinanceOutstanding = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // Unpaid termins (status != paid)
    const unpaidTermins = await prisma.projectTermin.findMany({
      where: {
        status: { not: 'paid' },
        project: { deletedAt: null }
      },
      include: {
        project: {
          include: {
            client: true
          }
        }
      }
    });

    const clientMap = {};
    const today = new Date();
    const overdueThreshold = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const t of unpaidTermins) {
      const client = t.project?.client;
      const clientId = client?.id || 'unassigned';
      const clientName = client?.companyName || t.project?.clientName || 'No Client';

      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          client_id: clientId,
          client_name: clientName,
          total_outstanding: 0,
          termins: []
        };
      }

      const is_overdue = ['submitted', 'approved'].includes(t.status) && t.submittedDate && new Date(t.submittedDate) < overdueThreshold;

      clientMap[clientId].termins.push({
        project_name: t.project?.projectName || 'Unknown Project',
        termin_label: t.terminLabel || `Termin ${t.terminNumber}`,
        netto_cair: t.nettoCair || 0,
        submitted_date: t.submittedDate,
        status: t.status,
        is_overdue
      });

      clientMap[clientId].total_outstanding += t.nettoCair || 0;
    }

    const result = Object.values(clientMap).sort((a, b) => b.total_outstanding - a.total_outstanding);
    res.json(result);
  } catch (error) {
    console.error('Error fetching outstanding finances:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. GET /api/finance/retensi
exports.getFinanceRetensi = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true }
    });

    const today = new Date();

    const retensiList = projects.map(p => {
      const retensi_total = p.retensiTotal || 0;
      const retensi_cair = p.retensiCair || 0;
      const retensi_sisa = Math.max(0, retensi_total - retensi_cair);
      
      let estimasi_cair_date = null;
      if (p.contractEndDate) {
        estimasi_cair_date = new Date(p.contractEndDate);
        estimasi_cair_date.setDate(estimasi_cair_date.getDate() + 180);
      }

      let status_retensi = 'belum_cair';
      if (retensi_total > 0 && retensi_sisa <= 0) {
        status_retensi = 'sudah_cair';
      } else if (estimasi_cair_date && estimasi_cair_date <= today && retensi_sisa > 0) {
        status_retensi = 'siap_cair';
      }

      return {
        project_id: p.id,
        project_name: p.projectName,
        client_name: p.client?.companyName || p.clientName || 'No Client',
        retensi_total,
        retensi_cair,
        retensi_sisa,
        contract_end_date: p.contractEndDate,
        estimasi_cair_date,
        status_retensi
      };
    });

    res.json(retensiList);
  } catch (error) {
    console.error('Error fetching retensi list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. GET /api/finance/cashflow
exports.getFinanceCashflow = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const paidTermins = await prisma.projectTermin.findMany({
      where: {
        status: 'paid',
        paidDate: {
          gte: startDate,
          lte: endDate
        },
        project: { deletedAt: null }
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        },
        project: { deletedAt: null }
      }
    });

    const monthLabels = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const cashflow = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      month_label: monthLabels[i],
      kas_masuk: 0,
      kas_keluar: 0,
      net_cashflow: 0
    }));

    for (const t of paidTermins) {
      if (t.paidDate) {
        const m = new Date(t.paidDate).getMonth();
        cashflow[m].kas_masuk += t.nettoCair || 0;
      }
    }

    for (const e of expenses) {
      if (e.date) {
        const m = new Date(e.date).getMonth();
        cashflow[m].kas_keluar += e.amount || 0;
      }
    }

    for (const item of cashflow) {
      item.net_cashflow = item.kas_masuk - item.kas_keluar;
    }

    res.json(cashflow);
  } catch (error) {
    console.error('Error fetching cashflow details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 6. GET /api/finance/pajak
exports.getFinancePajak = async (req, res) => {
  try {
    if (!checkFinanceReadAccess(req.user)) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { client: true }
    });

    let total_pph_final = 0;
    let total_ppn = 0;
    let total_pph23 = 0;
    let grand_total_pajak = 0;

    const per_project = projects.map(p => {
      const contractVal = p.contractValue || 0;
      const pph_final = 0.035 * contractVal;
      const ppn = 0.11 * contractVal;
      const pph23_subkon = 0.02 * 0.20 * contractVal;
      const total_pajak = pph_final + ppn + pph23_subkon;

      total_pph_final += pph_final;
      total_ppn += ppn;
      total_pph23 += pph23_subkon;
      grand_total_pajak += total_pajak;

      return {
        project_id: p.id,
        project_name: p.projectName,
        client_name: p.client?.companyName || p.clientName || 'No Client',
        nilai_kontrak: contractVal,
        pph_final,
        ppn,
        pph23_subkon,
        total_pajak
      };
    });

    res.json({
      per_project,
      totals: {
        total_pph_final,
        total_ppn,
        total_pph23,
        grand_total_pajak
      }
    });
  } catch (error) {
    console.error('Error calculating tax estimations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 7. PATCH /api/finance/termins/:terminId/status
exports.updateFinanceTerminStatus = async (req, res) => {
  try {
    const { terminId } = req.params;
    const { status, paid_date } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const termin = await prisma.projectTermin.findUnique({
      where: { id: terminId },
      include: { project: true }
    });

    if (!termin) {
      return res.status(404).json({ error: 'Termin tidak ditemukan' });
    }

    const projectId = termin.projectId;

    // Permission check for status update: super_admin or finance
    const isAuthorized = isSuperAdmin(req.user) || isFinance(req.user) || await prisma.projectMember.findFirst({
      where: { projectId, userId: req.user.id, roleInProject: 'finance' }
    });

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only admin or project finance user can update termin status' });
    }

    // Validate transition path: draft -> submitted -> approved -> paid (cannot go backward)
    const statusOrder = { draft: 1, submitted: 2, approved: 3, paid: 4 };
    const currentOrder = statusOrder[termin.status.toLowerCase()] || 0;
    const nextOrder = statusOrder[status.toLowerCase()] || 0;

    if (nextOrder === 0) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    if (nextOrder < currentOrder) {
      return res.status(400).json({ error: `Tidak dapat menurunkan status dari ${termin.status} ke ${status}` });
    }

    const dataToUpdate = { status: status.toLowerCase() };
    if (status.toLowerCase() === 'approved' && !termin.approvedDate) {
      dataToUpdate.approvedDate = new Date();
    }
    if (status.toLowerCase() === 'paid') {
      dataToUpdate.paidDate = paid_date ? new Date(paid_date) : new Date();
    }

    const updatedTermin = await prisma.projectTermin.update({
      where: { id: terminId },
      data: dataToUpdate
    });

    // Recalculate retensiTotal in projects
    const allTermins = await prisma.projectTermin.findMany({
      where: { projectId }
    });
    const retensiTotal = allTermins.reduce((sum, t) => sum + (t.retensiAmount || 0), 0);
    
    await prisma.project.update({
      where: { id: projectId },
      data: { retensiTotal }
    });

    // Log action to project activity logs
    await prisma.projectActivityLog.create({
      data: {
        projectId,
        userId: req.user.id,
        userName: req.user.name,
        action: `mengubah status termin "${termin.terminLabel || `Termin ${termin.terminNumber}`}" dari ${termin.status} ke ${status}`
      }
    });

    res.json(updatedTermin);
  } catch (error) {
    console.error('Error updating finance termin status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

