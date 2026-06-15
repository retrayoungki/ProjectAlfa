-- AlterTable
ALTER TABLE "projects" ADD COLUMN "retensi_cair" REAL DEFAULT 0.0;
ALTER TABLE "projects" ADD COLUMN "retensi_total" REAL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "project_termins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "termin_number" INTEGER NOT NULL,
    "termin_label" TEXT,
    "percentage" REAL,
    "nilai_termin" REAL NOT NULL DEFAULT 0,
    "retensi_pct" REAL DEFAULT 5.0,
    "retensi_amount" REAL DEFAULT 0,
    "netto_cair" REAL DEFAULT 0,
    "submitted_date" DATETIME,
    "approved_date" DATETIME,
    "paid_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_termins_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "project_termins_project_id_termin_number_key" ON "project_termins"("project_id", "termin_number");
