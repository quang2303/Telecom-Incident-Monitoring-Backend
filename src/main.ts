import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, VersioningType, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as rtracer from 'cls-rtracer';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefixes and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Security, request tracking, CORS
  app.use(helmet());
  app.use(rtracer.expressMiddleware({ useHeader: true, headerName: 'x-request-id' }));
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({ origin: corsOrigin === '*' ? '*' : corsOrigin.split(',') });

  // Graceful shutdown
  app.enableShutdownHooks();

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Telecom Incident Monitoring Backend')
    .setDescription('API documentation for the Telecom Incident Monitoring System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Start the server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Swagger Docs available at: http://localhost:${port}/docs`);
}
bootstrap();
