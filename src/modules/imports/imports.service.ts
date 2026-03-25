import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseCsvBuffer } from './utils/csv-parser.util';
import { extractCsvFromZipBuffer } from './utils/zip-parser.util';
import { ImportJobStatus, ImportSourceSystem } from '@prisma/client';

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);
  private readonly requiredFiles = [
    'train.csv',
    'event_type.csv',
    'log_feature.csv',
    'resource_type.csv',
    'severity_type.csv',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.importJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.importJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  async processTelstraUpload(uploadedFiles: Express.Multer.File[]) {
    const fileBuffers: Record<string, Buffer> = {};

    // Check if it's a single zip file
    if (
      uploadedFiles.length === 1 &&
      (uploadedFiles[0].originalname.endsWith('.zip') || uploadedFiles[0].mimetype.includes('zip'))
    ) {
      try {
        const extracted = await extractCsvFromZipBuffer(uploadedFiles[0].buffer);
        Object.assign(fileBuffers, extracted);
      } catch (error) {
        throw new BadRequestException('Failed to extract zip file');
      }
    } else {
      // Treat as individual CSVs
      for (const f of uploadedFiles) {
        fileBuffers[f.originalname] = f.buffer;
      }
    }

    // Validate required files
    const missing = this.requiredFiles.filter((f) => !fileBuffers[f]);
    if (missing.length > 0) {
      throw new BadRequestException(`Missing required files: ${missing.join(', ')}`);
    }

    // Create a pending job
    const job = await this.prisma.importJob.create({
      data: {
        sourceSystem: ImportSourceSystem.TELSTRA_CSV,
        status: ImportJobStatus.PENDING,
      },
    });

    // Run async so we don't block the request response
    this.runImportJob(job.id, fileBuffers).catch((err) => {
      this.logger.error(`Import job ${job.id} failed in background: ${err.message}`, err.stack);
    });

    return job;
  }

  private async runImportJob(jobId: string, buffers: Record<string, Buffer>) {
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportJobStatus.RUNNING },
    });

    try {
      this.logger.log(`[Job ${jobId}] Starting raw parse...`);
      let totalRecords = 0;

      // 1. Parse and insert raw data
      totalRecords += await this.loadTrainRaw(jobId, buffers['train.csv']);
      await this.loadEventTypeRaw(jobId, buffers['event_type.csv']);
      await this.loadLogFeatureRaw(jobId, buffers['log_feature.csv']);
      await this.loadResourceTypeRaw(jobId, buffers['resource_type.csv']);
      await this.loadSeverityTypeRaw(jobId, buffers['severity_type.csv']);

      this.logger.log(`[Job ${jobId}] Raw data loaded. Normalizing...`);

      // 2. Normalize Sites
      await this.normalizeSites();

      // 3. Normalize Incidents
      await this.normalizeIncidents(jobId);

      // 4. Normalize Features
      await this.normalizeIncidentFeatures();

      // Finalize
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportJobStatus.COMPLETED,
          totalRecords,
        },
      });
      this.logger.log(`[Job ${jobId}] Import completed successfully.`);
    } catch (error) {
      this.logger.error(`[Job ${jobId}] Failed: ${error.message}`, error.stack);
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportJobStatus.FAILED,
          errorMessage: String(error.message).slice(0, 1000),
        },
      });
    }
  }

  // --- RAW TABLE LOADERS ---

  private async chunkInsert<T>(
    items: T[],
    inserter: (batch: T[]) => Promise<void>,
    batchSize = 5000,
  ) {
    for (let i = 0; i < items.length; i += batchSize) {
      await inserter(items.slice(i, i + batchSize));
    }
  }

  private async loadTrainRaw(jobId: string, buffer: Buffer): Promise<number> {
    const data = await parseCsvBuffer<any>(buffer);
    const mapped = data.map((r) => ({
      id: String(r.id),
      location: String(r.location),
      fault_severity: parseInt(r.fault_severity, 10) || 0,
      importJobId: jobId,
    }));
    await this.prisma.telstraTrainRaw.deleteMany(); // Clear old raw data if necessary, or just upsert.
    // Requirement says raw tables trace data. We can keep it without clearing, but to avoid pk clash on 'id' since train.id is PK, we should upsert.
    // Wait, prisma createMany doesn't support upsert well.
    // Since 'id' is PK in TelstraTrainRaw, any re-import will fail. Let's delete entirely or use raw query.
    // Given the raw tables are basically just staging, clearing them is acceptable before inserting, OR making ID not absolute PK.
    // Assuming from Phase schema 'TelstraTrainRaw.id' is string @id.
    // We can just clear TelstraTrainRaw or upsert it. Let's just do deleteMany and populate to keep it fresh staging area.
    // Wait, raw tables represent all history? If history, `id` should not be primary key or we need a composite key.
    // Looking at schema: `id String @id`. So it's intended to be unique across all imports. Thus upsert or deleteMany is required.
    // Let's just delete existings matching the IDs.
    await this.prisma.telstraTrainRaw.deleteMany({
      where: { id: { in: mapped.map((x) => x.id) } },
    });

    await this.chunkInsert(mapped, async (batch) => {
      await this.prisma.telstraTrainRaw.createMany({ data: batch, skipDuplicates: true });
    });
    return mapped.length;
  }

  private async loadEventTypeRaw(jobId: string, buffer: Buffer) {
    const data = await parseCsvBuffer<any>(buffer);
    const mapped = data.map((r) => ({
      id: String(r.id),
      event_type: String(r.event_type),
      importJobId: jobId,
    }));
    // rawId is default uuid, so we can just insert.
    await this.prisma.telstraEventTypeRaw.deleteMany({
      where: { id: { in: mapped.map((x) => x.id) } },
    });
    await this.chunkInsert(mapped, async (batch) => {
      await this.prisma.telstraEventTypeRaw.createMany({ data: batch });
    });
  }

  private async loadLogFeatureRaw(jobId: string, buffer: Buffer) {
    const data = await parseCsvBuffer<any>(buffer);
    const mapped = data.map((r) => ({
      id: String(r.id),
      log_feature: String(r.log_feature),
      volume: parseInt(r.volume, 10) || 0,
      importJobId: jobId,
    }));
    await this.prisma.telstraLogFeatureRaw.deleteMany({
      where: { id: { in: mapped.map((x) => x.id) } },
    });
    await this.chunkInsert(mapped, async (batch) => {
      await this.prisma.telstraLogFeatureRaw.createMany({ data: batch });
    });
  }

  private async loadResourceTypeRaw(jobId: string, buffer: Buffer) {
    const data = await parseCsvBuffer<any>(buffer);
    const mapped = data.map((r) => ({
      id: String(r.id),
      resource_type: String(r.resource_type),
      importJobId: jobId,
    }));
    await this.prisma.telstraResourceTypeRaw.deleteMany({
      where: { id: { in: mapped.map((x) => x.id) } },
    });
    await this.chunkInsert(mapped, async (batch) => {
      await this.prisma.telstraResourceTypeRaw.createMany({ data: batch });
    });
  }

  private async loadSeverityTypeRaw(jobId: string, buffer: Buffer) {
    const data = await parseCsvBuffer<any>(buffer);
    const mapped = data.map((r) => ({
      id: String(r.id),
      severity_type: String(r.severity_type),
      importJobId: jobId,
    }));
    await this.prisma.telstraSeverityTypeRaw.deleteMany({
      where: { id: { in: mapped.map((x) => x.id) } },
    });
    await this.chunkInsert(mapped, async (batch) => {
      await this.prisma.telstraSeverityTypeRaw.createMany({ data: batch });
    });
  }

  // --- NORMALIZATION ---

  private async normalizeSites() {
    const locations = await this.prisma.telstraTrainRaw.findMany({
      select: { location: true },
      distinct: ['location'],
    });

    this.logger.log(`Upserting ${locations.length} Sites...`);
    for (const loc of locations) {
      if (!loc.location) continue;
      await this.prisma.site.upsert({
        where: { code: loc.location },
        update: {},
        create: {
          code: loc.location,
          externalCode: loc.location,
          name: loc.location,
        },
      });
    }
  }

  private async normalizeIncidents(jobId: string) {
    const rawIncidents = await this.prisma.telstraTrainRaw.findMany();

    // We need site mapping to get internal siteIds
    const sites = await this.prisma.site.findMany({ select: { id: true, code: true } });
    const siteMap = new Map(sites.map((s) => [s.code, s.id]));

    this.logger.log(`Upserting ${rawIncidents.length} Incidents...`);
    for (const raw of rawIncidents) {
      const siteId = siteMap.get(raw.location);
      if (!siteId) continue;

      await this.prisma.incident.upsert({
        where: { externalIncidentId: raw.id },
        update: {
          importedFaultSeverity: raw.fault_severity,
          importJobId: jobId,
          importedAt: new Date(),
        },
        create: {
          externalIncidentId: raw.id,
          sourceSystem: ImportSourceSystem.TELSTRA_CSV,
          importedFaultSeverity: raw.fault_severity,
          siteId,
          importJobId: jobId,
          importedAt: new Date(),
          internalStatus: 'NEW',
        },
      });
    }
  }

  private async normalizeIncidentFeatures() {
    // 1. Fetch mapping between externalIncidentId and internal uuid
    const incidents = await this.prisma.incident.findMany({
      where: { sourceSystem: ImportSourceSystem.TELSTRA_CSV },
      select: { id: true, externalIncidentId: true },
    });
    const incidentMap = new Map(incidents.map((i) => [i.externalIncidentId, i.id]));

    this.logger.log(`Normalizing features for ${incidents.length} incidents...`);

    // Clean existing features for these mapped incidents to avoid duplicates before batch insert
    const matchedInternalIds = incidents.map((i) => i.id);
    await this.prisma.incidentEventType.deleteMany({
      where: { incidentId: { in: matchedInternalIds } },
    });
    await this.prisma.incidentLogFeature.deleteMany({
      where: { incidentId: { in: matchedInternalIds } },
    });
    await this.prisma.incidentResourceType.deleteMany({
      where: { incidentId: { in: matchedInternalIds } },
    });
    await this.prisma.incidentSeverityTypeRaw.deleteMany({
      where: { incidentId: { in: matchedInternalIds } },
    });

    // Insert events
    const rawEvents = await this.prisma.telstraEventTypeRaw.findMany();
    const eventBatch = rawEvents
      .filter((r) => incidentMap.has(r.id))
      .map((r) => ({
        incidentId: incidentMap.get(r.id)!,
        eventType: r.event_type,
      }));
    await this.chunkInsert(eventBatch, async (batch) => {
      await this.prisma.incidentEventType.createMany({ data: batch });
    });

    // Insert logs
    const rawLogs = await this.prisma.telstraLogFeatureRaw.findMany();
    const logBatch = rawLogs
      .filter((r) => incidentMap.has(r.id))
      .map((r) => ({
        incidentId: incidentMap.get(r.id)!,
        logFeature: r.log_feature,
        volume: r.volume,
      }));
    await this.chunkInsert(logBatch, async (batch) => {
      await this.prisma.incidentLogFeature.createMany({ data: batch });
    });

    // Insert resources
    const rawResources = await this.prisma.telstraResourceTypeRaw.findMany();
    const resBatch = rawResources
      .filter((r) => incidentMap.has(r.id))
      .map((r) => ({
        incidentId: incidentMap.get(r.id)!,
        resourceType: r.resource_type,
      }));
    await this.chunkInsert(resBatch, async (batch) => {
      await this.prisma.incidentResourceType.createMany({ data: batch });
    });

    // Insert severities
    const rawSevs = await this.prisma.telstraSeverityTypeRaw.findMany();
    const sevBatch = rawSevs
      .filter((r) => incidentMap.has(r.id))
      .map((r) => ({
        incidentId: incidentMap.get(r.id)!,
        severityType: r.severity_type,
      }));
    await this.chunkInsert(sevBatch, async (batch) => {
      await this.prisma.incidentSeverityTypeRaw.createMany({ data: batch });
    });
  }
}
