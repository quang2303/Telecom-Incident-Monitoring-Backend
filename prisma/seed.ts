import { PrismaClient, UserRole } from '@prisma/client';
import "dotenv/config";
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const adapter = new PrismaPg(pool as any);

const prisma = new PrismaClient({
  adapter,
  errorFormat: 'pretty',
} as any);

async function main() {
  console.log('Starting seed...');

  // Helper to seed a user
  const seedUser = async (email: string, username: string, plainPassword: string, role: typeof UserRole[keyof typeof UserRole], region?: string) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role,
          region,
        },
      });
      console.log(`Created ${role} user: ${email} (Password: ${plainPassword})`);
    } else {
      console.log(`User ${email} already exists.`);
    }
  };

  // Seed Admin & Operators
  await seedUser('admin@telecom.local', 'admin', 'Admin@123', UserRole.ADMIN);
  await seedUser('operator1@telecom.local', 'operator1', 'Operator@123', UserRole.OPERATOR);
  await seedUser('operator2@telecom.local', 'operator2', 'Operator@123', UserRole.OPERATOR);

  // Seed Technicians
  await seedUser('tech.north@telecom.local', 'tech_north', 'Tech@123', UserRole.TECHNICIAN, 'North');
  await seedUser('tech.south@telecom.local', 'tech_south', 'Tech@123', UserRole.TECHNICIAN, 'South');

  // Seed Reference Sites
  const sites = [
    { code: 'SITE-001', name: 'Main Datacenter', region: 'North' },
    { code: 'SITE-002', name: 'Secondary Datacenter', region: 'South' },
  ];

  for (const siteData of sites) {
    const existingSite = await prisma.site.findUnique({
      where: { code: siteData.code },
    });

    if (!existingSite) {
      await prisma.site.create({
        data: siteData,
      });
      console.log(`Created site: ${siteData.code}`);
    } else {
       console.log(`Site ${siteData.code} already exists.`);
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
