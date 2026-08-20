// backend/test/geofencing.test.ts

// Mock the global fetch API to bypass Docker/Python Engine
global.fetch = jest.fn() as jest.Mock;

describe('Geofencing Alert Service (FR-08)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FR-08: Should return safe route when outside risk zones', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alert_triggered: false,
        message: 'Safe route',
        processing_time_ms: 0.5
      })
    });

    const payload = {
      driver_id: 'drv-123',
      lat: 9.000,
      lon: 38.000
    };

    const res = await fetch('http://127.0.0.1:8000/api/v1/geofence/check', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const data = await res.json();
    expect(data.alert_triggered).toBe(false);
  });

  it('FR-08 & FR-05.3: Should trigger alert and propose detour inside risk zone', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alert_triggered: true,
        risk_level: 'CRITICAL',
        message: 'DANGER: Entered Northern Route Conflict Zone',
        detour_instructions: 'Alternate safe route generated. Please confirm to apply detour.',
        proposed_detour_path: [[9.0, 38.0], [9.1, 38.1]],
        requires_confirmation: true,
        processing_time_ms: 1.2
      })
    });

    const payload = {
      driver_id: 'drv-123',
      lat: 13.5, // Inside Northern Route Conflict Zone
      lon: 38.5,
      destination_lat: 14.0,
      destination_lng: 39.0
    };

    const res = await fetch('http://127.0.0.1:8000/api/v1/geofence/check', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const data = await res.json();
    expect(data.alert_triggered).toBe(true);
    expect(data.requires_confirmation).toBe(true);
    expect(data.proposed_detour_path.length).toBeGreaterThan(0);
  });

  it('FR-05.3: Should allow driver/dispatcher to confirm detour', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        message: 'Detour accepted and active route updated.'
      })
    });

    const payload = {
      driver_id: 'drv-123',
      accepted: true,
      proposed_path: [[9.0, 38.0], [9.1, 38.1]]
    };

    const res = await fetch('http://127.0.0.1:8000/api/v1/geofence/confirm-detour', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const data = await res.json();
    expect(data.status).toBe('success');
  });

  it('FR-08.1: Should maintain updated risk zones via crowdsourcing/government', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'success',
        message: 'Successfully updated 1 risk zones.'
      })
    });

    const payload = [
      {
        id: 'zone-002',
        name: 'New Crowdsourced Zone',
        severity: 'HIGH',
        coordinates: [
          { lat: 10.0, lon: 39.0 },
          { lat: 11.0, lon: 39.0 },
          { lat: 11.0, lon: 40.0 },
          { lat: 10.0, lon: 40.0 }
        ]
      }
    ];

    const res = await fetch('http://127.0.0.1:8000/api/v1/geofence/update-zones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const data = await res.json();
    expect(data.status).toBe('success');
  });
});
