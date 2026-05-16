# PRO MAN - Enterprise Construction Management System

PRO MAN is a modern, scalable project management and financial oversight application designed specifically for the construction and architecture industry. This application follows a robust SaaS architecture to handle complex workflows, cost estimations, scheduling, and internal communications.

## 🚀 System Architecture

This project is structured as a monorepo, strictly separating frontend UI, backend services, database migrations, and documentation:

- **/frontend**: React + Vite SPA, styled with Tailwind CSS. Follows clean architecture.
- **/backend**: Reserved for future Node.js/Express API services or Edge Functions.
- **/database**: Reserved for Supabase/PostgreSQL schemas, migrations, and seed data.
- **/docs**: Comprehensive project documentation, SOPs, and deployment guides.

## 💻 Tech Stack (Frontend)

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Database / BaaS**: Firebase (Transitioning to Supabase)
- **Icons**: Google Material Symbols

## 📁 Frontend Architecture (`/frontend/src`)

The frontend strictly enforces a clean separation of concerns:

- `components/`: Pure, reusable UI elements (Buttons, Modals, Tables).
- `pages/`: Stateful container components representing full screens.
- `layouts/`: Structural wrappers (e.g., `MainLayout`, `AuthLayout`).
- `contexts/`: React Context providers for global state (`AuthContext`, `DataContext`).
- `services/`: API abstractions and database interactions (No DB logic inside UI components!).
- `hooks/`: Reusable React hooks.
- `config/`: Application configuration (Routes, RBAC).
- `types/`: JSDoc definitions for enhanced IDE support.

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Role-Based Access Control (RBAC)

The system enforces strict RBAC to ensure data security. Available roles:
- **Admin**: Full system access, configuration, and user management.
- **Director**: High-level financial oversight and executive reports.
- **Senior Project Manager**: Multi-project oversight and final approvals.
- **Project Manager**: Operational control over assigned projects.
- **Finance**: Invoice, ledger, and cost engine access.

## 🏗️ Deployment

Production deployment is fully decoupled. The `/frontend` directory can be deployed directly to Vercel, Netlify, or Firebase Hosting. Database migrations in `/database` must be run sequentially against the production Supabase instance.
