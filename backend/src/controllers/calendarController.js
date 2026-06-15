const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to construct unified events array for a given date range and filter parameters
const fetchUnifiedEvents = async ({ startDate, endDate, projectId, typeFilter }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = [];

  // 1. DEADLINE PROYEK (contract_end_date)
  if (!typeFilter || typeFilter === 'deadline') {
    const projectDeadlines = await prisma.project.findMany({
      where: {
        deletedAt: null,
        contractEndDate: {
          gte: startDate,
          lte: endDate
        },
        ...(projectId && { id: projectId })
      },
      select: {
        id: true,
        projectName: true,
        projectCode: true,
        status: true,
        contractEndDate: true
      }
    });

    projectDeadlines.forEach(p => {
      if (p.contractEndDate) {
        results.push({
          id: `deadline-${p.id}`,
          type: 'deadline',
          title: `Deadline Kontrak: ${p.projectName}`,
          date: p.contractEndDate.toISOString().split('T')[0],
          project_id: p.id,
          project_name: p.projectName,
          project_code: p.projectCode,
          color: '#E24B4A',
          meta: {
            status: p.status,
            contract_end_date: p.contractEndDate
          }
        });
      }
    });
  }

  // 2. MILESTONE PROYEK (target_date)
  if (!typeFilter || typeFilter === 'milestone') {
    const milestones = await prisma.projectMilestone.findMany({
      where: {
        project: { deletedAt: null },
        targetDate: {
          gte: startDate,
          lte: endDate
        },
        ...(projectId && { projectId })
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    milestones.forEach(m => {
      if (m.targetDate) {
        results.push({
          id: `milestone-${m.id}`,
          type: 'milestone',
          title: `Milestone: ${m.milestoneName}`,
          date: m.targetDate.toISOString().split('T')[0],
          project_id: m.projectId,
          project_name: m.project?.projectName || '',
          project_code: m.project?.projectCode || '',
          color: '#10B981',
          meta: {
            status: m.status,
            milestone_name: m.milestoneName
          }
        });
      }
    });
  }

  // 3. TASK DUE DATE (due_date)
  if (!typeFilter || typeFilter === 'task') {
    const tasks = await prisma.projectTask.findMany({
      where: {
        project: { deletedAt: null },
        dueDate: {
          gte: startDate,
          lte: endDate
        },
        ...(projectId && { projectId })
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    tasks.forEach(t => {
      if (t.dueDate) {
        const isOverdue = t.status !== 'done' && new Date(t.dueDate) < today;
        results.push({
          id: `task-${t.id}`,
          type: 'task',
          title: `Task: ${t.title}`,
          date: t.dueDate.toISOString().split('T')[0],
          project_id: t.projectId,
          project_name: t.project?.projectName || '',
          project_code: t.project?.projectCode || '',
          color: '#3B82F6',
          meta: {
            status: t.status,
            priority: t.priority,
            assigned_name: t.assignedName,
            is_overdue: !!isOverdue
          }
        });
      }
    });
  }

  // 4. JADWAL PENAGIHAN TERMIN (submitted_date & paid_date)
  if (!typeFilter || typeFilter === 'termin') {
    const termins = await prisma.projectTermin.findMany({
      where: {
        project: { deletedAt: null },
        OR: [
          { submittedDate: { gte: startDate, lte: endDate } },
          { paidDate: { gte: startDate, lte: endDate } }
        ],
        ...(projectId && { projectId })
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    termins.forEach(t => {
      if (t.submittedDate && t.submittedDate >= startDate && t.submittedDate <= endDate) {
        results.push({
          id: `termin-sub-${t.id}`,
          type: 'termin',
          title: `Tagihan Submitted: ${t.terminLabel || `Termin ${t.terminNumber}`} - ${t.project?.projectName}`,
          date: t.submittedDate.toISOString().split('T')[0],
          project_id: t.projectId,
          project_name: t.project?.projectName || '',
          project_code: t.project?.projectCode || '',
          color: '#F59E0B',
          meta: {
            termin_label: t.terminLabel || `Termin ${t.terminNumber}`,
            status: 'submitted',
            nilai_termin: t.nilaiTermin
          }
        });
      }
      if (t.paidDate && t.paidDate >= startDate && t.paidDate <= endDate) {
        results.push({
          id: `termin-paid-${t.id}`,
          type: 'termin',
          title: `Tagihan Paid: ${t.terminLabel || `Termin ${t.terminNumber}`} - ${t.project?.projectName}`,
          date: t.paidDate.toISOString().split('T')[0],
          project_id: t.projectId,
          project_name: t.project?.projectName || '',
          project_code: t.project?.projectCode || '',
          color: '#F59E0B',
          meta: {
            termin_label: t.terminLabel || `Termin ${t.terminNumber}`,
            status: 'paid',
            nilai_termin: t.nilaiTermin
          }
        });
      }
    });
  }

  // 5. MANUAL EVENTS / MEETINGS (event_date)
  if (!typeFilter || typeFilter === 'meeting') {
    const manualEvents = await prisma.calendarEvent.findMany({
      where: {
        OR: [
          { project: null },
          { project: { deletedAt: null } }
        ],
        eventDate: {
          gte: startDate,
          lte: endDate
        },
        ...(projectId && { projectId })
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    manualEvents.forEach(e => {
      if (e.eventDate) {
        results.push({
          id: e.id,
          type: 'meeting',
          title: e.title,
          date: e.eventDate.toISOString().split('T')[0],
          end_date: e.endDate ? e.endDate.toISOString().split('T')[0] : undefined,
          project_id: e.projectId,
          project_name: e.project?.projectName || '',
          project_code: e.project?.projectCode || '',
          color: '#8B5CF6',
          meta: {
            event_type: e.eventType, // meeting | site_visit | inspection | other
            event_time: e.eventTime,
            description: e.description
          }
        });
      }
    });
  }

  // Sort events chronologically (date ASC)
  results.sort((a, b) => a.date.localeCompare(b.date));

  return results;
};

// 1. Get unified events for a given month (YYYY-MM)
exports.getEvents = async (req, res) => {
  try {
    const { month, project_id, type } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Query param month wajib diisi dengan format YYYY-MM' });
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const events = await fetchUnifiedEvents({
      startDate,
      endDate,
      projectId: project_id,
      typeFilter: type
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Get 10 upcoming events from today onwards
exports.getUpcoming = async (req, res) => {
  try {
    const { project_id } = req.query;
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Set search window to 1 year forward to capture enough events
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const allEvents = await fetchUnifiedEvents({
      startDate,
      endDate,
      projectId: project_id,
      typeFilter: null
    });

    // Limit to 10 events
    res.json(allEvents.slice(0, 10));
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3. Get all events for a specific date (YYYY-MM-DD)
exports.getEventsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { project_id } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Format date wajib YYYY-MM-DD' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    const events = await fetchUnifiedEvents({
      startDate,
      endDate,
      projectId: project_id,
      typeFilter: null
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events by date:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. Create manual event (calendar_events table)
exports.createEvent = async (req, res) => {
  try {
    const { project_id, title, description, event_type, event_date, event_time, end_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Judul event wajib diisi.' });
    }
    if (!event_date) {
      return res.status(400).json({ error: 'Tanggal event wajib diisi.' });
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        projectId: project_id || null,
        title,
        description: description || null,
        eventType: event_type || 'meeting',
        eventDate: new Date(event_date),
        eventTime: event_time || null,
        endDate: end_date ? new Date(end_date) : null,
        createdBy: req.user.id
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    res.status(201).json({
      id: newEvent.id,
      type: 'meeting',
      title: newEvent.title,
      date: newEvent.eventDate.toISOString().split('T')[0],
      end_date: newEvent.endDate ? newEvent.endDate.toISOString().split('T')[0] : undefined,
      project_id: newEvent.projectId,
      project_name: newEvent.project?.projectName || '',
      project_code: newEvent.project?.projectCode || '',
      color: '#8B5CF6',
      meta: {
        event_type: newEvent.eventType,
        event_time: newEvent.eventTime,
        description: newEvent.description
      }
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. Update manual event (only calendar_events table)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_id, title, description, event_type, event_date, event_time, end_date } = req.body;

    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        projectId: project_id !== undefined ? (project_id || null) : existing.projectId,
        title: title !== undefined ? title : existing.title,
        description: description !== undefined ? description : existing.description,
        eventType: event_type !== undefined ? event_type : existing.eventType,
        eventDate: event_date !== undefined ? new Date(event_date) : existing.eventDate,
        eventTime: event_time !== undefined ? event_time : existing.eventTime,
        endDate: end_date !== undefined ? (end_date ? new Date(end_date) : null) : existing.endDate
      },
      include: {
        project: {
          select: {
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    res.json({
      id: updated.id,
      type: 'meeting',
      title: updated.title,
      date: updated.eventDate.toISOString().split('T')[0],
      end_date: updated.endDate ? updated.endDate.toISOString().split('T')[0] : undefined,
      project_id: updated.projectId,
      project_name: updated.project?.projectName || '',
      project_code: updated.project?.projectCode || '',
      color: '#8B5CF6',
      meta: {
        event_type: updated.eventType,
        event_time: updated.eventTime,
        description: updated.description
      }
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 6. Delete manual event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event tidak ditemukan.' });
    }

    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ message: 'Event berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
