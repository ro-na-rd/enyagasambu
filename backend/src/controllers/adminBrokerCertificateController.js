const pool = require('../config/db');

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
      `SELECT bc.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM broker_certificates bc
       JOIN users u ON bc.broker_id = u.id
       WHERE ${where}
       ORDER BY bc.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({ certificates: rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCertificateDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      `SELECT bc.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              bc.phone AS broker_phone, s.username AS generated_by_name
       FROM broker_certificates bc
       JOIN users u ON bc.broker_id = u.id
       LEFT JOIN staff s ON bc.generated_by = s.id
       WHERE bc.id = ?`,
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    return res.json({ certificate: cert });
  } catch (err) {
    console.error(err);
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

    return res.json({
      message: `Payment confirmed. Certificate ${certNo} generated automatically.`,
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

exports.generateCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    const [[cert]] = await pool.query(
      'SELECT bc.*, u.name AS user_name FROM broker_certificates bc JOIN users u ON bc.broker_id = u.id WHERE bc.id = ?',
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });
    if (cert.status !== 'paid') return res.status(400).json({ message: 'Payment not completed yet' });
    if (cert.cert_no) return res.status(400).json({ message: 'Certificate already generated' });

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

    return res.json({
      message: 'Certificate generated successfully',
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
