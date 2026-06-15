const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to check write access for a project task
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

// Helper to recalculate total_tasks and completed_tasks in projects
const updateProjectTaskStats = async (projectId) => {
  if (!projectId) return;
  try {
    const totalTasks = await prisma.projectTask.count({
      where: { projectId }
    });
    const completedTasks = await prisma.projectTask.count({
      where: { projectId, status: 'done' }
    });
    await prisma.project.update({
      where: { id: projectId },
      data: { totalTasks, completedTasks }
    });
  } catch (error) {
    console.error(`Error updating stats for project ${projectId}:`, error);
  }
};

// 1. Get all tasks (cross-project)
exports.getAllTasks = async (req, res) => {
  try {
    const {
      project_id,
      status,
      priority,
      division,
      assigned_to,
      overdue,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Build general filters (exclude status, priority, and overdue for KPI summary calculation)
    const baseFilter = {
      project: { deletedAt: null } // Only tasks from non-soft-deleted projects
    };

    if (project_id) {
      baseFilter.projectId = project_id;
    }
    if (division) {
      baseFilter.division = division.toLowerCase();
    }
    if (assigned_to) {
      baseFilter.assignedTo = assigned_to;
    }
    if (search) {
      baseFilter.title = { contains: search, mode: 'insensitive' };
    }

    // 2. Fetch tasks for KPI Summary (only with base filters applied)
    const summaryTasks = await prisma.projectTask.findMany({
      where: baseFilter
    });

    let todo = 0, in_progress = 0, review = 0, done = 0, overdueCount = 0;
    summaryTasks.forEach(t => {
      const statusLower = t.status ? t.status.toLowerCase() : '';
      if (statusLower === 'todo') todo++;
      else if (statusLower === 'in_progress') in_progress++;
      else if (statusLower === 'review') review++;
      else if (statusLower === 'done') done++;

      if (statusLower !== 'done' && t.dueDate) {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          overdueCount++;
        }
      }
    });

    // 3. Build query filters (including status, priority, and overdue)
    const listFilter = { ...baseFilter };

    if (status) {
      listFilter.status = status.toLowerCase();
    }
    if (priority) {
      listFilter.priority = priority.toLowerCase();
    }
    if (overdue === 'true') {
      listFilter.status = { not: 'done' };
      listFilter.dueDate = { lt: today };
    }

    // 4. Fetch the matched tasks with project relations
    const matchedTasks = await prisma.projectTask.findMany({
      where: listFilter,
      include: {
        project: {
          select: {
            id: true,
            projectName: true,
            projectCode: true
          }
        }
      }
    });

    // 5. Flatten structure and add is_overdue flags
    const mappedTasks = matchedTasks.map(t => {
      const isOverdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        project_id: t.projectId,
        project_name: t.project?.projectName || '',
        project_code: t.project?.projectCode || '',
        division: t.division,
        status: t.status,
        priority: t.priority,
        assigned_to: t.assignedTo,
        assigned_name: t.assignedName,
        due_date: t.dueDate,
        completed_date: t.completedDate,
        is_overdue: !!isOverdue,
        created_at: t.createdAt
      };
    });

    // 6. Sort results: Overdue first -> due_date ASC -> priority (high -> medium -> low)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    mappedTasks.sort((a, b) => {
      // a) Overdue tasks first
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;

      // b) due_date ASC (nulls at the end)
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        const diff = new Date(a.due_date) - new Date(b.due_date);
        if (diff !== 0) return diff;
      }

      // c) Priority: high -> medium -> low
      const weightA = priorityWeight[a.priority?.toLowerCase()] || 0;
      const weightB = priorityWeight[b.priority?.toLowerCase()] || 0;
      return weightB - weightA;
    });

    // 7. Paginate tasks
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTasks = mappedTasks.slice(startIndex, startIndex + limitNum);

    res.json({
      tasks: paginatedTasks,
      summary: {
        total: summaryTasks.length,
        todo,
        in_progress,
        review,
        done,
        overdue: overdueCount
      }
    });
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Get my tasks (automatically filter by currently logged-in user)
exports.getMyTasks = async (req, res) => {
  try {
    // Inject assigned_to filter as current user ID from JWT
    req.query.assigned_to = req.user.id;
    return exports.getAllTasks(req, res);
  } catch (error) {
    console.error('Error in getMyTasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3. Create a task (cross-project)
exports.createTask = async (req, res) => {
  try {
    const { project_id, title, description, division, priority, assigned_to, due_date, status } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'Proyek wajib diisi.' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Judul task wajib diisi.' });
    }

    // Check write access for the target project
    const hasAccess = await checkTaskWriteAccess(project_id, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk membuat task di proyek ini.' });
    }

    // Resolve assigned user's name
    let assignedName = null;
    if (assigned_to) {
      const assignedUser = await prisma.user.findUnique({ where: { id: assigned_to } });
      if (assignedUser) {
        assignedName = assignedUser.name;
      }
    }

    const taskStatus = status ? status.toLowerCase() : 'todo';
    const task = await prisma.projectTask.create({
      data: {
        projectId: project_id,
        title,
        description: description || null,
        division: division ? division.toLowerCase() : 'other',
        status: taskStatus,
        priority: priority ? priority.toLowerCase() : 'medium',
        assignedTo: assigned_to || null,
        assignedName,
        dueDate: due_date ? new Date(due_date) : null,
        completedDate: taskStatus === 'done' ? new Date() : null,
        createdBy: req.user.id
      }
    });

    // Update statistics on project table
    await updateProjectTaskStats(project_id);

    // Record activity log
    await prisma.projectActivityLog.create({
      data: {
        projectId: project_id,
        userId: req.user.id,
        userName: req.user.name,
        action: `menambahkan tugas baru: "${title}"`
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error in createTask:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 4. Update a task (cross-project)
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { project_id, title, description, division, priority, assigned_to, due_date, status } = req.body;

    const existingTask = await prisma.projectTask.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    const isManagerOldProject = await checkTaskWriteAccess(existingTask.projectId, req.user);
    const isAssigned = existingTask.assignedTo === req.user.id;

    // Check if user is a normal team member attempting to edit fields they shouldn't
    const isFieldsEditRequested = (title !== undefined || description !== undefined || division !== undefined ||
      priority !== undefined || assigned_to !== undefined || due_date !== undefined || project_id !== undefined);

    if (!isManagerOldProject) {
      if (isAssigned && !isFieldsEditRequested && status !== undefined) {
        // Normal user only allowed to update status if they are the assignee
      } else {
        return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk mengubah data task ini.' });
      }
    }

    // Check target project write access if transferring projects
    if (project_id && project_id !== existingTask.projectId) {
      const isManagerNewProject = await checkTaskWriteAccess(project_id, req.user);
      if (!isManagerNewProject) {
        return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk memindahkan task ke proyek ini.' });
      }
    }

    // Resolve assigned user's name if updated
    let assignedName = existingTask.assignedName;
    if (assigned_to !== undefined) {
      if (assigned_to) {
        const assignedUser = await prisma.user.findUnique({ where: { id: assigned_to } });
        assignedName = assignedUser ? assignedUser.name : null;
      } else {
        assignedName = null;
      }
    }

    // Determine completed date based on status changes
    let completedDate = existingTask.completedDate;
    if (status !== undefined) {
      const newStatus = status.toLowerCase();
      if (newStatus === 'done' && existingTask.status !== 'done') {
        completedDate = new Date();
      } else if (newStatus !== 'done' && existingTask.status === 'done') {
        completedDate = null;
      }
    }

    // Prepare update parameters
    const updateData = {};
    if (project_id !== undefined) updateData.projectId = project_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (division !== undefined) updateData.division = division ? division.toLowerCase() : null;
    if (priority !== undefined) updateData.priority = priority ? priority.toLowerCase() : null;
    if (assigned_to !== undefined) updateData.assignedTo = assigned_to || null;
    if (assigned_to !== undefined) updateData.assignedName = assignedName;
    if (due_date !== undefined) updateData.dueDate = due_date ? new Date(due_date) : null;
    if (status !== undefined) updateData.status = status.toLowerCase();
    updateData.completedDate = completedDate;

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: updateData
    });

    // Update stats on projects
    await updateProjectTaskStats(existingTask.projectId);
    if (project_id && project_id !== existingTask.projectId) {
      await updateProjectTaskStats(project_id);
    }

    // Log Activity
    const actionText = status !== undefined && status.toLowerCase() === 'done'
      ? `menyelesaikan tugas: "${updatedTask.title}"`
      : `mengubah tugas "${updatedTask.title}"`;

    await prisma.projectActivityLog.create({
      data: {
        projectId: updatedTask.projectId,
        userId: req.user.id,
        userName: req.user.name,
        action: actionText
      }
    });

    if (project_id && project_id !== existingTask.projectId) {
      await prisma.projectActivityLog.create({
        data: {
          projectId: existingTask.projectId,
          userId: req.user.id,
          userName: req.user.name,
          action: `memindahkan tugas "${updatedTask.title}" ke proyek lain`
        }
      });
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error in updateTask:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 5. Delete a task (cross-project)
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const existingTask = await prisma.projectTask.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    const hasAccess = await checkTaskWriteAccess(existingTask.projectId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk menghapus task ini.' });
    }

    await prisma.projectTask.delete({
      where: { id: taskId }
    });

    // Update project statistics
    await updateProjectTaskStats(existingTask.projectId);

    // Log Activity
    await prisma.projectActivityLog.create({
      data: {
        projectId: existingTask.projectId,
        userId: req.user.id,
        userName: req.user.name,
        action: `menghapus tugas: "${existingTask.title}"`
      }
    });

    res.json({ message: 'Tugas berhasil dihapus.' });
  } catch (error) {
    console.error('Error in deleteTask:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 6. Shortcut: Update status only (Kanban drag-drop)
exports.updateTaskStatusOnly = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status wajib diisi.' });
    }

    const existingTask = await prisma.projectTask.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task tidak ditemukan.' });
    }

    const isManager = await checkTaskWriteAccess(existingTask.projectId, req.user);
    const isAssigned = existingTask.assignedTo === req.user.id;

    if (!isManager && !isAssigned) {
      return res.status(403).json({ error: 'Forbidden: Anda tidak memiliki akses untuk mengubah status task ini.' });
    }

    const newStatus = status.toLowerCase();
    let completedDate = existingTask.completedDate;
    if (newStatus === 'done' && existingTask.status !== 'done') {
      completedDate = new Date();
    } else if (newStatus !== 'done' && existingTask.status === 'done') {
      completedDate = null;
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedDate
      }
    });

    // Update stats on project table
    await updateProjectTaskStats(existingTask.projectId);

    // Log Activity
    const actionText = newStatus === 'done'
      ? `menyelesaikan tugas: "${existingTask.title}"`
      : `mengubah status tugas "${existingTask.title}" ke "${status}"`;

    await prisma.projectActivityLog.create({
      data: {
        projectId: existingTask.projectId,
        userId: req.user.id,
        userName: req.user.name,
        action: actionText
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error in updateTaskStatusOnly:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 7. Get filter options for dropdowns (active projects, users, divisions)
exports.getFilterOptions = async (req, res) => {
  try {
    // Only show projects that are not completed/on_hold and not deleted
    const projectsData = await prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['completed', 'on_hold'] }
      },
      select: {
        id: true,
        projectName: true,
        projectCode: true
      }
    });

    const projects = projectsData.map(p => ({
      id: p.id,
      project_name: p.projectName,
      project_code: p.projectCode
    }));

    const usersData = await prisma.user.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const divisions = ["sipil", "mep", "arsitektur", "finishing", "persiapan", "other"];

    res.json({
      projects,
      users: usersData,
      divisions
    });
  } catch (error) {
    console.error('Error in getFilterOptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
