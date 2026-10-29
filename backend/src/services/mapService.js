const axios = require('axios');
const logger = require('../config/logger');

/**
 * Service for Google Maps and Routes API integration tailored for Rwanda.
 * Bounding box for Rwanda approx: lat -2.85 to -1.04, lng 28.86 to 30.89
 */
const RWANDA_BOUNDS = {
  minLat: -2.85,
  maxLat: -1.04,
  minLng: 28.86,
  maxLng: 30.89
};

function isWithinRwanda(lat, lng) {
  return lat >= RWANDA_BOUNDS.minLat && 
         lat <= RWANDA_BOUNDS.maxLat && 
         lng >= RWANDA_BOUNDS.minLng && 
         lng <= RWANDA_BOUNDS.maxLng;
}

/**
 * Calculate route and cost using Google Routes API or fallback estimation
 */
async function calculateRoutes(origin, destination, travelModes = ['DRIVE', 'TWO_WHEELER', 'BICYCLE', 'WALK']) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const results = [];

  for (const mode of travelModes) {
    let distanceKm = 5.0;
    let durationMinutes = 15;
    let polyline = '';

    if (apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY') {
      try {
        // Map travel mode to Google Routes API v2 mode
        const googleModeMap = {
          DRIVE: 'DRIVE',
          TWO_WHEELER: 'TWO_WHEELER',
          BICYCLE: 'BICYCLE',
          WALK: 'WALK'
        };
        const googleMode = googleModeMap[mode] || 'DRIVE';

        const response = await axios.post(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          {
            origin: {
              location: {
                latLng: {
                  latitude: origin.latitude,
                  longitude: origin.longitude
                }
              }
            },
            destination: {
              location: {
                latLng: {
                  latitude: destination.latitude,
                  longitude: destination.longitude
                }
              }
            },
            travelMode: googleMode,
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
            },
            timeout: 8000
          }
        );

        const routeData = response.data?.routes?.[0];
        if (routeData) {
          distanceKm = (routeData.distanceMeters || 5000) / 1000.0;
          durationMinutes = Math.ceil(parseInt(routeData.duration || '900s') / 60);
          polyline = routeData.polyline?.encodedPolyline || '';
        }
      } catch (err) {
        logger.error(`Google Routes API error for mode ${mode}: ${err.message}`);
        // Fallback to geometric estimation if API fails
        const dist = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
        distanceKm = Math.max(0.5, parseFloat(dist.toFixed(2)));
        durationMinutes = estimateDuration(distanceKm, mode);
      }
    } else {
      // Fallback calculation when API key is not configured
      const dist = calculateHaversineDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
      distanceKm = Math.max(0.5, parseFloat(dist.toFixed(2)));
      durationMinutes = estimateDuration(distanceKm, mode);
    }

    // E-Nagasambu Pricing Service: calculate transport / visit cost in RWF
    const estimatedCostRwf = calculateCostRwf(distanceKm, mode);

    results.push({
      travelMode: mode,
      distanceKm,
      estimatedDurationMinutes: durationMinutes,
      estimatedCostRwf,
      polyline
    });
  }

  return results;
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function estimateDuration(distanceKm, mode) {
  // Average speeds in km/h
  const speeds = {
    DRIVE: 35,
    TWO_WHEELER: 45,
    BICYCLE: 15,
    WALK: 5
  };
  const speed = speeds[mode] || 30;
  return Math.max(2, Math.round((distanceKm / speed) * 60));
}

function calculateCostRwf(distanceKm, mode) {
  // Base rates and per km rates in RWF for Rwanda
  const pricing = {
    DRIVE: { base: 1000, perKm: 400 },
    TWO_WHEELER: { base: 300, perKm: 200 },
    BICYCLE: { base: 200, perKm: 100 },
    WALK: { base: 0, perKm: 0 }
  };
  const rule = pricing[mode] || { base: 500, perKm: 300 };
  return Math.round(rule.base + (distanceKm * rule.perKm));
}

module.exports = {
  RWANDA_BOUNDS,
  isWithinRwanda,
  calculateRoutes
};
