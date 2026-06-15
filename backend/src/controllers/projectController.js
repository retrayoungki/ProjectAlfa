const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all projects (paginated, filtered, search)
exports.getAllProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Filters
    const whereClause = {
      deletedAt: null // Exclude soft-deleted records
    };

    if (status && status !== 'All') {
      whereClause.status = status.toLowerCase();
    }

    if (search) {
      whereClause.OR = [
        {
          projectName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          clientName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Fetch projects and total count
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc'
        },
        skip: skipNum,
        take: limitNum,
        include: {
          client: true,
          assignedUser: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }),
      prisma.project.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: projects,
      total,
      page: pageNum,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to fetch projects' });
  }
};

// 2. Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        client: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        tasks: true,
        expenses: true,
        invoices: true,
        documents: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to fetch project details' });
  }
};

// 3. Create project (with auto code generation)
exports.createProject = async (req, res) => {
  try {
    const {
      projectName,
      clientId,
      status,
      contractEndDate,
      contractStartDate,
      contractValue,
      budget,
      budgetUsed,
      location,
      projectType,
      assignedPm
    } = req.body;

    // Validation
    if (!projectName || !clientId || !status || !contractEndDate) {
      return res.status(400).json({ 
        error: 'Field project_name, client_id, status, and contract_end_date are required' 
      });
    }

    // Resolve clientName
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return res.status(400).json({ error: 'Client not found with the provided client_id' });
    }

    // Auto-generate project_code: PRJ-{YYYY}-{3-digit seq}
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const count = await prisma.project.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear
        }
      }
    });

    const nextSeq = String(count + 1).padStart(3, '0');
    const projectCode = `PRJ-${year}-${nextSeq}`;

    // Create the project
    const newProject = await prisma.project.create({
      data: {
        projectCode,
        projectName,
        clientId,
        clientName: client.company || client.name,
        status: status.toLowerCase(),
        contractValue: contractValue ? parseFloat(contractValue) : 0,
        budget: budget ? parseFloat(budget) : 0,
        budgetUsed: budgetUsed ? parseFloat(budgetUsed) : 0,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: new Date(contractEndDate),
        actualStartDate: req.body.actualStartDate ? new Date(req.body.actualStartDate) : null,
        location: location || null,
        projectType: projectType || null,
        assignedPm: assignedPm || null
      },
      include: {
        client: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to create project' });
  }
};

// 4. Update project (partial update)
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Find existing
    const existingProject = await prisma.project.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Resolve new clientName if clientId is changing
    if (updateData.clientId && updateData.clientId !== existingProject.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: updateData.clientId }
      });
      if (client) {
        updateData.clientName = client.company || client.name;
      }
    }

    // Format dates and floats if provided
    const dataToUpdate = {};
    if (updateData.projectName !== undefined) dataToUpdate.projectName = updateData.projectName;
    if (updateData.clientId !== undefined) dataToUpdate.clientId = updateData.clientId;
    if (updateData.clientName !== undefined) dataToUpdate.clientName = updateData.clientName;
    if (updateData.status !== undefined) dataToUpdate.status = updateData.status.toLowerCase();
    if (updateData.contractValue !== undefined) dataToUpdate.contractValue = parseFloat(updateData.contractValue) || 0;
    if (updateData.budget !== undefined) dataToUpdate.budget = parseFloat(updateData.budget) || 0;
    if (updateData.budgetUsed !== undefined) dataToUpdate.budgetUsed = parseFloat(updateData.budgetUsed) || 0;
    if (updateData.contractStartDate !== undefined) dataToUpdate.contractStartDate = updateData.contractStartDate ? new Date(updateData.contractStartDate) : null;
    if (updateData.contractEndDate !== undefined) dataToUpdate.contractEndDate = updateData.contractEndDate ? new Date(updateData.contractEndDate) : null;
    if (updateData.actualStartDate !== undefined) dataToUpdate.actualStartDate = updateData.actualStartDate ? new Date(updateData.actualStartDate) : null;
    if (updateData.location !== undefined) dataToUpdate.location = updateData.location;
    if (updateData.projectType !== undefined) dataToUpdate.projectType = updateData.projectType;
    if (updateData.assignedPm !== undefined) dataToUpdate.assignedPm = updateData.assignedPm;
    if (updateData.totalTasks !== undefined) dataToUpdate.totalTasks = parseInt(updateData.totalTasks, 10) || 0;
    if (updateData.completedTasks !== undefined) dataToUpdate.completedTasks = parseInt(updateData.completedTasks, 10) || 0;

    dataToUpdate.updatedAt = new Date();

    const updatedProject = await prisma.project.update({
      where: { id },
      data: dataToUpdate,
      include: {
        client: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to update project' });
  }
};

// 5. Delete project (soft delete)
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Perform Soft Delete
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Proyek berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to delete project' });
  }
};

// ── Helper to check if user is PM of project or Super Admin (ADMIN)
const checkPMOrAdmin = async (projectId, user) => {
  if (user.role === 'ADMIN') return true;
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  return project && project.assignedPm === user.id;
};

// 6. Get complete project detail + relations + quick stats
exports.getProjectDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        client: true,
        assignedUser: {
          select: { id: true, name: true, email: true, role: true }
        },
        milestones: {
          orderBy: { sortOrder: 'asc' }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Quick Stats Calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = project.contractEndDate ? new Date(project.contractEndDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);

    const sisa_hari = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const progress_fisik = project.progressActual || 0.0;
    const deviasi_progress = (project.progressActual || 0.0) - (project.progressPlan || 0.0);

    res.json({
      ...project,
      stats: {
        sisa_hari,
        progress_fisik,
        deviasi_progress
      }
    });
  } catch (error) {
    console.error('Error fetching project detail:', error);
    res.status(500).json({ error: 'Internal Server Error: Failed to fetch project details' });
  }
};

