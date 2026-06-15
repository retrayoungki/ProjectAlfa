const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSummary = async (req, res) => {
  try {
    // 1. Total Projects count
    const totalProjects = await prisma.project.count();

    // 2. Active Projects count (status = ONGOING)
    const activeProjects = await prisma.project.count({
      where: {
        status: 'EXECUTION'
      }
    });

    // 3. Overdue Tasks count
    const overdueTasks = await prisma.task.count({
      where: {
        status: { not: 'DONE' },
        deadline: {
          lt: new Date()
        }
      }
    });

    // 4. Monthly Revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlyProjects = await prisma.project.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      select: {
        budget: true
      }
    });

    const monthlyRevenue = monthlyProjects.reduce((sum, p) => sum + p.budget, 0);

    res.json({
      totalProjects,
      activeProjects,
      overdueTasks,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, status, revenue } = req.body;
    if (!name || !status) {
      return res.status(400).json({ error: 'Name and status are required' });
    }
    const newProject = await prisma.project.create({
      data: {
        name,
        status,
        budget: parseFloat(revenue) || 0.0,
      }
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
