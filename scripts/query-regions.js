require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sites = await prisma.site.findMany({ take: 10 });
  console.log("SITES SAMPLE:");
  console.log(sites);

  const devices = await prisma.device.findMany({ take: 10, include: { site: true } });
  console.log("\nDEVICES SAMPLE:");
  console.log(devices);

  const users = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  console.log("\nTECHNICIANS:");
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
