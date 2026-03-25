import { Test, TestingModule } from '@nestjs/testing';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';
import { ImportJobStatus, ImportSourceSystem } from '@prisma/client';

describe('ImportsController', () => {
  let controller: ImportsController;

  const mockImportsService = {
    processTelstraUpload: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportsController],
      providers: [
        {
          provide: ImportsService,
          useValue: mockImportsService,
        },
      ],
    }).compile();

    controller = module.get<ImportsController>(ImportsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadTelstraDataset', () => {
    it('should call processTelstraUpload with files', async () => {
      const mockResult = {
        id: 'job-123',
        sourceSystem: ImportSourceSystem.TELSTRA_CSV,
        status: ImportJobStatus.PENDING,
        totalRecords: 0,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockImportsService.processTelstraUpload.mockResolvedValue(mockResult);

      const files = [{ originalname: 'train.csv', buffer: Buffer.from('') } as any];
      const result = await controller.uploadTelstraDataset(files);

      expect(result).toEqual(mockResult);
      expect(mockImportsService.processTelstraUpload).toHaveBeenCalledWith(files);
    });

    it('should throw if no files array', async () => {
      await expect(controller.uploadTelstraDataset([])).rejects.toThrow('No files uploaded');
    });
  });
});
