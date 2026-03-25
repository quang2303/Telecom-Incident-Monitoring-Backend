import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { PaginatedResponseDto, PaginatedMetaDto } from '../../common/dto/paginated-response.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceResponseDto> {
    const { code, name, type, vendor, siteId } = createDeviceDto;

    const existingCode = await this.prisma.device.findUnique({ where: { code } });
    if (existingCode) {
      throw new ConflictException('Device with this code already exists');
    }

    const siteExists = await this.prisma.site.findUnique({ where: { id: siteId } });
    if (!siteExists) {
      throw new NotFoundException('Site not found for the provided siteId');
    }

    const device = await this.prisma.device.create({
      data: {
        code,
        name,
        type,
        vendor,
        siteId,
      },
    });

    return plainToInstance(DeviceResponseDto, device);
  }

  async findAll(query: DeviceQueryDto): Promise<PaginatedResponseDto<DeviceResponseDto>> {
    const { page = 1, limit = 10, siteId, type, keyword } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DeviceWhereInput = {};
    if (siteId) where.siteId = siteId;
    if (type) where.type = type;
    if (keyword) {
      where.OR = [
        { code: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, devices] = await Promise.all([
      this.prisma.device.count({ where }),
      this.prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = devices.map((d) => plainToInstance(DeviceResponseDto, d));
    const meta: PaginatedMetaDto = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return new PaginatedResponseDto(data, meta);
  }

  async findOne(id: string): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return plainToInstance(DeviceResponseDto, device);
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (updateDeviceDto.code && updateDeviceDto.code !== device.code) {
      const existingCode = await this.prisma.device.findUnique({
        where: { code: updateDeviceDto.code },
      });
      if (existingCode) {
        throw new ConflictException('Device with this code already exists');
      }
    }

    if (updateDeviceDto.siteId && updateDeviceDto.siteId !== device.siteId) {
      const siteExists = await this.prisma.site.findUnique({
        where: { id: updateDeviceDto.siteId },
      });
      if (!siteExists) {
        throw new NotFoundException('Site not found for the provided siteId');
      }
    }

    const updatedDevice = await this.prisma.device.update({
      where: { id },
      data: updateDeviceDto,
    });

    return plainToInstance(DeviceResponseDto, updatedDevice);
  }
}
