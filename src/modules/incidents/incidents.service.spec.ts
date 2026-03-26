import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentInternalStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_PROVIDER_TOKEN } from '../ai/interfaces/incident-analysis-provider.interface';
const mockPrismaService = {
  incident: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  incidentLog: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: { analyzeIncident: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    const dummyIncidentId = 'b040bf5e-c0fb-40aa-b883-933e1eb52ac4';

    it('should throw BadRequestException for invalid transition: RESOLVED -> NEW', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.RESOLVED,
      });

      await expect(
        service.updateStatus(dummyIncidentId, { status: IncidentInternalStatus.NEW }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully transition from NEW -> REVIEWING and create an IncidentLog', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.NEW,
      });

      // Mock $transaction to run the callback
      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.incident.update.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.REVIEWING,
      });

      const updated = await service.updateStatus(
        dummyIncidentId,
        { status: IncidentInternalStatus.REVIEWING },
        'user-123',
      );

      expect(updated.internalStatus).toBe(IncidentInternalStatus.REVIEWING);
      expect(mockPrismaService.incident.update).toHaveBeenCalledWith({
        where: { id: dummyIncidentId },
        data: { internalStatus: IncidentInternalStatus.REVIEWING },
      });
      expect(mockPrismaService.incidentLog.create).toHaveBeenCalledWith({
        data: {
          incidentId: dummyIncidentId,
          message: 'Status updated from NEW to REVIEWING by user user-123',
        },
      });
    });

    it('should successfully transition from ACKNOWLEDGED -> RESOLVED when requested by ADMIN', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.ACKNOWLEDGED,
        assigneeId: 'tech-123',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
      });

      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.incident.update.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.RESOLVED,
      });

      const updated = await service.updateStatus(
        dummyIncidentId,
        { status: IncidentInternalStatus.RESOLVED },
        'admin-1',
      );

      expect(updated.internalStatus).toBe(IncidentInternalStatus.RESOLVED);
      expect(mockPrismaService.incident.update).toHaveBeenCalledWith({
        where: { id: dummyIncidentId },
        data: { internalStatus: IncidentInternalStatus.RESOLVED },
      });
    });

    it('should throw ForbiddenException if resolving but user is not assignee and not ADMIN', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.ACKNOWLEDGED,
        assigneeId: 'tech-123',
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'other-tech',
        role: 'TECHNICIAN',
      });

      await expect(
        service.updateStatus(dummyIncidentId, { status: IncidentInternalStatus.RESOLVED }, 'other-tech'),
      ).rejects.toThrow('Only the assigned technician or an ADMIN can resolve this incident.');
    });

    it('should return incident immediately if target status is the same', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.NEW,
      });

      const updated = await service.updateStatus(dummyIncidentId, {
        status: IncidentInternalStatus.NEW,
      });

      expect(updated.internalStatus).toBe(IncidentInternalStatus.NEW);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockPrismaService.incident.update).not.toHaveBeenCalled();
    });
  });

  describe('assignIncident', () => {
    it('should assign a technician successfully', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-1',
        device: { region: 'North' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'tech-1',
        role: 'TECHNICIAN',
        region: 'North',
        email: 'tech@example.com',
      });

      mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));
      mockPrismaService.incident.update.mockResolvedValue({ id: 'inc-1', assigneeId: 'tech-1' });

      const result = await service.assignIncident('inc-1', { assigneeId: 'tech-1' }, 'admin-1');
      expect(result.assigneeId).toBe('tech-1');
      expect(mockPrismaService.incidentLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequest if region mismatch', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-1',
        device: { region: 'North' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'tech-1',
        role: 'TECHNICIAN',
        region: 'South',
      });

      await expect(service.assignIncident('inc-1', { assigneeId: 'tech-1' })).rejects.toThrow(
        'Technician region does not match incident device region',
      );
    });
  });
});
