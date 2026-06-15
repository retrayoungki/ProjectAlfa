/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Timesheet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Client";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Timesheet";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name" TEXT NOT NULL,
    "short_name" TEXT,
    "client_type" TEXT NOT NULL DEFAULT 'other',
    "pic_name" TEXT,
    "pic_position" TEXT,
    "pic_phone" TEXT,
    "pic_email" TEXT,
    "pic_2_name" TEXT,
    "pic_2_phone" TEXT,
    "pic_2_email" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "npwp" TEXT,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_account_name" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "company" TEXT
);

-- CreateTable
CREATE TABLE "timesheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,
    "work_date" DATETIME NOT NULL,
    "hours_regular" REAL NOT NULL DEFAULT 0,
    "hours_overtime" REAL NOT NULL DEFAULT 0,
    "work_type" TEXT NOT NULL DEFAULT 'regular',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timesheets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timesheets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "timesheets_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'meeting',
    "event_date" DATETIME NOT NULL,
    "event_time" TEXT,
    "end_date" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "projectId" TEXT,
    "scopeOfWork" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "paymentTerms" TEXT,
    "subtotal" REAL NOT NULL DEFAULT 0.0,
    "taxRate" REAL NOT NULL DEFAULT 0.0,
    "taxAmount" REAL NOT NULL DEFAULT 0.0,
    "discount" REAL NOT NULL DEFAULT 0.0,
    "totalAmount" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachmentUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("attachmentUrl", "clientId", "createdAt", "currency", "date", "discount", "dueDate", "id", "invoiceNumber", "paymentTerms", "projectId", "scopeOfWork", "status", "subtotal", "taxAmount", "taxRate", "totalAmount") SELECT "attachmentUrl", "clientId", "createdAt", "currency", "date", "discount", "dueDate", "id", "invoiceNumber", "paymentTerms", "projectId", "scopeOfWork", "status", "subtotal", "taxAmount", "taxRate", "totalAmount" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_code" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "client_id" TEXT,
    "client_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'preparation',
    "contract_value" REAL DEFAULT 0.0,
    "budget" REAL DEFAULT 0.0,
    "budget_used" REAL DEFAULT 0.0,
    "contract_start_date" DATETIME,
    "contract_end_date" DATETIME,
    "actual_start_date" DATETIME,
    "location" TEXT,
    "project_type" TEXT,
    "assigned_pm" TEXT,
    "total_tasks" INTEGER DEFAULT 0,
    "completed_tasks" INTEGER DEFAULT 0,
    "progress_plan" REAL DEFAULT 0.0,
    "progress_actual" REAL DEFAULT 0.0,
    "retensi_total" REAL DEFAULT 0.0,
    "retensi_cair" REAL DEFAULT 0.0,
    "scurve_data" TEXT DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "projects_assigned_pm_fkey" FOREIGN KEY ("assigned_pm") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("actual_start_date", "assigned_pm", "budget", "budget_used", "client_id", "client_name", "completed_tasks", "contract_end_date", "contract_start_date", "contract_value", "created_at", "deleted_at", "id", "location", "progress_actual", "progress_plan", "project_code", "project_name", "project_type", "retensi_cair", "retensi_total", "scurve_data", "status", "total_tasks", "updated_at") SELECT "actual_start_date", "assigned_pm", "budget", "budget_used", "client_id", "client_name", "completed_tasks", "contract_end_date", "contract_start_date", "contract_value", "created_at", "deleted_at", "id", "location", "progress_actual", "progress_plan", "project_code", "project_name", "project_type", "retensi_cair", "retensi_total", "scurve_data", "status", "total_tasks", "updated_at" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
