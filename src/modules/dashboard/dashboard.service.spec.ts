import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockPrismaService = {
    incident: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    site: {
      findMany: jest.fn(),
    },
    incidentEventType: {
      groupBy: jest.fn(),
    },
    incidentResourceType: {
      groupBy: jest.fn(),
    },
    incidentLogFeature: {
      groupBy: jest.fn(),
    },
    importJob: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should return total incidents', async () => {
      mockPrismaService.incident.count.mockResolvedValue(100);
      const result = await service.getSummary({});
      expect(result).toEqual({ totalIncidents: 100 });
      expect(mockPrismaService.incident.count).toHaveBeenCalled();
    });
  });

  describe('getByStatus', () => {
    it('should return grouped by internal status', async () => {
      mockPrismaService.incident.groupBy.mockResolvedValue([
        { internalStatus: 'NEW', _count: { _all: 50 } },
        { internalStatus: 'RESOLVED', _count: { _all: 20 } },
      ]);
      const result = await service.getByStatus({});
      expect(result).toEqual([
        { label: 'NEW', value: 50 },
        { label: 'RESOLVED', value: 20 },
      ]);
      expect(mockPrismaService.incident.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ by: ['internalStatus'] }),
      );
    });
  });

  describe('getBySite', () => {
    it('should return top sites mapped with site names', async () => {
      mockPrismaService.incident.groupBy.mockResolvedValue([
        { siteId: 'site-1', _count: { _all: 10 } },
        { siteId: 'site-2', _count: { _all: 5 } },
      ]);
      mockPrismaService.site.findMany.mockResolvedValue([
        { id: 'site-1', code: 'S1', name: 'Site One' },
      ]); // site-2 not found intentionally to check fallback

      const result = await service.getBySite({});
      expect(result).toEqual([
        { siteId: 'site-1', label: 'Site One (S1)', value: 10 },
        { siteId: 'site-2', label: 'Unknown Site', value: 5 },
      ]);
    });

    it('should return empty array if no grouping results', async () => {
      mockPrismaService.incident.groupBy.mockResolvedValue([]);
      const result = await service.getBySite({});
      expect(result).toEqual([]);
      expect(mockPrismaService.site.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getTopLogFeaturesByVolume', () => {
    it('should return grouped log features and sum their volume', async () => {
      mockPrismaService.incidentLogFeature.groupBy.mockResolvedValue([
        { logFeature: 'feature-A', _sum: { volume: 100 } },
        { logFeature: 'feature-B', _sum: { volume: 50 } },
      ]);
      const result = await service.getTopLogFeaturesByVolume({});
      expect(result).toEqual([
        { label: 'feature-A', value: 100 },
        { label: 'feature-B', value: 50 },
      ]);
    });
  });
});
