import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryPayloadDto } from './dto/telemetry-payload.dto';
import { IncidentInternalStatus, ImportSourceSystem } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processTelemetry(payload: TelemetryPayloadDto) {
    this.logger.log(`Received telemetry from device ${payload.deviceId}`);

    // 1. Verify Device Exists
    const device = await this.prisma.device.findUnique({
      where: { id: payload.deviceId },
    });

    if (!device) {
      throw new NotFoundException(`Device ${payload.deviceId} not found in inventory.`);
    }

    // 2. Generate a simulated external ID (since it's coming from telemetry, the "external system" is the device log ID)
    const newExternalId = `TEL-${Date.now()}-${uuidv4().split('-')[0]}`;

    // 3. Create the Incident
    const incident = await this.prisma.incident.create({
      data: {
        externalIncidentId: newExternalId,
        sourceSystem: ImportSourceSystem.MANUAL, // Treating webhook as manual/custom source
        importedFaultSeverity: payload.faultSeverity,
        internalStatus: IncidentInternalStatus.NEW,
        siteId: device.siteId,
        deviceId: device.id,
        importedAt: new Date(),

        events: {
          create: payload.eventTypes.map((e) => ({ eventType: e })),
        },

        resources: {
          create: [{ resourceType: device.type || 'Unknown Hardware' }],
        },

        features: {
          create: payload.logs?.map((l) => ({ logFeature: l.feature, volume: l.volume })) || [],
        },

        severitiesRaw: {
          create: [{ severityType: `severity type ${payload.faultSeverity}` }],
        },
      },
      include: {
        site: true,
        device: true,
      },
    });

    this.logger.log(`Generated new Incident ${incident.id} for Device ${device.name}`);
    return incident;
  }
}
