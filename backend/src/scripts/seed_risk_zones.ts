import { db } from '../db';
import { riskZones } from '../db/schema/risk_zones';

async function run() {
  await db.insert(riskZones).values([
    {
      name: 'Semera Highway Blockage',
      type: 'Road Closure',
      description: 'Major accident near Semera. All trucks must reroute via alternative detour. Heavy delays expected.',
      severity: 'Critical Incident',
      latitude: 11.7946,
      longitude: 40.9577,
      radiusKm: 5,
      zone: { type: "Circle", coordinates: [40.9577, 11.7946], radiusKm: 5 },
      isActive: true,
      createdAt: new Date()
    },
    {
      name: 'Dire Dawa Flash Floods',
      type: 'Weather Hazard',
      description: 'Severe flooding washed out section of the road. Clearance operations complete.',
      severity: 'High Advisory',
      latitude: 9.6009,
      longitude: 41.8501,
      radiusKm: 12,
      zone: { type: "Circle", coordinates: [41.8501, 9.6009], radiusKm: 12 },
      isActive: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  ]);
  console.log("Inserted active and resolved risk zones.");
  process.exit(0);
}
run();
