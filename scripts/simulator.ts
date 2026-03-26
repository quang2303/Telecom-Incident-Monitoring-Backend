import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import axios from 'axios';

const prisma = new PrismaClient();

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.TELEMETRY_API_KEY || 'default-telemetry-secret-key';
const INTERVAL_MS = parseInt(process.env.SIMULATOR_INTERVAL_MS || '1800000', 10); // Default 30 minutes

const FAULT_EVENTS = [
  'Fiber Cut (Core Link)',
  'High Temperature Alert',
  'Intermittent Packet Loss',
  'Module Failure (Hardware)',
  'Power Supply Drop'
];

async function simulateFault() {
  try {
    // 1. Pick a random device
    const devicesCount = await prisma.device.count();
    if (devicesCount === 0) {
      console.log('No devices found in DB. Simulator cannot run.');
      return;
    }

    const randomOffset = Math.floor(Math.random() * devicesCount);
    const device = await prisma.device.findFirst({
      skip: randomOffset,
    });

    if (!device) return;

    // 2. Generate plausible telemetry
    const faultSeverity = Math.floor(Math.random() * 3); // 0, 1, 2
    const eventType = FAULT_EVENTS[Math.floor(Math.random() * FAULT_EVENTS.length)];
    
    const payload = {
      deviceId: device.id,
      faultSeverity,
      eventTypes: [eventType],
      logs: [
        {
          feature: `Hardware fault detected code ${Math.floor(Math.random() * 9999)}`,
          volume: Math.floor(Math.random() * 10) + 1
        }
      ]
    };

    console.log(`[Simulator] Emitting event for Device ${device.code} (${device.name})...`);

    // 3. Post to Webhook
    const response = await axios.post(`${SERVER_URL}/api/v1/webhook/telemetry`, payload, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[Simulator] Webhook Success! Created Incident -> HTTP ${response.status}`);
  } catch (err: any) {
    console.error(`[Simulator] Error sending telemetry:`, err?.response?.data || err.message);
  }
}

async function main() {
  console.log(`[Simulator] Starting hardware simulation every ${INTERVAL_MS}ms...`);
  
  // Run immediately once
  await simulateFault();

  // Schedule repetitive ticks
  setInterval(simulateFault, INTERVAL_MS);
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
});
