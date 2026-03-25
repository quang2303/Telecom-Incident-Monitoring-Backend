-- CreateTable
CREATE TABLE "IncidentAnalysis" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "suggestedInternalPriority" TEXT NOT NULL,
    "shortSummary" TEXT NOT NULL,
    "possibleCause" TEXT NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "rawModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentAnalysis_incidentId_key" ON "IncidentAnalysis"("incidentId");

-- AddForeignKey
ALTER TABLE "IncidentAnalysis" ADD CONSTRAINT "IncidentAnalysis_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
