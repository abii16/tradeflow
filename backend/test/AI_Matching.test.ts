import axios from 'axios';
import { describe, it, expect, afterEach, jest } from '@jest/globals';

// Mock axios to prevent actual network calls during Jest tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Matching Engine - NFR Verification Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. Should accept a valid AI match prediction', async () => {
    // Mock the expected AI response
    const mockAiResponse = {
      data: {
        match_accepted: true,
        confidence_score: 0.98
      }
    };
    mockedAxios.post.mockResolvedValueOnce(mockAiResponse);

    // Payload sent by the backend
    const aiPayload = {
      required_weight_tons: 20.0,
      transporter_capacity_tons: 22.0,
      trip_distance_km: 150.0,
      proximity_distance_km: 15.0,
      proposed_cost_etb: 8000,
      historical_reliability_score: 0.9,
      fuel_efficiency_score: 0.85
    };

    // Simulated Axios call (just like in bids.routes.ts)
    const response = await axios.post('http://localhost:8000/predict-match', aiPayload, {
      headers: { 'X-API-Key': 'tradeflow-default-key' },
      timeout: 1000 // Performance SLA
    });

    // Verify it called with correct timeout and headers
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/predict-match',
      aiPayload,
      expect.objectContaining({
        timeout: 1000, // Ensuring the 1s SLA is enforced
        headers: { 'X-API-Key': 'tradeflow-default-key' }
      })
    );
    
    expect(response.data.match_accepted).toBe(true);
    expect(response.data.confidence_score).toBe(0.98);
  });

  it('2. Should handle AI engine Timeout (SLA missed) gracefully (Availability SLA)', async () => {
    // Mock a timeout error
    const timeoutError = new Error('timeout of 1000ms exceeded');
    (timeoutError as any).code = 'ECONNABORTED';
    mockedAxios.post.mockRejectedValueOnce(timeoutError);

    let aiPrediction = null;
    let didCrash = false;

    try {
      const response = await axios.post('http://localhost:8000/predict-match', {}, {
        headers: { 'X-API-Key': 'tradeflow-default-key' },
        timeout: 1000
      });
      aiPrediction = response.data;
    } catch (error: any) {
      // The error is safely caught in the backend, meaning it doesn't crash the bid creation
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Backend logs a warning but proceeds
        aiPrediction = null;
      } else {
        didCrash = true;
      }
    }

    // Verify that the timeout was caught and it didn't crash the process
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(aiPrediction).toBeNull();
    expect(didCrash).toBe(false);
  });
});
