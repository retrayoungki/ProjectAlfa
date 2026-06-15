const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INDO_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Helper to format week range into Indonesian, e.g. "9 – 15 Juni 2026"
function formatIndoPeriod(start, end) {
  const startDay = start.getUTCDate();
  const startMonth = start.getUTCMonth();
  const startYear = start.getUTCFullYear();
  
  const endDay = end.getUTCDate();
  const endMonth = end.getUTCMonth();
  const endYear = end.getUTCFullYear();
  
  if (startYear !== endYear) {
    return `${startDay} ${INDO_MONTHS[startMonth]} ${startYear} – ${endDay} ${INDO_MONTHS[endMonth]} ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startDay} ${INDO_MONTHS[startMonth]} – ${endDay} ${INDO_MONTHS[endMonth]} ${endYear}`;
  }
  return `${startDay} – ${endDay} ${INDO_MONTHS[startMonth]} ${endYear}`;
}

// Helper to parse ISO Week and get dates
function getISOWeekBounds(weekStr) {
  const match = weekStr.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  
  // Jan 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mondayOfW1 = new Date(jan4.getTime() + diff * 24 * 60 * 60 * 1000);
  
  const monday = new Date(mondayOfW1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  return {
    start: new Date(monday.setUTCHours(0, 0, 0, 0)),
    end: new Date(sunday.setUTCHours(23, 59, 59, 999))
  };
}

// Helper for current week
function getCurrentWeekBounds() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
  return {
    start: new Date(monday.setUTCHours(0, 0, 0, 0)),
    end: new Date(sunday.setUTCHours(23, 59, 59, 999))
  };
}

