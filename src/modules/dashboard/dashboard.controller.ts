import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get total dashboard summary (e.g., total incidents)' })
  getSummary(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getSummary(filter);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Get incidents grouped by internal status' })
  getByStatus(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getByStatus(filter);
  }

  @Get('by-imported-fault-severity')
  @ApiOperation({ summary: 'Get incidents grouped by imported fault severity' })
  getByImportedFaultSeverity(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getByImportedFaultSeverity(filter);
  }

  @Get('by-site')
  @ApiOperation({ summary: 'Get top 20 sites with most incidents' })
  getBySite(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getBySite(filter);
  }

  @Get('top-event-types')
  @ApiOperation({ summary: 'Get top 20 event types by incident frequency' })
  getTopEventTypes(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getTopEventTypes(filter);
  }

  @Get('top-resource-types')
  @ApiOperation({ summary: 'Get top 20 resource types by incident frequency' })
  getTopResourceTypes(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getTopResourceTypes(filter);
  }

  @Get('top-log-features')
  @ApiOperation({ summary: 'Get top 20 log features by incident occurrence' })
  getTopLogFeatures(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getTopLogFeatures(filter);
  }

  @Get('top-log-features-by-volume')
  @ApiOperation({ summary: 'Get top 20 log features by total volume' })
  getTopLogFeaturesByVolume(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getTopLogFeaturesByVolume(filter);
  }

  @Get('import-jobs-summary')
  @ApiOperation({ summary: 'Get summary of recent import jobs and status counts' })
  getImportJobsSummary() {
    return this.dashboardService.getImportJobsSummary();
  }
}
