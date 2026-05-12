const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_alfa',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// POST /api/projects
app.post('/api/projects', async (req, res) => {
  const client = await pool.connect();
  try {
    const { 
      projectName, clientId, projectType, description, 
      startDate, endDate, budget, billingType, 
      projectManagerId, teamMemberIds, milestones 
    } = req.body;

    // 1. Validation
    if (!projectName || !clientId || !startDate || !endDate || budget < 0) {
      return res.status(400).json({ error: 'Missing required fields or invalid budget' });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    await client.query('BEGIN');

    // 2. Auto Generate Project Code: PRJ-YYYY-XXX
    const year = new Date().getFullYear();
    const countRes = await client.query('SELECT count(*) FROM projects');
    const projectCode = `PRJ-${year}-${String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0')}`;

    // 3. Status Logic
    let status = 'On Track';
    const now = new Date();
    if (new Date(endDate) < now) {
      status = 'Delayed';
    }

    // 4. Insert Project
    const projectInsertRes = await client.query(
      `INSERT INTO projects 
       (project_name, client_id, project_code, project_type, description, start_date, end_date, budget, billing_type, progress, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id`,
      [projectName, clientId, projectCode, projectType, description, startDate, endDate, budget, billingType, 0, status]
    );

    const projectId = projectInsertRes.rows[0].id;

    // 5. Insert Team (PM and Members)
    // Add PM
    if (projectManagerId) {
      await client.query(
        'INSERT INTO project_team (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, projectManagerId, 'Project Manager']
      );
    }
    
    // Add Team Members
    if (teamMemberIds && teamMemberIds.length > 0) {
      for (const userId of teamMemberIds) {
        await client.query(
          'INSERT INTO project_team (project_id, user_id, role) VALUES ($1, $2, $3)',
          [projectId, userId, 'Team Member']
        );
      }
    }

    // 6. Insert Milestones
    if (milestones && milestones.length > 0) {
      for (const m of milestones) {
        await client.query(
          'INSERT INTO milestones (project_id, name, date, type) VALUES ($1, $2, $3, $4)',
          [projectId, m.name, m.date, m.type]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ 
      message: 'Project created successfully', 
      projectId, 
      projectCode,
      status 
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Dropdown data endpoints
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, role FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
