-- AlterTable
ALTER TABLE "projects" ADD COLUMN "scurve_data" TEXT DEFAULT '[]';

-- CreateTable
CREATE TABLE "project_divisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "division_name" TEXT NOT NULL,
    "bobot" REAL NOT NULL DEFAULT 0.0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_divisions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_weekly_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "week_label" TEXT,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "reported_by" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_weekly_progress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_weekly_progress_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_progress_details" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekly_progress_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "progress_plan" REAL NOT NULL DEFAULT 0.0,
    "progress_actual" REAL NOT NULL DEFAULT 0.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_progress_details_weekly_progress_id_fkey" FOREIGN KEY ("weekly_progress_id") REFERENCES "project_weekly_progress" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_progress_details_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_progress_details_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "project_divisions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "project_weekly_progress_project_id_week_number_key" ON "project_weekly_progress"("project_id", "week_number");
