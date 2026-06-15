const express = require('express');
const path = require('path');
const cors = require('cors');
const dashboardRoutes = require('./routes/dashboardRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const clientRoutes = require('./routes/clientRoutes');
const financeRoutes = require('./routes/financeRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const documentRoutes = require('./routes/documentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const materialRoutes = require('./routes/materialRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const http = require('http');
const socketIo = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/timesheet', timesheetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Setup HTTP server and bind Socket.IO
const server = http.createServer(app);
socketIo.init(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
