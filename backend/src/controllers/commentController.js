const pool = require('../config/db');

exports.getComments = async (req, res) => {
  const { id } = req.params;

  try {
    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.parent_id, c.created_at,
              u.id AS user_id, u.name AS user_name
       FROM listing_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.listing_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );
    return res.json({ comments });
  } catch (err) {
    console.error('[Comments list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { content, parent_id } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Login required to comment' });
  if (!content || !content.trim()) return res.status(400).json({ message: 'Comment content is required' });

  try {
    const [[listing]] = await pool.query('SELECT id FROM listings WHERE id = ? AND status != ?', [id, 'deleted']);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (parent_id) {
      const [[parent]] = await pool.query('SELECT id FROM listing_comments WHERE id = ? AND listing_id = ?', [parent_id, id]);
      if (!parent) return res.status(400).json({ message: 'Parent comment not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO listing_comments (listing_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [id, userId, parent_id || null, content.trim()]
    );

    const [[comment]] = await pool.query(
      `SELECT c.id, c.content, c.parent_id, c.created_at,
              u.id AS user_id, u.name AS user_name
       FROM listing_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    return res.json({ comment });
  } catch (err) {
    console.error('[Comment add error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  const { id, commentId } = req.params;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const [[comment]] = await pool.query(
      'SELECT id, user_id FROM listing_comments WHERE id = ? AND listing_id = ?',
      [commentId, id]
    );
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user_id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete others\' comments' });
    }

    await pool.query('DELETE FROM listing_comments WHERE id = ?', [commentId]);
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('[Comment delete error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
