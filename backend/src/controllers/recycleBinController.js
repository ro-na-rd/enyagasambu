const pool = require('../config/db');
const { notifyAdmins, notifyUser } = require('../services/notificationService');

const AUTO_DELETE_DAYS = 30; // Items in recycle bin are permanently deleted after 30 days

exports.recycleItem = async (req, res) => {
  const { item_type, item_id } = req.body;
  
  if (!item_type || !item_id) {
    return res.status(400).json({ message: 'item_type and item_id are required' });
  }

  const validTypes = ['listing', 'user', 'category', 'certificate', 'message', 'notification'];
  if (!validTypes.includes(item_type)) {
    return res.status(400).json({ message: `Invalid item_type. Must be one of: ${validTypes.join(', ')}` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let originalData = null;
    let originalTableName = '';
    let idField = '';

    // Fetch original data based on item type
    switch (item_type) {
      case 'listing':
        originalTableName = 'listings';
        idField = 'id';
        const [[listing]] = await conn.query(
          `SELECT * FROM ${originalTableName} WHERE ${idField} = ?`,
          [item_id]
        );
        if (!listing) {
          await conn.rollback();
          return res.status(404).json({ message: 'Item not found' });
        }
        originalData = listing;
        // Mark as deleted in original table
        await conn.query(`UPDATE ${originalTableName} SET status = 'deleted' WHERE ${idField} = ?`, [item_id]);
        break;

      case 'user':
        originalTableName = 'users';
        idField = 'id';
        const [[user]] = await conn.query(
          `SELECT id, name, email, phone, role, coins, created_at FROM ${originalTableName} WHERE ${idField} = ?`,
          [item_id]
        );
        if (!user) {
          await conn.rollback();
          return res.status(404).json({ message: 'User not found' });
        }
        originalData = user;
        // Mark as deleted in original table
        await conn.query(`UPDATE ${originalTableName} SET is_deleted = 1, deleted_at = NOW() WHERE ${idField} = ?`, [item_id]);
        break;

      case 'category':
        originalTableName = 'categories';
        idField = 'id';
        const [[category]] = await conn.query(
          `SELECT * FROM ${originalTableName} WHERE ${idField} = ?`,
          [item_id]
        );
        if (!category) {
          await conn.rollback();
          return res.status(404).json({ message: 'Category not found' });
        }
        originalData = category;
        // Mark as deleted in original table
        await conn.query(`UPDATE ${originalTableName} SET is_deleted = 1, deleted_at = NOW() WHERE ${idField} = ?`, [item_id]);
        break;

      case 'certificate':
        // Determine certificate type based on context
        const [[ambCert]] = await conn.query('SELECT * FROM ambassador_certificates WHERE id = ?', [item_id]);
        if (ambCert) {
          originalData = { ...ambCert, cert_type: 'ambassador' };
          originalTableName = 'ambassador_certificates';
          idField = 'id';
          await conn.query('UPDATE ambassador_certificates SET status = ? WHERE id = ?', ['deleted', item_id]);
        } else {
          const [[brokerCert]] = await conn.query('SELECT * FROM broker_certificates WHERE id = ?', [item_id]);
          if (brokerCert) {
            originalData = { ...brokerCert, cert_type: 'broker' };
            originalTableName = 'broker_certificates';
            idField = 'id';
            await conn.query('UPDATE broker_certificates SET status = ? WHERE id = ?', ['deleted', item_id]);
          } else {
            const [[supplierCert]] = await conn.query('SELECT * FROM supplier_certificates WHERE id = ?', [item_id]);
            if (supplierCert) {
              originalData = { ...supplierCert, cert_type: 'supplier' };
              originalTableName = 'supplier_certificates';
              idField = 'id';
              await conn.query('UPDATE supplier_certificates SET status = ? WHERE id = ?', ['deleted', item_id]);
            } else {
              await conn.rollback();
              return res.status(404).json({ message: 'Certificate not found' });
            }
          }
        }
        break;

      case 'message':
        originalTableName = 'broker_messages';
        idField = 'id';
        const [[message]] = await conn.query(
          `SELECT * FROM ${originalTableName} WHERE ${idField} = ?`,
          [item_id]
        );
        if (!message) {
          await conn.rollback();
          return res.status(404).json({ message: 'Message not found' });
        }
        originalData = message;
        await conn.query(`UPDATE ${originalTableName} SET is_deleted = 1, deleted_at = NOW() WHERE ${idField} = ?`, [item_id]);
        break;

      default:
        await conn.rollback();
        return res.status(400).json({ message: 'Item type not yet supported for recycling' });
    }

    // Check if already in recycle bin
    const [[existing]] = await conn.query(
      'SELECT id FROM recycle_bin WHERE item_type = ? AND item_id = ?',
      [item_type, item_id]
    );
    if (existing) {
      await conn.rollback();
      return res.status(400).json({ message: 'Item already in recycle bin' });
    }

    // Calculate auto-delete date
    const restoreUntil = new Date();
    restoreUntil.setDate(restoreUntil.getDate() + AUTO_DELETE_DAYS);

    // Add to recycle bin
    await conn.query(
      `INSERT INTO recycle_bin (item_type, item_id, original_data, deleted_by, deleted_role, restore_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_type, item_id, JSON.stringify(originalData), req.user.id, req.user.role, restoreUntil]
    );

    await conn.commit();

    // Notify if applicable
    if (item_type === 'listing') {
      notifyAdmins('Listing moved to recycle bin', `Listing "${originalData.title}" moved to recycle bin by ${req.user.name || req.user.role}`, 'recycle', '/admin/recycle-bin');
    }

    return res.json({ 
      message: 'Item moved to recycle bin successfully',
      item_type,
      item_id,
      restore_until: restoreUntil,
      auto_delete_after_days: AUTO_DELETE_DAYS
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Recycle bin error]', err);
    return res.status(500).json({ message: 'Server error during recycling' });
  } finally {
    conn.release();
  }
};

exports.getRecycleBin = async (req, res) => {
  const { item_type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = '1=1';
    const params = [];

    if (item_type) {
      where += ' AND item_type = ?';
      params.push(item_type);
    }

    const [items] = await pool.query(
      `SELECT rb.*, u.name AS deleted_by_name, u.email AS deleted_by_email
       FROM recycle_bin rb
       LEFT JOIN users u ON u.id = rb.deleted_by
       WHERE ${where}
       ORDER BY rb.deleted_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM recycle_bin WHERE ${where}`,
      params
    );

    // Add time remaining for each item
    const itemsWithTimeRemaining = items.map(item => {
      const restoreUntil = new Date(item.restore_until);
      const now = new Date();
      const daysRemaining = Math.ceil((restoreUntil - now) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        days_remaining: Math.max(0, daysRemaining),
        is_expired: daysRemaining <= 0
      };
    });

    return res.json({ 
      items: itemsWithTimeRemaining, 
      total, 
      page: parseInt(page),
      auto_delete_after_days: AUTO_DELETE_DAYS
    });
  } catch (err) {
    console.error('[Get recycle bin error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.restoreItem = async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[item]] = await conn.query(
      'SELECT * FROM recycle_bin WHERE id = ?',
      [id]
    );

    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: 'Item not found in recycle bin' });
    }

    const originalData = JSON.parse(item.original_data);
    const itemType = item.item_type;
    const itemId = item.item_id;

    // Restore based on item type
    switch (itemType) {
      case 'listing':
        await conn.query('UPDATE listings SET status = ? WHERE id = ?', ['active', itemId]);
        break;

      case 'user':
        await conn.query('UPDATE users SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [itemId]);
        break;

      case 'category':
        await conn.query('UPDATE categories SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [itemId]);
        break;

      case 'certificate':
        if (originalData.cert_type === 'ambassador') {
          await conn.query('UPDATE ambassador_certificates SET status = ? WHERE id = ?', [originalData.status || 'pending', itemId]);
        } else if (originalData.cert_type === 'broker') {
          await conn.query('UPDATE broker_certificates SET status = ? WHERE id = ?', [originalData.status || 'pending', itemId]);
        } else if (originalData.cert_type === 'supplier') {
          await conn.query('UPDATE supplier_certificates SET status = ? WHERE id = ?', [originalData.status || 'pending', itemId]);
        }
        break;

      case 'message':
        await conn.query('UPDATE broker_messages SET is_deleted = 0, deleted_at = NULL WHERE id = ?', [itemId]);
        break;

      default:
        await conn.rollback();
        return res.status(400).json({ message: 'Item type not yet supported for restoration' });
    }

    // Remove from recycle bin
    await conn.query('DELETE FROM recycle_bin WHERE id = ?', [id]);

    await conn.commit();

    // Notify user if applicable
    if (itemType === 'listing' && originalData.user_id) {
      notifyUser(originalData.user_id, 'Listing restored', `Your listing "${originalData.title}" has been restored from recycle bin.`, 'recycle', '/listings');
    }

    return res.json({ message: 'Item restored successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('[Restore item error]', err);
    return res.status(500).json({ message: 'Server error during restoration' });
  } finally {
    conn.release();
  }
};

exports.permanentDelete = async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[item]] = await conn.query(
      'SELECT * FROM recycle_bin WHERE id = ?',
      [id]
    );

    if (!item) {
      await conn.rollback();
      return res.status(404).json({ message: 'Item not found in recycle bin' });
    }

    const itemType = item.item_type;
    const itemId = item.item_id;

    // Permanently delete from original table
    switch (itemType) {
      case 'listing':
        // Delete listing and related data
        await conn.query('DELETE FROM listing_images WHERE listing_id = ?', [itemId]);
        await conn.query('DELETE FROM contact_unlocks WHERE listing_id = ?', [itemId]);
        await conn.query('DELETE FROM renewal_tokens WHERE listing_id = ?', [itemId]);
        await conn.query('DELETE FROM coin_transactions WHERE listing_id = ?', [itemId]);
        await conn.query('DELETE FROM listings WHERE id = ?', [itemId]);
        break;

      case 'user':
        // Mark user as permanently deleted (keep record but inaccessible)
        await conn.query('UPDATE users SET is_deleted = 2, deleted_at = NOW() WHERE id = ?', [itemId]);
        break;

      case 'category':
        await conn.query('DELETE FROM categories WHERE id = ?', [itemId]);
        break;

      case 'certificate':
        if (item.original_data) {
          const originalData = JSON.parse(item.original_data);
          if (originalData.cert_type === 'ambassador') {
            await conn.query('DELETE FROM ambassador_certificates WHERE id = ?', [itemId]);
          } else if (originalData.cert_type === 'broker') {
            await conn.query('DELETE FROM broker_certificates WHERE id = ?', [itemId]);
          } else if (originalData.cert_type === 'supplier') {
            await conn.query('DELETE FROM supplier_certificates WHERE id = ?', [itemId]);
          }
        }
        break;

      case 'message':
        await conn.query('DELETE FROM broker_messages WHERE id = ?', [itemId]);
        break;

      default:
        await conn.rollback();
        return res.status(400).json({ message: 'Item type not yet supported for permanent deletion' });
    }

    // Remove from recycle bin
    await conn.query('DELETE FROM recycle_bin WHERE id = ?', [id]);

    await conn.commit();

    return res.json({ message: 'Item permanently deleted' });
  } catch (err) {
    await conn.rollback();
    console.error('[Permanent delete error]', err);
    return res.status(500).json({ message: 'Server error during permanent deletion' });
  } finally {
    conn.release();
  }
};

exports.emptyRecycleBin = async (req, res) => {
  const { item_type } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let where = '1=1';
    const params = [];

    if (item_type) {
      where += ' AND item_type = ?';
      params.push(item_type);
    }

    // Get all items to permanently delete
    const [items] = await pool.query(
      `SELECT * FROM recycle_bin WHERE ${where}`,
      params
    );

    for (const item of items) {
      const itemId = item.item_id;
      const itemType = item.item_type;

      switch (itemType) {
        case 'listing':
          await conn.query('DELETE FROM listing_images WHERE listing_id = ?', [itemId]);
          await conn.query('DELETE FROM contact_unlocks WHERE listing_id = ?', [itemId]);
          await conn.query('DELETE FROM renewal_tokens WHERE listing_id = ?', [itemId]);
          await conn.query('DELETE FROM coin_transactions WHERE listing_id = ?', [itemId]);
          await conn.query('DELETE FROM listings WHERE id = ?', [itemId]);
          break;

        case 'user':
          await conn.query('UPDATE users SET is_deleted = 2, deleted_at = NOW() WHERE id = ?', [itemId]);
          break;

        case 'category':
          await conn.query('DELETE FROM categories WHERE id = ?', [itemId]);
          break;

        case 'certificate':
          const originalData = JSON.parse(item.original_data);
          if (originalData.cert_type === 'ambassador') {
            await conn.query('DELETE FROM ambassador_certificates WHERE id = ?', [itemId]);
          } else if (originalData.cert_type === 'broker') {
            await conn.query('DELETE FROM broker_certificates WHERE id = ?', [itemId]);
          } else if (originalData.cert_type === 'supplier') {
            await conn.query('DELETE FROM supplier_certificates WHERE id = ?', [itemId]);
          }
          break;

        case 'message':
          await conn.query('DELETE FROM broker_messages WHERE id = ?', [itemId]);
          break;
      }
    }

    // Empty recycle bin
    await conn.query(`DELETE FROM recycle_bin WHERE ${where}`, params);

    await conn.commit();

    return res.json({ message: `Recycle bin emptied. ${items.length} items permanently deleted.` });
  } catch (err) {
    await conn.rollback();
    console.error('[Empty recycle bin error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getRecycleBinStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM recycle_bin');
    
    const [byType] = await pool.query(
      `SELECT item_type, COUNT(*) AS count 
       FROM recycle_bin 
       GROUP BY item_type`
    );

    const [[{ expiringSoon }]] = await pool.query(
      'SELECT COUNT(*) AS expiringSoon FROM recycle_bin WHERE restore_until <= DATE_ADD(NOW(), INTERVAL 7 DAY)'
    );

    const [[{ expired }]] = await pool.query(
      'SELECT COUNT(*) AS expired FROM recycle_bin WHERE restore_until < NOW()'
    );

    const typeStats = {};
    byType.forEach(row => {
      typeStats[row.item_type] = row.count;
    });

    return res.json({
      total,
      by_type: typeStats,
      expiring_soon: expiringSoon,
      expired,
      auto_delete_after_days: AUTO_DELETE_DAYS
    });
  } catch (err) {
    console.error('[Recycle bin stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
