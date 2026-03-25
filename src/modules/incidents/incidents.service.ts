import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER_TOKEN, IncidentAnalysisProvider, AiIncidentInput } from '../ai/interfaces/incident-analysis-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentQueryDto } from './dto/incident-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentInternalStatus, Prisma } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

// Define the allowed transitions
const VALID_TRANSITIONS: Record<IncidentInternalStatus, IncidentInternalStatus[]> = {
  [IncidentInternalStatus.NEW]: [IncidentInternalStatus.REVIEWING, IncidentInternalStatus.RESOLVED],
  [IncidentInternalStatus.REVIEWING]: [
    IncidentInternalStatus.ACKNOWLEDGED,
    IncidentInternalStatus.RESOLVED,
  ],
  [IncidentInternalStatus.ACKNOWLEDGED]: [IncidentInternalStatus.RESOLVED],
  [IncidentInternalStatus.RESOLVED]: [], // No outgoing transitions
};

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(AI_PROVIDER_TOKEN)
    private readonly aiProvider: IncidentAnalysisProvider,
  ) {}

  async findAll(query: IncidentQueryDto): Promise<PaginatedResponseDto<any>> {
    const {
      page = 1,
      limit = 50,
      search,
      internalStatus,
      importedFaultSeverity,
      siteId,
      importJobId,
      sourceSystem,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = {
      internalStatus,
      importedFaultSeverity,
      siteId,
      importJobId,
      sourceSystem,
    };

    if (search) {
      where.OR = [
        { externalIncidentId: { contains: search, mode: 'insensitive' } },
        { site: { code: { contains: search, mode: 'insensitive' } } },
        { site: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { importedAt: 'desc' },
        include: {
          site: true,
          device: true,
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        events: true,
        features: true,
        resources: true,
        severitiesRaw: true,
        site: true,
        device: true,
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return incident;
  }

  async updateStatus(id: string, dto: UpdateIncidentStatusDto, userId?: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    const currentStatus = incident.internalStatus;
    const targetStatus = dto.status;

    if (currentStatus === targetStatus) {
      return incident;
    }

    const allowedNextStates = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(targetStatus)) {
      throw new BadRequestException(`Invalid transition from ${currentStatus} to ${targetStatus}`);
    }

    const updatedIncident = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.incident.update({
        where: { id },
        data: { internalStatus: targetStatus },
      });

      let message = `Status updated from ${currentStatus} to ${targetStatus}`;
      if (userId) {
        message += ` by user ${userId}`;
      }

      await tx.incidentLog.create({
        data: {
          incidentId: id,
          message,
        },
      });

      return updated;
    });

    return updatedIncident;
  }

  async findLogs(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    return this.prisma.incidentLog.findMany({
      where: { incidentId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnalysis(id: string) {
    const analysis = await this.prisma.incidentAnalysis.findUnique({
      where: { incidentId: id },
    });
    if (!analysis) {
      throw new NotFoundException(`Analysis for incident ${id} not found`);
    }
    return analysis;
  }

  async analyzeIncident(id: string) {
    const isAiEnabled = this.configService.get<string>('AI_ENABLED') === 'true';
    if (!isAiEnabled) {
      throw new UnprocessableEntityException('AI Analysis is currently disabled by system configuration.');
    }

    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        events: true,
        features: true,
        resources: true,
        severitiesRaw: true,
        site: true,
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }

    // Explicitly build the typed AI input payload mapped from relational DB rows
    const input: AiIncidentInput = {
      incidentId: incident.id,
      location: incident.site?.name || null,
      region: incident.site?.region || null,
      importedFaultSeverity: incident.importedFaultSeverity,
      eventTypes: incident.events.map((e) => e.eventType),
      logFeatures: incident.features.map((f) => ({ feature: f.logFeature, volume: f.volume })),
      resourceTypes: incident.resources.map((r) => r.resourceType),
      severityTypesRaw: incident.severitiesRaw.map((s) => s.severityType),
    };

    const aiResult = await this.aiProvider.analyzeIncident(input);

    const savedAnalysis = await this.prisma.incidentAnalysis.upsert({
      where: { incidentId: incident.id },
      create: {
        incidentId: incident.id,
        category: aiResult.category,
        suggestedInternalPriority: aiResult.suggestedInternalPriority,
        shortSummary: aiResult.shortSummary,
        possibleCause: aiResult.possibleCause,
        suggestedAction: aiResult.suggestedAction,
        confidence: aiResult.confidence,
        rawModel: aiResult.rawModel,
      },
      update: {
        category: aiResult.category,
        suggestedInternalPriority: aiResult.suggestedInternalPriority,
        shortSummary: aiResult.shortSummary,
        possibleCause: aiResult.possibleCause,
        suggestedAction: aiResult.suggestedAction,
        confidence: aiResult.confidence,
        rawModel: aiResult.rawModel,
      },
    });

    return savedAnalysis;
  }
}
