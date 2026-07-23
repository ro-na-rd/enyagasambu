const pool = require('../config/db');

exports.toggleLike = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Login required to like' });

  try {
    const [[existing]] = await pool.query(
      'SELECT id FROM listing_likes WHERE listing_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing) {
      await pool.query('DELETE FROM listing_likes WHERE id = ?', [existing.id]);
    } else {
      await pool.query('INSERT INTO listing_likes (listing_id, user_id) VALUES (?, ?)', [id, userId]);
    }

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM listing_likes WHERE listing_id = ?',
      [id]
    );

    return res.json({ liked: !existing, count: total });
  } catch (err) {
    console.error('[Like toggle error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getLikeStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM listing_likes WHERE listing_id = ?',
      [id]
    );

    let liked = false;
    if (userId) {
      const [[row]] = await pool.query(
        'SELECT id FROM listing_likes WHERE listing_id = ? AND user_id = ?',
        [id, userId]
      );
      liked = !!row;
    }

    return res.json({ count: total, liked });
  } catch (err) {
    console.error('[Like status error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
