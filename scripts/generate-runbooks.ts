import * as fs from 'fs';
import * as path from 'path';

interface Runbook {
  id: string;
  category: string;
  faultCode: string;
  symptoms: string;
  possibleCauses: string[];
  resolutionSteps: string[];
  vendor: string;
  severity: string;
}

const vendors = ['Cisco', 'Huawei', 'Nokia', 'Juniper', 'Ericsson'];
const severities = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING'];

const faultTemplates = [
  {
    category: 'Optical',
    faultCode: 'OPT-LOS-001',
    symptoms: 'Loss of Signal (LOS) alarm on optical interface. Traffic dropping 100%.',
    possibleCauses: ['Fiber cut', 'SFP module failure', 'Dirty optical connector', 'Upstream device powered off'],
    resolutionSteps: [
      '1. Check OTDR reading to locate potential fiber cut distance.',
      '2. Inspect physical patching at the ODF and clean optical connectors.',
      '3. Swap the SFP/XFP transceiver module to rule out hardware failure.',
      '4. Verify Rx/Tx power levels using command "show interfaces transceiver".',
      '5. Dispatch field team if fiber cut is confirmed outside the facility.'
    ]
  },
  {
    category: 'Optical',
    faultCode: 'OPT-PWR-002',
    symptoms: 'Low Rx Power alarm. Intermittent packet loss observed.',
    possibleCauses: ['Bending of fiber cable', 'Degraded SFP module', 'Bad splice joint'],
    resolutionSteps: [
      '1. Measure optical power using a light meter.',
      '2. Compare current Rx power with baseline commissioning records.',
      '3. Re-seat or replace fiber patch cord.',
      '4. Clean both ends of the fiber connection.',
      '5. Monitor error counters (CRC, Input errors) for 15 minutes.'
    ]
  },
  {
    category: 'Power',
    faultCode: 'PWR-MAINS-001',
    symptoms: 'AC Mains Power Failure alarm triggered. Site running on battery backup.',
    possibleCauses: ['Grid power outage', 'Tripped main breaker', 'Blown fuse at meter box'],
    resolutionSteps: [
      '1. Acknowledge alarm and check estimated battery runtime left (SoC).',
      '2. Contact local utility company to verify grid status in the area.',
      '3. Dispatch technician with portable generator if grid restoration ETA exceeds battery life.',
      '4. Check rectifier logs for any voltage spikes prior to failure.',
      '5. Once AC is restored, verify battery charging status.'
    ]
  },
  {
    category: 'Power',
    faultCode: 'PWR-RECT-002',
    symptoms: 'Rectifier Module Failure. Load sharing compromised.',
    possibleCauses: ['Hardware fault in rectifier module', 'Overheating due to clogged filter', 'Input voltage surge'],
    resolutionSteps: [
      '1. Remote check total load current vs remaining rectifier capacity.',
      '2. If capacity is sufficient, schedule replacement during business hours.',
      '3. Instruct field tech to inspect for burnt smell or visible damage.',
      '4. Swap failed rectifier module with identical spare.',
      '5. Verify load is evenly distributed across new module.'
    ]
  },
  {
    category: 'Routing',
    faultCode: 'RTG-BGP-001',
    symptoms: 'BGP Peer transition to Idle/Active state. Routing table missing prefixes.',
    possibleCauses: ['Transport link failure', 'MTU mismatch', 'BGP timer mismatch', 'ISP filtering routing updates'],
    resolutionSteps: [
      '1. Ping BGP neighbor IP to verify Layer 3 reachability.',
      '2. Check interface status and error counters.',
      '3. Verify MTU size end-to-end to ensure large packets are not dropped.',
      '4. Run "show ip bgp neighbors" to check for hold-timer expiration or TCP session resets.',
      '5. Contact peer ISP NOC to verify reciprocal configuration.'
    ]
  },
  {
    category: 'Routing',
    faultCode: 'RTG-OSPF-002',
    symptoms: 'OSPF Neighbor state stuck in EXSTART/EXCHANGE.',
    possibleCauses: ['MTU mismatch on interfaces', 'Duplicate Router ID', 'Access Control List blocking multicast'],
    resolutionSteps: [
      '1. Issue "show ip ospf neighbor" to confirm stuck state.',
      '2. Verify interface IP MTU matches on both ends of the link.',
      '3. Check if OSPF packets (IP Protocol 89) are permitted by intermediate firewalls.',
      '4. Ensure Router IDs are unique across the OSPF domain.',
      '5. Clear OSPF process if configuration was recently changed.'
    ]
  },
  {
    category: 'Hardware',
    faultCode: 'HW-TEMP-001',
    symptoms: 'High Temperature Threshold Exceeded alarm.',
    possibleCauses: ['HVAC failure in server room', 'Clogged air filters on chassis', 'Fan tray failure'],
    resolutionSteps: [
      '1. Check environmental sensors for ambient room temperature.',
      '2. Ensure all fan modules are operational via CLI "show environment cooling".',
      '3. Check if air filters are blocked with dust.',
      '4. If HVAC failed, dispatch facilities team immediately to prevent thermal shutdown.',
      '5. Monitor CPU and line-card temperatures continuously until resolved.'
    ]
  },
  {
    category: 'Hardware',
    faultCode: 'HW-CPU-002',
    symptoms: 'CPU Utilization consistently > 95% for over 15 minutes.',
    possibleCauses: ['DDoS attack', 'Routing loop', 'Software memory leak/bug', 'Excessive SNMP polling'],
    resolutionSteps: [
      '1. Run "show processes cpu sorted" to identify offending process.',
      '2. If interrupt-driven (traffic), check for high broadcast/multicast traffic or DDoS.',
      '3. Apply Control Plane Policing (CoPP) if management plane is under attack.',
      '4. Review recent configuration changes causing routing loops.',
      '5. Plan a maintenance window for firmware upgrade if identified as a known bug.'
    ]
  },
  {
    category: 'Network',
    faultCode: 'NET-L2-001',
    symptoms: 'MAC Flapping detected between two ports.',
    possibleCauses: ['Layer 2 Spanning Tree loop', 'Duplicate MAC addresses', 'Wireless client roaming aggressively'],
    resolutionSteps: [
      '1. Check switch logs for MAC flapping notifications to identify involved ports.',
      '2. Verify Spanning Tree Protocol (STP) status and root bridge.',
      '3. Shut down one of the ports if a loop is actively crashing the network.',
      '4. Trace the cabling between the two ports.',
      '5. Enable BPDU Guard on edge ports to prevent future loops.'
    ]
  },
  {
    category: 'Software',
    faultCode: 'SW-MEM-001',
    symptoms: 'Memory allocation failures. System running low on free memory.',
    possibleCauses: ['Memory leak in OS process', 'Excessive BGP routing table size', 'Too many concurrent sessions'],
    resolutionSteps: [
      '1. Check memory utilization using "show memory" or equivalent command.',
      '2. Compare routing table size against hardware limits.',
      '3. Clear large unused caches or reset non-critical processes.',
      '4. Schedule a proactive reboot of the device during maintenance hours.',
      '5. Check vendor release notes for known memory leak patches.'
    ]
  }
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRunbooks(count: number): Runbook[] {
  const runbooks: Runbook[] = [];

  for (let i = 1; i <= count; i++) {
    const template = getRandomElement(faultTemplates);
    const vendor = getRandomElement(vendors);
    const severity = getRandomElement(severities);
    
    // Add some realistic variations to make data look diverse
    const id = `RB-${new Date().getFullYear()}-${String(i).padStart(4, '0')}`;
    const specificFaultCode = `${vendor.substring(0, 3).toUpperCase()}-${template.faultCode}-${getRandomInt(10, 99)}`;
    
    // Shuffle causes slightly for variance
    const shuffledCauses = [...template.possibleCauses].sort(() => 0.5 - Math.random());
    const selectedCauses = shuffledCauses.slice(0, getRandomInt(1, template.possibleCauses.length));

    runbooks.push({
      id,
      category: template.category,
      faultCode: specificFaultCode,
      symptoms: `[${vendor}] ${template.symptoms}`,
      possibleCauses: selectedCauses,
      resolutionSteps: template.resolutionSteps,
      vendor,
      severity
    });
  }

  return runbooks;
}

const totalCount = 500;
console.log(`Generating ${totalCount} realistic telecom runbooks...`);
const data = generateRunbooks(totalCount);

const outputDir = path.join(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'ai-runbooks.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Successfully generated ${totalCount} records at ${outputPath}`);
