const http = require('http');

// Coordinates along the corridor
const TRUCKS = [
  { id: 'TRK-DJB1', lat: 11.588, lng: 43.145, dLat: -0.005, dLng: -0.007 }, // Djibouti moving towards Ethiopia
  { id: 'TRK-AWA2', lat: 8.983, lng: 40.166, dLat: -0.002, dLng: -0.005 },  // Awash moving towards Modjo
  { id: 'TRK-SEM3', lat: 11.794, lng: 41.008, dLat: -0.004, dLng: -0.006 }, // Semera moving towards Awash
  { id: 'TRK-GAL4', lat: 11.716, lng: 41.838, dLat: -0.004, dLng: -0.007 }  // Galafi moving towards Semera
];

console.log('Starting Live GPS Simulation...');

setInterval(() => {
  TRUCKS.forEach(truck => {
    // Update position
    truck.lat += truck.dLat;
    truck.lng += truck.dLng;

    // Optional: add some random jitter
    const jitterLat = (Math.random() - 0.5) * 0.001;
    const jitterLng = (Math.random() - 0.5) * 0.001;

    const url = `http://localhost:4001/api/v1/telemetry/simulate?id=${truck.id}&lat=${truck.lat + jitterLat}&lng=${truck.lng + jitterLng}`;

    http.get(url, (res) => {
      // Just consume the response
      res.on('data', () => {});
    }).on('error', (err) => {
      console.log('Simulation error:', err.message);
    });
  });

  console.log('Emitted live GPS updates for', TRUCKS.length, 'trucks');
}, 2000); // Update every 2 seconds
