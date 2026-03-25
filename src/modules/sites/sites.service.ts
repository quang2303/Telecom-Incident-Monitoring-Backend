import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SiteQueryDto } from './dto/site-query.dto';
import { PaginatedResponseDto, PaginatedMetaDto } from '../../common/dto/paginated-response.dto';
import { SiteResponseDto } from './dto/site-response.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma } from '@prisma/client';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async create(createSiteDto: CreateSiteDto): Promise<SiteResponseDto> {
    const { code, name, region, address } = createSiteDto;

    const existingSite = await this.prisma.site.findUnique({
      where: { code },
    });

    if (existingSite) {
      throw new ConflictException('Site with this code already exists');
    }

    const site = await this.prisma.site.create({
      data: {
        code,
        name,
        region,
        address,
      },
    });

    return plainToInstance(SiteResponseDto, site);
  }

  async findAll(query: SiteQueryDto): Promise<PaginatedResponseDto<SiteResponseDto>> {
    const { page = 1, limit = 10, region, keyword } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SiteWhereInput = {};
    if (region) where.region = region;
    if (keyword) {
      where.OR = [
        { code: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, sites] = await Promise.all([
      this.prisma.site.count({ where }),
      this.prisma.site.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data = sites.map((s) => plainToInstance(SiteResponseDto, s));
    const meta: PaginatedMetaDto = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return new PaginatedResponseDto(data, meta);
  }

  async findOne(id: string): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }
    return plainToInstance(SiteResponseDto, site);
  }

  async update(id: string, updateSiteDto: UpdateSiteDto): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findUnique({ where: { id } });
    if (!site) {
      throw new NotFoundException('Site not found');
    }

    if (updateSiteDto.code && updateSiteDto.code !== site.code) {
      const existingSite = await this.prisma.site.findUnique({
        where: { code: updateSiteDto.code },
      });
      if (existingSite) {
        throw new ConflictException('Site with this code already exists');
      }
    }

    const updatedSite = await this.prisma.site.update({
      where: { id },
      data: updateSiteDto,
    });

    return plainToInstance(SiteResponseDto, updatedSite);
  }
}
