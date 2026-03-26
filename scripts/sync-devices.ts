import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('Synchronizing devices based on existing incidents and resource types...');
  
  // 1. Get all incidents with their sites and resource types
  const incidents = await prisma.incident.findMany({
    include: {
      site: true,
      resources: true,
    }
  });

  console.log(`Found ${incidents.length} incidents. Processing devices...`);

  // Track created devices in memory to avoid redundant DB queries
  const deviceCache = new Map<string, string>(); // 'SiteCode-ResourceType' -> 'DeviceId'

  let updatedCount = 0;
  let newDeviceCount = 0;

  for (const incident of incidents) {
    if (incident.resources.length === 0) continue;
    
    // Use the primary resource type to define the device
    const primaryResource = incident.resources[0].resourceType;
    const deviceKey = `${incident.site.code}-${primaryResource}`;

    let deviceId = deviceCache.get(deviceKey);

    if (!deviceId) {
      // Check DB or Create
      const deviceCode = `DEV-${incident.site.code.replace(/\s+/g, '')}-${primaryResource.replace(/\s+/g, '')}`;
      
      let device = await prisma.device.findUnique({
        where: { code: deviceCode }
      });

      if (!device) {
        device = await prisma.device.create({
          data: {
            code: deviceCode,
            name: `${primaryResource.toUpperCase()} Equipment`,
            type: primaryResource,
            vendor: 'Telstra Simulated',
            siteId: incident.siteId,
          }
        });
        newDeviceCount++;
      }

      deviceId = device.id;
      deviceCache.set(deviceKey, deviceId);
    }

    // Link the incident to the device
    if (incident.deviceId !== deviceId) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: { deviceId }
      });
      updatedCount++;
    }
  }

  console.log(`Synchronization complete! Created ${newDeviceCount} new devices (Total Unique: ${deviceCache.size}) and linked ${updatedCount} incidents to them.`);
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
