import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

const resourceMap: Record<string, string> = {
  'resource_type 1': 'Core Router (Cisco ASR-9000)',
  'resource_type 2': 'Edge Router (Juniper MX960)',
  'resource_type 3': 'Switch (Cisco Catalyst 9300)',
  'resource_type 4': 'Firewall (Palo Alto PA-5200)',
  'resource_type 5': 'Baseband Unit - BBU (Ericsson)',
  'resource_type 6': 'Remote Radio Head - RRH (Huawei)',
  'resource_type 7': 'Microwave Antenna (NEC)',
  'resource_type 8': 'Power Supply / Rectifier',
  'resource_type 9': 'Cooling System / HVAC',
  'resource_type 10': 'Optical Line Terminal - OLT (Nokia)',
};

const faultStrings = [
  'Fiber Cut (Core Link)',
  'High Temperature Alert',
  'BGP Session Down',
  'Intermittent Packet Loss',
  'Module Failure (Hardware)',
  'Power Supply Drop',
  'Memory OOM Crash',
  'Software Bug (Kernel Panic)',
  'Link Flapping',
  'Unauthorized Access Attempt',
  'Optical Signal Degraded'
];

function getEventString(typeStr: string) {
  const match = typeStr.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;
  return faultStrings[num % faultStrings.length] + ` [EV-${num}]`;
}

const logStrings = [
  'Interface GigabitEthernet down',
  'CPU Utilization > 90%',
  'Coolant level low',
  'Power redundant module B failed',
  'BGP Neighbor Down',
  'OSPF adjacency lost',
  'Authentication failed for user admin',
  'Hardware sensor: high temp',
  'Optical Tx Power Low'
];

function getFeatureString(featStr: string) {
  const match = featStr.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;
  return logStrings[num % logStrings.length] + ` [LOG-${num}]`;
}

function getLocationDetails(locStr: string) {
  const match = locStr.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;
  let region = 'TP.HCM';
  let name = `Trạm BTS HCM-${num}`;
  let address = `Quận ${Math.max(1, num % 12)}, TP.HCM`;
  
  if (num <= 100) {
    region = 'Hà Nội';
    name = `Trạm BTS HN-${num}`;
    address = `Quận Ba Đình, Hà Nội`;
  } else if (num <= 500) {
    region = 'Đà Nẵng';
    name = `Trạm BTS DNG-${num}`;
    address = `Quận Hải Châu, Đà Nẵng`;
  }
  return { name, region, address };
}

async function main() {
  console.log('Starting data translation process...');

  // 1. Map IncidentResourceType
  console.log('Translating IncidentResourceType...');
  const distinctResources = await prisma.incidentResourceType.findMany({ distinct: ['resourceType'], select: { resourceType: true } });
  for (const r of distinctResources) {
    if (r.resourceType.includes('resource_type')) {
      const translated = resourceMap[r.resourceType] || r.resourceType.replace('resource_type', 'Unclassified Hardware');
      await prisma.incidentResourceType.updateMany({
        where: { resourceType: r.resourceType },
        data: { resourceType: translated }
      });
    }
  }

  // 2. Map IncidentEventType
  console.log('Translating IncidentEventType...');
  const distinctEvents = await prisma.incidentEventType.findMany({ distinct: ['eventType'], select: { eventType: true } });
  for (const e of distinctEvents) {
    if (e.eventType.includes('event_type')) {
      const translated = getEventString(e.eventType);
      await prisma.incidentEventType.updateMany({
        where: { eventType: e.eventType },
        data: { eventType: translated }
      });
    }
  }

  // 3. Map IncidentLogFeature
  console.log('Translating IncidentLogFeature...');
  const distinctLogs = await prisma.incidentLogFeature.findMany({ distinct: ['logFeature'], select: { logFeature: true } });
  for (const l of distinctLogs) {
    if (l.logFeature.includes('feature ')) {
      const translated = getFeatureString(l.logFeature);
      await prisma.incidentLogFeature.updateMany({
        where: { logFeature: l.logFeature },
        data: { logFeature: translated }
      });
    }
  }

  // 4. Update Sites
  console.log('Translating Sites...');
  const sites = await prisma.site.findMany();
  for (const s of sites) {
    if (s.name.includes('location ')) {
      const { name, region, address } = getLocationDetails(s.name);
      await prisma.site.update({
        where: { id: s.id },
        data: { name, region, address }
      });
    }
  }

  // 5. Update Devices
  console.log('Translating Devices...');
  const devices = await prisma.device.findMany();
  for (const d of devices) {
    if (d.type && d.type.includes('resource_type')) {
      const translatedType = resourceMap[d.type] || d.type.replace('resource_type', 'Unclassified Hardware');
      const vendorMatch = translatedType.match(/\(([^)]+)\)/);
      const vendor = vendorMatch ? vendorMatch[1] : 'Unknown Vendor';
      // extract name part before parenthesis
      const equipName = translatedType.split('(')[0].trim();
      
      await prisma.device.update({
        where: { id: d.id },
        data: {
          type: equipName,
          name: `${equipName} [${d.code.split('-').pop()}]`,
          vendor: vendor
        }
      });
    }
  }

  console.log('Database Translation Complete!');
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
