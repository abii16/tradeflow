import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { pricingService } from '../src/modules/pricing/pricing.service';

// Mock fetch globally to instantly simulate the AI Engine being unreachable,
// preventing the 5-second connection timeout in Jest.
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn(() => Promise.reject(new Error('ECONNREFUSED'))) as any;
});
afterAll(() => {
  global.fetch = originalFetch;
});
import { SpotPricingRequestSchema, ContractEvaluationRequestSchema } from '../src/dto/pricing.dto';

describe('Backend Pricing Service (FR-04)', () => {
  describe('DTO Validation', () => {
    it('should validate a valid spot pricing request', () => {
      const validPayload = {
        origin: { city: 'Djibouti', lat: 11.588, lng: 43.145 },
        destination: { city: 'Modjo', lat: 8.592, lng: 39.123 },
        cargoType: 'dry',
        weightKg: 20000,
        currency: 'ETB',
      };

      const result = SpotPricingRequestSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.weightKg).toBe(20000);
        expect(result.data.cargoType).toBe('dry');
      }
    });

    it('should reject invalid weight <= 0', () => {
      const invalidPayload = {
        origin: { city: 'Djibouti' },
        destination: { city: 'Modjo' },
        weightKg: -50,
      };

      const result = SpotPricingRequestSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should validate contract evaluation request', () => {
      const contractPayload = {
        contractRate: 85000,
        currency: 'ETB',
        origin: { city: 'Djibouti' },
        destination: { city: 'Modjo' },
        cargoType: 'dry',
        weightKg: 20000,
        divergenceThresholdPercent: 15.0,
      };

      const result = ContractEvaluationRequestSchema.safeParse(contractPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Spot Rate Calculation Fallback', () => {
    it('should return a valid spot price breakdown for Djibouti -> Modjo', async () => {
      const quote = await pricingService.calculateSpotRate({
        origin: { city: 'Djibouti' },
        destination: { city: 'Modjo' },
        cargoType: 'dry',
        weightKg: 20000,
        truckType: 'FLATBED_TRAILER',
        urgency: 'standard',
        isUrgent: false,
        pickupWindowHours: 24,
        currency: 'ETB',
      });

      expect(quote).toBeDefined();
      expect(quote.spot_price).toBeGreaterThan(50000);
      expect(quote.currency).toBe('ETB');
      expect(quote.breakdown).toBeDefined();
      expect(quote.breakdown.distance_km).toBe(810);
    });

    it('should evaluate contract divergence correctly', async () => {
      const evaluation = await pricingService.evaluateContractRate({
        contractRate: 50000, // Significantly below ~90,000 spot price
        currency: 'ETB',
        origin: { city: 'Djibouti' },
        destination: { city: 'Modjo' },
        cargoType: 'dry',
        weightKg: 20000,
        urgency: 'standard',
        divergenceThresholdPercent: 15.0,
      });

      expect(evaluation).toBeDefined();
      expect(evaluation.is_renegotiation_recommended).toBe(true);
      expect(evaluation.severity).toBe('CRITICAL_RENEGOTIATION_REQUIRED');
      expect(evaluation.divergence_percent).toBeGreaterThan(15);
    });
  });
});
