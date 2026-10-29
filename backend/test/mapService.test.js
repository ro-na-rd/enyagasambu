const test = require('node:test');
const assert = require('node:assert');
const { isWithinRwanda, calculateRoutes } = require('../src/services/mapService');

test('isWithinRwanda validates coordinates within Rwanda bounding box', () => {
  // Kigali center: lat -1.9441, lng 30.0619
  assert.strictEqual(isWithinRwanda(-1.9441, 30.0619), true);
  // Outside Rwanda (e.g., Nairobi: lat -1.2921, lng 36.8219)
  assert.strictEqual(isWithinRwanda(-1.2921, 36.8219), false);
});

test('calculateRoutes returns distance, duration, and cost across travel modes', async () => {
  const origin = { latitude: -1.9441, longitude: 30.0619 };
  const destination = { latitude: -1.9499, longitude: 30.0626 };
  const modes = ['DRIVE', 'TWO_WHEELER', 'BICYCLE', 'WALK'];

  const routes = await calculateRoutes(origin, destination, modes);
  assert.strictEqual(routes.length, 4);
  
  for (const route of routes) {
    assert.ok(route.travelMode);
    assert.ok(typeof route.distanceKm === 'number');
    assert.ok(typeof route.estimatedDurationMinutes === 'number');
    assert.ok(typeof route.estimatedCostRwf === 'number');
  }
});
