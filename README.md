# ProMan – Project & Financial Management System

A premium SaaS dashboard for professional consulting firms, tax consultants, accounting firms, and contractors.

## Project Structure

```
ProMan/
├── frontend/       # Vite + React web application
├── backend/        # API server (future)
├── database/       # Schemas, migrations, seeds (future)
├── docs/           # Project documentation
├── scratch/        # Temporary files & experiments
└── README.md
```

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router DOM |
| Styling | Vanilla CSS (custom design system) |

## Features

- 📊 **Dashboard** — KPI cards, revenue chart, project status donut
- 📁 **Projects** — Table + detail view with Gantt timeline
- ✅ **Tasks** — Drag & drop Kanban board
- 💰 **Finance** — Invoices, expenses, budget tracking
- 👥 **Clients** — Client portal with milestones
- ⏱️ **Timesheet** — Weekly hour tracking grid
- 📄 **Documents** — File manager with grid/list view
- 🌙 **Dark Mode** — Full dark theme support
- 📱 **Mobile** — Fully responsive with bottom navigation
