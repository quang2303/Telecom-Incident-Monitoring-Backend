import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  // Disconnect prisma client after all tests in a suite
  await prisma.$disconnect();
});
