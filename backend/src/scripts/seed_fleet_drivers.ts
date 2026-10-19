import { db } from '../db';
import { shipments, users, vehicles } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  const [obama] = await db.select().from(users).where(eq(users.fullName, 'Obama Obama'));
  if (!obama) {
    console.error('Obama transporter not found');
    process.exit(1);
  }

  // 1. Create or ensure dedicated drivers for the fleet
  const driverDefs = [
    {
      fullName: 'Kassahun Desta',
      phone: '+251 911 284920',
      email: 'kassahun.driver@tradeflow.et',
      companyName: 'Obama Freight Logistics',
      metadata: { license_plate: '3-AA-98214', vehicle_model: 'Volvo FH16' },
      defaultPlate: '3-AA-98214',
    },
    {
      fullName: 'Tadesse Bekele',
      phone: '+251 922 475819',
      email: 'tadesse.driver@tradeflow.et',
      companyName: 'Obama Freight Logistics',
      metadata: { license_plate: '3-ET-74192', vehicle_model: 'Scania R500' },
      defaultPlate: '3-ET-74192',
    },
    {
      fullName: 'Alemayehu Wolde',
      phone: '+251 933 618294',
      email: 'alemayehu.driver@tradeflow.et',
      companyName: 'Obama Freight Logistics',
      metadata: { license_plate: '3-AA-45812', vehicle_model: 'Actros 3340' },
      defaultPlate: '3-AA-45812',
    },
  ];

  const createdDrivers = [];
  for (const d of driverDefs) {
    const [existing] = await db.select().from(users).where(eq(users.phone, d.phone));
    if (existing) {
      createdDrivers.push({ ...existing, defaultPlate: d.defaultPlate });
    } else {
      const [newDriver] = await db.insert(users).values({
        id: uuidv4(),
        fullName: d.fullName,
        phone: d.phone,
        email: d.email,
        role: 'TRANSPORTER', // drivers operate within transporter fleet
        companyName: d.companyName,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        metadata: d.metadata,
      }).returning();
      createdDrivers.push({ ...newDriver, defaultPlate: d.defaultPlate });
      console.log(`Created fleet driver: ${d.fullName} (${d.phone})`);
    }
  }

  // 2. Create fleet vehicles owned by Obama
  const vehicleDefs = [
    { vehicleType: 'Volvo FH16 Heavy Hauler', plateNumber: '3-AA-98214', capacityTons: '40.00', fuelType: 'Diesel' },
    { vehicleType: 'Scania R500 Fuel Tanker', plateNumber: '3-ET-74192', capacityTons: '45.00', fuelType: 'Diesel' },
    { vehicleType: 'Mercedes-Benz Actros 3340', plateNumber: '3-AA-45812', capacityTons: '38.00', fuelType: 'Diesel' },
  ];

  for (const v of vehicleDefs) {
    const existing = await db.select().from(vehicles).where(eq(vehicles.plateNumber, v.plateNumber));
    if (existing.length === 0) {
      await db.insert(vehicles).values({
        id: uuidv4(),
        ownerId: obama.id,
        vehicleType: v.vehicleType,
        plateNumber: v.plateNumber,
        capacityTons: v.capacityTons,
        fuelType: v.fuelType,
        isVerified: true,
      });
      console.log(`Created fleet vehicle: ${v.vehicleType} [Plate: ${v.plateNumber}]`);
    }
  }

  // 3. Update active shipments with real assigned drivers and truck plates
  const obamaShipments = await db.select().from(shipments).where(eq(shipments.transporterId, obama.id));
  console.log(`Found ${obamaShipments.length} shipments to update.`);

  for (let i = 0; i < obamaShipments.length; i++) {
    const s = obamaShipments[i];
    const assignedDriver = createdDrivers[i % createdDrivers.length];
    await db.update(shipments).set({
      driverId: assignedDriver.id,
      truckPlate: assignedDriver.defaultPlate,
      updatedAt: new Date(),
    }).where(eq(shipments.id, s.id));

    console.log(`Shipment ${s.id.substring(0, 8)} assigned to Driver: ${assignedDriver.fullName}, Plate: ${assignedDriver.defaultPlate}`);
  }

  console.log('Driver and vehicle assignment seed complete!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
