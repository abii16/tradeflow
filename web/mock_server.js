import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8000 });

console.log("Mock WebSocket Telematics Server running on ws://localhost:8000/ws/telematics");

wss.on('connection', function connection(ws) {
  console.log("Frontend connected!");

  // Send an alert every 10 seconds to test the Audio Beep and Toast Notification
  const interval = setInterval(() => {
    console.log("Sending mock alert...");
    
    const mockAlert = {
      type: 'telemetry_update',
      alert_triggered: true,
      alert_message: "CRITICAL: Truck ET-9021 breached the Semera Conflict Zone!",
      payload: {
        alerts: [
          {
            id: 'RISK-05',
            title: 'Semera Conflict Zone',
            description: 'Active militant activity reported.',
            lat: 11.794,
            lng: 41.008,
            radius: 30000,
            polygon: [
              [11.7, 40.9],
              [11.9, 40.9],
              [11.9, 41.1],
              [11.7, 41.1]
            ]
          }
        ],
        trucks: [
          { 
            id: 'ET-9021', 
            lat: 11.750, 
            lng: 40.950, 
            speed: 80, 
            cargo: '30T Rebar', 
            driver: 'Yared Tekle', 
            eta: '4.2h', 
            status: 'GEOFENCE_BREACH' 
          }
        ]
      }
    };

    ws.send(JSON.stringify(mockAlert));
  }, 10000);

  ws.on('close', () => {
    console.log("Frontend disconnected.");
    clearInterval(interval);
  });
});
