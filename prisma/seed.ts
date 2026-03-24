import { PrismaClient, UserRole } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

async function main() {
  console.log('Starting seed...');

  // Seed Admin User
  const adminEmail = 'admin@telecom.local';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin',
        password: '$2b$10$D/3M/vS.P15HhV1I2/fWeuX9L1i2f9v6jY4rR/LqB1P9VdFv1z/d2', // Valid bcrypt hash for "Admin@123"
        role: UserRole.ADMIN,
      },
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

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
  });