// GET /api/timesheet
exports.getTimesheets = async (req, res) => {
  try {
    const { week, month, user_id, project_id, status } = req.query;
    const isPMOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PROJECT_MANAGER' || req.user.role === 'SENIOR_PROJECT_MANAGER';
    
    // Security check: regular users can only see their own timesheet data
    let filterUserId = user_id;
    if (!isPMOrAdmin) {
      filterUserId = req.user.id;
    }

    let startDate, endDate, periodLabel;
    let isWeekMode = true;

    if (month) {
      isWeekMode = false;
      const [year, m] = month.split('-').map(Number);
      startDate = new Date(Date.UTC(year, m - 1, 1));
      endDate = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      periodLabel = `${INDO_MONTHS[m - 1]} ${year}`;
    } else if (week) {
      const bounds = getISOWeekBounds(week);
      if (!bounds) return res.status(400).json({ error: 'Invalid week format. Use YYYY-Wxx' });
      startDate = bounds.start;
      endDate = bounds.end;
      periodLabel = formatIndoPeriod(startDate, endDate);
    } else {
      const bounds = getCurrentWeekBounds();
      startDate = bounds.start;
      endDate = bounds.end;
      periodLabel = formatIndoPeriod(startDate, endDate);
    }

    // Prepare where filter
    const where = {
      workDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (filterUserId) where.userId = filterUserId;
    if (project_id) where.projectId = project_id;
    if (status) where.status = status;

    // Fetch entries
    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { projectName: true, projectCode: true } },
        approver: { select: { name: true } }
      },
      orderBy: { workDate: 'desc' }
    });

    const entries = timesheets.map(t => ({
      id: t.id,
      user_id: t.userId,
      user_name: t.user?.name || '',
      user_role: t.user?.role || '',
      project_id: t.projectId,
      project_name: t.project ? t.project.projectName : 'Kegiatan Internal',
      project_code: t.project ? t.project.projectCode : null,
      work_date: t.workDate,
      hours_regular: t.hoursRegular,
      hours_overtime: t.hoursOvertime,
      hours_total: t.hoursRegular + t.hoursOvertime,
      work_type: t.workType,
      description: t.description,
      status: t.status,
      approved_by_name: t.approver ? t.approver.name : null,
      approved_at: t.approvedAt,
      rejection_reason: t.rejectionReason
    }));

    // Generate Weekly Summary (if in week mode or default)
    let weeklySummary = null;
    
    // Fetch users for rekap grid
    const allUsers = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });

    // If filtering by a single user, only show them in summary
    let summaryUsers = allUsers;
    if (filterUserId) {
      summaryUsers = allUsers.filter(u => u.id === filterUserId);
    }

    // Fetch all timesheets in period for summary calculations (unfiltered by status/project to show real totals)
    const summaryWhere = {
      workDate: { gte: startDate, lte: endDate }
    };
    if (filterUserId) summaryWhere.userId = filterUserId;

    const periodTimesheets = await prisma.timesheet.findMany({
      where: summaryWhere,
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { projectName: true } }
      }
    });

    const getUTCDayOfWeek = (date) => {
      const d = new Date(date).getUTCDay();
      return d === 0 ? 6 : d - 1; // Mon=0, Tue=1, ..., Sun=6
    };

    if (isWeekMode) {
      const perMember = summaryUsers.map(user => {
        const userEntries = periodTimesheets.filter(e => e.userId === user.id);
        const dayHours = [0, 0, 0, 0, 0, 0, 0];
        
        userEntries.forEach(e => {
          const dayIndex = getUTCDayOfWeek(e.workDate);
          if (dayIndex >= 0 && dayIndex < 7) {
            dayHours[dayIndex] += (e.hoursRegular + e.hoursOvertime);
          }
        });

        const week_regular = userEntries.reduce((sum, e) => sum + e.hoursRegular, 0);
        const week_overtime = userEntries.reduce((sum, e) => sum + e.hoursOvertime, 0);
        const week_total = week_regular + week_overtime;

        // Calculate status_summary
        let status_summary = 'missing';
        if (userEntries.length > 0) {
          const statuses = userEntries.map(e => e.status.toLowerCase());
          if (statuses.includes('pending')) {
            status_summary = 'pending';
          } else if (statuses.includes('rejected')) {
            status_summary = 'rejected'; // Maps to "Ada Ditolak" in front
          } else {
            // Check if missing workdays (Mon-Fri)
            let missingWorkday = false;
            for (let i = 0; i < 5; i++) {
              if (dayHours[i] === 0) {
                missingWorkday = true;
                break;
              }
            }
            status_summary = missingWorkday ? 'partial' : 'approved';
          }
        }

        return {
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          mon: dayHours[0],
          tue: dayHours[1],
          wed: dayHours[2],
          thu: dayHours[3],
          fri: dayHours[4],
          sat: dayHours[5],
          sun: dayHours[6],
          week_total,
          week_regular,
          week_overtime,
          status_summary
        };
      });

      // Daily totals
      const per_day_total = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      perMember.forEach(m => {
        per_day_total.mon += m.mon;
        per_day_total.tue += m.tue;
        per_day_total.wed += m.wed;
        per_day_total.thu += m.thu;
        per_day_total.fri += m.fri;
        per_day_total.sat += m.sat;
        per_day_total.sun += m.sun;
      });

      const grand_total_hours = perMember.reduce((sum, m) => sum + m.week_total, 0);
      const grand_overtime_hours = perMember.reduce((sum, m) => sum + m.week_overtime, 0);

      weeklySummary = {
        per_member: perMember,
        per_day_total,
        grand_total_hours,
        grand_overtime_hours,
        period_label: periodLabel
      };
    }

    // Calculate KPI Bar
    const total_hours_this_week = periodTimesheets.reduce((sum, e) => sum + e.hoursRegular + e.hoursOvertime, 0);
    const avg_hours_per_person = summaryUsers.length > 0 
      ? Math.round((total_hours_this_week / summaryUsers.length) * 10) / 10 
      : 0;
    const total_overtime = periodTimesheets.reduce((sum, e) => sum + e.hoursOvertime, 0);
    const pending_count = periodTimesheets.filter(e => e.status.toLowerCase() === 'pending').length;

    // Missing count: employees who haven't logged any time in this period
    const missing_count = summaryUsers.filter(u => {
      const userLogs = periodTimesheets.filter(e => e.userId === u.id);
      return userLogs.length === 0;
    }).length;

    const kpi = {
      total_hours_this_week,
      avg_hours_per_person,
      total_overtime,
      pending_count,
      missing_count
    };

    // Calculate Hours Per Project
    const projectMap = {};
    periodTimesheets.forEach(e => {
      const pId = e.projectId;
      const pName = e.project ? e.project.projectName : 'Kegiatan Internal';
      if (!projectMap[pId]) {
        projectMap[pId] = { project_id: pId, project_name: pName, total_hours: 0 };
      }
      projectMap[pId].total_hours += (e.hoursRegular + e.hoursOvertime);
    });

    const hours_per_project = Object.values(projectMap).sort((a, b) => b.total_hours - a.total_hours);

    res.json({
      entries,
      weekly_summary: weeklySummary,
      kpi,
      hours_per_project
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/timesheet/log
exports.getTimesheetLog = async (req, res) => {
  try {
    const { date, user_id, project_id } = req.query;
    if (!date) return res.status(400).json({ error: 'Date parameter (YYYY-MM-DD) is required' });

    const isPMOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PROJECT_MANAGER' || req.user.role === 'SENIOR_PROJECT_MANAGER';
    let filterUserId = user_id;
    if (!isPMOrAdmin) {
      filterUserId = req.user.id;
    }

    const targetDate = new Date(date);
    const gte = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const lte = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    const where = {
      workDate: { gte, lte }
    };
    if (filterUserId) where.userId = filterUserId;
    if (project_id) where.projectId = project_id;

    const logs = await prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { projectName: true, projectCode: true } }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { createdAt: 'asc' }
      ]
    });

    const formatted = logs.map(t => ({
      id: t.id,
      user_id: t.userId,
      user_name: t.user?.name || '',
      user_role: t.user?.role || '',
      project_id: t.projectId,
      project_name: t.project ? t.project.projectName : 'Kegiatan Internal',
      project_code: t.project ? t.project.projectCode : null,
      work_date: t.workDate,
      hours_regular: t.hoursRegular,
      hours_overtime: t.hoursOvertime,
      hours_total: t.hoursRegular + t.hoursOvertime,
      work_type: t.workType,
      description: t.description,
      status: t.status,
      rejection_reason: t.rejectionReason
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/timesheet
exports.createTimesheet = async (req, res) => {
  try {
    const { project_id, work_date, hours_regular, hours_overtime = 0, work_type = 'regular', description } = req.body;
    const userId = req.user.id; // derived from JWT token

    if (!work_date || hours_regular === undefined || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reg = Number(hours_regular);
    const ovt = Number(hours_overtime);

    // Validation checks
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7);
    const inputDate = new Date(work_date);
    if (inputDate > maxFutureDate) {
      return res.status(400).json({ error: 'Work date cannot be more than 7 days in the future' });
    }

    if (reg + ovt > 16) {
      return res.status(400).json({ error: 'Regular + Overtime hours cannot exceed 16 hours per day' });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long' });
    }

    // Check sum of hours on same day
    const dayStart = new Date(new Date(work_date).setUTCHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(work_date).setUTCHours(23, 59, 59, 999));
    const existing = await prisma.timesheet.findMany({
      where: {
        userId,
        workDate: { gte: dayStart, lte: dayEnd }
      }
    });

    const currentTotal = existing.reduce((sum, t) => sum + t.hoursRegular + t.hoursOvertime, 0);
    if (currentTotal + reg + ovt > 16) {
      return res.status(400).json({ error: `Total daily hours would exceed 16 hours. You have already logged ${currentTotal} hours on this day.` });
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        userId,
        projectId: project_id || null,
        workDate: new Date(work_date),
        hoursRegular: reg,
        hoursOvertime: ovt,
        workType: work_type,
        description,
        status: 'pending'
      },
      include: {
        project: { select: { projectName: true } }
      }
    });

    res.status(201).json(timesheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/timesheet/:id
exports.updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, work_date, hours_regular, hours_overtime = 0, work_type, description } = req.body;

    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) return res.status(404).json({ error: 'Timesheet entry not found' });

    if (timesheet.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own timesheet entries' });
    }

    if (timesheet.status.toLowerCase() === 'approved') {
      return res.status(400).json({ error: 'Cannot edit an already approved timesheet entry' });
    }

    const reg = hours_regular !== undefined ? Number(hours_regular) : timesheet.hoursRegular;
    const ovt = hours_overtime !== undefined ? Number(hours_overtime) : timesheet.hoursOvertime;
    const wDate = work_date ? new Date(work_date) : timesheet.workDate;
    const desc = description !== undefined ? description : timesheet.description;

    // Validation checks
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7);
    if (wDate > maxFutureDate) {
      return res.status(400).json({ error: 'Work date cannot be more than 7 days in the future' });
    }

    if (reg + ovt > 16) {
      return res.status(400).json({ error: 'Regular + Overtime hours cannot exceed 16 hours per day' });
    }

    if (desc.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters long' });
    }

    // Check sum of hours on same day, excluding this timesheet
    const dayStart = new Date(new Date(wDate).setUTCHours(0, 0, 0, 0));
    const dayEnd = new Date(new Date(wDate).setUTCHours(23, 59, 59, 999));
    const existing = await prisma.timesheet.findMany({
      where: {
        userId: req.user.id,
        workDate: { gte: dayStart, lte: dayEnd },
        id: { not: id }
      }
    });

    const currentTotal = existing.reduce((sum, t) => sum + t.hoursRegular + t.hoursOvertime, 0);
    if (currentTotal + reg + ovt > 16) {
      return res.status(400).json({ error: `Total daily hours would exceed 16 hours. You have already logged ${currentTotal} hours on this day.` });
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        projectId: project_id || null,
        workDate: wDate,
        hoursRegular: reg,
        hoursOvertime: ovt,
        workType: work_type || timesheet.workType,
        description: desc,
        status: 'pending', // Resets back to pending on modification
        rejectionReason: null // Reset rejection reason if any
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /api/timesheet/:id
exports.deleteTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user.role === 'ADMIN';

    const timesheet = await prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) return res.status(404).json({ error: 'Timesheet entry not found' });

    // Admins can delete anyone's timesheets, regular users only their own
    if (!isSuperAdmin && timesheet.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own timesheet entries' });
    }

    // Regular users cannot delete approved entries
    if (!isSuperAdmin && timesheet.status.toLowerCase() === 'approved') {
      return res.status(400).json({ error: 'Cannot delete approved timesheet entries' });
    }

    await prisma.timesheet.delete({ where: { id } });
    res.json({ message: 'Timesheet entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/timesheet/:id/approve
exports.approveTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: null
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/timesheet/:id/reject
exports.rejectTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: rejection_reason
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PATCH /api/timesheet/approve-bulk
exports.approveBulk = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Invalid input. Provide an array of UUIDs.' });
    }

    const userId = req.user.id;
    const failed_ids = [];
    let approved_count = 0;

    for (const id of ids) {
      try {
        await prisma.timesheet.update({
          where: { id },
          data: {
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date(),
            rejectionReason: null
          }
        });
        approved_count++;
      } catch (err) {
        failed_ids.push(id);
      }
    }

    res.json({ approved_count, failed_ids });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/timesheet/pending
exports.getPendingTimesheets = async (req, res) => {
  try {
    const pending = await prisma.timesheet.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { projectName: true, projectCode: true } }
      },
      orderBy: [
        { workDate: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    const formatted = pending.map(t => ({
      id: t.id,
      user_id: t.userId,
      user_name: t.user?.name || '',
      user_role: t.user?.role || '',
      project_id: t.projectId,
      project_name: t.project ? t.project.projectName : 'Kegiatan Internal',
      project_code: t.project ? t.project.projectCode : null,
      work_date: t.workDate,
      hours_regular: t.hoursRegular,
      hours_overtime: t.hoursOvertime,
      hours_total: t.hoursRegular + t.hoursOvertime,
      work_type: t.workType,
      description: t.description,
      status: t.status
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET /api/timesheet/export
exports.exportTimesheets = async (req, res) => {
  try {
    const { start_date, end_date, user_id, project_id } = req.query;
    const isPMOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PROJECT_MANAGER' || req.user.role === 'SENIOR_PROJECT_MANAGER';
    
    let filterUserId = user_id;
    if (!isPMOrAdmin) {
      filterUserId = req.user.id;
    }

    const where = {};
    if (start_date || end_date) {
      where.workDate = {};
      if (start_date) where.workDate.gte = new Date(start_date);
      if (end_date) where.workDate.lte = new Date(end_date);
    }
    if (filterUserId) where.userId = filterUserId;
    if (project_id) where.projectId = project_id;

    const entries = await prisma.timesheet.findMany({
      where,
      include: {
        user: { select: { name: true, role: true } },
        project: { select: { projectName: true, projectCode: true } }
      },
      orderBy: { workDate: 'asc' }
    });

    const formatted = entries.map(t => ({
      id: t.id,
      user_name: t.user?.name || '',
      user_role: t.user?.role || '',
      project_name: t.project ? t.project.projectName : 'Kegiatan Internal',
      project_code: t.project ? t.project.projectCode : '',
      work_date: t.workDate.toISOString().split('T')[0],
      hours_regular: t.hoursRegular,
      hours_overtime: t.hoursOvertime,
      hours_total: t.hoursRegular + t.hoursOvertime,
      work_type: t.workType,
      description: t.description,
      status: t.status
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
