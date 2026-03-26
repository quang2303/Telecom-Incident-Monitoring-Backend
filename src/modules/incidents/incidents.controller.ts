import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Req } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentQueryDto } from './dto/incident-query.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { IncidentResponseDto, IncidentLogResponseDto } from './dto/incident-response.dto';
import { IncidentAnalysisResponseDto } from './dto/incident-analysis-response.dto';
import { AssignIncidentDto } from './dto/assign-incident.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all incidents' })
  @ApiPaginatedResponse(IncidentResponseDto)
  findAll(@Query() query: IncidentQueryDto, @Req() req: any) {
    return this.incidentsService.findAll(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of an incident by ID' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the internal status of an incident' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() updateIncidentStatusDto: UpdateIncidentStatusDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.incidentsService.updateStatus(id, updateIncidentStatusDto, userId);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a technician to an incident (Admin/Operator only)' })
  @ApiResponse({ status: 200, type: IncidentResponseDto })
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  assignIncident(
    @Param('id') id: string,
    @Body() assignIncidentDto: AssignIncidentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.incidentsService.assignIncident(id, assignIncidentDto, userId);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get internal logs for an incident' })
  @ApiResponse({ status: 200, type: [IncidentLogResponseDto] })
  findLogs(@Param('id') id: string) {
    return this.incidentsService.findLogs(id);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Run AI analysis on an incident' })
  @ApiResponse({ status: 201, type: IncidentAnalysisResponseDto })
  analyzeIncident(@Param('id') id: string) {
    return this.incidentsService.analyzeIncident(id);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get the AI analysis for an incident' })
  @ApiResponse({ status: 200, type: IncidentAnalysisResponseDto })
  getAnalysis(@Param('id') id: string) {
    return this.incidentsService.getAnalysis(id);
  }
}