// 7. Get project members
exports.getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(members);
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 8. Add project member
exports.addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role_in_project } = req.body;

    if (!user_id || !role_in_project) {
      return res.status(400).json({ error: 'user_id and role_in_project are required' });
    }

    // Check Permissions (Admin or PM)
    const isAuthorized = await checkPMOrAdmin(id, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only admin or project PM can add members' });
    }

    // Check Duplicate
    const duplicate = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: user_id
        }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'This user is already a member of this project' });
    }

    // Add Member
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: user_id,
        roleInProject: role_in_project.toLowerCase()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan anggota tim baru: ${newMember.user.name} sebagai ${role_in_project}`
      }
    });

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding project member:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 9. Delete project member
exports.deleteProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check Permissions (Admin or PM)
    const isAuthorized = await checkPMOrAdmin(id, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only admin or project PM can remove members' });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId
        }
      },
      include: {
        user: true
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in this project' });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId: userId
        }
      }
    });

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus anggota tim: ${member.user.name}`
      }
    });

    res.json({ message: 'Anggota tim berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting project member:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 10. Get project milestones
exports.getProjectMilestones = async (req, res) => {
  try {
    const { id } = req.params;
    const milestones = await prisma.projectMilestone.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(milestones);
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 11. Add project milestone
exports.addProjectMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { milestone_name, target_date, sort_order } = req.body;

    if (!milestone_name) {
      return res.status(400).json({ error: 'milestone_name is required' });
    }

    // Check Permissions (Admin or PM)
    const isAuthorized = await checkPMOrAdmin(id, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only admin or project PM can add milestones' });
    }

    const newMilestone = await prisma.projectMilestone.create({
      data: {
        projectId: id,
        milestoneName: milestone_name,
        targetDate: target_date ? new Date(target_date) : null,
        sortOrder: sort_order ? parseInt(sort_order, 10) : 0,
        status: 'pending'
      }
    });

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan milestone baru: ${milestone_name}`
      }
    });

    res.status(201).json(newMilestone);
  } catch (error) {
    console.error('Error adding project milestone:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 12. Update project milestone status
exports.updateProjectMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    // Check Permissions (Admin or PM)
    const isAuthorized = await checkPMOrAdmin(id, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only admin or project PM can update milestones' });
    }

    const milestone = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId: id }
    });

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found in this project' });
    }

    const dataToUpdate = { status: status.toLowerCase() };
    if (status.toLowerCase() === 'done') {
      dataToUpdate.actualDate = new Date();
    } else {
      dataToUpdate.actualDate = null;
    }

    const updatedMilestone = await prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: dataToUpdate
    });

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `mengubah status milestone "${milestone.milestoneName}" ke ${status}`
      }
    });

    res.json(updatedMilestone);
  } catch (error) {
    console.error('Error updating project milestone:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 13. Helper: Check if user is Admin, project PM, or project Finance member
const checkFinanceWriteAccess = async (projectId, user) => {
  if (user.role === 'ADMIN') return true;
  
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

// 14. Get complete project finance summary and list of termins
exports.getProjectFinance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        termins: {
          orderBy: { terminNumber: 'asc' }
        }
      }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const termins = project.termins || [];
    
    // Summary calculations
    const nilai_kontrak = project.contractValue || 0;
    const budget_rab = project.budget || 0;
    const budget_used = project.budgetUsed || 0;
    const sisa_anggaran = budget_rab - budget_used;
    const pct_budget_used = budget_rab > 0 ? (budget_used / budget_rab) * 100 : 0;
    
    const total_tertagih = termins
      .filter(t => ['paid', 'approved'].includes(t.status))
      .reduce((sum, t) => sum + t.nilaiTermin, 0);
      
    const total_paid = termins
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.nettoCair || 0), 0);
      
    const retensi_total = project.retensiTotal || 0;
    const retensi_cair = project.retensiCair || 0;
    
    const cash_in = total_paid + retensi_cair;
    const cash_out = budget_used;
    const posisi_cashflow = cash_in - cash_out;
    
    // Tax estimates
    const pph_final = 0.035 * nilai_kontrak;
    const ppn = 0.11 * nilai_kontrak;
    const pph23_subkon = 0.02 * (0.20 * nilai_kontrak);
    const total_pajak = pph_final + ppn + pph23_subkon;
    
    res.json({
      summary: {
        nilai_kontrak,
        budget_rab,
        budget_used,
        sisa_anggaran,
        pct_budget_used,
        total_tertagih,
        total_paid,
        retensi_total,
        retensi_cair,
        cash_in,
        cash_out,
        posisi_cashflow
      },
      termins,
      pajak: {
        pph_final,
        ppn,
        pph23_subkon,
        total_pajak
      }
    });
  } catch (error) {
    console.error('Error fetching project finance:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 15. Add new project termin
exports.addProjectTermin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      termin_number,
      termin_label,
      percentage,
      nilai_termin,
      retensi_pct,
      submitted_date,
      notes
    } = req.body;
    
    const hasAccess = await checkFinanceWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage finance data' });
    }
    
    const nilaiTerminFloat = parseFloat(nilai_termin);
    if (isNaN(nilaiTerminFloat) || nilaiTerminFloat <= 0) {
      return res.status(400).json({ error: 'Nilai termin wajib diisi dan harus lebih dari 0' });
    }
    
    const terminNum = parseInt(termin_number, 10);
    if (isNaN(terminNum) || terminNum <= 0) {
      return res.status(400).json({ error: 'Nomor termin wajib diisi dan harus berupa angka positif' });
    }
    
    // Check duplication
    const duplicate = await prisma.projectTermin.findUnique({
      where: {
        projectId_terminNumber: {
          projectId: id,
          terminNumber: terminNum
        }
      }
    });
    if (duplicate) {
      return res.status(400).json({ error: `Termin nomor ${terminNum} sudah terdaftar` });
    }
    
    // Check percentage limit (<= 100%)
    const existingTermins = await prisma.projectTermin.findMany({
      where: { projectId: id }
    });
    const totalPercentage = existingTermins.reduce((sum, t) => sum + (t.percentage || 0), 0) + (parseFloat(percentage) || 0);
    if (totalPercentage > 100.01) {
      return res.status(400).json({ error: 'Total persentase termin melebihi 100%' });
    }
    
    const retPct = retensi_pct !== undefined ? parseFloat(retensi_pct) : 5.0;
    const retAmount = nilaiTerminFloat * (retPct / 100);
    const netCair = nilaiTerminFloat - retAmount;
    
    const newTermin = await prisma.projectTermin.create({
      data: {
        projectId: id,
        terminNumber: terminNum,
        terminLabel: termin_label || `Termin ${terminNum}`,
        percentage: parseFloat(percentage) || null,
        nilaiTermin: nilaiTerminFloat,
        retensiPct: retPct,
        retensiAmount: retAmount,
        nettoCair: netCair,
        submittedDate: submitted_date ? new Date(submitted_date) : null,
        status: 'draft',
        notes: notes || null
      }
    });
    
    // Recalculate retensi_total in projects
    const allTermins = await prisma.projectTermin.findMany({
      where: { projectId: id }
    });
    const retensiTotal = allTermins.reduce((sum, t) => sum + (t.retensiAmount || 0), 0);
    await prisma.project.update({
      where: { id },
      data: { retensiTotal }
    });
    
    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan draft termin baru: ${newTermin.terminLabel} sebesar Rp ${new Intl.NumberFormat('id-ID').format(nilaiTerminFloat)}`
      }
    });
    
    res.status(201).json(newTermin);
  } catch (error) {
    console.error('Error adding project termin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 16. Update project termin details & status
exports.updateProjectTermin = async (req, res) => {
  try {
    const { id, terminId } = req.params;
    const updateData = { ...req.body };
    
    const hasAccess = await checkFinanceWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage finance data' });
    }
    
    const termin = await prisma.projectTermin.findFirst({
      where: { id: terminId, projectId: id }
    });
    if (!termin) {
      return res.status(404).json({ error: 'Termin tidak ditemukan' });
    }
    
    const dataToUpdate = {};
    if (updateData.termin_label !== undefined) dataToUpdate.terminLabel = updateData.termin_label;
    if (updateData.percentage !== undefined) dataToUpdate.percentage = parseFloat(updateData.percentage) || null;
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
    
    if (updateData.submitted_date !== undefined) {
      dataToUpdate.submittedDate = updateData.submitted_date ? new Date(updateData.submitted_date) : null;
    }
    if (updateData.approved_date !== undefined) {
      dataToUpdate.approvedDate = updateData.approved_date ? new Date(updateData.approved_date) : null;
    }
    if (updateData.paid_date !== undefined) {
      dataToUpdate.paidDate = updateData.paid_date ? new Date(updateData.paid_date) : null;
    }
    
    // Re-calculate calculations if nilai_termin or retensi_pct changes
    let nilaiTerminFloat = termin.nilaiTermin;
    if (updateData.nilai_termin !== undefined) {
      nilaiTerminFloat = parseFloat(updateData.nilai_termin);
      if (isNaN(nilaiTerminFloat) || nilaiTerminFloat <= 0) {
        return res.status(400).json({ error: 'Nilai termin harus lebih besar dari 0' });
      }
      dataToUpdate.nilaiTermin = nilaiTerminFloat;
    }
    
    let retPct = termin.retensiPct;
    if (updateData.retensi_pct !== undefined) {
      retPct = parseFloat(updateData.retensi_pct);
      dataToUpdate.retensiPct = retPct;
    }
    
    if (updateData.nilai_termin !== undefined || updateData.retensi_pct !== undefined) {
      const retAmount = nilaiTerminFloat * (retPct / 100);
      dataToUpdate.retensiAmount = retAmount;
      dataToUpdate.nettoCair = nilaiTerminFloat - retAmount;
    }
    
    // Status transition auto date setting
    if (updateData.status !== undefined) {
      const oldStatus = termin.status;
      const nextStatus = updateData.status.toLowerCase();
      dataToUpdate.status = nextStatus;
      
      if (nextStatus === 'approved' && oldStatus !== 'approved' && !termin.approvedDate && !dataToUpdate.approvedDate) {
        dataToUpdate.approvedDate = new Date();
      }
      if (nextStatus === 'paid' && oldStatus !== 'paid' && !termin.paidDate && !dataToUpdate.paidDate) {
        dataToUpdate.paidDate = new Date();
      }
    }
    
    const updatedTermin = await prisma.projectTermin.update({
      where: { id: terminId },
      data: dataToUpdate
    });
    
    // Recalculate retensi_total in projects
    const allTermins = await prisma.projectTermin.findMany({
      where: { projectId: id }
    });
    const retensiTotal = allTermins.reduce((sum, t) => sum + (t.retensiAmount || 0), 0);
    await prisma.project.update({
      where: { id },
      data: { retensiTotal }
    });
    
    // Log action
    let logMsg = `memperbarui termin: ${updatedTermin.terminLabel}`;
    if (updateData.status !== undefined && updateData.status.toLowerCase() !== termin.status) {
      logMsg = `mengubah status termin "${updatedTermin.terminLabel}" ke ${updatedTermin.status}`;
    }
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: logMsg
      }
    });
    
    res.json(updatedTermin);
  } catch (error) {
    console.error('Error updating project termin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 17. Delete project termin (only if draft)
exports.deleteProjectTermin = async (req, res) => {
  try {
    const { id, terminId } = req.params;
    
    const hasAccess = await checkFinanceWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage finance data' });
    }
    
    const termin = await prisma.projectTermin.findFirst({
      where: { id: terminId, projectId: id }
    });
    if (!termin) {
      return res.status(404).json({ error: 'Termin tidak ditemukan' });
    }
    
    if (termin.status !== 'draft') {
      return res.status(400).json({ error: 'Hanya termin berstatus draft yang dapat dihapus' });
    }
    
    await prisma.projectTermin.delete({
      where: { id: terminId }
    });
    
    // Recalculate retensi_total in projects
    const allTermins = await prisma.projectTermin.findMany({
      where: { projectId: id }
    });
    const retensiTotal = allTermins.reduce((sum, t) => sum + (t.retensiAmount || 0), 0);
    await prisma.project.update({
      where: { id },
      data: { retensiTotal }
    });
    
    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus termin: ${termin.terminLabel}`
      }
    });
    
    res.json({ message: 'Termin berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting project termin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 18. Record retensi cair
exports.recordRetensiCair = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date } = req.body;
    
    const hasAccess = await checkFinanceWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage finance data' });
    }
    
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < 0) {
      return res.status(400).json({ error: 'Jumlah retensi cair harus berupa angka positif' });
    }
    
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null }
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project retensi_cair
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        retensiCair: amountFloat
      }
    });
    
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountFloat);
    const formattedDate = date ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    
    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `mencatat pencairan retensi sebesar ${formattedAmount} pada tanggal ${formattedDate}`
      }
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error recording retensi cair:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// STEP 4: PROJECT PROGRESS CONTROLLERS
// ==========================================

// Helper: check write permission for project progress
const checkProgressWriteAccess = async (projectId, user) => {
  if (user.role === 'ADMIN') return true;
  
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  if (project && project.assignedPm === user.id) return true;
  
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      roleInProject: { in: ['pm', 'site_manager'] }
    }
  });
  return !!member;
};

// Helper: rebuild progressPlan, progressActual, and scurveData summary on Project
const rebuildProjectProgressAndScurve = async (projectId) => {
  const divisions = await prisma.projectDivision.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' }
  });

  const weeklyReports = await prisma.projectWeeklyProgress.findMany({
    where: { projectId },
    orderBy: { weekNumber: 'asc' },
    include: {
      details: true
    }
  });

  const scurveDataList = [];
  let finalPlan = 0;
  let finalActual = 0;

  for (const w of weeklyReports) {
    let weekTotalPlan = 0;
    let weekTotalActual = 0;

    for (const det of w.details) {
      const div = divisions.find(d => d.id === det.divisionId);
      const bobot = div ? div.bobot : 0;
      weekTotalPlan += (bobot * (det.progressPlan || 0)) / 100;
      weekTotalActual += (bobot * (det.progressActual || 0)) / 100;
    }

    weekTotalPlan = Math.round(weekTotalPlan * 100) / 100;
    weekTotalActual = Math.round(weekTotalActual * 100) / 100;

    scurveDataList.push({
      week: w.weekNumber,
      week_label: w.weekLabel || `Minggu ${w.weekNumber}`,
      plan: weekTotalPlan,
      actual: weekTotalActual
    });
  }

  if (scurveDataList.length > 0) {
    finalPlan = scurveDataList[scurveDataList.length - 1].plan;
    finalActual = scurveDataList[scurveDataList.length - 1].actual;
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      progressPlan: finalPlan,
      progressActual: finalActual,
      scurveData: JSON.stringify(scurveDataList)
    }
  });

  return { finalPlan, finalActual, scurveDataList };
};

// 19. Get Project Progress overview and statistics
exports.getProjectProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const divisions = await prisma.projectDivision.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' }
    });

    const weeklyProgressList = await prisma.projectWeeklyProgress.findMany({
      where: { projectId: id },
      orderBy: { weekNumber: 'asc' },
      include: {
        details: true
      }
    });

    // S-curve data parsing
    let scurveData = [];
    if (project.scurveData) {
      try {
        scurveData = JSON.parse(project.scurveData);
      } catch (e) {
        scurveData = [];
      }
    }

    if (scurveData.length === 0 && weeklyProgressList.length > 0) {
      scurveData = weeklyProgressList.map(w => {
        let planTotal = 0;
        let actualTotal = 0;
        w.details.forEach(det => {
          const div = divisions.find(d => d.id === det.divisionId);
          const bobot = div ? div.bobot : 0;
          planTotal += (bobot * det.progressPlan) / 100;
          actualTotal += (bobot * det.progressActual) / 100;
        });
        return {
          week: w.weekNumber,
          week_label: w.weekLabel || `Minggu ${w.weekNumber}`,
          plan: Math.round(planTotal * 100) / 100,
          actual: Math.round(actualTotal * 100) / 100
        };
      });
    }

    const latestWeek = weeklyProgressList.length > 0 
      ? weeklyProgressList[weeklyProgressList.length - 1] 
      : null;
    const prevWeek = weeklyProgressList.length > 1 
      ? weeklyProgressList[weeklyProgressList.length - 2] 
      : null;

    // KPI Calculations
    const plan = project.progressPlan || 0;
    const actual = project.progressActual || 0;
    const spi = plan > 0 ? (actual / plan) : 1.0;
    
    let spiStatus = 'ontrack';
    if (spi < 0.90) {
      spiStatus = 'critical';
    } else if (spi < 1.0) {
      spiStatus = 'warning';
    }

    const today = new Date();
    const endDate = project.contractEndDate ? new Date(project.contractEndDate) : null;
    let remainingDays = 0;
    if (endDate && endDate > today) {
      remainingDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    }

    // EAC Finish Date based on average daily speed
    const startDate = project.actualStartDate ? new Date(project.actualStartDate) : (project.contractStartDate ? new Date(project.contractStartDate) : null);
    let eacFinishDate = null;
    if (startDate && latestWeek && actual > 0) {
      const elapsedMs = new Date(latestWeek.periodEnd).getTime() - startDate.getTime();
      const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
      if (elapsedDays > 0) {
        const dailySpeed = actual / elapsedDays;
        if (dailySpeed > 0) {
          const remainingProgress = 100 - actual;
          const remainingDaysNeeded = remainingProgress / dailySpeed;
          const eacTime = new Date(latestWeek.periodEnd).getTime() + (remainingDaysNeeded * 24 * 60 * 60 * 1000);
          eacFinishDate = new Date(eacTime);
        }
      }
    }

    // Weekly actual progress trend
    let weeklyTrend = 0;
    if (latestWeek) {
      let latestActualSum = 0;
      latestWeek.details.forEach(det => {
        const div = divisions.find(d => d.id === det.divisionId);
        const bobot = div ? div.bobot : 0;
        latestActualSum += (bobot * det.progressActual) / 100;
      });
      
      let prevActualSum = 0;
      if (prevWeek) {
        prevWeek.details.forEach(det => {
          const div = divisions.find(d => d.id === det.divisionId);
          const bobot = div ? div.bobot : 0;
          prevActualSum += (bobot * det.progressActual) / 100;
        });
      }
      weeklyTrend = latestActualSum - prevActualSum;
    }

    // Latest progress per division
    const divisionProgressList = divisions.map(div => {
      const detail = latestWeek 
        ? latestWeek.details.find(d => d.divisionId === div.id)
        : null;
      const planVal = detail ? detail.progressPlan : 0;
      const actualVal = detail ? detail.progressActual : 0;
      return {
        id: div.id,
        divisionName: div.divisionName,
        bobot: div.bobot,
        plan: planVal,
        actual: actualVal,
        deviasi: actualVal - planVal,
        weightedPlan: Math.round(((div.bobot * planVal) / 100) * 100) / 100,
        weightedActual: Math.round(((div.bobot * actualVal) / 100) * 100) / 100
      };
    });

    res.json({
      project: {
        id: project.id,
        projectCode: project.projectCode,
        projectName: project.projectName,
        progressPlan: plan,
        progressActual: actual,
        contractStartDate: project.contractStartDate,
        contractEndDate: project.contractEndDate,
        actualStartDate: project.actualStartDate
      },
      kpi: {
        progressPlan: plan,
        progressActual: actual,
        deviasiTotal: actual - plan,
        spi,
        spiStatus,
        remainingDays,
        eacFinishDate,
        weeklyTrend
      },
      scurve: scurveData,
      divisions: divisionProgressList,
      history: weeklyProgressList.map(w => ({
        id: w.id,
        weekNumber: w.weekNumber,
        weekLabel: w.weekLabel,
        periodStart: w.periodStart,
        periodEnd: w.periodEnd,
        notes: w.notes,
        createdAt: w.createdAt,
        reportedBy: w.reportedBy
      }))
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 20. Get detail of a specific weekly report
exports.getWeeklyReportDetail = async (req, res) => {
  try {
    const { id, weekId } = req.params;
    const weeklyReport = await prisma.projectWeeklyProgress.findFirst({
      where: { id: weekId, projectId: id },
      include: {
        details: {
          include: {
            division: true
          }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    });

    if (!weeklyReport) {
      return res.status(404).json({ error: 'Laporan mingguan tidak ditemukan' });
    }

    res.json(weeklyReport);
  } catch (error) {
    console.error('Error fetching weekly report detail:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 21. Create a new weekly progress report
exports.createWeeklyReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hasAccess = await checkProgressWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage progress data' });
    }

    let { weekNumber, periodStart, periodEnd, notes, details } = req.body;

    if (!periodStart || !periodEnd || !details || !Array.isArray(details)) {
      return res.status(400).json({ error: 'Field periodStart, periodEnd, and details are required' });
    }

    if (!weekNumber) {
      const maxWeek = await prisma.projectWeeklyProgress.aggregate({
        where: { projectId: id },
        _max: { weekNumber: true }
      });
      weekNumber = (maxWeek._max.weekNumber || 0) + 1;
    }

    const existingWeek = await prisma.projectWeeklyProgress.findFirst({
      where: { projectId: id, weekNumber }
    });
    if (existingWeek) {
      return res.status(400).json({ error: `Laporan Mingguan ke-${weekNumber} sudah ada` });
    }

    const weeklyReport = await prisma.projectWeeklyProgress.create({
      data: {
        projectId: id,
        weekNumber,
        weekLabel: `Minggu ${weekNumber}`,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        reportedBy: req.user.id,
        notes: notes || null
      }
    });

    for (const d of details) {
      await prisma.projectProgressDetail.create({
        data: {
          weeklyProgressId: weeklyReport.id,
          projectId: id,
          divisionId: d.divisionId,
          progressPlan: parseFloat(d.progressPlan) || 0,
          progressActual: parseFloat(d.progressActual) || 0
        }
      });
    }

    await rebuildProjectProgressAndScurve(id);

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan Laporan Mingguan ke-${weekNumber} periode ${new Date(periodStart).toLocaleDateString('id-ID')} s/d ${new Date(periodEnd).toLocaleDateString('id-ID')}`
      }
    });

    res.status(201).json(weeklyReport);
  } catch (error) {
    console.error('Error creating weekly report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 22. Update an existing weekly progress report
exports.updateWeeklyReport = async (req, res) => {
  try {
    const { id, weekId } = req.params;

    const hasAccess = await checkProgressWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage progress data' });
    }

    const { periodStart, periodEnd, notes, details } = req.body;

    const weeklyReport = await prisma.projectWeeklyProgress.findFirst({
      where: { id: weekId, projectId: id }
    });

    if (!weeklyReport) {
      return res.status(404).json({ error: 'Laporan mingguan tidak ditemukan' });
    }

    const updateData = {};
    if (periodStart) updateData.periodStart = new Date(periodStart);
    if (periodEnd) updateData.periodEnd = new Date(periodEnd);
    if (notes !== undefined) updateData.notes = notes;

    await prisma.projectWeeklyProgress.update({
      where: { id: weekId },
      data: updateData
    });

    if (details && Array.isArray(details)) {
      for (const d of details) {
        const existingDetail = await prisma.projectProgressDetail.findFirst({
          where: { weeklyProgressId: weekId, divisionId: d.divisionId }
        });

        if (existingDetail) {
          await prisma.projectProgressDetail.update({
            where: { id: existingDetail.id },
            data: {
              progressPlan: parseFloat(d.progressPlan) || 0,
              progressActual: parseFloat(d.progressActual) || 0
            }
          });
        } else {
          await prisma.projectProgressDetail.create({
            data: {
              weeklyProgressId: weekId,
              projectId: id,
              divisionId: d.divisionId,
              progressPlan: parseFloat(d.progressPlan) || 0,
              progressActual: parseFloat(d.progressActual) || 0
            }
          });
        }
      }
    }

    await rebuildProjectProgressAndScurve(id);

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `mengubah rincian Laporan Mingguan ke-${weeklyReport.weekNumber}`
      }
    });

    res.json({ message: 'Laporan mingguan berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating weekly report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 23. Delete the latest weekly progress report
exports.deleteWeeklyReport = async (req, res) => {
  try {
    const { id, weekId } = req.params;

    const hasAccess = await checkProgressWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage progress data' });
    }

    const weeklyReport = await prisma.projectWeeklyProgress.findFirst({
      where: { id: weekId, projectId: id }
    });

    if (!weeklyReport) {
      return res.status(404).json({ error: 'Laporan mingguan tidak ditemukan' });
    }

    const maxWeek = await prisma.projectWeeklyProgress.aggregate({
      where: { projectId: id },
      _max: { weekNumber: true }
    });

    if (weeklyReport.weekNumber !== maxWeek._max.weekNumber) {
      return res.status(400).json({ error: 'Hanya laporan minggu terakhir yang boleh dihapus' });
    }

    await prisma.projectWeeklyProgress.delete({
      where: { id: weekId }
    });

    await rebuildProjectProgressAndScurve(id);

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus Laporan Mingguan ke-${weeklyReport.weekNumber}`
      }
    });

    res.json({ message: 'Laporan mingguan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting weekly report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 24. Get all project divisions
exports.getProjectDivisions = async (req, res) => {
  try {
    const { id } = req.params;
    const divisions = await prisma.projectDivision.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 25. Create a new project division
exports.createProjectDivision = async (req, res) => {
  try {
    const { id } = req.params;

    const hasAccess = await checkProgressWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage progress data' });
    }

    const { divisionName, bobot, sortOrder } = req.body;
    if (!divisionName || bobot === undefined) {
      return res.status(400).json({ error: 'Field divisionName and bobot are required' });
    }

    const bobotFloat = parseFloat(bobot) || 0;

    const existingDivisions = await prisma.projectDivision.findMany({
      where: { projectId: id }
    });
    const totalBobot = existingDivisions.reduce((sum, d) => sum + d.bobot, 0);

    if (totalBobot + bobotFloat > 100.01) {
      return res.status(400).json({ error: `Total bobot melebihi 100% (saat ini ${totalBobot}%, ditambah ${bobotFloat}% menjadi ${totalBobot + bobotFloat}%)` });
    }

    const division = await prisma.projectDivision.create({
      data: {
        projectId: id,
        divisionName,
        bobot: bobotFloat,
        sortOrder: parseInt(sortOrder) || 0
      }
    });

    // Log action
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan divisi pekerjaan baru: ${divisionName} dengan bobot ${bobotFloat}%`
      }
    });

    res.status(201).json(division);
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 26. Update a project division
exports.updateProjectDivision = async (req, res) => {
  try {
    const { id, divisionId } = req.params;
    const { divisionName, bobot, sortOrder } = req.body;

    const hasAccess = await checkProgressWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to manage progress data' });
    }

    const division = await prisma.projectDivision.findFirst({
      where: { id: divisionId, projectId: id }
    });

    if (!division) {
      return res.status(404).json({ error: 'Divisi tidak ditemukan' });
    }

    const dataToUpdate = {};
    if (divisionName !== undefined) dataToUpdate.divisionName = divisionName;
    if (sortOrder !== undefined) dataToUpdate.sortOrder = parseInt(sortOrder) || 0;

    if (bobot !== undefined) {
      const bobotFloat = parseFloat(bobot) || 0;
      
      const otherDivisions = await prisma.projectDivision.findMany({
        where: { projectId: id, NOT: { id: divisionId } }
      });
      const totalBobotOthers = otherDivisions.reduce((sum, d) => sum + d.bobot, 0);

      if (totalBobotOthers + bobotFloat > 100.01) {
        return res.status(400).json({ error: `Total bobot melebihi 100% (divisi lain ${totalBobotOthers}%, ditambah ${bobotFloat}% menjadi ${totalBobotOthers + bobotFloat}%)` });
      }
      dataToUpdate.bobot = bobotFloat;
    }

    const updatedDivision = await prisma.projectDivision.update({
      where: { id: divisionId },
      data: dataToUpdate
    });

    if (bobot !== undefined) {
      await rebuildProjectProgressAndScurve(id);
    }

    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `mengubah divisi pekerjaan: ${division.divisionName}`
      }
    });

    res.json(updatedDivision);
  } catch (error) {
    console.error('Error updating project division:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// STEP 5: TASKS & DOKUMEN IMPLEMENTATION
// ==========================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helpers for permission checks
const checkTaskWriteAccess = async (projectId, user) => {
  if (user.role === 'ADMIN') return true;
  
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  if (project && project.assignedPm === user.id) return true;
  
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      roleInProject: { in: ['pm', 'site_manager'] }
    }
  });
  return !!member;
};

