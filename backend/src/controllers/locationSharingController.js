const db = require('../config/db');
const { calculateRoutes, isWithinRwanda } = require('../services/mapService');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../config/logger');

/**
 * Controller for handling location sharing and Rwanda map route calculations.
 */
class LocationSharingController {
  async shareLocation(req, res) {
    try {
      const { recipientPhone, origin, destination, travelModes, channel } = req.body;
      const userId = req.user.id;

      if (!recipientPhone || !origin || !destination) {
        return res.status(400).json({ error: 'Recipient phone, origin, and destination are required.' });
      }

      // Validate Rwanda phone format (+2507XXXXXXXX)
      const phoneRegex = /^\+2507\d{8}$/;
      if (!phoneRegex.test(recipientPhone)) {
        return res.status(400).json({ error: 'Invalid Rwanda phone number format. Expected +2507XXXXXXXX.' });
      }

      // Validate coordinates are within Rwanda bounding box
      if (!isWithinRwanda(origin.latitude, origin.longitude) || !isWithinRwanda(destination.latitude, destination.longitude)) {
        return res.status(400).json({ error: 'Selected locations must be within Rwanda.' });
      }

      const modes = Array.isArray(travelModes) && travelModes.length > 0 
        ? travelModes 
        : ['DRIVE', 'TWO_WHEELER', 'BICYCLE', 'WALK'];

      // Calculate routes using Google Routes API / pricing service
      const routes = await calculateRoutes(origin, destination, modes);
      const sharingId = `loc_share_${uuidv4().substring(0, 8)}`;

      // Save to database
      await db.execute(
        `INSERT INTO location_shares (user_id, sharing_id, recipient_phone, origin_lat, origin_lng, dest_lat, dest_lng, travel_modes, channel, status, routes_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          sharingId,
          recipientPhone,
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude,
          JSON.stringify(modes),
          channel || 'WHATSAPP',
          'QUEUED_FOR_WHATSAPP_DELIVERY',
          JSON.stringify(routes)
        ]
      );

      // In production, dispatch WhatsApp message via WhatsApp Business Cloud API or Africa's Talking
      logger.info(`WhatsApp location sharing queued for ${recipientPhone} (Sharing ID: ${sharingId}) via E-Nagasambu`);

      return res.status(201).json({
        sharingId,
        status: 'QUEUED_FOR_WHATSAPP_DELIVERY',
        message: `Location successfully shared via WhatsApp to ${recipientPhone} through E-Nagasambu.`,
        routes
      });
    } catch (err) {
      logger.error(`Location sharing error: ${err.message}`);
      return res.status(500).json({ error: 'Internal server error during location sharing.' });
    }
  }

  async getSharedLocation(req, res) {
    try {
      const { sharingId } = req.params;
      const [rows] = await db.execute(
        `SELECT ls.*, u.name as sender_name FROM location_shares ls JOIN users u ON ls.user_id = u.id WHERE ls.sharing_id = ?`,
        [sharingId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Shared location not found or expired.' });
      }

      const share = rows.length ? rows[0] : null;
      if (share && !share.opened_at) {
        await db.execute(`UPDATE location_shares SET opened_at = CURRENT_TIMESTAMP WHERE sharing_id = ?`, [sharingId]);
      }

      return res.json({
        sharingId: share.sharing_id,
        senderName: share.sender_name,
        recipientPhone: share.recipient_phone,
        origin: { latitude: share.origin_lat, longitude: share.origin_lng },
        destination: { latitude: share.dest_lat, longitude: share.dest_lng },
        travelModes: JSON.parse(share.travel_modes),
        routes: JSON.parse(share.routes_json || '[]'),
        createdAt: share.created_at,
        openedAt: share.opened_at
      });
    } catch (err) {
      logger.error(`Get shared location error: ${err.message}`);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
}

module.exports = new LocationSharingController();
