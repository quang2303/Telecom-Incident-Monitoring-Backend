import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ImportsService } from './imports.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ImportJobResponseDto } from './dto/import-job-response.dto';

@ApiTags('Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('telstra')
  @ApiOperation({ summary: 'Ingest Telstra dataset bundle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Upload either a dataset.zip or individual csv files',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: ImportJobResponseDto })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadTelstraDataset(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ImportJobResponseDto> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return this.importsService.processTelstraUpload(files);
  }

  @Get()
  @ApiOperation({ summary: 'List import jobs' })
  @ApiResponse({ status: 200, type: [ImportJobResponseDto] })
  async findAll(): Promise<ImportJobResponseDto[]> {
    return this.importsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get import job by id' })
  @ApiResponse({ status: 200, type: ImportJobResponseDto })
  async findOne(@Param('id') id: string): Promise<ImportJobResponseDto> {
    return this.importsService.findOne(id);
  }
}
