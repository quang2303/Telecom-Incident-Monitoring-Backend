import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device' })
  @ApiResponse({ status: 201, type: DeviceResponseDto })
  create(@Body() createDeviceDto: CreateDeviceDto): Promise<DeviceResponseDto> {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all devices with pagination and filtering' })
  @ApiPaginatedResponse(DeviceResponseDto)
  findAll(@Query() query: DeviceQueryDto): Promise<PaginatedResponseDto<DeviceResponseDto>> {
    return this.devicesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  findOne(@Param('id') id: string): Promise<DeviceResponseDto> {
    return this.devicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto): Promise<DeviceResponseDto> {
    return this.devicesService.update(id, updateDeviceDto);
  }
}