const checkDocumentUploadAccess = async (projectId, user) => {
  if (user.role === 'ADMIN') return true;
  
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  if (project && project.assignedPm === user.id) return true;
  
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id
    }
  });
  return !!member;
};

const checkDocumentDeleteAccess = async (projectId, documentId, user) => {
  if (user.role === 'ADMIN') return true;
  
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null }
  });
  if (project && project.assignedPm === user.id) return true;
  
  const document = await prisma.projectDocument.findUnique({
    where: { id: documentId }
  });
  if (!document) return false;
  
  if (document.uploadedBy === user.id) return true;
  
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId: user.id,
      roleInProject: 'pm'
    }
  });
  return !!member;
};

// Multer storage configuration for project documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id;
    const uploadPath = path.join(__dirname, '../../uploads', projectId);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const cleanFileName = file.originalname.replace(/\s+/g, '_');
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    cb(null, `${timestamp}_${cleanFileName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.dwg', '.jpg', '.jpeg', '.png', '.zip'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe file ${ext} tidak diperbolehkan.`));
    }
  }
});

// Middleware for single file upload
exports.uploadDocumentMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// === TASKS ===

// 1. Get Project Tasks with filters and summary
exports.getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, division, search } = req.query;

    const whereClause = { projectId: id };

    if (status && status.toLowerCase() !== 'all') {
      whereClause.status = status.toLowerCase();
    }
    if (division && division.toLowerCase() !== 'all') {
      whereClause.division = division.toLowerCase();
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tasks = await prisma.projectTask.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    // Calculate dynamic summary stats
    const allProjectTasks = await prisma.projectTask.findMany({
      where: { projectId: id }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todo = 0, in_progress = 0, review = 0, done = 0, overdue = 0;
    allProjectTasks.forEach(t => {
      if (t.status === 'todo') todo++;
      else if (t.status === 'in_progress') in_progress++;
      else if (t.status === 'review') review++;
      else if (t.status === 'done') done++;

      if (t.status !== 'done' && t.dueDate) {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          overdue++;
        }
      }
    });

    res.json({
      tasks,
      summary: {
        total: allProjectTasks.length,
        todo,
        in_progress,
        review,
        done,
        overdue
      }
    });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Create Project Task
exports.createProjectTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, division, priority, assigned_to, due_date, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Judul task wajib diisi.' });
    }

    const hasAccess = await checkTaskWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk menambah task.' });
    }

    // Resolve assignee name
    let assignedName = null;
    if (assigned_to) {
      const userObj = await prisma.user.findUnique({ where: { id: assigned_to } });
      if (userObj) assignedName = userObj.name;
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: id,
        title,
        description: description || null,
        division: division ? division.toLowerCase() : 'other',
        status: status ? status.toLowerCase() : 'todo',
        priority: priority ? priority.toLowerCase() : 'medium',
        assignedTo: assigned_to || null,
        assignedName,
        dueDate: due_date ? new Date(due_date) : null,
        createdBy: req.user.id
      }
    });

    // Update total_tasks count on project
    const totalTasks = await prisma.projectTask.count({ where: { projectId: id } });
    await prisma.project.update({
      where: { id },
      data: { totalTasks }
    });

    // Log Activity
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan tugas baru: "${title}"`
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating project task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3. Update Project Task
exports.updateProjectTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const updateData = { ...req.body };

    const hasAccess = await checkTaskWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk mengubah task.' });
    }

    const existingTask = await prisma.projectTask.findFirst({
      where: { id: taskId, projectId: id }
    });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    const dataToUpdate = {};
    if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
    if (updateData.division !== undefined) dataToUpdate.division = updateData.division ? updateData.division.toLowerCase() : null;
    if (updateData.priority !== undefined) dataToUpdate.priority = updateData.priority ? updateData.priority.toLowerCase() : null;
    if (updateData.dueDate !== undefined) dataToUpdate.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.sortOrder !== undefined) dataToUpdate.sortOrder = parseInt(updateData.sortOrder) || 0;

    if (updateData.assignedTo !== undefined) {
      dataToUpdate.assignedTo = updateData.assignedTo || null;
      if (updateData.assignedTo) {
        const userObj = await prisma.user.findUnique({ where: { id: updateData.assignedTo } });
        dataToUpdate.assignedName = userObj ? userObj.name : null;
      } else {
        dataToUpdate.assignedName = null;
      }
    }

    if (updateData.status !== undefined) {
      const newStatus = updateData.status.toLowerCase();
      dataToUpdate.status = newStatus;
      if (newStatus === 'done' && existingTask.status !== 'done') {
        dataToUpdate.completedDate = new Date();
      } else if (newStatus !== 'done' && existingTask.status === 'done') {
        dataToUpdate.completedDate = null;
      }
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: dataToUpdate
    });

    // Update project statistics
    const completedTasks = await prisma.projectTask.count({ where: { projectId: id, status: 'done' } });
    const totalTasks = await prisma.projectTask.count({ where: { projectId: id } });
    await prisma.project.update({
      where: { id },
      data: { completedTasks, totalTasks }
    });

    // Log Activity
    const actionText = updateData.status === 'done' 
      ? `menyelesaikan tugas: "${updatedTask.title}"` 
      : `mengubah tugas "${updatedTask.title}"`;
      
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: actionText
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating project task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. Delete Project Task
exports.deleteProjectTask = async (req, res) => {
  try {
    const { id, taskId } = req.params;

    const hasAccess = await checkTaskWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk menghapus task.' });
    }

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, projectId: id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    await prisma.projectTask.delete({
      where: { id: taskId }
    });

    // Update project statistics
    const completedTasks = await prisma.projectTask.count({ where: { projectId: id, status: 'done' } });
    const totalTasks = await prisma.projectTask.count({ where: { projectId: id } });
    await prisma.project.update({
      where: { id },
      data: { completedTasks, totalTasks }
    });

    // Log Activity
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus tugas: "${task.title}"`
      }
    });

    res.json({ message: 'Tugas berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting project task:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. Shortcut: Update status only (Kanban drag-drop)
exports.updateProjectTaskStatusOnly = async (req, res) => {
  try {
    const { id, taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status wajib diisi.' });
    }

    const hasAccess = await checkTaskWriteAccess(id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk mengubah status task.' });
    }

    const task = await prisma.projectTask.findFirst({
      where: { id: taskId, projectId: id }
    });
    if (!task) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    const dataToUpdate = { status: status.toLowerCase() };
    if (status.toLowerCase() === 'done' && task.status !== 'done') {
      dataToUpdate.completedDate = new Date();
    } else if (status.toLowerCase() !== 'done' && task.status === 'done') {
      dataToUpdate.completedDate = null;
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: dataToUpdate
    });

    // Update completed count in projects
    const completedTasks = await prisma.projectTask.count({ where: { projectId: id, status: 'done' } });
    await prisma.project.update({
      where: { id },
      data: { completedTasks }
    });

    // Log Activity
    const actionText = status.toLowerCase() === 'done'
      ? `menyelesaikan tugas: "${task.title}"`
      : `mengubah status tugas "${task.title}" ke "${status}"`;

    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: actionText
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// === DOKUMEN ===

// 6. Get Project Documents
exports.getProjectDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id, file_type, search } = req.query;

    // Fetch folders with file count using Prisma _count
    const foldersData = await prisma.projectFolder.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    });

    const folders = foldersData.map(f => ({
      id: f.id,
      projectId: f.projectId,
      folderName: f.folderName,
      folderColor: f.folderColor,
      sortOrder: f.sortOrder,
      createdAt: f.createdAt,
      fileCount: f._count.documents
    }));

    // Fetch recent 6 files
    const recent_files = await prisma.projectDocument.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    // Query files
    const whereFile = { projectId: id };
    if (folder_id) {
      whereFile.folderId = folder_id;
    }
    if (file_type && file_type.toLowerCase() !== 'all' && file_type.toLowerCase() !== 'semua tipe') {
      const ft = file_type.toLowerCase();
      if (ft === 'pdf') whereFile.fileType = 'pdf';
      else if (ft === 'excel') whereFile.fileType = { in: ['xlsx', 'xls'] };
      else if (ft === 'word') whereFile.fileType = { in: ['docx', 'doc'] };
      else if (ft === 'gambar') whereFile.fileType = { in: ['jpg', 'jpeg', 'png'] };
      else if (ft === 'dwg') whereFile.fileType = 'dwg';
    }
    if (search) {
      whereFile.fileName = { contains: search, mode: 'insensitive' };
    }

    const files = await prisma.projectDocument.findMany({
      where: whereFile,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      folders,
      recent_files,
      files
    });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 7. Upload Project Document
