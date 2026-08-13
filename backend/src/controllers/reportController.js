const pool = require('../config/db');
const { notifyAdmins } = require('../services/notificationService');

const REASONS = ['spam', 'inappropriate', 'scam', 'misleading', 'illegal', 'other'];

exports.createReport = async (req, res) => {
  const { listingId, reason, details } = req.body;
  if (!listingId || !reason) {
    return res.status(400).json({ message: 'listingId and reason are required' });
  }
  if (!REASONS.includes(reason)) {
    return res.status(422).json({ message: 'Invalid report reason' });
  }

  try {
    const [[listing]] = await pool.query('SELECT id FROM listings WHERE id = ?', [listingId]);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const reporterId = req.user?.id || null;

    const [existing] = await pool.query(
      `SELECT id FROM listing_reports
       WHERE listing_id = ? AND reporter_id <=> ? AND status IN ('open', 'reviewing')
       LIMIT 1`,
      [listingId, reporterId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You have already reported this listing' });
    }

    const [result] = await pool.query(
      'INSERT INTO listing_reports (listing_id, reporter_id, reason, details) VALUES (?, ?, ?, ?)',
      [listingId, reporterId, reason, details || null]
    );

    notifyAdmins('Listing reported', `Listing #${listingId} was reported for ${reason}.`, 'alert', '/admin/reports');

    return res.status(201).json({ id: result.insertId, message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    console.error('[Report create error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listReports = async (req, res) => {
  const { status } = req.query;
  try {
    const params = [];
    let where = '';
    if (status) {
      where = 'WHERE lr.status = ?';
      params.push(status);
    }
    const [rows] = await pool.query(
      `SELECT lr.id, lr.reason, lr.details, lr.status, lr.created_at,
              l.id AS listing_id, l.title AS listing_title,
              u.name AS reporter_name
       FROM listing_reports lr
       JOIN listings l ON l.id = lr.listing_id
       LEFT JOIN users u ON u.id = lr.reporter_id
       ${where}
       ORDER BY lr.created_at DESC`,
      params
    );
    return res.json({ reports: rows });
  } catch (err) {
    console.error('[Report list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReport = async (req, res) => {
  const { id } = req.params;
  const { status, disableListing } = req.body;

  const VALID_STATUS = ['open', 'reviewing', 'actioned', 'dismissed'];
  if (!VALID_STATUS.includes(status)) {
    return res.status(422).json({ message: 'Invalid report status' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[report]] = await conn.query('SELECT * FROM listing_reports WHERE id = ?', [id]);
    if (!report) {
      await conn.rollback();
      return res.status(404).json({ message: 'Report not found' });
    }

    await conn.query(
      'UPDATE listing_reports SET status = ?, resolved_by = ?, resolved_at = NOW() WHERE id = ?',
      [status, req.user.id, id]
    );

    if (status === 'actioned' && (disableListing || report.status !== 'actioned')) {
      await conn.query(
        "UPDATE listings SET status = 'disabled' WHERE id = ?",
        [report.listing_id]
      );
    }

    await conn.commit();
    return res.json({ message: 'Report updated' });
  } catch (err) {
    await conn.rollback();
    console.error('[Report update error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
