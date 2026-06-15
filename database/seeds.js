const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with relations...');

  // Clean existing data
  await prisma.calendarEvent.deleteMany();
  await prisma.projectProgressDetail.deleteMany();
  await prisma.projectWeeklyProgress.deleteMany();
  await prisma.projectDivision.deleteMany();
  await prisma.projectTermin.deleteMany();
  await prisma.document.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.projectFolder.deleteMany();
  await prisma.projectTask.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const bcrypt = require('../backend/node_modules/bcryptjs');
  const defaultPassword = await bcrypt.hash('admin123', 10);
  const adminPassword = await bcrypt.hash('Chester100877', 10);

  // Create Users
  const mockUsers = [
    { name: 'Alex Kumar', email: 'alex@proman.com', role: 'PROJECT_MANAGER', department: 'MANAGEMENT', password: defaultPassword },
    { name: 'Sarah Jenkins', email: 'sarah@proman.com', role: 'SENIOR_PROJECT_MANAGER', department: 'ENGINEERING', password: defaultPassword },
    { name: 'Super Admin', email: 'retra@proman.com', role: 'ADMIN', department: 'ENGINEERING', password: adminPassword },
    { name: 'Emma Vance', email: 'emma@proman.com', role: 'DIRECTOR', department: 'DESIGN', password: defaultPassword },
    { name: 'Marcus Thorne', email: 'marcus@proman.com', role: 'PROJECT_MANAGER', department: 'MANAGEMENT', password: defaultPassword },
  ];

  const createdUsers = [];
  for (const u of mockUsers) {
    const created = await prisma.user.create({ data: u });
    createdUsers.push(created);
  }

  const getRandomUserId = () => createdUsers[Math.floor(Math.random() * createdUsers.length)].id;

  // Mock teams
  const TEAMS = [
    'Sarah Jenkins (PM), David Cole (Lead Dev), Emma Vance (Designer)',
    'Marcus Thorne (PM), Liam Henderson (Lead), Clara Oswald (QA)',
    'Elena Rostova (PM), Kenji Sato (Dev), John Doe (Architect)',
  ];

  // Create mock clients
  const mockClients = [
    {
      companyName: 'Tianlala Group',
      shortName: 'Tianlala',
      clientType: 'retail',
      picName: 'Dewi Lestari',
      picPosition: 'Project Director',
      picPhone: '0812-3456-7890',
      picEmail: 'dewi@tianlala.com',
      phone: '021-5550100',
      email: 'info@tianlala.com',
      address: 'Grand Indonesia Mall, Lt. 5, Jl. M.H. Thamrin No. 1',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      npwp: '01.234.567.8-012.000',
      bankName: 'BCA',
      bankAccount: '123-456-7890',
      bankAccountName: 'PT Tianlala Retail Indonesia',
      name: 'Dewi Lestari',
      company: 'Tianlala Group'
    },
    {
      companyName: 'BlueStar Group',
      shortName: 'BlueStar',
      clientType: 'mall',
      picName: 'Raj Patel',
      picPosition: 'Development Lead',
      picPhone: '0813-1111-2222',
      picEmail: 'raj@bluestar.com',
      phone: '021-5550200',
      email: 'contact@bluestar.com',
      address: 'BlueStar Tower, Lt. 12, Mega Kuningan',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      npwp: '02.456.789.0-034.000',
      bankName: 'Mandiri',
      bankAccount: '987-654-3210',
      bankAccountName: 'PT BlueStar Realty Tbk',
      name: 'Raj Patel',
      company: 'BlueStar Group'
    },
    {
      companyName: 'Meridian Corp',
      shortName: 'Meridian',
      clientType: 'office',
      picName: 'David Lim',
      picPosition: 'General Manager',
      picPhone: '0811-9999-8888',
      picEmail: 'david@meridian.com',
      phone: '021-5550300',
      email: 'hello@meridian.com',
      address: 'Meridian Plaza, Kav. 21, Jl. Jend. Sudirman',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      npwp: '03.789.123.4-045.000',
      bankName: 'CIMB Niaga',
      bankAccount: '456-789-0123',
      bankAccountName: 'PT Meridian Development',
      name: 'David Lim',
      company: 'Meridian Corp'
    },
    {
      companyName: 'TechNova Ltd',
      shortName: 'TechNova',
      clientType: 'industrial',
      picName: 'Sarah Chen',
      picPosition: 'Head of Infrastructure',
      picPhone: '0815-5555-4444',
      picEmail: 'sarah@technova.com',
      phone: '021-5550400',
      email: 'admin@technova.com',
      address: 'TechNova Industrial Park, Blok B4, BSD City',
      city: 'Tangerang Selatan',
      province: 'Banten',
      npwp: '04.123.456.7-056.000',
      bankName: 'BRI',
      bankAccount: '321-654-9870',
      bankAccountName: 'PT TechNova Advanced Industries',
      name: 'Sarah Chen',
      company: 'TechNova Ltd'
    },
    {
      companyName: 'PT Showroom Otomotif Nusantara',
      shortName: 'Showroom Nusantara',
      clientType: 'retail',
      picName: 'Bintang Kusuma',
      picPosition: 'Regional Operations Manager',
      picPhone: '0812-7777-6666',
      picEmail: 'bintang@otomotifnusantara.co.id',
      phone: '021-5550500',
      email: 'office@otomotifnusantara.co.id',
      address: 'Kawasan Niaga Pluit, Blok A No. 12',
      city: 'Jakarta Utara',
      province: 'DKI Jakarta',
      npwp: '05.321.654.9-067.000',
      bankName: 'Permata Bank',
      bankAccount: '111-222-3333',
      bankAccountName: 'PT Showroom Otomotif Nusantara',
      name: 'Bintang Kusuma',
      company: 'PT Showroom Otomotif Nusantara'
    },
    {
      companyName: 'CV Maju Bersama Konstruksi',
      shortName: 'Maju Bersama',
      clientType: 'other',
      picName: 'Hendra Wijaya',
      picPosition: 'Director',
      picPhone: '0818-8888-9999',
      picEmail: 'hendra@majubersama.com',
      phone: '021-5550600',
      email: 'contact@majubersama.com',
      address: 'Jl. Raya Darmo No. 45',
      city: 'Surabaya',
      province: 'Jawa Timur',
      npwp: '06.654.321.0-078.000',
      bankName: 'Danamon',
      bankAccount: '444-555-6666',
      bankAccountName: 'CV Maju Bersama Konstruksi',
      name: 'Hendra Wijaya',
      company: 'CV Maju Bersama Konstruksi'
    }
  ];

  const createdClients = [];
  for (const c of mockClients) {
    const created = await prisma.client.create({ data: c });
    createdClients.push(created);
  }

  const getClientData = (companyName) => {
    const cl = createdClients.find(c => c.companyName === companyName || c.company === companyName);
    return cl ? { id: cl.id, name: cl.picName } : { id: null, name: '' };
  };

  const getPmUserId = (name) => {
    return createdUsers.find(u => u.name === name)?.id || createdUsers[0].id;
  };

  // Create 10 Projects
  const mockProjects = [
    {
      projectCode: 'PRJ-2026-001',
      projectName: 'Pembangunan Kantor Pusat Meridian',
      company: 'Meridian Corp',
      status: 'execution',
      contractValue: 7500000000,
      budget: 6000000000,
      budgetUsed: 4200000000,
      contractStartDate: new Date('2026-01-15'),
      contractEndDate: new Date('2026-10-15'),
      actualStartDate: new Date('2026-01-20'),
      location: 'Sudirman, Jakarta Pusat',
      projectType: 'office',
      pmName: 'Alex Kumar',
      totalTasks: 14,
      completedTasks: 5,
      progressPlan: 65.0,
      progressActual: 58.0
    },
    {
      projectCode: 'PRJ-2026-002',
      projectName: 'Fit-out Cafe Tianlala Grand Indonesia',
      company: 'Tianlala Group',
      status: 'execution',
      contractValue: 1200000000,
      budget: 950000000,
      budgetUsed: 910000000,
      contractStartDate: new Date('2026-03-01'),
      contractEndDate: new Date('2026-06-30'),
      actualStartDate: new Date('2026-03-05'),
      location: 'Thamrin, Jakarta Pusat',
      projectType: 'store',
      pmName: 'Alex Kumar',
      totalTasks: 8,
      completedTasks: 7,
      progressPlan: 90.0,
      progressActual: 92.0
    },
    {
      projectCode: 'PRJ-2026-003',
      projectName: 'Renovasi Lobby Hotel BlueStar',
      company: 'BlueStar Group',
      status: 'preparation',
      contractValue: 2500000000,
      budget: 2000000000,
      budgetUsed: 0,
      contractStartDate: new Date('2026-07-01'),
      contractEndDate: new Date('2026-12-31'),
      actualStartDate: null,
      location: 'Seminyak, Bali',
      projectType: 'renovation',
      pmName: 'Sarah Jenkins',
      totalTasks: 5,
      completedTasks: 0,
      progressPlan: 0.0,
      progressActual: 0.0
    },
    {
      projectCode: 'PRJ-2026-004',
      projectName: 'Sistem MEP TechNova R&D Center',
      company: 'TechNova Ltd',
      status: 'handover',
      contractValue: 4800000000,
      budget: 3800000000,
      budgetUsed: 3750000000,
      contractStartDate: new Date('2025-08-01'),
      contractEndDate: new Date('2026-05-30'),
      actualStartDate: new Date('2025-08-10'),
      location: 'BSD City, Tangerang Selatan',
      projectType: 'office',
      pmName: 'Sarah Jenkins',
      totalTasks: 24,
      completedTasks: 24,
      progressPlan: 100.0,
      progressActual: 100.0
    },
    {
      projectCode: 'PRJ-2026-005',
      projectName: 'Gerai Baru Tianlala Mall Kelapa Gading',
      company: 'Tianlala Group',
      status: 'preparation',
      contractValue: 950000000,
      budget: 800000000,
      budgetUsed: 50000000,
      contractStartDate: new Date('2026-06-15'),
      contractEndDate: new Date('2026-09-15'),
      actualStartDate: null,
      location: 'Kelapa Gading, Jakarta Utara',
      projectType: 'store',
      pmName: 'Alex Kumar',
      totalTasks: 10,
      completedTasks: 1,
      progressPlan: 10.0,
      progressActual: 5.0
    },
    {
      projectCode: 'PRJ-2026-006',
      projectName: 'Gudang Logistik BlueStar Karawang',
      company: 'BlueStar Group',
      status: 'execution',
      contractValue: 8500000000,
      budget: 7000000000,
      budgetUsed: 4800000000,
      contractStartDate: new Date('2026-02-01'),
      contractEndDate: new Date('2026-11-30'),
      actualStartDate: new Date('2026-02-15'),
      location: 'KIIC, Karawang',
      projectType: 'other',
      pmName: 'Sarah Jenkins',
      totalTasks: 30,
      completedTasks: 12,
      progressPlan: 45.0,
      progressActual: 40.0
    },
    {
      projectCode: 'PRJ-2026-007',
      projectName: 'Studi Kelayakan TechNova Tower',
      company: 'TechNova Ltd',
      status: 'completed',
      contractValue: 500000000,
      budget: 400000000,
      budgetUsed: 400000000,
      contractStartDate: new Date('2025-11-01'),
      contractEndDate: new Date('2026-03-31'),
      actualStartDate: new Date('2025-11-05'),
      location: 'Mega Kuningan, Jakarta Selatan',
      projectType: 'office',
      pmName: 'Alex Kumar',
      totalTasks: 6,
      completedTasks: 6,
      progressPlan: 100.0,
      progressActual: 100.0
    },
    {
      projectCode: 'PRJ-2026-008',
      projectName: 'Showroom Mobil Meridian Pluit',
      company: 'Meridian Corp',
      status: 'handover',
      contractValue: 3200000000,
      budget: 2600000000,
      budgetUsed: 2550000000,
      contractStartDate: new Date('2025-09-15'),
      contractEndDate: new Date('2026-05-15'),
      actualStartDate: new Date('2025-09-20'),
      location: 'Pluit, Jakarta Utara',
      projectType: 'store',
      pmName: 'Alex Kumar',
      totalTasks: 18,
      completedTasks: 18,
      progressPlan: 100.0,
      progressActual: 100.0
    },
    {
      projectCode: 'PRJ-2026-009',
      projectName: 'Stasiun Pengisian Listrik TechNova',
      company: 'TechNova Ltd',
      status: 'on_hold',
      contractValue: 1500000000,
      budget: 1200000000,
      budgetUsed: 600000000,
      contractStartDate: new Date('2025-12-01'),
      contractEndDate: new Date('2026-08-30'),
      actualStartDate: new Date('2025-12-10'),
      location: 'Cikarang, Bekasi',
      projectType: 'other',
      pmName: 'Sarah Jenkins',
      totalTasks: 12,
      completedTasks: 4,
      progressPlan: 50.0,
      progressActual: 45.0
    },
    {
      projectCode: 'PRJ-2026-010',
      projectName: 'Renovasi Kantor Cabang BlueStar Surabaya',
      company: 'BlueStar Group',
      status: 'execution',
      contractValue: 1800000000,
      budget: 1400000000,
      budgetUsed: 1380000000,
      contractStartDate: new Date('2026-02-10'),
      contractEndDate: new Date('2026-07-10'),
      actualStartDate: new Date('2026-02-15'),
      location: 'Darmo, Surabaya',
      projectType: 'renovation',
      pmName: 'Alex Kumar',
      totalTasks: 14,
      completedTasks: 11,
      progressPlan: 85.0,
      progressActual: 78.0
    }
  ];

  const createdProjects = [];
  for (const p of mockProjects) {
    const clientData = getClientData(p.company);
    const pmId = getPmUserId(p.pmName);
    const created = await prisma.project.create({
      data: {
        projectCode: p.projectCode,
        projectName: p.projectName,
        clientId: clientData.id,
        clientName: clientData.name,
        status: p.status,
        contractValue: p.contractValue,
        budget: p.budget,
        budgetUsed: p.budgetUsed,
        contractStartDate: p.contractStartDate,
        contractEndDate: p.contractEndDate,
        actualStartDate: p.actualStartDate,
        location: p.location,
        projectType: p.projectType,
        assignedPm: pmId,
        totalTasks: p.totalTasks,
        completedTasks: p.completedTasks,
        progressPlan: p.progressPlan,
        progressActual: p.progressActual,
        retensiTotal: p.projectCode === 'PRJ-2026-001' ? 356250000.0 : 0.0,
        retensiCair: 0.0
      }
    });
    createdProjects.push(created);
  }

  // Seed milestones, members, and log data for PRJ-2026-001
  const prj01 = createdProjects.find(p => p.projectCode === 'PRJ-2026-001');
  if (prj01) {
    console.log('Seeding project milestones, members and activity logs for PRJ-2026-001...');
    
    // Milestones
    await prisma.projectMilestone.createMany({
      data: [
        { projectId: prj01.id, milestoneName: 'M1 Mobilisasi', targetDate: new Date('2026-01-20'), actualDate: new Date('2026-01-22'), status: 'done', sortOrder: 1 },
        { projectId: prj01.id, milestoneName: 'M2 Pekerjaan Struktur', targetDate: new Date('2026-04-15'), actualDate: new Date('2026-04-12'), status: 'done', sortOrder: 2 },
        { projectId: prj01.id, milestoneName: 'M3 Pekerjaan MEP Rough-in', targetDate: new Date('2026-06-15'), actualDate: null, status: 'in_progress', sortOrder: 3 },
        { projectId: prj01.id, milestoneName: 'M4 Pekerjaan Finishing', targetDate: new Date('2026-08-30'), actualDate: null, status: 'pending', sortOrder: 4 },
        { projectId: prj01.id, milestoneName: 'M5 Serah Terima Akhir / BAST 1', targetDate: new Date('2026-10-15'), actualDate: null, status: 'pending', sortOrder: 5 }
      ]
    });

    // Members
    const uAlex = createdUsers.find(u => u.email === 'alex@proman.com');
    const uSarah = createdUsers.find(u => u.email === 'sarah@proman.com');
    const uRetra = createdUsers.find(u => u.email === 'retra@proman.com');
    const uEmma = createdUsers.find(u => u.email === 'emma@proman.com');
    const uMarcus = createdUsers.find(u => u.email === 'marcus@proman.com');

    await prisma.projectMember.createMany({
      data: [
        { projectId: prj01.id, userId: uAlex.id, roleInProject: 'pm', joinedAt: new Date('2026-01-15') },
        { projectId: prj01.id, userId: uSarah.id, roleInProject: 'site_manager', joinedAt: new Date('2026-01-15') },
        { projectId: prj01.id, userId: uEmma.id, roleInProject: 'finance', joinedAt: new Date('2026-01-20') },
        { projectId: prj01.id, userId: uMarcus.id, roleInProject: 'drafter', joinedAt: new Date('2026-01-20') },
        { projectId: prj01.id, userId: uRetra.id, roleInProject: 'mandor', joinedAt: new Date('2026-01-22') }
      ]
    });

    // Activity Logs
    await prisma.projectActivityLog.createMany({
      data: [
        { projectId: prj01.id, userId: uAlex.id, userName: 'Alex Kumar', action: 'memulai proyek dan merilis Mobilisasi (M1)', createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
        { projectId: prj01.id, userId: uSarah.id, userName: 'Sarah Jenkins', action: 'mengunggah dokumen Shop Drawing struktur kolom', createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        { projectId: prj01.id, userId: uAlex.id, userName: 'Alex Kumar', action: 'mengubah status milestone Pekerjaan Struktur (M2) ke done', createdAt: new Date(Date.now() - 62 * 24 * 60 * 60 * 1000) },
        { projectId: prj01.id, userId: uMarcus.id, userName: 'Marcus Thorne', action: 'menambahkan tugas baru: Instalasi kabel tray risers', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { projectId: prj01.id, userId: uAlex.id, userName: 'Alex Kumar', action: 'mengubah status milestone Pekerjaan MEP Rough-in (M3) ke in_progress', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
      ]
    });

    // Seeding termins for PRJ-2026-001
    await prisma.projectTermin.createMany({
      data: [
        {
          projectId: prj01.id,
          terminNumber: 1,
          terminLabel: 'Termin 1 — Uang Muka 30%',
          percentage: 30.00,
          nilaiTermin: 2250000000,
          retensiPct: 5.00,
          retensiAmount: 112500000,
          nettoCair: 2137500000,
          submittedDate: new Date('2026-02-15'),
          approvedDate: new Date('2026-02-18'),
          paidDate: new Date('2026-02-25'),
          status: 'paid',
          notes: 'Pembayaran termin pertama uang muka'
        },
        {
          projectId: prj01.id,
          terminNumber: 2,
          terminLabel: 'Termin 2 — Progress 30%',
          percentage: 30.00,
          nilaiTermin: 2250000000,
          retensiPct: 5.00,
          retensiAmount: 112500000,
          nettoCair: 2137500000,
          submittedDate: new Date('2026-04-10'),
          approvedDate: new Date('2026-04-12'),
          paidDate: new Date('2026-04-20'),
          status: 'paid',
          notes: 'Penagihan termin kedua progres lapangan'
        },
        {
          projectId: prj01.id,
          terminNumber: 3,
          terminLabel: 'Termin 3 — Progress 20%',
          percentage: 20.00,
          nilaiTermin: 1500000000,
          retensiPct: 5.00,
          retensiAmount: 75000000,
          nettoCair: 1425000000,
          submittedDate: new Date('2026-06-01'),
          approvedDate: new Date('2026-06-05'),
          paidDate: null,
          status: 'approved',
          notes: 'Persetujuan termin ketiga oleh manajemen client'
        },
        {
          projectId: prj01.id,
          terminNumber: 4,
          terminLabel: 'Termin 4 — Progress 15%',
          percentage: 15.00,
          nilaiTermin: 1125000000,
          retensiPct: 5.00,
          retensiAmount: 56250000,
          nettoCair: 1068750000,
          submittedDate: new Date('2026-06-10'),
          approvedDate: null,
          paidDate: null,
          status: 'submitted',
          notes: 'Dokumen tagihan termin keempat diajukan ke client'
        },
        {
          projectId: prj01.id,
          terminNumber: 5,
          terminLabel: 'Termin 5 — Retensi BAST 2 / FHO 5%',
          percentage: 5.00,
          nilaiTermin: 375000000,
          retensiPct: 0.00,
          retensiAmount: 0,
          nettoCair: 375000000,
          submittedDate: null,
          approvedDate: null,
          paidDate: null,
          status: 'draft',
          notes: 'Draft termin kelima pengembalian retensi'
        }
      ]
    });

    console.log('Seeding project divisions, weekly progress, and details for PRJ-2026-001...');
    const divisions = [
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000001', divisionName: 'Persiapan & Mobilisasi', bobot: 3.00, sortOrder: 1 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000002', divisionName: 'Pekerjaan Tanah & Fondasi', bobot: 8.00, sortOrder: 2 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000003', divisionName: 'Struktur Beton & Baja', bobot: 20.00, sortOrder: 3 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000004', divisionName: 'Pasangan, Plesteran & Acian', bobot: 12.00, sortOrder: 4 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000005', divisionName: 'MEP Rough-in', bobot: 25.00, sortOrder: 5 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000006', divisionName: 'Arsitektur & Finishing', bobot: 22.00, sortOrder: 6 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000007', divisionName: 'MEP Final & Commissioning', bobot: 7.00, sortOrder: 7 },
      { id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000008', divisionName: 'Perapihan & BAST', bobot: 3.00, sortOrder: 8 }
    ];

    const createdDivisions = [];
    for (const d of divisions) {
      const created = await prisma.projectDivision.create({
        data: {
          id: d.id,
          projectId: prj01.id,
          divisionName: d.divisionName,
          bobot: d.bobot,
          sortOrder: d.sortOrder
        }
      });
      createdDivisions.push(created);
    }

    const getDivisionProgress = (weekNum, divIndex) => {
      let plan = 0;
      let actual = 0;
      
      if (divIndex === 0) {
        if (weekNum === 1) { plan = 40; actual = 30; }
        else if (weekNum === 2) { plan = 80; actual = 70; }
        else if (weekNum >= 3) { plan = 100; actual = 100; }
      } else if (divIndex === 1) {
        if (weekNum < 2) { plan = 0; actual = 0; }
        else if (weekNum === 2) { plan = 20; actual = 10; }
        else if (weekNum === 3) { plan = 50; actual = 35; }
        else if (weekNum === 4) { plan = 80; actual = 65; }
        else if (weekNum === 5) { plan = 100; actual = 85; }
        else if (weekNum >= 6) { plan = 100; actual = 100; }
      } else if (divIndex === 2) {
        if (weekNum < 5) { plan = 0; actual = 0; }
        else if (weekNum >= 14) { plan = 100; actual = weekNum >= 16 ? 100 : (weekNum === 14 ? 90 : 96); }
        else {
          const totalWeeks = 14 - 5;
          const currentWeek = weekNum - 5;
          plan = Math.round((currentWeek / totalWeeks) * 100);
          actual = Math.round((currentWeek / totalWeeks) * 80);
        }
      } else if (divIndex === 3) {
        if (weekNum < 10) { plan = 0; actual = 0; }
        else if (weekNum >= 18) { plan = 100; actual = weekNum >= 20 ? 98 : (weekNum === 18 ? 85 : 92); }
        else {
          const totalWeeks = 18 - 10;
          const currentWeek = weekNum - 10;
          plan = Math.round((currentWeek / totalWeeks) * 100);
          actual = Math.round((currentWeek / totalWeeks) * 75);
        }
      } else if (divIndex === 4) {
        if (weekNum < 12) { plan = 0; actual = 0; }
        else {
          const totalWeeks = 24 - 12;
          const currentWeek = weekNum - 12;
          plan = Math.round((currentWeek / totalWeeks) * 100);
          actual = Math.round((currentWeek / totalWeeks) * 70);
        }
      } else if (divIndex === 5) {
        if (weekNum < 15) { plan = 0; actual = 0; }
        else {
          const totalWeeks = 30 - 15;
          const currentWeek = weekNum - 15;
          plan = Math.round((currentWeek / totalWeeks) * 100);
          actual = Math.round((currentWeek / totalWeeks) * 65);
        }
      }
      return { plan, actual };
    };

    const scurveDataList = [];
    const baseDate = new Date('2026-01-20');

    for (let w = 1; w <= 20; w++) {
      const periodStart = new Date(baseDate.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      const weeklyProgress = await prisma.projectWeeklyProgress.create({
        data: {
          projectId: prj01.id,
          weekNumber: w,
          weekLabel: `Minggu ${w}`,
          periodStart,
          periodEnd,
          reportedBy: uSarah.id,
          notes: `Laporan progres mingguan untuk minggu ke-${w}`
        }
      });

      let weekTotalPlan = 0;
      let weekTotalActual = 0;

      for (let d = 0; d < createdDivisions.length; d++) {
        const { plan, actual } = getDivisionProgress(w, d);
        
        await prisma.projectProgressDetail.create({
          data: {
            weeklyProgressId: weeklyProgress.id,
            projectId: prj01.id,
            divisionId: createdDivisions[d].id,
            progressPlan: plan,
            progressActual: actual
          }
        });

        weekTotalPlan += (createdDivisions[d].bobot * plan) / 100;
        weekTotalActual += (createdDivisions[d].bobot * actual) / 100;
      }

      weekTotalPlan = Math.round(weekTotalPlan * 100) / 100;
      weekTotalActual = Math.round(weekTotalActual * 100) / 100;

      scurveDataList.push({
        week: w,
        week_label: `Minggu ${w}`,
        plan: weekTotalPlan,
        actual: weekTotalActual
      });
    }

    // Update project PRJ-2026-001 progress fields
    const finalPlan = scurveDataList[scurveDataList.length - 1].plan;
    const finalActual = scurveDataList[scurveDataList.length - 1].actual;

    await prisma.project.update({
      where: { id: prj01.id },
      data: {
        progressPlan: finalPlan,
        progressActual: finalActual,
        scurveData: JSON.stringify(scurveDataList),
        totalTasks: 14,
        completedTasks: 5
      }
    });

    console.log('Seeding project folders, documents and tasks for PRJ-2026-001...');
    // Seed folders
    const folders = [
      { id: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000001', folderName: 'Kontrak & SPK', folderColor: 'amber', sortOrder: 1 },
      { id: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000002', folderName: 'Gambar Kerja / Shop Drawing', folderColor: 'blue', sortOrder: 2 },
      { id: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000003', folderName: 'Laporan Kemajuan Pekerjaan', folderColor: 'green', sortOrder: 3 },
      { id: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000004', folderName: 'Dokumen Penagihan', folderColor: 'purple', sortOrder: 4 },
      { id: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000005', folderName: 'Dokumentasi Foto Lapangan', folderColor: 'amber', sortOrder: 5 }
    ];

    for (const f of folders) {
      await prisma.projectFolder.create({
        data: {
          id: f.id,
          projectId: prj01.id,
          folderName: f.folderName,
          folderColor: f.folderColor,
          sortOrder: f.sortOrder
        }
      });
    }

    // Seed documents
    const docData = [
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000101',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000001',
        fileName: 'SPK_Pembangunan_Meridian_Signed.pdf',
        fileType: 'pdf',
        fileSizeKb: 4500,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/SPK_Pembangunan_Meridian_Signed.pdf',
        uploadedBy: uAlex.id,
        uploadedName: 'Alex Kumar',
        description: 'Surat Perjanjian Kerja konstruksi ditandatangani kedua pihak.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000102',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000001',
        fileName: 'Addendum_01_Penyesuaian_Jadwal.pdf',
        fileType: 'pdf',
        fileSizeKb: 1200,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Addendum_01_Penyesuaian_Jadwal.pdf',
        uploadedBy: uAlex.id,
        uploadedName: 'Alex Kumar',
        description: 'Addendum waktu pelaksanaan konstruksi.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000103',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000002',
        fileName: 'Shop_Drawing_Arsitektur_Rev2.dwg',
        fileType: 'dwg',
        fileSizeKb: 15400,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Shop_Drawing_Arsitektur_Rev2.dwg',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Gambar kerja arsitektur revisi ke-2 untuk layout interior.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000104',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000002',
        fileName: 'Layout_Plan_MEP_Piping.pdf',
        fileType: 'pdf',
        fileSizeKb: 3200,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Layout_Plan_MEP_Piping.pdf',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Gambar jalur pipa instalasi MEP (Plumbing & Air).'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000105',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000003',
        fileName: 'Laporan_Mingguan_Week_20.xlsx',
        fileType: 'xlsx',
        fileSizeKb: 850,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Laporan_Mingguan_Week_20.xlsx',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Laporan realisasi kemajuan mingguan (Minggu 20).'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000106',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000003',
        fileName: 'Laporan_Bulanan_Mei_2026.pdf',
        fileType: 'pdf',
        fileSizeKb: 5400,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Laporan_Bulanan_Mei_2026.pdf',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Laporan komparasi progress plan vs actual bulan Mei.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000107',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000004',
        fileName: 'Invoice_Termin_3_Approved.pdf',
        fileType: 'pdf',
        fileSizeKb: 750,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Invoice_Termin_3_Approved.pdf',
        uploadedBy: uEmma.id,
        uploadedName: 'Emma Vance',
        description: 'Dokumen persetujuan penagihan termin 3.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000108',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000004',
        fileName: 'Berita_Acara_Prestasi_Pekerjaan_80pct.pdf',
        fileType: 'pdf',
        fileSizeKb: 1800,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Berita_Acara_Prestasi_Pekerjaan_80pct.pdf',
        uploadedBy: uEmma.id,
        uploadedName: 'Emma Vance',
        description: 'BAPP yang sudah ditandatangani oleh Pengawas Lapangan.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000109',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000005',
        fileName: 'Foto_Progress_Kolom_Utama.jpg',
        fileType: 'jpg',
        fileSizeKb: 2300,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Foto_Progress_Kolom_Utama.jpg',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Dokumentasi pekerjaan pembesian kolom.'
      },
      {
        id: 'd1b8a9d2-e3a4-4f5b-8c6d-000000000110',
        folderId: 'f1b8a9d2-e3a4-4f5b-8c6d-000000000005',
        fileName: 'Foto_Inspeksi_MEP_Langit_Langit.png',
        fileType: 'png',
        fileSizeKb: 3100,
        fileUrl: '/uploads/p1b8a9d2-e3a4-4f5b-8c6d-7e8f9a0b1c2d/Foto_Inspeksi_MEP_Langit_Langit.png',
        uploadedBy: uSarah.id,
        uploadedName: 'Sarah Jenkins',
        description: 'Foto detail instalasi kabel tray.'
      }
    ];

    for (const d of docData) {
      await prisma.projectDocument.create({
        data: {
          id: d.id,
          projectId: prj01.id,
          folderId: d.folderId,
          fileName: d.fileName,
          fileType: d.fileType,
          fileSizeKb: d.fileSizeKb,
          fileUrl: d.fileUrl,
          uploadedBy: d.uploadedBy,
          uploadedName: d.uploadedName,
          description: d.description
        }
      });
    }

    // Seed tasks (14 tasks)
    const taskData = [
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000201',
        title: 'Pengukuran Ulang Area Proyek (Site Survey)',
        description: 'Melakukan pengukuran ulang batas area lahan untuk presisi struktur konstruksi.',
        division: 'persiapan',
        status: 'done',
        priority: 'high',
        assignedTo: uSarah.id,
        assignedName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 102 * 24 * 60 * 60 * 1000),
        sortOrder: 1
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000202',
        title: 'Mobilisasi Alat Berat & Konstruksi Direksikeet',
        description: 'Mendatangkan excavator dan membangun kantor sementara lapangan.',
        division: 'persiapan',
        status: 'done',
        priority: 'high',
        assignedTo: uSarah.id,
        assignedName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        sortOrder: 2
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000203',
        title: 'Galian Tanah Pondasi Footplat & Lajur',
        description: 'Pekerjaan galian tanah sedalam 1.5 meter untuk struktur pondasi.',
        division: 'sipil',
        status: 'done',
        priority: 'high',
        assignedTo: uMarcus.id,
        assignedName: 'Marcus Thorne',
        dueDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 72 * 24 * 60 * 60 * 1000),
        sortOrder: 3
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000204',
        title: 'Pengecoran Pondasi & Kolom Struktur Utama',
        description: 'Pengecoran beton ready mix K-350 untuk pondasi tapak dan kolom struktur utama.',
        division: 'sipil',
        status: 'done',
        priority: 'high',
        assignedTo: uAlex.id,
        assignedName: 'Alex Kumar',
        dueDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
        sortOrder: 4
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000205',
        title: 'Pekerjaan Pasangan Dinding Bata Ringan',
        description: 'Pemasangan bata ringan keliling luar dan sekat antar ruangan lantai 1.',
        division: 'sipil',
        status: 'done',
        priority: 'medium',
        assignedTo: uAlex.id,
        assignedName: 'Alex Kumar',
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        sortOrder: 5
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000206',
        title: 'Plasteran & Acian Dinding Area Belakang',
        description: 'Melakukan plasteran semen mortar dan acian halus pada dinding bata ringan.',
        division: 'sipil',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: uMarcus.id,
        assignedName: 'Marcus Thorne',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        sortOrder: 6
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000207',
        title: 'Instalasi Pipa Conduit Kabel Power Utama',
        description: 'Penarikan pipa pelindung kabel listrik utama di area langit-langit.',
        division: 'mep',
        status: 'in_progress',
        priority: 'high',
        assignedTo: uSarah.id,
        assignedName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        sortOrder: 7
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000208',
        title: 'Pemasangan Ducting AC Cassette & Exhaust',
        description: 'Instalasi ducting pendingin ruangan dan exhaust fan untuk sirkulasi udara.',
        division: 'mep',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: uMarcus.id,
        assignedName: 'Marcus Thorne',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        sortOrder: 8
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000209',
        title: 'Pemasangan Panel Listrik & Sub-Panel',
        description: 'Perakitan box panel MDP dan SDP beserta komponen MCB utama.',
        division: 'mep',
        status: 'review',
        priority: 'high',
        assignedTo: uSarah.id,
        assignedName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue
        sortOrder: 9
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000210',
        title: 'Instalasi Jalur Fire Alarm & Sprinkler',
        description: 'Memasang pipa besi sprinkler merah dan sensor panas/asap kebakaran.',
        division: 'mep',
        status: 'todo',
        priority: 'medium',
        assignedTo: uMarcus.id,
        assignedName: 'Marcus Thorne',
        dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        sortOrder: 10
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000211',
        title: 'Pemasangan Rangka Hollow Plafon Gypsum',
        description: 'Pemasangan besi hollow 2x4 dan 4x4 untuk dudukan papan plafon gypsum.',
        division: 'arsitektur',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: uAlex.id,
        assignedName: 'Alex Kumar',
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        sortOrder: 11
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000212',
        title: 'Pemasangan Keramik Homogenous Tile 60x60',
        description: 'Pemasangan keramik HT 60x60 di area showroom utama dengan adukan semen instan.',
        division: 'arsitektur',
        status: 'review',
        priority: 'high',
        assignedTo: uAlex.id,
        assignedName: 'Alex Kumar',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue
        sortOrder: 12
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000213',
        title: 'Pemasangan Pintu Kaca & Partisi Aluminium',
        description: 'Pemasangan kusen aluminium dan kaca tempered 12mm pintu utama.',
        division: 'arsitektur',
        status: 'todo',
        priority: 'low',
        assignedTo: uMarcus.id,
        assignedName: 'Marcus Thorne',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sortOrder: 13
      },
      {
        id: 't1b8a9d2-e3a4-4f5b-8c6d-000000000214',
        title: 'Pengecatan Dinding Cat Interior (Base Coat)',
        description: 'Aplikasi cat dasar sealer alkali resisting untuk menahan kelembaban dinding.',
        division: 'finishing',
        status: 'todo',
        priority: 'low',
        assignedTo: uSarah.id,
        assignedName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        sortOrder: 14
      }
    ];

    for (const t of taskData) {
      await prisma.projectTask.create({
        data: {
          id: t.id,
          projectId: prj01.id,
          title: t.title,
          description: t.description,
          division: t.division,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignedTo,
          assignedName: t.assignedName,
          dueDate: t.dueDate,
          completedDate: t.completedDate || null,
          sortOrder: t.sortOrder,
          createdBy: uAlex.id
        }
      });
    }
  }

  // Seeding relations for each project
  console.log('Seeding nested relation records (tasks, expenses, invoices, documents, timesheets)...');
  for (const proj of createdProjects) {
    // 1. Create Tasks (2-3 per project)
    await prisma.task.createMany({
      data: [
        {
          title: `Analyze client requirements`,
          description: `Gather requirements from stakeholders.`,
          status: 'DONE',
          priority: 'HIGH',
          assigneeId: getRandomUserId(),
          deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          projectId: proj.id,
        },
        {
          title: `Build system architecture layout`,
          description: `Draft the initial technical specs.`,
          status: proj.status === 'handover' || proj.status === 'completed' ? 'DONE' : 'IN_PROGRESS',
          priority: 'MEDIUM',
          assigneeId: getRandomUserId(),
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          projectId: proj.id,
        },
        {
          title: `Launch public beta test`,
          description: `Prepare deployment pipelines and alert users.`,
          status: proj.status === 'handover' || proj.status === 'completed' ? 'DONE' : 'TODO',
          priority: 'LOW',
          assigneeId: getRandomUserId(),
          deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          projectId: proj.id,
        }
      ]
    });



    // 2. Create Expenses (2 per project)
    const expenseAmount1 = Math.round(proj.budget * 0.12 * 100) / 100;
    const expenseAmount2 = Math.round(proj.budget * 0.05 * 100) / 100;
    await prisma.expense.createMany({
      data: [
        {
          category: 'INFRASTRUCTURE',
          amount: expenseAmount1 || 250.00,
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          projectId: proj.id,
        },
        {
          category: 'SOFTWARE',
          amount: expenseAmount2 || 85.00,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          projectId: proj.id,
        }
      ]
    });

    // 3. Create Invoices (2 per project)
    const invoiceAmount1 = Math.round(proj.budget * 0.4 * 100) / 100;
    const invoiceAmount2 = Math.round(proj.budget * 0.6 * 100) / 100;
    
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Math.floor(1000000 + Math.random() * 9000000)}`,
        clientId: proj.clientId,
        subtotal: invoiceAmount1,
        totalAmount: invoiceAmount1,
        status: 'PAID',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        projectId: proj.id,
        items: {
          create: [{ description: 'Project Initial Milestone', qty: 1, unitPrice: invoiceAmount1, total: invoiceAmount1 }]
        }
      }
    });

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Math.floor(1000000 + Math.random() * 9000000)}`,
        clientId: proj.clientId,
        subtotal: invoiceAmount2,
        totalAmount: invoiceAmount2,
        status: proj.status === 'handover' || proj.status === 'completed' ? 'PAID' : 'PENDING',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        projectId: proj.id,
        items: {
          create: [{ description: 'Project Final Delivery', qty: 1, unitPrice: invoiceAmount2, total: invoiceAmount2 }]
        }
      }
    });

    // 4. Create Documents (2 per project)
    await prisma.document.createMany({
      data: [
        {
          fileName: 'Project_Requirements.pdf',
          fileUrl: 'http://localhost:5000/uploads/mock-requirements.pdf',
          category: 'REQUIREMENT',
          projectId: proj.id,
        },
        {
          fileName: 'Initial_Design.fig',
          fileUrl: 'http://localhost:5000/uploads/mock-design.fig',
          category: 'DESIGN',
          projectId: proj.id,
        }
      ]
    });
  }

  // Seeding Timesheets
  console.log('Seeding 25 Timesheet entries...');
  const uAlex = createdUsers.find(u => u.email === 'alex@proman.com');
  const uSarah = createdUsers.find(u => u.email === 'sarah@proman.com');
  const uRetra = createdUsers.find(u => u.email === 'retra@proman.com');
  const uEmma = createdUsers.find(u => u.email === 'emma@proman.com');
  const uMarcus = createdUsers.find(u => u.email === 'marcus@proman.com');

  const pMeridian = createdProjects.find(p => p.projectCode === 'PRJ-2026-001');
  const pTianlala = createdProjects.find(p => p.projectCode === 'PRJ-2026-002');
  const pBlueStar = createdProjects.find(p => p.projectCode === 'PRJ-2026-006');

  const timesheetData = [
    // User 0 (Alex Kumar, PM)
    {
      userId: uAlex.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-15T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Internal coordination meeting with site manager',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-15T10:00:00Z')
    },
    {
      userId: uAlex.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-16T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 4.0,
      workType: 'overtime',
      description: 'Supervising column plastering zoning B and checking material logs',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-16T12:00:00Z')
    },
    {
      userId: uAlex.id,
      projectId: pTianlala.id,
      workDate: new Date('2026-06-17T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Layout checking and MEP alignment confirmation at GI site',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-17T17:00:00Z')
    },
    {
      userId: uAlex.id,
      projectId: pTianlala.id,
      workDate: new Date('2026-06-18T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 6.0,
      workType: 'overtime',
      description: 'Monitoring night-shift cafe fit-out work and safety audit',
      status: 'pending'
    },
    {
      userId: uAlex.id,
      projectId: null,
      workDate: new Date('2026-06-19T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Weekly progress report consolidation and cost estimation review',
      status: 'pending'
    },

    // User 1 (Sarah Jenkins, PM)
    {
      userId: uSarah.id,
      projectId: pBlueStar.id,
      workDate: new Date('2026-06-15T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'lapangan',
      description: 'Site visitation and foundation structural inspection at Karawang',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-15T11:00:00Z')
    },
    {
      userId: uSarah.id,
      projectId: pBlueStar.id,
      workDate: new Date('2026-06-16T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 5.0,
      workType: 'overtime',
      description: 'Overtime monitoring warehouse structural casting',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-16T18:00:00Z')
    },
    {
      userId: uSarah.id,
      projectId: pBlueStar.id,
      workDate: new Date('2026-06-17T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'lapangan',
      description: 'Subcontractor meeting regarding steel roof structure fabrication',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-17T15:00:00Z')
    },
    {
      userId: uSarah.id,
      projectId: null,
      workDate: new Date('2026-06-18T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'training',
      description: 'Attending health and safety certification training session',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-18T16:00:00Z')
    },
    {
      userId: uSarah.id,
      projectId: pBlueStar.id,
      workDate: new Date('2026-06-19T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Reviewing material logistics bills and qc checklist',
      status: 'pending'
    },

    // User 2 (Super Admin)
    {
      userId: uRetra.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-15T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Database setup and initial server administration for portal',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-15T09:00:00Z')
    },
    {
      userId: uRetra.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-16T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 4.0,
      workType: 'overtime',
      description: 'Troubleshooting project activity logging real-time push update issues',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-16T10:00:00Z')
    },
    {
      userId: uRetra.id,
      projectId: null,
      workDate: new Date('2026-06-17T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'wfh',
      description: 'Remote server migration and backend performance tuning',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-17T11:00:00Z')
    },
    {
      userId: uRetra.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-18T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Conducting training session for team members on ProMan tools',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-18T14:00:00Z')
    },
    {
      userId: uRetra.id,
      projectId: pTianlala.id,
      workDate: new Date('2026-06-19T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Setting up new discussion channels and testing notifications',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-19T16:00:00Z')
    },

    // User 3 (Emma Vance, Finance)
    {
      userId: uEmma.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-15T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Preparing draft invoicing and retensi calculations for client review',
      status: 'approved',
      approvedBy: uAlex.id,
      approvedAt: new Date('2026-06-15T15:00:00Z')
    },
    {
      userId: uEmma.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-16T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Verifying subcontractor invoices and material cost reports',
      status: 'approved',
      approvedBy: uAlex.id,
      approvedAt: new Date('2026-06-16T15:00:00Z')
    },
    {
      userId: uEmma.id,
      projectId: pTianlala.id,
      workDate: new Date('2026-06-17T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Reviewing billing status and project budget realization values',
      status: 'rejected',
      rejectionReason: 'Hours did not match actual log, please check'
    },
    {
      userId: uEmma.id,
      projectId: null,
      workDate: new Date('2026-06-18T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Administrative tax calculations and corporate finance monthly report',
      status: 'pending'
    },
    {
      userId: uEmma.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-19T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Preparing client termins and drafting next month billing progress',
      status: 'pending'
    },

    // User 4 (Marcus Thorne, PM)
    {
      userId: uMarcus.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-15T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Shop drawing alignment and internal review for layout revisions',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-15T16:00:00Z')
    },
    {
      userId: uMarcus.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-16T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 4.5,
      workType: 'overtime',
      description: 'Supervising architectural finishing zone C and detailing',
      status: 'approved',
      approvedBy: uRetra.id,
      approvedAt: new Date('2026-06-16T17:00:00Z')
    },
    {
      userId: uMarcus.id,
      projectId: pBlueStar.id,
      workDate: new Date('2026-06-17T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Preparing layout dwg revision files for the Karawang warehouse roof',
      status: 'rejected',
      rejectionReason: 'Description too short, please elaborate'
    },
    {
      userId: uMarcus.id,
      projectId: pMeridian.id,
      workDate: new Date('2026-06-18T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Coordinating MEP installers for cable tray routing and checks',
      status: 'pending'
    },
    {
      userId: uMarcus.id,
      projectId: null,
      workDate: new Date('2026-06-19T08:00:00Z'),
      hoursRegular: 8.0,
      hoursOvertime: 0.0,
      workType: 'regular',
      description: 'Bi-weekly general staff meeting and engineering review',
      status: 'pending'
    }
  ];

  for (const ts of timesheetData) {
    await prisma.timesheet.create({ data: ts });
  }

  // Seed Calendar Events
  console.log('Seeding calendar events...');
  const prj1 = createdProjects.find(p => p.projectCode === 'PRJ-2026-001');
  const prj2 = createdProjects.find(p => p.projectCode === 'PRJ-2026-002');
  const alexUser = createdUsers.find(u => u.email === 'alex@proman.com');

  await prisma.calendarEvent.createMany({
    data: [
      {
        projectId: prj1?.id || null,
        title: 'Rapat Koordinasi Mingguan',
        description: 'Rapat progress mingguan tim lapangan ProMan.',
        eventType: 'meeting',
        eventDate: new Date('2026-06-10'),
        eventTime: '09:00',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj1?.id || null,
        title: 'Rapat Koordinasi Mingguan',
        description: 'Rapat progress mingguan tim lapangan ProMan.',
        eventType: 'meeting',
        eventDate: new Date('2026-06-17'),
        eventTime: '09:00',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj1?.id || null,
        title: 'Rapat Koordinasi Mingguan',
        description: 'Rapat progress mingguan tim lapangan ProMan.',
        eventType: 'meeting',
        eventDate: new Date('2026-06-24'),
        eventTime: '09:00',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj2?.id || null,
        title: 'Site Visit Owner Tianlala',
        description: 'Kunjungan lapangan owner Tianlala Group ke Grand Indonesia.',
        eventType: 'site_visit',
        eventDate: new Date('2026-06-17'),
        eventTime: '14:00',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj1?.id || null,
        title: 'Inspeksi Akhir MEP',
        description: 'Inspeksi kelaikan MEP di gedung kantor pusat Meridian.',
        eventType: 'inspection',
        eventDate: new Date('2026-06-18'),
        eventTime: '10:30',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj1?.id || null,
        title: 'Rapat Evaluasi Q2',
        description: 'Rapat komite manajemen evaluasi tengah tahun.',
        eventType: 'meeting',
        eventDate: new Date('2026-06-23'),
        eventTime: '13:00',
        createdBy: alexUser?.id || null
      },
      {
        projectId: prj2?.id || null,
        title: 'Serah Terima Dokumen',
        description: 'Serah terima gambar as-built dan dokumen penunjang lainnya.',
        eventType: 'other',
        eventDate: new Date('2026-06-30'),
        eventTime: '11:00',
        createdBy: alexUser?.id || null
      }
    ]
  });

  console.log('Database relations seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
