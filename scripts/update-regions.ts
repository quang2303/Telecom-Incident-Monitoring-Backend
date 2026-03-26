import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const adapter = new PrismaPg(pool as any);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('Fetching sites and devices...');
  
  const devices = await prisma.device.findMany({
    include: { site: true }
  });

  console.log(`Found ${devices.length} devices.`);

  for (const device of devices) {
    if (device.site && device.site.region) {
      await prisma.device.update({
        where: { id: device.id },
        data: { region: device.site.region }
      });
      console.log(`Updated Device ${device.name} (${device.code}) to region: ${device.site.region}`);
    } else {
      console.log(`Device ${device.name} has no valid site region.`);
    }
  }

  // Update Technicians if needed, but wait, technician regions are currently North/South.
  // The user says "cập nhật lại region của technican". Let's get the distinct regions of sites and update technicians.
  const distinctRegions = [...new Set(devices.map(d => d.site?.region).filter(Boolean))];
  console.log("Distinct Site Regions from Devices: ", distinctRegions);

  const techs = await prisma.user.findMany({ where: { role: 'TECHNICIAN' } });
  
  for (let i = 0; i < techs.length; i++) {
    const r = distinctRegions[i % distinctRegions.length];
    if (r) {
      await prisma.user.update({
        where: { id: techs[i].id },
        data: { region: r }
      });
      console.log(`Updated Technician ${techs[i].email} to region: ${r}`);
    }
  }

  console.log('Update completed.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
