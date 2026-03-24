-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "IncidentInternalStatus" AS ENUM ('NEW', 'REVIEWING', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportSourceSystem" AS ENUM ('TELSTRA_CSV', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "externalCode" TEXT,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "externalIncidentId" TEXT,
    "sourceSystem" "ImportSourceSystem" NOT NULL DEFAULT 'MANUAL',
    "title" TEXT,
    "description" TEXT,
    "importedFaultSeverity" INTEGER,
    "internalStatus" "IncidentInternalStatus" NOT NULL DEFAULT 'NEW',
    "siteId" TEXT NOT NULL,
    "deviceId" TEXT,
    "importJobId" TEXT,
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLog" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "sourceSystem" "ImportSourceSystem" NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEventType" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,

    CONSTRAINT "IncidentEventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLogFeature" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "logFeature" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,

    CONSTRAINT "IncidentLogFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentResourceType" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,

    CONSTRAINT "IncidentResourceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentSeverityTypeRaw" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "severityType" TEXT NOT NULL,

    CONSTRAINT "IncidentSeverityTypeRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelstraTrainRaw" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "fault_severity" INTEGER NOT NULL,
    "importJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelstraTrainRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelstraEventTypeRaw" (
    "rawId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "importJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelstraEventTypeRaw_pkey" PRIMARY KEY ("rawId")
);

-- CreateTable
CREATE TABLE "TelstraLogFeatureRaw" (
    "rawId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "log_feature" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "importJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelstraLogFeatureRaw_pkey" PRIMARY KEY ("rawId")
);

-- CreateTable
CREATE TABLE "TelstraResourceTypeRaw" (
    "rawId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "importJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelstraResourceTypeRaw_pkey" PRIMARY KEY ("rawId")
);

-- CreateTable
CREATE TABLE "TelstraSeverityTypeRaw" (
    "rawId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "severity_type" TEXT NOT NULL,
    "importJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelstraSeverityTypeRaw_pkey" PRIMARY KEY ("rawId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Site_externalCode_key" ON "Site"("externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_externalIncidentId_key" ON "Incident"("externalIncidentId");

-- CreateIndex
CREATE INDEX "Incident_siteId_idx" ON "Incident"("siteId");

-- CreateIndex
CREATE INDEX "Incident_internalStatus_idx" ON "Incident"("internalStatus");

-- CreateIndex
CREATE INDEX "Incident_importedFaultSeverity_idx" ON "Incident"("importedFaultSeverity");

-- CreateIndex
CREATE INDEX "IncidentLog_incidentId_idx" ON "IncidentLog"("incidentId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "IncidentEventType_incidentId_idx" ON "IncidentEventType"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentEventType_eventType_idx" ON "IncidentEventType"("eventType");

-- CreateIndex
CREATE INDEX "IncidentLogFeature_incidentId_idx" ON "IncidentLogFeature"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentLogFeature_logFeature_idx" ON "IncidentLogFeature"("logFeature");

-- CreateIndex
CREATE INDEX "IncidentResourceType_incidentId_idx" ON "IncidentResourceType"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentResourceType_resourceType_idx" ON "IncidentResourceType"("resourceType");

-- CreateIndex
CREATE INDEX "IncidentSeverityTypeRaw_incidentId_idx" ON "IncidentSeverityTypeRaw"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentSeverityTypeRaw_severityType_idx" ON "IncidentSeverityTypeRaw"("severityType");

-- CreateIndex
CREATE INDEX "TelstraEventTypeRaw_id_idx" ON "TelstraEventTypeRaw"("id");

-- CreateIndex
CREATE INDEX "TelstraLogFeatureRaw_id_idx" ON "TelstraLogFeatureRaw"("id");

-- CreateIndex
CREATE INDEX "TelstraResourceTypeRaw_id_idx" ON "TelstraResourceTypeRaw"("id");

-- CreateIndex
CREATE INDEX "TelstraSeverityTypeRaw_id_idx" ON "TelstraSeverityTypeRaw"("id");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLog" ADD CONSTRAINT "IncidentLog_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEventType" ADD CONSTRAINT "IncidentEventType_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLogFeature" ADD CONSTRAINT "IncidentLogFeature_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentResourceType" ADD CONSTRAINT "IncidentResourceType_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentSeverityTypeRaw" ADD CONSTRAINT "IncidentSeverityTypeRaw_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
