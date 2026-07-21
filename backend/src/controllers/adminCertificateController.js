const pool = require('../config/db');

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
      `SELECT ac.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM ambassador_certificates ac
       JOIN users u ON ac.user_id = u.id
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

  try {
    const [[cert]] = await pool.query(
      'SELECT ac.*, u.name AS user_name FROM ambassador_certificates ac JOIN users u ON ac.user_id = u.id WHERE ac.id = ?',
      [id]
    );
    if (!cert) return res.status(404).json({ message: 'Certificate request not found' });
    if (cert.status !== 'paid') return res.status(400).json({ message: 'Payment not completed yet' });
    if (cert.cert_no) return res.status(400).json({ message: 'Certificate already generated' });

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
              s.username AS generated_by_name
       FROM ambassador_certificates ac
       JOIN users u ON ac.user_id = u.id
       LEFT JOIN staff s ON ac.generated_by = s.id
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
