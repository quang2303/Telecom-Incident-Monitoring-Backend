import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { TelemetryPayloadDto } from './dto/telemetry-payload.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('telemetry')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Ingest real-time device telemetry/faults' })
  @ApiResponse({ status: 201, description: 'Incident successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized API Key.' })
  async handleTelemetry(@Body() payload: TelemetryPayloadDto) {
    return this.webhookService.processTelemetry(payload);
  }
}
