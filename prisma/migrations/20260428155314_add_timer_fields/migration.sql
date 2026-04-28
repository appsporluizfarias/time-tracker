/*
  Warnings:

  - Made the column `description` on table `time_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_projectId_fkey";

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "osNumber" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3),
ALTER COLUMN "hours" DROP NOT NULL,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "billable" SET DEFAULT false,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
