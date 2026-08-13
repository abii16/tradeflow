import { db } from '../../db';
import { driverCheckIns, incidentReports, syncBatches } from '../../db/schema/offline_sync';
import { shipments, shipmentStatusEnum } from '../../db/schema/shipments';
import { loads } from '../../db/schema/loads';
import { eq, and, desc, asc, inArray, gte, lte } from 'drizzle-orm';
import {
  SyncBatchRequestDto,
  CheckInItemDto,
  IncidentItemDto,
  QueryTrailDto,
  QueryIncidentsDto,
} from '../../dto/offline-sync.dto';
import { UserProfile } from '../../types';

export interface SyncBatchResult {
  batchId: string;
  status: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED';
  syncedAt: string;
  summary: {
    totalReceived: number;
    checkInsProcessed: number;
    incidentsProcessed: number;
    duplicatesSkipped: number;
    errorsCount: number;
  };
  processedCheckInIds: string[];
  processedIncidentIds: string[];
  duplicateClientRecordIds: string[];
  errors: Array<{ clientRecordId: string; error: string }>;
  latestShipments?: Array<{
    shipmentId: string;
    status: string;
    currentLat: number;
    currentLng: number;
    updatedAt: string;
  }>;
}

export class OfflineSyncService {
  /**
   * Process a queued offline sync batch from a driver upon reconnection (TF-205 / FR-03 / FR-05.2)
   */
  async processSyncBatch(
    user: UserProfile & { isVerified?: boolean },
    batchData: SyncBatchRequestDto,
    socketEmitter?: (room: string, event: string, payload: any) => void
  ): Promise<SyncBatchResult> {
    const { batchId, deviceInfo, checkIns, incidents, clientTimestamp } = batchData;

    // 1. Idempotency check: Check if this batch has already been processed
    const [existingBatch] = await db
      .select()
      .from(syncBatches)
      .where(eq(syncBatches.batchId, batchId));

    if (existingBatch) {
      // Return previous batch result summary if available
      return (
        (existingBatch.summary as unknown as SyncBatchResult) || {
          batchId: existingBatch.batchId,
          status: existingBatch.status as any,
          syncedAt: existingBatch.syncedAt.toISOString(),
          summary: {
            totalReceived: existingBatch.totalItems,
            checkInsProcessed: existingBatch.processedCount,
            incidentsProcessed: 0,
            duplicatesSkipped: existingBatch.duplicateCount,
            errorsCount: existingBatch.failureCount,
          },
          processedCheckInIds: [],
          processedIncidentIds: [],
          duplicateClientRecordIds: [],
          errors: [],
        }
      );
    }

    const processedCheckInIds: string[] = [];
    const processedIncidentIds: string[] = [];
    const duplicateClientRecordIds: string[] = [];
    const errors: Array<{ clientRecordId: string; error: string }> = [];

    // 2. Sort check-ins chronologically by clientTimestamp to enforce sequential state progression
    const sortedCheckIns = [...checkIns].sort(
      (a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime()
    );

    // Group check-ins by shipment to resolve latest authoritative coordinates & status
    const shipmentLatestUpdates = new Map<
      string,
      {
        latestCheckIn: CheckInItemDto;
        hasDelivery: boolean;
        hasPickup: boolean;
        podPhotoUrl?: string;
        podSignatureUrl?: string;
        latestStatus?: (typeof shipmentStatusEnum.enumValues)[number];
      }
    >();

    // 3. Process Check-ins
    for (const item of sortedCheckIns) {
      try {
        // Check for duplicate clientRecordId
        const [existingCheckIn] = await db
          .select({ id: driverCheckIns.id })
          .from(driverCheckIns)
          .where(eq(driverCheckIns.clientRecordId, item.clientRecordId));

        if (existingCheckIn) {
          duplicateClientRecordIds.push(item.clientRecordId);
          continue;
        }

        // Verify shipment existence and permissions
        const [shipment] = await db
          .select()
          .from(shipments)
          .where(eq(shipments.id, item.shipmentId));

        if (!shipment) {
          errors.push({
            clientRecordId: item.clientRecordId,
            error: `Shipment '${item.shipmentId}' not found`,
          });
          continue;
        }

        // Validate driver authorization
        if (
          user.role === 'DRIVER' &&
          shipment.driverId !== user.id &&
          shipment.transporterId !== user.id
        ) {
          errors.push({
            clientRecordId: item.clientRecordId,
            error: `Forbidden: Driver is not assigned to shipment '${item.shipmentId}'`,
          });
          continue;
        }

        // Insert driver check-in record
        const [inserted] = await db
          .insert(driverCheckIns)
          .values({
            shipmentId: item.shipmentId,
            driverId: user.id,
            clientRecordId: item.clientRecordId,
            eventType: item.eventType,
            status: item.status,
            latitude: item.latitude,
            longitude: item.longitude,
            altitude: item.altitude,
            speedKmH: item.speedKmH,
            heading: item.heading,
            accuracy: item.accuracy,
            odometerKm: item.odometerKm,
            batteryLevel: item.batteryLevel,
            locationName: item.locationName,
            notes: item.notes,
            podPhotoUrl: item.podPhotoUrl,
            podSignatureUrl: item.podSignatureUrl,
            metadata: item.metadata,
            clientTimestamp: new Date(item.clientTimestamp),
          })
          .returning();

        processedCheckInIds.push(inserted.id);

        // Track latest updates for this shipment
        const currentGroup = shipmentLatestUpdates.get(item.shipmentId) || {
          latestCheckIn: item,
          hasDelivery: false,
          hasPickup: false,
        };

        currentGroup.latestCheckIn = item;

        if (item.status === 'PICKED_UP' || item.eventType === 'WAYPOINT_CHECKIN') {
          currentGroup.hasPickup = true;
        }

        if (item.status === 'DELIVERED' || item.eventType === 'DELIVERY_POD') {
          currentGroup.hasDelivery = true;
          if (item.podPhotoUrl) currentGroup.podPhotoUrl = item.podPhotoUrl;
          if (item.podSignatureUrl) currentGroup.podSignatureUrl = item.podSignatureUrl;
          currentGroup.latestStatus = 'DELIVERED';
        } else if (item.status) {
          currentGroup.latestStatus = item.status as (typeof shipmentStatusEnum.enumValues)[number];
        }

        shipmentLatestUpdates.set(item.shipmentId, currentGroup);

        // Real-time WebSocket emission for GPS breadcrumb
        if (socketEmitter) {
          socketEmitter(item.shipmentId, 'shipment-location-updated', {
            shipmentId: item.shipmentId,
            latitude: item.latitude,
            longitude: item.longitude,
            speedKmH: item.speedKmH,
            heading: item.heading,
            locationName: item.locationName,
            timestamp: new Date(item.clientTimestamp).toISOString(),
            isOfflineSync: true,
          });
        }
      } catch (err: any) {
        console.error(`[OfflineSyncService] Error processing check-in ${item.clientRecordId}:`, err);
        errors.push({
          clientRecordId: item.clientRecordId,
          error: err.message || 'Database error processing check-in',
        });
      }
    }

    // 4. Update Shipments and Loads with Authoritative Latest Coordinates & Status
    const updatedShipmentsList: Array<{
      shipmentId: string;
      status: string;
      currentLat: number;
      currentLng: number;
      updatedAt: string;
    }> = [];

    for (const [shipmentId, updateData] of shipmentLatestUpdates.entries()) {
      try {
        const [existingShipment] = await db
          .select()
          .from(shipments)
          .where(eq(shipments.id, shipmentId));

        if (!existingShipment) continue;

        const updateFields: any = {
          currentLat: updateData.latestCheckIn.latitude,
          currentLng: updateData.latestCheckIn.longitude,
          updatedAt: new Date(),
        };

        if (updateData.latestStatus) {
          updateFields.status = updateData.latestStatus;
        }

        if (updateData.hasPickup && !existingShipment.pickupTime) {
          updateFields.pickupTime = new Date(updateData.latestCheckIn.clientTimestamp);
        }

        if (updateData.hasDelivery) {
          updateFields.status = 'DELIVERED';
          updateFields.deliveryTime = new Date(updateData.latestCheckIn.clientTimestamp);
          if (updateData.podPhotoUrl) updateFields.podPhotoUrl = updateData.podPhotoUrl;
          if (updateData.podSignatureUrl) updateFields.podSignatureUrl = updateData.podSignatureUrl;
        }

        const [updatedShipment] = await db
          .update(shipments)
          .set(updateFields)
          .where(eq(shipments.id, shipmentId))
          .returning();

        // Update corresponding parent load status
        if (updateData.hasDelivery) {
          await db
            .update(loads)
            .set({ status: 'DELIVERED', updatedAt: new Date() })
            .where(eq(loads.id, existingShipment.loadId));
        } else if (updateFields.status === 'IN_TRANSIT' || updateFields.status === 'PICKED_UP') {
          await db
            .update(loads)
            .set({ status: 'IN_TRANSIT', updatedAt: new Date() })
            .where(eq(loads.id, existingShipment.loadId));
        }

        updatedShipmentsList.push({
          shipmentId: updatedShipment.id,
          status: updatedShipment.status,
          currentLat: updatedShipment.currentLat ?? updateData.latestCheckIn.latitude,
          currentLng: updatedShipment.currentLng ?? updateData.latestCheckIn.longitude,
          updatedAt: updatedShipment.updatedAt.toISOString(),
        });

        // Broadcast status update via WebSocket
        if (socketEmitter && updateFields.status) {
          socketEmitter(shipmentId, 'shipment-status-updated', {
            shipmentId,
            status: updatedShipment.status,
            pickupTime: updatedShipment.pickupTime?.toISOString(),
            deliveryTime: updatedShipment.deliveryTime?.toISOString(),
            podPhotoUrl: updatedShipment.podPhotoUrl,
            podSignatureUrl: updatedShipment.podSignatureUrl,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(`[OfflineSyncService] Error updating shipment state for ${shipmentId}:`, err);
      }
    }

    // 5. Process Incident Reports
    const sortedIncidents = [...incidents].sort(
      (a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime()
    );

    for (const incident of sortedIncidents) {
      try {
        if (incident.clientRecordId) {
          const [existingIncident] = await db
            .select({ id: incidentReports.id })
            .from(incidentReports)
            .where(eq(incidentReports.clientRecordId, incident.clientRecordId));

          if (existingIncident) {
            duplicateClientRecordIds.push(incident.clientRecordId);
            continue;
          }
        }

        const [newIncident] = await db
          .insert(incidentReports)
          .values({
            shipmentId: incident.shipmentId || null,
            driverId: user.id,
            clientRecordId: incident.clientRecordId,
            incidentType: incident.incidentType,
            severity: incident.severity,
            description: incident.description,
            latitude: incident.latitude,
            longitude: incident.longitude,
            locationName: incident.locationName,
            mediaUrls: incident.mediaUrls,
            status: 'REPORTED',
            clientTimestamp: new Date(incident.clientTimestamp),
          })
          .returning();

        processedIncidentIds.push(newIncident.id);

        // Real-time WebSocket emission for urgent incident alerts
        if (socketEmitter) {
          const room = incident.shipmentId || 'general';
          socketEmitter(room, 'incident-reported', {
            incidentId: newIncident.id,
            shipmentId: incident.shipmentId,
            driverId: user.id,
            incidentType: incident.incidentType,
            severity: incident.severity,
            description: incident.description,
            locationName: incident.locationName,
            latitude: incident.latitude,
            longitude: incident.longitude,
            timestamp: new Date(incident.clientTimestamp).toISOString(),
          });
        }
      } catch (err: any) {
        console.error(`[OfflineSyncService] Error recording incident ${incident.clientRecordId}:`, err);
        errors.push({
          clientRecordId: incident.clientRecordId,
          error: err.message || 'Database error recording incident',
        });
      }
    }

    // 6. Formulate Batch Synchronization Result
    const totalItems = checkIns.length + incidents.length;
    const processedCount = processedCheckInIds.length + processedIncidentIds.length;
    const duplicateCount = duplicateClientRecordIds.length;
    const failureCount = errors.length;

    let overallStatus: 'COMPLETED' | 'PARTIAL_SUCCESS' | 'FAILED' = 'COMPLETED';
    if (failureCount > 0 && processedCount === 0) {
      overallStatus = 'FAILED';
    } else if (failureCount > 0 && processedCount > 0) {
      overallStatus = 'PARTIAL_SUCCESS';
    }

    const result: SyncBatchResult = {
      batchId,
      status: overallStatus,
      syncedAt: new Date().toISOString(),
      summary: {
        totalReceived: totalItems,
        checkInsProcessed: processedCheckInIds.length,
        incidentsProcessed: processedIncidentIds.length,
        duplicatesSkipped: duplicateCount,
        errorsCount: failureCount,
      },
      processedCheckInIds,
      processedIncidentIds,
      duplicateClientRecordIds,
      errors,
      latestShipments: updatedShipmentsList,
    };

    // 7. Persist Sync Batch Log
    try {
      await db.insert(syncBatches).values({
        batchId,
        driverId: user.id,
        deviceInfo: deviceInfo || null,
        totalItems,
        processedCount,
        duplicateCount,
        failureCount,
        status: overallStatus,
        summary: result as any,
        clientTimestamp: new Date(clientTimestamp),
      });
    } catch (batchLogErr) {
      console.error('[OfflineSyncService] Could not save sync batch log:', batchLogErr);
    }

    return result;
  }

  /**
   * Record a single real-time or offline check-in ping
   */
  async processSingleCheckIn(
    user: UserProfile & { isVerified?: boolean },
    checkIn: CheckInItemDto,
    socketEmitter?: (room: string, event: string, payload: any) => void
  ) {
    const singleBatch: SyncBatchRequestDto = {
      batchId: `SINGLE-${checkIn.clientRecordId}`,
      checkIns: [checkIn],
      incidents: [],
      clientTimestamp: checkIn.clientTimestamp,
    };

    return await this.processSyncBatch(user, singleBatch, socketEmitter);
  }

  /**
   * Record a single incident report
   */
  async processSingleIncident(
    user: UserProfile & { isVerified?: boolean },
    incident: IncidentItemDto,
    socketEmitter?: (room: string, event: string, payload: any) => void
  ) {
    const singleBatch: SyncBatchRequestDto = {
      batchId: `SINGLE-INCIDENT-${incident.clientRecordId}`,
      checkIns: [],
      incidents: [incident],
      clientTimestamp: incident.clientTimestamp,
    };

    return await this.processSyncBatch(user, singleBatch, socketEmitter);
  }

  /**
   * Get chronological GPS trail / telemetry history for a shipment
   */
  async getShipmentTrail(
    shipmentId: string,
    user: UserProfile,
    query: QueryTrailDto
  ) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    // Role visibility check
    if (
      user.role === 'DRIVER' &&
      shipment.driverId !== user.id &&
      shipment.transporterId !== user.id
    ) {
      throw new Error('Forbidden: You do not have access to this shipment trail');
    }

    const conditions = [eq(driverCheckIns.shipmentId, shipmentId)];

    if (query.since) {
      conditions.push(gte(driverCheckIns.clientTimestamp, new Date(query.since)));
    }

    if (query.eventType) {
      conditions.push(eq(driverCheckIns.eventType, query.eventType));
    }

    const trail = await db
      .select()
      .from(driverCheckIns)
      .where(and(...conditions))
      .orderBy(asc(driverCheckIns.clientTimestamp))
      .limit(query.limit)
      .offset(query.offset);

    return {
      shipmentId,
      shipmentStatus: shipment.status,
      currentLocation: {
        lat: shipment.currentLat,
        lng: shipment.currentLng,
      },
      count: trail.length,
      trail,
    };
  }

  /**
   * Get logged incidents for a shipment
   */
  async getShipmentIncidents(
    shipmentId: string,
    user: UserProfile,
    query: QueryIncidentsDto
  ) {
    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, shipmentId));

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const conditions = [eq(incidentReports.shipmentId, shipmentId)];

    if (query.severity) {
      conditions.push(eq(incidentReports.severity, query.severity));
    }

    if (query.incidentType) {
      conditions.push(eq(incidentReports.incidentType, query.incidentType));
    }

    const incidents = await db
      .select()
      .from(incidentReports)
      .where(and(...conditions))
      .orderBy(desc(incidentReports.clientTimestamp))
      .limit(query.limit)
      .offset(query.offset);

    return {
      shipmentId,
      count: incidents.length,
      incidents,
    };
  }

  /**
   * Get driver's sync batch history
   */
  async getDriverSyncHistory(driverId: string, user: UserProfile, limit = 20, offset = 0) {
    if (user.role === 'DRIVER' && user.id !== driverId) {
      throw new Error('Forbidden: You can only view your own sync history');
    }

    const batches = await db
      .select()
      .from(syncBatches)
      .where(eq(syncBatches.driverId, driverId))
      .orderBy(desc(syncBatches.syncedAt))
      .limit(limit)
      .offset(offset);

    return {
      driverId,
      count: batches.length,
      batches,
    };
  }
}

export const offlineSyncService = new OfflineSyncService();
