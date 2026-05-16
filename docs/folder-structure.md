# PRO MAN Folder Structure Guide

This document outlines the standard architecture of the PRO MAN SaaS platform.

```plaintext
/proman
├── /backend                    # Reserved for future Node.js/Edge functions
│   ├── /api                    # REST/GraphQL route handlers
│   ├── /middleware             # Express/Fastify middlewares (Auth, Rate Limit)
│   ├── /services               # Backend business logic
│   └── /utils                  # Shared backend utilities
│
├── /database                   # Supabase / PostgreSQL management
│   ├── /erd                    # Entity Relationship Diagrams (Images/Markdown)
│   ├── /migrations             # SQL migration scripts
│   ├── /schema                 # Schema definitions
│   └── /seed                   # Seed data for local testing
│
├── /docs                       # Internal Documentation
│   ├── /api-docs               # Postman collections or OpenAPI specs
│   ├── /deployment             # CI/CD and hosting setup instructions
│   ├── /proposal               # Project scope and business requirements
│   └── /sop                    # Standard Operating Procedures for developers
│
└── /frontend                   # React/Vite Single Page Application
    ├── /public                 # Static assets (Favicon, Logo, raw files)
    └── /src                    # Application Source Code
        ├── /assets             # Processed assets (CSS, Images used in JS)
        ├── /components         # Pure, reusable UI blocks (Buttons, Modals, Layout elements)
        ├── /config             # App-wide configurations (Routing, RBAC constants)
        ├── /contexts           # React Context Providers (State Management)
        ├── /hooks              # Custom React Hooks (useAuth, useData)
        ├── /layouts            # Structural Page Wrappers (MainLayout, AuthLayout)
        ├── /pages              # Full-screen container components (Dashboard, Login)
        ├── /services           # API integration and Database abstractions
        │   └── /supabase       # Dedicated Supabase integration logic
        ├── /types              # JSDoc type definitions
        └── /utils              # Helper functions (Formatting, Validation)
```

## Core Principles
1. **No Business Logic in UI**: React components in `/components` and `/pages` should only handle rendering and local UI state. All data fetching and complex logic must reside in `/services` or `/hooks`.
2. **Absolute Imports** (Future Config): Use `@/` to import files to avoid `../../../` hell.
3. **Keep Contexts Small**: Avoid massive global states. Split contexts by domain (e.g., `AuthContext`, `ProjectContext`).
