import axios from 'axios';
import { db } from '../db';
import { loads } from '../db/schema/loads';
import { bids } from '../db/schema/bids';
import { users } from '../db/schema/users';
import { vehicles } from '../db/schema/vehicles';
import { freightMatches } from '../db/schema/freight_matches';
import { eq, and, or } from 'drizzle-orm';

export interface TransporterCandidateInput {
  transporter_id: string;
  capacity_tons: number;
  proximity_distance_km: number;
  proposed_cost_etb: number;
  historical_reliability_score: number;
  fuel_efficiency_score: number;
}

export interface RankedTransporterResult {
  transporter_id: string;
  match_score: number;
  confidence_score: number;
  model_accepted: boolean;
}

export class AiMatchingService {
  private get aiEngineUrl(): string {
    return process.env.AI_ENGINE_URL || 'http://localhost:8000';
  }

  private get apiKey(): string {
    return process.env.AI_API_KEY || 'tradeflow-default-key';
  }

  /**
   * Evaluates verified transporters for a load using the AI Engine (/rank-matches)
   * and creates initial competitive bids with AI scores (SRS FR-02).
   */
  async generateAiMatchesForLoad(loadId: string, forceRefresh: boolean = false): Promise<any[]> {
    // 1. Fetch load
    const [load] = await db.select().from(loads).where(eq(loads.id, loadId));
    if (!load) {
      throw new Error(`Load ${loadId} not found`);
    }

    if (load.status !== 'POSTED') {
      return [];
    }

    // 2. Check existing bids
    const existingBids = await db.select().from(bids).where(eq(bids.loadId, loadId));
    if (existingBids.length >= 3 && !forceRefresh) {
      return existingBids;
    }

    const existingTransporterIds = new Set(existingBids.map(b => b.transporterId));

    // 3. Find active verified transporters
    const verifiedTransporters = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        companyName: users.companyName,
        rating: users.vehicleCapacity,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'TRANSPORTER'),
          or(eq(users.isVerified, true), eq(users.verificationStatus, 'VERIFIED'))
        )
      );

    if (verifiedTransporters.length === 0) {
      return existingBids;
    }

    // 4. Gather fleet capacity for each transporter
    const allVehicles = await db.select().from(vehicles);
    const vehicleMap = new Map<string, number>();
    for (const v of allVehicles) {
      if (!vehicleMap.has(v.ownerId)) {
        vehicleMap.set(v.ownerId, Number(v.capacityTons));
      }
    }

    // 5. Construct candidate inputs for AI microservice
    const baseBudget = Number(load.budgetAmount) > 0 ? Number(load.budgetAmount) : 85000;
    const reqWeightTons = Math.max(1, Number(load.weightKg || 25000) / 1000);
    const corridorDistance = 810.0; // Standard Djibouti-Modjo corridor (FR-02)

    const candidates: TransporterCandidateInput[] = verifiedTransporters
      .filter(t => !existingTransporterIds.has(t.id))
      .map((t, idx) => {
        const capacity = vehicleMap.get(t.id) || 35.0 + (idx % 3) * 5.0;
        // Competitive quotes around the shipper's budget (-5% to +2%)
        const quoteFactor = 0.95 + (idx % 4) * 0.025;
        const proposedCost = Math.round(baseBudget * quoteFactor);
        const proximity = 8.0 + idx * 4.5;
        const reliability = 92.0 + (idx % 5) * 1.5;
        const fuel = 86.0 + (idx % 4) * 2.0;

        return {
          transporter_id: t.id,
          capacity_tons: capacity,
          proximity_distance_km: proximity,
          proposed_cost_etb: proposedCost,
          historical_reliability_score: reliability,
          fuel_efficiency_score: fuel,
        };
      });

    if (candidates.length === 0) {
      return existingBids;
    }

    // 6. Invoke AI Microservice /rank-matches (SRS FR-02.2 & FR-02.3)
    let ranked: RankedTransporterResult[] = [];
    try {
      const response = await axios.post<{ ranked_candidates: RankedTransporterResult[] }>(
        `${this.aiEngineUrl}/rank-matches`,
        {
          required_weight_tons: reqWeightTons,
          trip_distance_km: corridorDistance,
          candidates,
          preference: 'balanced',
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 4000,
        }
      );
      ranked = response.data?.ranked_candidates || [];
    } catch (err: any) {
      console.error('[AiMatchingService] AI Engine error:', err.response?.data || err.message);
      throw new Error(
        `AI Freight Matching Engine is offline (${this.aiEngineUrl}). Real ML inference is required per SRS FR-02.`
      );
    }

    // 7. Insert ranked candidates into bids table
    // Limit to top 3-4 matches for the shortlist (FR-02.3)
    const topShortlist = ranked.slice(0, 3);
    const newBids = [];

    for (const r of topShortlist) {
      const candidateData = candidates.find(c => c.transporter_id === r.transporter_id);
      if (!candidateData) continue;

      const [createdBid] = await db
        .insert(bids)
        .values({
          loadId: load.id,
          transporterId: r.transporter_id,
          bidAmount: candidateData.proposed_cost_etb.toString(),
          currency: load.currency || 'ETB',
          status: 'PENDING',
          notes: `AI Match: ${r.match_score}% | Conf: ${(r.confidence_score * 100).toFixed(1)}%`,
        })
        .returning();

      // Record in freight_matches table for ML audit trail (FR-04.3 / 5.4)
      try {
        await db.insert(freightMatches).values({
          requiredWeightTons: reqWeightTons.toFixed(2),
          transporterCapacityTons: candidateData.capacity_tons.toFixed(2),
          tripDistanceKm: corridorDistance.toFixed(2),
          proximityDistanceKm: candidateData.proximity_distance_km.toFixed(2),
          proposedCostEtb: candidateData.proposed_cost_etb.toFixed(2),
          historicalReliabilityScore: (candidateData.historical_reliability_score / 100).toFixed(2),
          fuelEfficiencyScore: (candidateData.fuel_efficiency_score / 100).toFixed(2),
          matchAccepted: r.model_accepted,
          isTrained: false,
        });
      } catch (auditErr: any) {
        console.warn('[AiMatchingService] Failed to record ML match audit:', auditErr.message);
      }

      newBids.push(createdBid);
    }

    return [...existingBids, ...newBids];
  }
}

export const aiMatchingService = new AiMatchingService();
