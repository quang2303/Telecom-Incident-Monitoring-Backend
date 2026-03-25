import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/prisma/prisma.service';
import { IncidentInternalStatus, UserRole, ImportSourceSystem } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testIncidentId: string;
  let testSiteId: string;

  const testUser = {
    email: `e2e_user_${Date.now()}@example.com`,
    username: `e2e_user_${Date.now()}`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mimic main.ts setup
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Initial Database Prep
    const site = await prisma.site.create({
      data: {
        code: `SITE_E2E_${Date.now()}`,
        name: 'E2E Test Site',
      },
    });
    testSiteId = site.id;
  });

  afterAll(async () => {
    // Teardown E2E specific data
    await prisma.incidentLog.deleteMany({
      where: { incident: { title: { contains: 'E2E' } } },
    });
    await prisma.incident.deleteMany({
      where: { title: { contains: 'E2E' } },
    });
    await prisma.site.deleteMany({
      where: { id: testSiteId },
    });
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  describe('Auth flows', () => {
    it('/api/v1/auth/register (POST) - should register user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('/api/v1/auth/login (POST) - should login and return token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ identifier: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      accessToken = res.body.accessToken;
    });

    it('/api/v1/auth/me (GET) - should get profile with valid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email);
      expect(res.body.role).toBe(UserRole.OPERATOR);
      expect(res.body.password).toBeUndefined();
    });
  });

  describe('Incident flows', () => {
    it('Simulate creating an incident via database (as there is no standalone POST endpoint)', async () => {
      const incident = await prisma.incident.create({
        data: {
          title: `E2E Test Incident ${Date.now()}`,
          description: 'Used for E2E testing listing and updates',
          externalIncidentId: `INC-E2E-${Date.now()}`,
          internalStatus: IncidentInternalStatus.NEW,
          sourceSystem: ImportSourceSystem.MANUAL,
          siteId: testSiteId,
        },
      });
      testIncidentId = incident.id;
      expect(testIncidentId).toBeDefined();
    });

    it('/api/v1/incidents (GET) - should list incidents when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/incidents?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
      expect(res.body.data.some((inc: any) => inc.id === testIncidentId)).toBeTruthy();
    });

    it('/api/v1/incidents (GET) - should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/v1/incidents').expect(401);
    });

    it('/api/v1/incidents/:id/status (PATCH) - should update status and create log', async () => {
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/incidents/${testIncidentId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: IncidentInternalStatus.REVIEWING })
        .expect(200);

      expect(updateRes.body.internalStatus).toBe(IncidentInternalStatus.REVIEWING);

      // Verify log was created
      const logsRes = await request(app.getHttpServer())
        .get(`/api/v1/incidents/${testIncidentId}/logs`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logsRes.body.length).toBeGreaterThan(0);
      expect(logsRes.body[0].message).toContain('REVIEWING');
    });

    it('/api/v1/incidents/:id/status (PATCH) - should return 400 for bad transition', async () => {
      // Transitioning back to NEW from REVIEWING is invalid
      await request(app.getHttpServer())
        .patch(`/api/v1/incidents/${testIncidentId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: IncidentInternalStatus.NEW })
        .expect(400);
    });
  });
});
