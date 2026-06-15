const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to validate email format
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Helper to map Prisma Client object to snake_case response
const mapClientToSnakeCase = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    company_name: c.companyName,
    short_name: c.shortName,
    client_type: c.clientType,
    pic_name: c.picName,
    pic_position: c.picPosition,
    pic_phone: c.picPhone,
    pic_email: c.picEmail,
    pic_2_name: c.pic2Name,
    pic_2_phone: c.pic2Phone,
    pic_2_email: c.pic2Email,
    phone: c.phone,
    email: c.email,
    address: c.address,
    city: c.city,
    province: c.province,
    npwp: c.npwp,
    bank_name: c.bankName,
    bank_account: c.bankAccount,
    bank_account_name: c.bankAccountName,
    notes: c.notes,
    is_active: c.isActive,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
    // Legacy fields
    name: c.picName,
    company: c.companyName
  };
};

// 1. Get all clients with filters, stats, and paging
exports.getAllClients = async (req, res) => {
  try {
    const { search, client_type, is_active, page = 1, limit = 10 } = req.query;
    
    // Pagination params
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Filters
    const where = {};
    
    // Search filter
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { shortName: { contains: search } },
        { picName: { contains: search } },
        { picEmail: { contains: search } }
      ];
    }

    // Client type filter
    if (client_type && client_type !== 'all') {
      where.clientType = client_type;
    }

    // Active filter
    if (is_active === 'true') {
      where.isActive = true;
    } else if (is_active === 'false') {
      where.isActive = false;
    } else if (!is_active) {
      // By default return only active clients
      where.isActive = true;
    }

    // Query clients
    const clients = await prisma.client.findMany({
      where,
      include: {
        projects: {
          include: {
            termins: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    const totalClientsCount = await prisma.client.count({ where });

    // Compute stats for each client
    const clientsWithStats = clients.map(c => {
      const projects = c.projects || [];
      const totalProjects = projects.length;
      
      const activeProjects = projects.filter(p => 
        ['preparation', 'execution', 'testing'].includes(p.status.toLowerCase())
      ).length;

      const completedProjects = projects.filter(p => 
        p.status.toLowerCase() === 'completed'
      ).length;

      const totalContractValue = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);

      // total paid = sum nettoCair of all paid termins from all client's projects
      let totalPaid = 0;
      projects.forEach(p => {
        const paidTermins = (p.termins || []).filter(t => t.status === 'paid');
        totalPaid += paidTermins.reduce((sum, t) => sum + (t.nettoCair || 0), 0);
      });

      const outstanding = totalContractValue - totalPaid;

      return {
        ...mapClientToSnakeCase(c),
        total_projects: totalProjects,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        total_contract_value: totalContractValue,
        total_paid: totalPaid,
        outstanding: outstanding
      };
    });

    // Compute system-wide summaries
    const allClients = await prisma.client.findMany({
      include: {
        projects: {
          include: {
            termins: true
          }
        }
      }
    });

    const activeClientsCount = allClients.filter(c => {
      if (!c.isActive) return false;
      const activeProjects = c.projects.filter(p => 
        ['preparation', 'execution', 'testing'].includes(p.status.toLowerCase())
      );
      return activeProjects.length > 0;
    }).length;

    let totalContractValueSum = 0;
    let totalCompletedProjectsSum = 0;

    allClients.forEach(c => {
      c.projects.forEach(p => {
        totalContractValueSum += (p.contractValue || 0);
        if (p.status.toLowerCase() === 'completed') {
          totalCompletedProjectsSum += 1;
        }
      });
    });

    res.json({
      clients: clientsWithStats,
      summary: {
        total_clients: allClients.length,
        active_clients: activeClientsCount,
        total_contract_value: totalContractValueSum,
        total_completed_projects: totalCompletedProjectsSum
      },
      pagination: {
        total: totalClientsCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalClientsCount / limitNum)
      }
    });

  } catch (error) {
    console.error('Error in getAllClients:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Get single client details + projects + finance summary
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            termins: true
          }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const projects = client.projects || [];
    const totalContractValue = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
    
    let totalPaid = 0;
    let terminPendingCount = 0;

    const mappedProjects = projects.map(p => {
      const paidTermins = (p.termins || []).filter(t => t.status === 'paid');
      totalPaid += paidTermins.reduce((sum, t) => sum + (t.nettoCair || 0), 0);

      // Pending termins = status 'submitted' or 'approved' (not draft, not paid)
      terminPendingCount += (p.termins || []).filter(t => 
        ['submitted', 'approved'].includes(t.status.toLowerCase())
      ).length;

      return {
        id: p.id,
        project_code: p.projectCode,
        project_name: p.projectName,
        status: p.status,
        contract_value: p.contractValue,
        contract_end_date: p.contractEndDate
      };
    });

    res.json({
      ...mapClientToSnakeCase(client),
      projects: mappedProjects,
      finance_summary: {
        total_contract_value: totalContractValue,
        total_paid: totalPaid,
        outstanding: totalContractValue - totalPaid,
        termin_pending: terminPendingCount
      }
    });

  } catch (error) {
    console.error('Error in getClientById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3. Create new client
exports.createClient = async (req, res) => {
  try {
    const {
      company_name, short_name, client_type,
      pic_name, pic_position, pic_phone, pic_email,
      pic_2_name, pic_2_phone, pic_2_email,
      phone, email, address, city, province, npwp,
      bank_name, bank_account, bank_account_name, notes
    } = req.body;

    // Validation
    if (!company_name) {
      return res.status(400).json({ error: 'company_name is required' });
    }

    if (pic_email && !isValidEmail(pic_email)) {
      return res.status(400).json({ error: 'pic_email format is invalid' });
    }

    const newClient = await prisma.client.create({
      data: {
        companyName: company_name,
        shortName: short_name || null,
        clientType: client_type || 'other',
        picName: pic_name || null,
        picPosition: pic_position || null,
        picPhone: pic_phone || null,
        picEmail: pic_email || null,
        pic2Name: pic_2_name || null,
        pic2Phone: pic_2_phone || null,
        pic2Email: pic_2_email || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        province: province || null,
        npwp: npwp || null,
        bankName: bank_name || null,
        bankAccount: bank_account || null,
        bankAccountName: bank_account_name || null,
        notes: notes || null,
        isActive: true,
        // Legacy support
        company: company_name,
        name: pic_name || short_name || company_name
      }
    });

    res.status(201).json(mapClientToSnakeCase(newClient));

  } catch (error) {
    console.error('Error in createClient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. Update client
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validation
    if (updateData.pic_email && !isValidEmail(updateData.pic_email)) {
      return res.status(400).json({ error: 'pic_email format is invalid' });
    }

    // Map fields
    const data = {};
    if (updateData.company_name !== undefined) {
      data.companyName = updateData.company_name;
      data.company = updateData.company_name;
    }
    if (updateData.short_name !== undefined) data.shortName = updateData.short_name;
    if (updateData.client_type !== undefined) data.clientType = updateData.client_type;
    if (updateData.pic_name !== undefined) {
      data.picName = updateData.pic_name;
      data.name = updateData.pic_name;
    }
    if (updateData.pic_position !== undefined) data.picPosition = updateData.pic_position;
    if (updateData.pic_phone !== undefined) data.picPhone = updateData.pic_phone;
    if (updateData.pic_email !== undefined) data.picEmail = updateData.pic_email;
    if (updateData.pic_2_name !== undefined) data.pic2Name = updateData.pic_2_name;
    if (updateData.pic_2_phone !== undefined) data.pic2Phone = updateData.pic_2_phone;
    if (updateData.pic_2_email !== undefined) data.pic2Email = updateData.pic_2_email;
    if (updateData.phone !== undefined) data.phone = updateData.phone;
    if (updateData.email !== undefined) data.email = updateData.email;
    if (updateData.address !== undefined) data.address = updateData.address;
    if (updateData.city !== undefined) data.city = updateData.city;
    if (updateData.province !== undefined) data.province = updateData.province;
    if (updateData.npwp !== undefined) data.npwp = updateData.npwp;
    if (updateData.bank_name !== undefined) data.bankName = updateData.bank_name;
    if (updateData.bank_account !== undefined) data.bankAccount = updateData.bank_account;
    if (updateData.bank_account_name !== undefined) data.bankAccountName = updateData.bank_account_name;
    if (updateData.notes !== undefined) data.notes = updateData.notes;
    if (updateData.is_active !== undefined) data.isActive = updateData.is_active;

    data.updatedAt = new Date();

    const updated = await prisma.client.update({
      where: { id },
      data
    });

    res.json(mapClientToSnakeCase(updated));

  } catch (error) {
    console.error('Error in updateClient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. Delete / Deactivate client (soft delete)
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { projects: true }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check for active projects (status not completed or on_hold)
    const activeProjects = (client.projects || []).filter(p => 
      !['completed', 'on_hold'].includes(p.status.toLowerCase())
    );

    if (activeProjects.length > 0) {
      return res.status(400).json({
        error: `Client masih memiliki ${activeProjects.length} proyek aktif. Selesaikan atau tutup proyek terlebih dahulu.`
      });
    }

    // Soft delete
    await prisma.client.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Client berhasil dinonaktifkan (soft delete).' });

  } catch (error) {
    console.error('Error in deleteClient:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 6. Get client projects
exports.getClientProjects = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          orderBy: { contractEndDate: 'desc' }
        }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const projects = client.projects || [];

    // Sort active projects first
    const sorted = [...projects].sort((a, b) => {
      const aActive = ['preparation', 'execution', 'testing'].includes(a.status.toLowerCase());
      const bActive = ['preparation', 'execution', 'testing'].includes(b.status.toLowerCase());
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return 0;
    });

    const mapped = sorted.map(p => ({
      id: p.id,
      project_code: p.projectCode,
      project_name: p.projectName,
      status: p.status,
      contract_value: p.contractValue,
      budget: p.budget,
      budget_used: p.budgetUsed,
      contract_end_date: p.contractEndDate
    }));

    res.json(mapped);

  } catch (error) {
    console.error('Error in getClientProjects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 7. Get client options for dropdowns (active only)
exports.getClientOptions = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { isActive: true },
      select: {
        id: true,
        companyName: true,
        shortName: true,
        picName: true
      },
      orderBy: { companyName: 'asc' }
    });

    const mapped = clients.map(c => ({
      id: c.id,
      company_name: c.companyName,
      short_name: c.shortName,
      // Compatibility alias fields
      company: c.companyName,
      name: c.picName || c.shortName
    }));

    res.json(mapped);

  } catch (error) {
    console.error('Error in getClientOptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
