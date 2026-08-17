const pool = require('../config/db');
const { notifyUser, notifyAdmins } = require('../services/notificationService');

exports.getCertificates = async (req, res) => {
  const { status, page = 1 } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = '1=1';
  const params = [];
  if (status) {
    where += ' AND ac.status = ?';
    params.push(status);
  }

  try {
    const countParams = [...params];
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ambassador_certificates ac JOIN users u ON ac.user_id = u.id WHERE ${where}`,
      countParams
    );

    const [rows] = await pool.query(
      `SELECT ac.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              ct.name AS type_name, ct.code AS type_code
       FROM ambassador_certificates ac
       JOIN users u ON ac.user_id = u.id
       LEFT JOIN certificate_types ct ON ac.certificate_type_id = ct.id
       WHERE ${where}
       ORDER BY ac.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({ certificates: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.generateCertificate = async (req, res) => {
  const { id } = req.params;
  const { force = false } = req.body;

  try {
    const [[cert]] = await pool.query(
      'SELECT ac.*, u.name AS user_name FROM ambassador_certificates ac JOIN users u ON ac.user_id = u.id WHERE ac.id = ?',
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
      "SELECT COUNT(*) AS cnt FROM ambassador_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
      [year]
    );
    const certNo = `ENA-AMB-${year}-${String(cnt + 1).padStart(4, '0')}`;
    const issuedDate = new Date().toISOString().split('T')[0];
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validUntilStr = validUntil.toISOString().split('T')[0];

    await pool.query(
      'UPDATE ambassador_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ?, generated_by = ? WHERE id = ?',
      ['generated', certNo, issuedDate, validUntilStr, req.user.id, id]
    );

    notifyUser(cert.user_id, 'Certificate generated', `Your ambassador certificate ${certNo} is ready.`, 'certificate', '/ambassador/certificate');
    notifyAdmins('Ambassador certificate generated', `Admin generated certificate ${certNo} for ${cert.user_name}`, 'certificate', '/admin/certificates');

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
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      'SELECT id, status FROM ambassador_certificates WHERE id = ?',
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });
    if (cert.status === 'generated') return res.status(400).json({ message: 'Certificate already generated' });
    if (cert.status === 'paid') return res.status(400).json({ message: 'Payment already confirmed' });

    await pool.query(
      'UPDATE ambassador_certificates SET status = ? WHERE id = ?',
      ['paid', id]
    );

    return res.json({ message: 'Payment confirmed. Certificate is ready to generate.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCertificateDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      `SELECT ac.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              s.username AS generated_by_name, ct.name AS type_name, ct.code AS type_code
       FROM ambassador_certificates ac
       JOIN users u ON ac.user_id = u.id
       LEFT JOIN staff s ON ac.generated_by = s.id
       LEFT JOIN certificate_types ct ON ac.certificate_type_id = ct.id
       WHERE ac.id = ?`,
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    return res.json({ certificate: cert });
  } catch (err) {
    console.error(err);
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
        query = `UPDATE ambassador_certificates SET status = 'paid' WHERE id IN (${placeholders}) AND status = 'pending'`;
        params = ids;
        break;
      case 'generate':
        // Generate for each certificate individually to get unique cert numbers
        const year = new Date().getFullYear();
        let generatedCount = 0;
        for (const id of ids) {
          const [[cert]] = await pool.query(
            'SELECT id, status, user_id FROM ambassador_certificates WHERE id = ?',
            [id]
          );
          if (cert && (cert.status === 'paid' || value === true)) {
            const [[{ cnt }]] = await pool.query(
              "SELECT COUNT(*) AS cnt FROM ambassador_certificates WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL",
              [year]
            );
            const certNo = `ENA-AMB-${year}-${String(cnt + 1).padStart(4, '0')}`;
            const issuedDate = new Date().toISOString().split('T')[0];
            const validUntil = new Date();
            validUntil.setFullYear(validUntil.getFullYear() + 1);
            const validUntilStr = validUntil.toISOString().split('T')[0];
            
            await pool.query(
              'UPDATE ambassador_certificates SET status = ?, cert_no = ?, issued_date = ?, valid_until = ?, generated_by = ? WHERE id = ?',
              ['generated', certNo, issuedDate, validUntilStr, req.user.id, id]
            );
            notifyUser(cert.user_id, 'Certificate generated', `Your ambassador certificate ${certNo} is ready.`, 'certificate', '/ambassador/certificate');
            generatedCount++;
          }
        }
        return res.json({ message: `Generated ${generatedCount} certificates` });
      case 'delete':
        query = `DELETE FROM ambassador_certificates WHERE id IN (${placeholders})`;
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
    console.error('[Admin bulkUpdateCertificates error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
