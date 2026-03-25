import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SiteQueryDto } from './dto/site-query.dto';
import { SiteResponseDto } from './dto/site-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@ApiTags('Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({ status: 201, type: SiteResponseDto })
  create(@Body() createSiteDto: CreateSiteDto): Promise<SiteResponseDto> {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all sites with pagination and filtering' })
  @ApiPaginatedResponse(SiteResponseDto)
  findAll(@Query() query: SiteQueryDto): Promise<PaginatedResponseDto<SiteResponseDto>> {
    return this.sitesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a site by ID' })
  @ApiResponse({ status: 200, type: SiteResponseDto })
  findOne(@Param('id') id: string): Promise<SiteResponseDto> {
    return this.sitesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a site' })
  @ApiResponse({ status: 200, type: SiteResponseDto })
  update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto): Promise<SiteResponseDto> {
    return this.sitesService.update(id, updateSiteDto);
  }
}