exports.uploadProjectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id, description } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File wajib diunggah.' });
    }

    const hasAccess = await checkDocumentUploadAccess(id, req.user);
    if (!hasAccess) {
      // Clean up the uploaded file to prevent orphans
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk mengunggah dokumen di proyek ini.' });
    }

    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    let fileType = 'other';
    if (['pdf', 'xlsx', 'xls', 'docx', 'doc', 'dwg', 'jpg', 'jpeg', 'png', 'zip'].includes(ext)) {
      if (ext === 'jpeg') fileType = 'jpg';
      else if (ext === 'xls') fileType = 'xlsx';
      else if (ext === 'doc') fileType = 'docx';
      else fileType = ext;
    }

    const fileSizeKb = Math.round(file.size / 1024);
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${id}/${file.filename}`;

    const doc = await prisma.projectDocument.create({
      data: {
        projectId: id,
        folderId: folder_id || null,
        fileName: file.originalname,
        fileType,
        fileSizeKb,
        fileUrl,
        uploadedBy: req.user.id,
        uploadedName: req.user.name,
        description: description || null
      }
    });

    // Log activity
    let logAction = `mengunggah dokumen baru: "${doc.fileName}"`;
    if (folder_id) {
      const folder = await prisma.projectFolder.findUnique({ where: { id: folder_id } });
      if (folder) {
        logAction += ` di folder "${folder.folderName}"`;
      }
    }

    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: logAction
      }
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('Error uploading document:', error);
    // Cleanup if file was written but DB failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 8. Delete Project Document
exports.deleteProjectDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const hasAccess = await checkDocumentDeleteAccess(id, docId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk menghapus dokumen ini.' });
    }

    const document = await prisma.projectDocument.findFirst({
      where: { id: docId, projectId: id }
    });
    if (!document) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
    }

    // Delete file from disk
    const filename = document.fileUrl.split('/').pop();
    const filePath = path.join(__dirname, '../../uploads', id, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from DB
    await prisma.projectDocument.delete({
      where: { id: docId }
    });

    // Log activity
    await prisma.projectActivityLog.create({
      data: {
        projectId: id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus dokumen: "${document.fileName}"`
      }
    });

    res.json({ message: 'Dokumen berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 9. Get Project Folders
exports.getProjectFolders = async (req, res) => {
  try {
    const { id } = req.params;
    const folders = await prisma.projectFolder.findMany({
      where: { projectId: id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching project folders:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 10. Create Project Folder
exports.createProjectFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_name, folder_color } = req.body;

    if (!folder_name) {
      return res.status(400).json({ error: 'Nama folder wajib diisi.' });
    }

    // Check duplicate
    const duplicate = await prisma.projectFolder.findFirst({
      where: {
        projectId: id,
        folderName: { equals: folder_name, mode: 'insensitive' }
      }
    });
    if (duplicate) {
      return res.status(400).json({ error: `Folder dengan nama "${folder_name}" sudah ada di proyek ini.` });
    }

    const maxSort = await prisma.projectFolder.findFirst({
      where: { projectId: id },
      orderBy: { sortOrder: 'desc' }
    });
    const nextSort = maxSort ? maxSort.sortOrder + 1 : 1;

    const folder = await prisma.projectFolder.create({
      data: {
        projectId: id,
        folderName: folder_name,
        folderColor: folder_color || 'blue',
        sortOrder: nextSort
      }
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 11. Delete Project Folder
exports.deleteProjectFolder = async (req, res) => {
  try {
    const { id, folderId } = req.params;

    const folder = await prisma.projectFolder.findFirst({
      where: { id: folderId, projectId: id }
    });
    if (!folder) {
      return res.status(404).json({ error: 'Folder tidak ditemukan.' });
    }

    // Verify if it contains files
    const fileCount = await prisma.projectDocument.count({
      where: { folderId }
    });
    if (fileCount > 0) {
      return res.status(400).json({ error: `Folder masih berisi ${fileCount} file. Pindahkan atau hapus file terlebih dahulu.` });
    }

    await prisma.projectFolder.delete({
      where: { id: folderId }
    });

    res.json({ message: 'Folder berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
