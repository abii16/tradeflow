import { db } from './src/db';
import { riskZones } from './src/db/schema/risk_zones';

async function seedSecurity() {
  console.log('Seeding security test data...');

  try {
    // Insert 1 active incident
    await db.insert(riskZones).values({
      name: 'Semera Checkpoint Delay',
      type: 'Checkpoint Delay',
      description: 'Unexpected mandatory military checkpoint resulting in a 4+ hour delay for all cargo passing through Semera.',
      severity: 'medium',
      latitude: 11.794,
      longitude: 41.008,
      radiusKm: 15,
      zone: { type: "Circle", coordinates: [41.008, 11.794], radiusKm: 15 },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert 1 resolved historical incident
    await db.insert(riskZones).values({
      name: 'Galafi Border Road Washout',
      type: 'Road Closure',
      description: 'Severe flooding has completely washed out a 2km section of the main highway near the border. Impassable.',
      severity: 'critical',
      latitude: 11.716,
      longitude: 41.838,
      radiusKm: 25,
      zone: { type: "Circle", coordinates: [41.838, 11.716], radiusKm: 25 },
      isActive: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Resolved 1 day ago
    });

    console.log('Security test data seeded successfully.');
  } catch (error) {
    console.error('Error seeding security data:', error);
  }
}

seedSecurity().catch(console.error).finally(() => process.exit(0));
