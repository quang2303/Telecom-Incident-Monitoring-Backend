import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentInternalStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  incident: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  incidentLog: {
    create: jest.fn(),
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

    it('should successfully transition from ACKNOWLEDGED -> RESOLVED', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.ACKNOWLEDGED,
      });

      mockPrismaService.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrismaService);
      });

      mockPrismaService.incident.update.mockResolvedValue({
        id: dummyIncidentId,
        internalStatus: IncidentInternalStatus.RESOLVED,
      });

      const updated = await service.updateStatus(dummyIncidentId, {
        status: IncidentInternalStatus.RESOLVED,
      });

      expect(updated.internalStatus).toBe(IncidentInternalStatus.RESOLVED);
      expect(mockPrismaService.incident.update).toHaveBeenCalledWith({
        where: { id: dummyIncidentId },
        data: { internalStatus: IncidentInternalStatus.RESOLVED },
      });
      expect(mockPrismaService.incidentLog.create).toHaveBeenCalledWith({
        data: {
          incidentId: dummyIncidentId,
          message: 'Status updated from ACKNOWLEDGED to RESOLVED',
        },
      });
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
});
