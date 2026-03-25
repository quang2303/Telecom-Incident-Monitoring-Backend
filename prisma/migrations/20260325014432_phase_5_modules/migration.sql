/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Device` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "siteId" TEXT NOT NULL,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Device_code_key" ON "Device"("code");

-- CreateIndex
CREATE INDEX "Device_siteId_idx" ON "Device"("siteId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
