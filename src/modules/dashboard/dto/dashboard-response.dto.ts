import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty({ description: 'Total number of incidents' })
  totalIncidents: number;

  @ApiProperty({ description: 'Number of NEW incidents' })
  statusNew: number;

  @ApiProperty({ description: 'Number of REVIEWING incidents' })
  statusReviewing: number;

  @ApiProperty({ description: 'Number of ACKNOWLEDGED incidents' })
  statusAcknowledged: number;

  @ApiProperty({ description: 'Number of RESOLVED incidents' })
  statusResolved: number;

  @ApiProperty({ description: 'Total number of monitored sites' })
  totalSites: number;

  @ApiProperty({ description: 'Resolution rate percentage (0-100)' })
  resolutionRate: number;
}

export class DailyTrendDto {
  @ApiProperty({ description: 'Date string (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Number of P1 Critical incidents (Severity 2)' })
  p1Critical: number;

  @ApiProperty({ description: 'Number of P2 High incidents (Severity 1)' })
  p2High: number;

  @ApiProperty({ description: 'Number of currently Resolved incidents created on this day' })
  resolved: number;
}

export class ChartDataDto {
  @ApiProperty({ description: 'Label for the chart segment' })
  label: string;

  @ApiProperty({ description: 'Value for the chart segment' })
  value: number;
}

export class SiteChartDataDto extends ChartDataDto {
  @ApiPropertyOptional({ description: 'ID of the site, if applicable' })
  siteId?: string;
}

export class ImportJobStatusCountDto {
  @ApiProperty({ description: 'Status of the import job' })
  status: string;

  @ApiProperty({ description: 'Number of jobs with this status' })
  count: number;

  @ApiProperty({ description: 'Total records processed across these jobs' })
  totalRecords: number;
}

export class RecentImportJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalRecords: number;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;
}

export class ImportJobsSummaryDto {
  @ApiProperty({ type: [ImportJobStatusCountDto], description: 'Counts grouped by status' })
  byStatus: ImportJobStatusCountDto[];

  @ApiProperty({ type: [RecentImportJobDto], description: 'List of 5 most recent import jobs' })
  recentJobs: RecentImportJobDto[];
}
