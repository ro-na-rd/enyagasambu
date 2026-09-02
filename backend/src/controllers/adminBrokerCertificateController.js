const pool = require('../config/db');
const { notifyUser, notifyAdmins } = require('../services/notificationService');
const { logger } = require('../config/logger');

exports.getCertificates = async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = '1=1';
  const params = [];
  if (status) {
    where += ' AND bc.status = ?';
    params.push(status);
  }

  try {
    const countParams = [...params];
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM broker_certificates bc JOIN users u ON bc.broker_id = u.id WHERE ${where}`,
      countParams
    );

    const [rows] = await pool.query(
      `SELECT bc.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              ct.name AS type_name, ct.code AS type_code
       FROM broker_certificates bc
       JOIN users u ON bc.broker_id = u.id
       LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
       WHERE ${where}
       ORDER BY bc.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({ certificates: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCertificateDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      `SELECT bc.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              bc.phone AS broker_phone, s.username AS generated_by_name,
              ct.name AS type_name, ct.code AS type_code
       FROM broker_certificates bc
       JOIN users u ON bc.broker_id = u.id
       LEFT JOIN staff s ON bc.generated_by = s.id
       LEFT JOIN certificate_types ct ON bc.certificate_type_id = ct.id
       WHERE bc.id = ?`,
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    return res.json({ certificate: cert });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      'SELECT bc.*, u.name AS user_name FROM broker_certificates bc JOIN users u ON bc.broker_id = u.id WHERE bc.id = ?',
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });
    if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
    if (cert.status === 'paid') return res.status(400).json({ message: 'Payment already confirmed' });

    await pool.query(
      'UPDATE broker_certificates SET status = ? WHERE id = ?',
      ['paid', id]
    );

    return res.json({
      message: 'Payment confirmed. You can now generate the certificate.',
      certificate: {
        ...cert,
        status: 'paid',
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.generateCertificate = async (req, res) => {
  const { id } = req.params;
  const { force = false } = req.body;

  try {
    const [[cert]] = await pool.query(
      'SELECT bc.*, u.name AS user_name FROM broker_certificates bc JOIN users u ON bc.broker_id = u.id WHERE bc.id = ?',
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });
    if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
    
    // Allow admin to force generate even without payment if requested
    if (!force && cert.status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed yet. Use force=true to override.' });
    }

    const year = new Date().getFullYear();
    const [[{ cnt }]] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM broker_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
      [year]
    );
    const certNo = `ENA-BRK-${year}-${String(cnt + 1).padStart(4, '0')}`;
    const issuedDate = new Date().toISOString().split('T')[0];
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validUntilStr = validUntil.toISOString().split('T')[0];

    await pool.query(
      'UPDATE broker_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ?, generated_by = ? WHERE id = ?',
      ['generated', certNo, issuedDate, validUntilStr, req.user.id, id]
    );

    notifyUser(cert.broker_id, 'Certificate generated', `Your broker certificate ${certNo} is ready.`, 'certificate', '/broker/certificate');
    notifyAdmins('Broker certificate generated', `Admin generated certificate ${certNo} for ${cert.user_name}`, 'certificate', '/admin/broker-certificates');

    return res.json({
      message: force ? 'Certificate force-generated successfully' : 'Certificate generated successfully',
      certificate: {
        ...cert,
        cert_no: certNo,
        status: 'generated',
        issued_date: issuedDate,
        valid_until: validUntilStr,
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.bulkUpdateCertificates = async (req, res) => {
  const { ids, action, value } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Certificate IDs array required' });
  }
  if (!action) return res.status(400).json({ message: 'Action required' });

  try {
    let query, params;
    const placeholders = ids.map(() => '?').join(',');
    
    switch (action) {
      case 'confirm_payment':
        query = `UPDATE broker_certificates SET status = 'paid' WHERE id IN (${placeholders}) AND status = 'pending'`;
        params = ids;
        break;
      case 'generate':
        const year = new Date().getFullYear();
        let generatedCount = 0;
        for (const id of ids) {
          const [[cert]] = await pool.query(
            'SELECT id, status, broker_id FROM broker_certificates WHERE id = ?',
            [id]
          );
          if (cert && (cert.status === 'paid' || value === true)) {
            const [[{ cnt }]] = await pool.query(
              "SELECT COUNT(*) AS cnt FROM broker_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
              [year]
            );
            const certNo = `ENA-BRK-${year}-${String(cnt + 1).padStart(4, '0')}`;
            const issuedDate = new Date().toISOString().split('T')[0];
            const validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 1);
            const validUntilStr = validUntil.toISOString().split('T')[0];
            
            await pool.query(
              'UPDATE broker_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ?, generated_by = ? WHERE id = ?',
              ['generated', certNo, issuedDate, validUntilStr, req.user.id, id]
            );
            notifyUser(cert.broker_id, 'Certificate generated', `Your broker certificate ${certNo} is ready.`, 'certificate', '/broker/certificate');
            generatedCount++;
          }
        }
        return res.json({ message: `Generated ${generatedCount} certificates` });
      case 'delete':
        query = `DELETE FROM broker_certificates WHERE id IN (${placeholders})`;
        params = ids;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    if (query) {
      const [result] = await pool.query(query, params);
      return res.json({ 
        message: `Updated ${result.affectedRows} certificates`,
        affectedRows: result.affectedRows
      });
    }
  } catch (err) {
    logger.error('[Admin bulkUpdateBrokerCertificates error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
