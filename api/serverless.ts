import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, BadRequestException } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as rtracer from 'cls-rtracer';

const server = express();

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.use(helmet());
    app.use(rtracer.expressMiddleware({ useHeader: true, headerName: 'x-request-id' }));
    
    // We can allow all CORS for serverless or read from process.env if needed
    const corsOrigin = process.env.CORS_ORIGIN || '*';
    app.enableCors({ origin: corsOrigin === '*' ? '*' : corsOrigin.split(',') });

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

    // Swagger setup for Serverless
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Telecom Incident Monitoring Backend')
      .setDescription('API documentation for the Telecom Incident Monitoring System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    await app.init();
    cachedApp = app;
  }
}

export default async function handler(req: any, res: any) {
  if (req.url === '/') {
    return res.status(200).json({ status: 'ok', message: 'Telecom Incident Monitoring Backend is running on Vercel' });
  }
  
  await bootstrap();
  return server(req, res);
}

