import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the base Prisma where clause based on the provided filters.
   */
  private buildIncidentWhere(filter: DashboardFilterDto): Prisma.IncidentWhereInput {
    const where: Prisma.IncidentWhereInput = {};
    if (filter.siteId) {
      where.siteId = filter.siteId;
    }
    if (filter.importJobId) {
      where.importJobId = filter.importJobId;
    }
    if (filter.internalStatus) {
      where.internalStatus = filter.internalStatus;
    }
    if (filter.sourceSystem) {
      where.sourceSystem = filter.sourceSystem;
    }
    return where;
  }

  /**
   * Format group by results into { label, value } array for frontend pie/bar charts.
   */
  private formatChartData(
    data: any[],
    keyField: string,
    valueField: string,
  ): { label: string; value: number }[] {
    return data
      .map((item) => ({
        label: String(item[keyField] ?? 'Unknown'),
        value: Number(item[valueField] ?? 0),
      }))
      .sort((a, b) => b.value - a.value); // default sort descending by value
  }

  async getSummary(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);

    // Total sites
    const totalSites = await this.prisma.site.count();

    // Group by status
    const statusCounts = await this.prisma.incident.groupBy({
      by: ['internalStatus'],
      where,
      _count: {
        _all: true,
      },
    });

    let totalIncidents = 0;
    let statusNew = 0;
    let statusReviewing = 0;
    let statusAcknowledged = 0;
    let statusResolved = 0;

    statusCounts.forEach((item) => {
      const count = item._count._all;
      totalIncidents += count;
      switch (item.internalStatus) {
        case 'NEW':
          statusNew = count;
          break;
        case 'REVIEWING':
          statusReviewing = count;
          break;
        case 'ACKNOWLEDGED':
          statusAcknowledged = count;
          break;
        case 'RESOLVED':
          statusResolved = count;
          break;
      }
    });

    const resolutionRate =
      totalIncidents > 0 ? Math.round((statusResolved / totalIncidents) * 100) : 0;

    return {
      totalIncidents,
      statusNew,
      statusReviewing,
      statusAcknowledged,
      statusResolved,
      totalSites,
      resolutionRate,
    };
  }

  async getByStatus(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incident.groupBy({
      by: ['internalStatus'],
      where,
      _count: {
        _all: true,
      },
    });

    return (
      this.formatChartData(result, 'internalStatus', '_count._all')
        // Extract nested _count
        .map((item, index) => ({
          label: result[index].internalStatus,
          value: result[index]._count._all,
        }))
        .sort((a, b) => b.value - a.value)
    );
  }

  async getByImportedFaultSeverity(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incident.groupBy({
      by: ['importedFaultSeverity'],
      where,
      _count: {
        _all: true,
      },
      orderBy: {
        importedFaultSeverity: 'asc',
      },
    });

    return result.map((item) => ({
      label: item.importedFaultSeverity !== null ? String(item.importedFaultSeverity) : 'Unknown',
      value: item._count._all,
    }));
  }

  async getBySite(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const grouped = await this.prisma.incident.groupBy({
      by: ['siteId'],
      where,
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          siteId: 'desc',
        },
      },
      take: 20, // Top 20 sites for display purposes
    });

    // Fetch site details
    const siteIds = grouped.map((g) => g.siteId);
    if (!siteIds.length) {
      return [];
    }

    const sites = await this.prisma.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, code: true, name: true },
    });

    const siteMap = new Map<string, { code: string; name: string }>();
    sites.forEach((s) => siteMap.set(s.id, { code: s.code, name: s.name }));

    return grouped.map((item) => {
      const siteDetails = siteMap.get(item.siteId);
      return {
        siteId: item.siteId,
        label: siteDetails ? `${siteDetails.name} (${siteDetails.code})` : 'Unknown Site',
        value: item._count._all,
      };
    });
  }

  async getTopEventTypes(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incidentEventType.groupBy({
      by: ['eventType'],
      where: {
        incident: where,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
      take: 20,
    });

    return result.map((item) => ({
      label: item.eventType,
      value: item._count._all,
    }));
  }

  async getTopResourceTypes(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incidentResourceType.groupBy({
      by: ['resourceType'],
      where: {
        incident: where,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          resourceType: 'desc',
        },
      },
      take: 20,
    });

    return result.map((item) => ({
      label: item.resourceType,
      value: item._count._all,
    }));
  }

  async getTopLogFeatures(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incidentLogFeature.groupBy({
      by: ['logFeature'],
      where: {
        incident: where,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          logFeature: 'desc',
        },
      },
      take: 20,
    });

    return result.map((item) => ({
      label: item.logFeature,
      value: item._count._all,
    }));
  }

  async getTopLogFeaturesByVolume(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);
    const result = await this.prisma.incidentLogFeature.groupBy({
      by: ['logFeature'],
      where: {
        incident: where,
      },
      _sum: {
        volume: true,
      },
      orderBy: {
        _sum: {
          volume: 'desc',
        },
      },
      take: 20,
    });

    return result.map((item) => ({
      label: item.logFeature,
      value: item._sum.volume || 0,
    }));
  }

  async getImportJobsSummary() {
    const result = await this.prisma.importJob.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      _sum: {
        totalRecords: true,
      },
    });

    const recentJobs = await this.prisma.importJob.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalRecords: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    const byStatus = result.map((item) => ({
      status: item.status,
      count: item._count._all,
      totalRecords: item._sum.totalRecords || 0,
    }));

    return {
      byStatus,
      recentJobs,
    };
  }

  async getVolumeTrend(filter: DashboardFilterDto) {
    const where = this.buildIncidentWhere(filter);

    // Calculate date for 7 days ago (in UTC to match Prisma createdAt ISO strings)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    const recentIncidents = await this.prisma.incident.findMany({
      where: {
        ...where,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        importedFaultSeverity: true,
        internalStatus: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Initialize 7 days array
    const trendMap = new Map<string, { p1Critical: number; p2High: number; resolved: number }>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap.set(dateStr, { p1Critical: 0, p2High: 0, resolved: 0 });
    }

    recentIncidents.forEach((incident) => {
      const dateStr = incident.createdAt.toISOString().split('T')[0];
      const dayData = trendMap.get(dateStr);
      if (dayData) {
        if (incident.importedFaultSeverity === 2) {
          dayData.p1Critical++;
        } else if (incident.importedFaultSeverity === 1) {
          dayData.p2High++;
        }
        if (incident.internalStatus === 'RESOLVED') {
          dayData.resolved++;
        }
      }
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      p1Critical: data.p1Critical,
      p2High: data.p2High,
      resolved: data.resolved,
    }));
  }
}
