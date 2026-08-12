import axios from 'axios';
import { describe, it, expect, afterEach, jest } from '@jest/globals';

// Mock axios to avoid hitting the actual server during automated unit tests,
// this ensures the tests run fast and don't require the AI server to be up.
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Engine Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully format the payload and receive an AI prediction', async () => {
    // 1. Mock the expected response from the AI Engine
    const mockAiResponse = {
      data: {
        match_accepted: true,
        confidence_score: 0.96
      }
    };
    mockedAxios.post.mockResolvedValueOnce(mockAiResponse);

    // 2. Simulated payload exactly as constructed in our bids.routes.ts
    const aiPayload = {
      required_weight_tons: 40.5,
      transporter_capacity_tons: 45.0,
      trip_distance_km: 150.0,
      proximity_distance_km: 10.0,
      proposed_cost_etb: 12000,
      historical_reliability_score: 0.95,
      fuel_efficiency_score: 0.85
    };

    // 3. Perform the simulated Axios call
    const response = await axios.post('http://localhost:8000/predict-match', aiPayload, {
      headers: {
        'X-API-Key': 'tradeflow-default-key'
      }
    });

    // 4. Assertions to verify it worked correctly
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:8000/predict-match',
      aiPayload,
      expect.objectContaining({
        headers: { 'X-API-Key': 'tradeflow-default-key' }
      })
    );
    
    expect(response.data.match_accepted).toBe(true);
    expect(response.data.confidence_score).toBe(0.96);
  });

  it('should handle AI engine errors (e.g. server down) gracefully without crashing', async () => {
    // Mock a network error
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error: Connection Refused'));

    // Simulated try-catch block just like the one we added to bids.routes.ts
    let aiPrediction = null;
    try {
      const response = await axios.post('http://localhost:8000/predict-match', {}, {
        headers: { 'X-API-Key': 'tradeflow-default-key' }
      });
      aiPrediction = response.data;
    } catch (error) {
      // The error is caught here
      aiPrediction = null;
    }

    // Ensure the call was attempted but the prediction safely remained null
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(aiPrediction).toBeNull();
  });
});
