import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { validate } from './config/env.validation';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SitesModule } from './modules/sites/sites.module';
import { DevicesModule } from './modules/devices/devices.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ImportsModule } from './modules/imports/imports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // global limit 100 req/min
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SitesModule,
    DevicesModule,
    IncidentsModule,
    ImportsModule,
    DashboardModule,
    AiModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
