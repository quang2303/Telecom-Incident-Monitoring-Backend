import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
    const adapter = new PrismaPg(pool as any);
    super({ adapter } as any);
    this.pool = pool;
  }

  async onModuleInit() {
    this.logger.log('PrismaService is initializing...');
    await this.$connect();
    this.logger.log('PrismaService connected to the database.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('PrismaService disconnected from the database.');
  }
}
