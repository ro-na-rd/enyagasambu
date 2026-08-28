const pool = require('../config/db');

function maskPhone(phone) {
  if (!phone) return null;
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
}

function maskEmail(email) {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!domain) return '***@***';
  return user.charAt(0) + '***@' + domain;
}

function maskName(name) {
  if (!name) return null;
  return name.charAt(0) + '*'.repeat(Math.max(0, name.length - 1));
}

function buildDateFilter(startDate, endDate) {
  let where = 'created_at >= COALESCE(?, \'1970-01-01\') AND created_at <= COALESCE(?, NOW())';
  const params = [startDate || null, endDate || null];
  return { where, params };
}

async function computeAlerts() {
  const alerts = [];
  try {
    const [[{ failedPaymentRate }]] = await pool.query(
      `SELECT COALESCE(COUNT(CASE WHEN status = 'failed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 0) AS failedPaymentRate
       FROM payments WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    if (failedPaymentRate > 10) {
      alerts.push({ id: 'payment_failure_rate', type: 'payment', severity: 'high', message: `Payment failure rate is ${Number(failedPaymentRate).toFixed(1)}% (threshold: 10%)`, createdAt: new Date().toISOString() });
    }
  } catch { /* ignore */ }
  try {
    const [[{ highSupportTickets }]] = await pool.query("SELECT COUNT(*) AS c FROM support_requests WHERE status = 'pending'");
    if (highSupportTickets > 10) {
      alerts.push({ id: 'high_support_tickets', type: 'support', severity: 'medium', message: `${highSupportTickets} pending support tickets (threshold: 10)`, createdAt: new Date().toISOString() });
    }
  } catch { /* ignore */ }
  try {
    const [[{ reportedListings }]] = await pool.query("SELECT COUNT(*) AS c FROM listing_reports WHERE status IN ('open','reviewing')");
    if (reportedListings > 5) {
      alerts.push({ id: 'reported_listings', type: 'report', severity: 'medium', message: `${reportedListings} open listing reports (threshold: 5)`, createdAt: new Date().toISOString() });
    }
  } catch { /* ignore */ }
  try {
    const [[{ refunds24h }]] = await pool.query("SELECT COUNT(*) AS c FROM payments WHERE status = 'refunded' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    if (refunds24h > 5) {
      alerts.push({ id: 'unusual_refunds', type: 'payment', severity: 'high', message: `${refunds24h} refunds in the last 24 hours (threshold: 5)`, createdAt: new Date().toISOString() });
    }
  } catch { /* ignore */ }
  return alerts;
}

exports.getCEODashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = buildDateFilter(startDate, endDate);

    const [[{ totalRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS totalRevenue FROM coin_transactions
       WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee') AND ${df.where}`,
      df.params
    );
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ activeUsers30d }]] = await pool.query(
      'SELECT COUNT(*) AS activeUsers30d FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
    );
    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active' AND expires_at > NOW()"
    );
    const [[{ brokers }]] = await pool.query("SELECT COUNT(*) AS brokers FROM users WHERE role = 'broker'");
    const [[{ ambassadors }]] = await pool.query("SELECT COUNT(*) AS ambassadors FROM users WHERE role = 'ambassador'");
    const [[{ suppliers }]] = await pool.query("SELECT COUNT(*) AS suppliers FROM users WHERE role = 'supplier'");
    const [[{ openReports }]] = await pool.query("SELECT COUNT(*) AS openReports FROM listing_reports WHERE status IN ('open','reviewing')");
    const [[{ pendingSupport }]] = await pool.query("SELECT COUNT(*) AS pendingSupport FROM support_requests WHERE status = 'pending'");

    const [revenueByMonth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, SUM(ABS(amount)) AS value
       FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee')
       GROUP BY label, YEAR(created_at), MONTH(created_at) ORDER BY YEAR(created_at), MONTH(created_at) DESC LIMIT 12`
    );

    const [userGrowth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS value
       FROM users GROUP BY label, YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at) DESC LIMIT 12`
    );

    const [listingsByCategory] = await pool.query(
      `SELECT c.name AS label, COUNT(l.id) AS value
       FROM listings l JOIN categories c ON l.category_id = c.id
       WHERE l.status != 'deleted' GROUP BY c.name ORDER BY value DESC LIMIT 10`
    );

    const [typeRows] = await pool.query(
      `SELECT listing_type AS label, COUNT(*) AS value FROM listings WHERE status != 'deleted' GROUP BY listing_type`
    );
    const listingsByType = { sale: 0, rent: 0, auction: 0 };
    for (const row of typeRows) {
      if (row.label && Object.prototype.hasOwnProperty.call(listingsByType, row.label)) listingsByType[row.label] = row.value;
    }

    const [subRows] = await pool.query(
      `SELECT plan AS label, COUNT(*) AS value FROM seller_subscriptions GROUP BY plan`
    );
    const subscriptions = { free: 0, standard: 0, premium: 0 };
    for (const row of subRows) {
      if (row.label && Object.prototype.hasOwnProperty.call(subscriptions, row.label)) subscriptions[row.label] = row.value;
    }

    const [[{ coinsSold }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS coinsSold FROM coin_transactions WHERE type = 'purchase'"
    );
    const [[{ coinsUsed }]] = await pool.query(
      "SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsUsed FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee')"
    );
    const [[{ coinRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(amount_rwf), 0) AS coinRevenue FROM payments WHERE status = 'confirmed' AND ${df.where}`,
      df.params
    );

    const [recentReports] = await pool.query(
      `SELECT lr.id, l.title AS listingTitle, u.name AS reporterName, lr.reason AS reason, lr.status AS status, lr.created_at AS createdAt
       FROM listing_reports lr
       LEFT JOIN listings l ON lr.listing_id = l.id
       LEFT JOIN users u ON lr.reporter_id = u.id
       ORDER BY lr.created_at DESC LIMIT 8`
    );

    const alerts = await computeAlerts();

    return res.json({
      totalRevenue, totalUsers, activeUsers30d, activeListings,
      brokers, ambassadors, suppliers, openReports, pendingSupport,
      revenueByMonth: revenueByMonth.reverse(),
      userGrowth: userGrowth.reverse(),
      listingsByCategory,
      listingsByType,
      subscriptions,
      coins: { totalSold: coinsSold, totalUsed: coinsUsed, revenue: coinRevenue },
      reports: recentReports,
      alerts
    });
  } catch (err) {
    console.error('[CEO Dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCIODashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = buildDateFilter(startDate, endDate);

    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalStaff }]] = await pool.query('SELECT COUNT(*) AS totalStaff FROM staff WHERE is_active = 1');
    const [[{ failedLogins }]] = await pool.query(
      `SELECT COUNT(*) AS failedLogins FROM staff_otps WHERE used = 0 AND expires_at < NOW() AND ${df.where}`,
      df.params
    );
    const [[{ totalPayments }]] = await pool.query('SELECT COUNT(*) AS totalPayments FROM payments');
    const [[{ failedPayments }]] = await pool.query(
      `SELECT COUNT(*) AS failedPayments FROM payments WHERE status = 'failed' AND ${df.where}`,
      df.params
    );
    let totalOtps = 0;
    try {
      const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM otp_codes');
      totalOtps = r.c;
    } catch {
      const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM seller_otps');
      totalOtps = r.c;
    }

    const [apiErrors] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%d %b') AS label, COUNT(*) AS value
       FROM payments WHERE status = 'failed'
       GROUP BY label, DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 14`
    );

    const [authActivity] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%d %b') AS label, COUNT(*) AS value
       FROM staff_otps GROUP BY label, DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 14`
    );

    const [recentAuditRows] = await pool.query(
      `SELECT a.id, a.created_at AS timestamp, s.username AS actor,
              a.executive_role AS role, a.action, a.module
       FROM executive_audit_log a
       LEFT JOIN staff s ON a.staff_id = s.id
       ORDER BY a.created_at DESC LIMIT 20`
    );

    return res.json({
      totalUsers, totalStaff, failedLogins, totalPayments, failedPayments, totalOtps,
      apiErrors: apiErrors.reverse(),
      authActivity: authActivity.reverse(),
      recentAuditLog: recentAuditRows
    });
  } catch (err) {
    console.error('[CIO Dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCIOHealth = async (req, res) => {
  const health = {
    frontend: { available: true, latency: 0 },
    backend: { available: true, latency: Math.round(process.uptime()) },
    database: { healthy: false, connectionPool: 0 },
    storage: { usedPercent: 0, totalGB: 10, usedGB: 0 },
    minio: { available: !!process.env.S3_ENDPOINT || !!process.env.AWS_S3_BUCKET, bucketCount: process.env.S3_BUCKET ? 1 : 0 },
    socketio: { connected: false, clientCount: 0 },
    scheduler: { renewal: true, expiry: true, auction: true },
    emailService: { available: !!process.env.SMTP_HOST || !!process.env.EMAIL_API_KEY, queueSize: 0 },
    smsService: { available: !!process.env.AT_SMS_API_KEY || !!process.env.AFRICASTALKING_API_KEY, queueSize: 0 },
    mtnMomo: { available: !!process.env.MOMO_SUBSCRIPTION_KEY || !!process.env.MOMO_API_KEY, lastPing: new Date().toISOString() }
  };

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    health.database.healthy = true;
    health.backend.latency = Date.now() - start;
    health.database.connectionPool = pool.config?.connectionLimit || 10;
  } catch { /* unhealthy */ }

  try {
    const [[{ bytes }]] = await pool.query(
      `SELECT COALESCE(SUM(data_length + index_length), 0) AS bytes
       FROM information_schema.tables WHERE table_schema = DATABASE()`
    );
    const usedGB = Number(bytes) / (1024 * 1024 * 1024);
    health.storage.usedGB = Math.round(usedGB * 100) / 100;
    health.storage.usedPercent = Math.min(100, Math.round((usedGB / (health.storage.totalGB || 10)) * 100));
  } catch { /* ignore */ }

  try {
    const { getIO } = require('../config/socket');
    const io = getIO && getIO();
    if (io) {
      health.socketio.connected = true;
      health.socketio.clientCount = io.engine?.clientsCount ?? 0;
    }
  } catch { /* ignore */ }

  return res.json(health);
};

exports.getCOODashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = buildDateFilter(startDate, endDate);

    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active' AND expires_at > NOW()"
    );
    const [[{ expiringListings }]] = await pool.query(
      "SELECT COUNT(*) AS expiringListings FROM listings WHERE status = 'active' AND expires_at <= NOW()"
    );
    const [[{ soldListings }]] = await pool.query("SELECT COUNT(*) AS soldListings FROM listings WHERE status = 'sold'");
    const [[{ disabledListings }]] = await pool.query("SELECT COUNT(*) AS disabledListings FROM listings WHERE status = 'disabled'");
    const [[{ auctions }]] = await pool.query("SELECT COUNT(*) AS auctions FROM listings WHERE listing_type = 'auction'");
    const [[{ openReports }]] = await pool.query("SELECT COUNT(*) AS openReports FROM listing_reports WHERE status IN ('open','reviewing')");
    const [[{ pendingSupport }]] = await pool.query("SELECT COUNT(*) AS pendingSupport FROM support_requests WHERE status = 'pending'");
    const [[{ pendingBrokerCerts }]] = await pool.query("SELECT COUNT(*) AS c FROM broker_certificates WHERE status IN ('pending','paid')");
    const [[{ pendingAmbassadorCerts }]] = await pool.query("SELECT COUNT(*) AS c FROM ambassador_certificates WHERE status IN ('pending','paid')");
    let pendingSupplierCerts = 0;
    try {
      const [[r]] = await pool.query("SELECT COUNT(*) AS c FROM supplier_certificates WHERE status IN ('pending','paid')");
      pendingSupplierCerts = r.c;
    } catch { /* table optional */ }
    const [[{ brokers }]] = await pool.query("SELECT COUNT(*) AS brokers FROM users WHERE role = 'broker'");
    const [[{ suppliers }]] = await pool.query("SELECT COUNT(*) AS suppliers FROM users WHERE role = 'supplier'");

    const [listingsByStatus] = await pool.query(
      `SELECT status AS label, COUNT(*) AS value FROM listings
       WHERE status != 'deleted' GROUP BY status ORDER BY value DESC`
    );

    const [supportByCategory] = await pool.query(
      `SELECT category AS label, COUNT(*) AS value FROM support_requests GROUP BY category ORDER BY value DESC`
    );

    const [reportsByReason] = await pool.query(
      `SELECT reason AS label, COUNT(*) AS value FROM listing_reports GROUP BY reason ORDER BY value DESC`
    );

    const brokerActivity = {
      activeBrokers: brokers,
      newBrokers30d: 0,
      brokerListings: 0
    };
    try {
      const [[nb]] = await pool.query("SELECT COUNT(*) AS c FROM users WHERE role = 'broker' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
      brokerActivity.newBrokers30d = nb.c;
      const [[bl]] = await pool.query(
        `SELECT COUNT(*) AS c FROM listings l JOIN users u ON l.user_id = u.id WHERE u.role = 'broker' AND l.status != 'deleted'`
      );
      brokerActivity.brokerListings = bl.c;
    } catch { /* ignore */ }

    const supplierActivity = {
      activeSuppliers: suppliers,
      newSuppliers30d: 0,
      supplierListings: 0
    };
    try {
      const [[ns]] = await pool.query("SELECT COUNT(*) AS c FROM users WHERE role = 'supplier' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
      supplierActivity.newSuppliers30d = ns.c;
      const [[sl]] = await pool.query(
        `SELECT COUNT(*) AS c FROM listings l JOIN users u ON l.user_id = u.id WHERE u.role = 'supplier' AND l.status != 'deleted'`
      );
      supplierActivity.supplierListings = sl.c;
    } catch { /* ignore */ }

    const certificateProcessing = {
      brokerPending: pendingBrokerCerts,
      ambassadorPending: pendingAmbassadorCerts,
      supplierPending: pendingSupplierCerts,
      brokerApproved: 0,
      ambassadorApproved: 0,
      supplierApproved: 0
    };
    try {
      const [[b]] = await pool.query("SELECT COUNT(*) AS c FROM broker_certificates WHERE status = 'generated'");
      certificateProcessing.brokerApproved = b.c;
    } catch { /* try alternate status */ }
    if (!certificateProcessing.brokerApproved) {
      try {
        const [[b]] = await pool.query("SELECT COUNT(*) AS c FROM broker_certificates WHERE status = 'approved'");
        certificateProcessing.brokerApproved = b.c;
      } catch { /* ignore */ }
    }
    try {
      const [[a]] = await pool.query("SELECT COUNT(*) AS c FROM ambassador_certificates WHERE status = 'generated'");
      certificateProcessing.ambassadorApproved = a.c;
    } catch { /* ignore */ }
    if (!certificateProcessing.ambassadorApproved) {
      try {
        const [[a]] = await pool.query("SELECT COUNT(*) AS c FROM ambassador_certificates WHERE status = 'approved'");
        certificateProcessing.ambassadorApproved = a.c;
      } catch { /* ignore */ }
    }
    try {
      const [[s]] = await pool.query("SELECT COUNT(*) AS c FROM supplier_certificates WHERE status = 'approved'");
      certificateProcessing.supplierApproved = s.c;
    } catch { /* ignore */ }

    const alerts = (await computeAlerts()).filter(a =>
      a.type === 'support' || a.type === 'report'
    );
    try {
      const [[{ expiringAlert }]] = await pool.query(
        "SELECT COUNT(*) AS c FROM listings WHERE status = 'active' AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)"
      );
      if (expiringAlert > 0) {
        alerts.unshift({
          id: 'expiring_listings', type: 'system', severity: 'low',
          message: `${expiringAlert} listings expire within 48 hours`,
          createdAt: new Date().toISOString()
        });
      }
    } catch { /* ignore */ }

    return res.json({
      activeListings, expiringListings, soldListings, disabledListings,
      auctions, openReports, pendingSupport, pendingBrokerCerts,
      pendingAmbassadorCerts, pendingSupplierCerts, brokers, suppliers,
      listingsByStatus,
      supportByCategory,
      reportsByReason,
      brokerActivity,
      supplierActivity,
      certificateProcessing,
      alerts
    });
  } catch (err) {
    console.error('[COO Dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCMODashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = buildDateFilter(startDate, endDate);

    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ newUsersMonth }]] = await pool.query(
      "SELECT COUNT(*) AS newUsersMonth FROM users WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
    );
    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active'"
    );
    const [[{ referrals }]] = await pool.query('SELECT COUNT(*) AS referrals FROM referrals');
    const [[{ ambassadors }]] = await pool.query("SELECT COUNT(*) AS ambassadors FROM users WHERE role = 'ambassador'");
    const [[{ brokers }]] = await pool.query("SELECT COUNT(*) AS brokers FROM users WHERE role = 'broker'");
    const [[{ likes }]] = await pool.query('SELECT COUNT(*) AS likes FROM listing_likes');
    const [[{ comments }]] = await pool.query('SELECT COUNT(*) AS comments FROM listing_comments');
    let auctionBids = 0;
    try {
      const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM auction_bids');
      auctionBids = r.c;
    } catch { /* table optional */ }
    const [[{ activePromos }]] = await pool.query(
      'SELECT COUNT(*) AS activePromos FROM promo_codes WHERE expires_at IS NULL OR expires_at > NOW()'
    );

    const [userGrowth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS value
       FROM users GROUP BY label, YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at) DESC LIMIT 12`
    );

    const engagementByCategory = await pool.query(
      `SELECT c.name AS label, COUNT(l.id) AS value
       FROM listings l JOIN categories c ON l.category_id = c.id
       WHERE l.status = 'active' GROUP BY c.name ORDER BY value DESC LIMIT 8`
    ).then(([rows]) => rows);

    const [referralTrend] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS value
       FROM referrals GROUP BY label, YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at) DESC LIMIT 12`
    );

    // Retention (last 30 days)
    const [[returningUsersRow]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS c FROM coin_transactions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const returningUsers = returningUsersRow.c || 0;
    const retentionRate = totalUsers > 0 ? Math.round((Math.min(returningUsers, totalUsers) / totalUsers) * 100) : 0;
    const userRetention = { newUsers: newUsersMonth, returningUsers, retentionRate };

    // Search activity proxy: listing views over last 14 days
    let searchActivity = { totalSearches: 0, uniqueSearchers: 0, topCategories: [] };
    try {
      const [[t]] = await pool.query(
        `SELECT COUNT(*) AS c, COUNT(DISTINCT user_id) AS u FROM listing_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)`
      );
      searchActivity.totalSearches = t.c || 0;
      searchActivity.uniqueSearchers = t.u || 0;
      searchActivity.topCategories = await pool.query(
        `SELECT c.name AS label, COUNT(v.id) AS value
         FROM listing_views v JOIN listings l ON v.listing_id = l.id JOIN categories c ON l.category_id = c.id
         WHERE v.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY c.name ORDER BY value DESC LIMIT 5`
      ).then(([rows]) => rows);
    } catch { /* listing_views may not exist */ }

    // Subscription conversions by plan (last 30 days)
    const subscriptionConversions = { freeToStandard: 0, standardToPremium: 0, totalConverted: 0 };
    try {
      const [[std]] = await pool.query(
        `SELECT COUNT(*) AS c FROM seller_subscriptions WHERE plan = 'standard' AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );
      const [[prem]] = await pool.query(
        `SELECT COUNT(*) AS c FROM seller_subscriptions WHERE plan = 'premium' AND started_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );
      subscriptionConversions.freeToStandard = std.c || 0;
      subscriptionConversions.standardToPremium = prem.c || 0;
      subscriptionConversions.totalConverted = (std.c || 0) + (prem.c || 0);
    } catch { /* ignore */ }

    // Coin conversions (last 30 days)
    const coinConversions = { totalPurchases: 0, totalRevenue: 0, averagePerUser: 0 };
    try {
      const [[p]] = await pool.query(
        `SELECT COUNT(DISTINCT user_id) AS users, COALESCE(SUM(amount), 0) AS revenue
         FROM coin_transactions WHERE type = 'purchase' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      );
      coinConversions.totalPurchases = p.users || 0;
      coinConversions.totalRevenue = Number(p.revenue) || 0;
      coinConversions.averagePerUser = p.users > 0 ? Math.round((Number(p.revenue) / p.users) * 10) / 10 : 0;
    } catch { /* ignore */ }

    // Announcement performance + read-rate proxy from notifications
    const announcementPerformance = { totalSent: 0, openRate: 0, clickRate: 0 };
    try {
      const [[a]] = await pool.query(`SELECT COUNT(*) AS c FROM announcements`);
      announcementPerformance.totalSent = a.c || 0;
      const [[n]] = await pool.query(
        `SELECT COUNT(*) AS total, SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) AS opened FROM notifications`
      );
      if (n.total > 0) {
        announcementPerformance.openRate = Math.round(((n.opened || 0) / n.total) * 100);
      }
    } catch { /* ignore */ }

    // Content page views proxy: listing views (14 days)
    const contentPageViews = { totalViews: searchActivity.totalSearches, uniqueViewers: searchActivity.uniqueSearchers, averageTimeOnPage: 0 };

    const alerts = (await computeAlerts()).filter(a => a.type !== 'system');

    return res.json({
      totalUsers, newUsersMonth, activeListings, referrals,
      ambassadors, brokers, likes, comments, auctionBids, activePromos,
      userGrowth: userGrowth.reverse(),
      engagementByCategory,
      referralTrend: referralTrend.reverse(),
      userRetention,
      searchActivity,
      subscriptionConversions,
      coinConversions,
      announcementPerformance,
      contentPageViews,
      alerts
    });
  } catch (err) {
    console.error('[CMO Dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCFODashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = buildDateFilter(startDate, endDate);

    const [[{ totalRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS totalRevenue FROM coin_transactions
       WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee') AND ${df.where}`,
      df.params
    );
    const [[{ listingFees }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS listingFees FROM coin_transactions
       WHERE type = 'listing_fee' AND ${df.where}`,
      df.params
    );
    const [[{ connectFees }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS connectFees FROM coin_transactions
       WHERE type = 'connect_fee' AND ${df.where}`,
      df.params
    );
    const [[{ subscriptionRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS subscriptionRevenue FROM coin_transactions
       WHERE type = 'subscription_fee' AND ${df.where}`,
      df.params
    );
    const [[{ boostRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(ABS(amount)), 0) AS boostRevenue FROM coin_transactions
       WHERE type = 'boost_fee' AND ${df.where}`,
      df.params
    );
    let donations = 0;
    try {
      const [[d]] = await pool.query(
        `SELECT COALESCE(SUM(amount_rwf), 0) AS v FROM donations WHERE status = 'confirmed' AND ${df.where}`,
        df.params
      );
      donations = d.v;
    } catch { /* table optional */ }
    const [[{ totalPayments }]] = await pool.query(
      `SELECT COUNT(*) AS totalPayments FROM payments WHERE ${df.where}`,
      df.params
    );
    const [[{ failedPayments }]] = await pool.query(
      `SELECT COUNT(*) AS failedPayments FROM payments WHERE status = 'failed' AND ${df.where}`,
      df.params
    );
    const [[{ refunded }]] = await pool.query(
      `SELECT COUNT(*) AS refunded FROM payments WHERE status = 'refunded' AND ${df.where}`,
      df.params
    );
    const [[{ pendingPayments }]] = await pool.query(
      "SELECT COUNT(*) AS pendingPayments FROM payments WHERE status = 'pending'"
    );
    const [[{ activeSubscriptions }]] = await pool.query(
      "SELECT COUNT(*) AS activeSubscriptions FROM seller_subscriptions WHERE plan != 'free'"
    );
    const [[{ pendingApprovals }]] = await pool.query(
      "SELECT COUNT(*) AS pendingApprovals FROM executive_approvals WHERE status = 'pending'"
    );

    const [revenueByMonth] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') AS label, SUM(ABS(amount)) AS value
       FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee')
       GROUP BY label, YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at), MONTH(created_at) DESC LIMIT 12`
    );

    const [revenueByType] = await pool.query(
      `SELECT type AS label, SUM(ABS(amount)) AS value
       FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee')
       GROUP BY type ORDER BY value DESC`
    );

    const [paymentsByStatus] = await pool.query(
      `SELECT status AS label, COUNT(*) AS value FROM payments
       WHERE ${df.where} GROUP BY status ORDER BY value DESC`,
      df.params
    );

    const [[{ successfulPayments }]] = await pool.query(
      `SELECT COUNT(*) AS successfulPayments FROM payments WHERE status = 'completed' AND ${df.where}`,
      df.params
    );

    const [recentRefunds] = await pool.query(
      `SELECT id, amount, status, created_at FROM payments
       WHERE status = 'refunded' ORDER BY created_at DESC LIMIT 10`
    );

    const alerts = await computeAlerts();

    return res.json({
      totalRevenue, listingFees, connectFees, subscriptionRevenue,
      boostRevenue, donations, totalPayments, failedPayments, refunded,
      pendingPayments, activeSubscriptions, pendingApprovals,
      successfulPayments,
      revenueByMonth: revenueByMonth.reverse(),
      revenueByType,
      paymentsByStatus,
      recentRefunds,
      alerts
    });
  } catch (err) {
    console.error('[CFO Dashboard error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuditLog = async (req, res) => {
  const { page = 1, role, action } = req.query;
  const limit = 30;
  const offset = (parseInt(page) - 1) * limit;
  let where = '1=1';
  const params = [];
  if (role) { where += ' AND a.executive_role = ?'; params.push(role); }
  if (action) { where += ' AND a.action LIKE ?'; params.push(`%${action}%`); }
  try {
    const [logs] = await pool.query(
      `SELECT a.id, a.created_at AS timestamp, s.username AS actor,
              a.executive_role AS role, a.action, a.module,
              a.record_id, a.ip_address
       FROM executive_audit_log a
       LEFT JOIN staff s ON a.staff_id = s.id
       WHERE ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM executive_audit_log a WHERE ${where}`, params
    );
    return res.json({ entries: logs, logs, total, page: parseInt(page) });
  } catch (err) {
    console.error('[Audit log error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await computeAlerts();

    // CIO security metrics
    let failedLoginsCount = 0;
    try {
      const [[f]] = await pool.query(
        'SELECT COUNT(*) AS c FROM staff_otps WHERE used = 0 AND expires_at < NOW() AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      failedLoginsCount = f.c;
    } catch { /* ignore */ }

    let rateLimiterEvents = 0;

    let suspiciousIPs = [];
    try {
      suspiciousIPs = await pool.query(
        `SELECT ip_address AS ip, COUNT(*) AS hits FROM executive_audit_log
         WHERE ip_address IS NOT NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY ip_address ORDER BY hits DESC LIMIT 10`
      ).then(([rows]) => rows.map(r => r.ip));
    } catch { /* ignore */ }

    let authActivity = [];
    try {
      authActivity = await pool.query(
        `SELECT DATE_FORMAT(created_at, '%d %b') AS label,
                SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) AS logins,
                SUM(CASE WHEN used = 0 AND expires_at < NOW() THEN 1 ELSE 0 END) AS failures
         FROM staff_otps GROUP BY label, DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7`
      ).then(([rows]) => rows);
    } catch { /* ignore */ }

    return res.json({
      alerts: alerts.map(a => ({ ...a, timestamp: a.createdAt })),
      failedLoginsCount,
      rateLimiterEvents,
      suspiciousIPs,
      authActivity
    });
  } catch (err) {
    console.error('[Alerts error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.dismissAlert = async (req, res) => {
  const { id } = req.params;
  try {
    const [[existing]] = await pool.query('SELECT * FROM executive_alerts WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Alert not found' });

    await pool.query(
      "UPDATE executive_alerts SET status = 'dismissed', dismissed_by = ?, dismissed_at = NOW() WHERE id = ?",
      [req.user.id, id]
    );

    return res.json({ message: 'Alert dismissed' });
  } catch (err) {
    console.error('[Dismiss alert error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.exportDashboardData = async (req, res) => {
  const { role = 'ceo' } = req.query;
  try {
    let csvRows = [];
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const header = (cols) => csvRows.push(cols.join(','));

    if (role === 'ceo') {
      header(['Metric', 'Value']);
      const [[rev]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee')");
      csvRows.push(['Total Revenue', esc(rev.v)]);
      const [[usr]] = await pool.query('SELECT COUNT(*) AS v FROM users');
      csvRows.push(['Total Users', esc(usr.v)]);
      const [[lst]] = await pool.query("SELECT COUNT(*) AS v FROM listings WHERE status='active'");
      csvRows.push(['Active Listings', esc(lst.v)]);
    } else if (role === 'cio') {
      header(['Metric', 'Value']);
      const [[usr]] = await pool.query('SELECT COUNT(*) AS v FROM users');
      csvRows.push(['Total Users', esc(usr.v)]);
      const [[fl]] = await pool.query("SELECT COUNT(*) AS v FROM staff_otps WHERE used=0 AND expires_at<NOW()");
      csvRows.push(['Failed Logins', esc(fl.v)]);
    } else if (role === 'coo') {
      header(['Metric', 'Value']);
      const [[al]] = await pool.query("SELECT COUNT(*) AS v FROM listings WHERE status='active' AND expires_at>NOW()");
      csvRows.push(['Active Listings', esc(al.v)]);
      const [[pr]] = await pool.query("SELECT COUNT(*) AS v FROM listing_reports WHERE status IN ('open','reviewing')");
      csvRows.push(['Open Reports', esc(pr.v)]);
    } else if (role === 'cmo') {
      header(['Metric', 'Value']);
      const [[tu]] = await pool.query('SELECT COUNT(*) AS v FROM users');
      csvRows.push(['Total Users', esc(tu.v)]);
      const [[ref]] = await pool.query('SELECT COUNT(*) AS v FROM referrals');
      csvRows.push(['Total Referrals', esc(ref.v)]);
    } else if (role === 'cfo') {
      header(['Metric', 'Value']);
      const [[rev]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)),0) AS v FROM coin_transactions WHERE type IN ('connect_fee','listing_fee','boost_fee','subscription_fee')");
      csvRows.push(['Total Revenue', esc(rev.v)]);
      const [[fp]] = await pool.query("SELECT COUNT(*) AS v FROM payments WHERE status='failed'");
      csvRows.push(['Failed Payments', esc(fp.v)]);
    } else {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }

    const csv = csvRows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${role}_dashboard_export.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('[Export error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getApprovals = async (req, res) => {
  const { status = 'pending' } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT ap.*, s1.username AS requested_by_name, s1.executive_role AS requester_role,
              s2.username AS reviewed_by_name
       FROM executive_approvals ap
       LEFT JOIN staff s1 ON ap.requested_by = s1.id
       LEFT JOIN staff s2 ON ap.reviewed_by = s2.id
       WHERE ap.status = ? ORDER BY ap.created_at DESC`,
      [status]
    );
    const approvals = rows.map(r => ({
      ...r,
      requested_by: r.requested_by_name || `Staff #${r.requested_by}`,
      role: r.requester_role || 'staff'
    }));
    return res.json({ approvals });
  } catch (err) {
    console.error('[Approvals error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getApprovalsByType = async (req, res) => {
  const { type } = req.query;
  const validTypes = ['promotion', 'refund', 'listing_deletion', 'financial_config', 'security_change'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ message: `Type must be one of: ${validTypes.join(', ')}` });
  }
  try {
    const [rows] = await pool.query(
      `SELECT ap.*, s1.username AS requested_by_name, s1.executive_role AS requester_role,
              s2.username AS reviewed_by_name
       FROM executive_approvals ap
       LEFT JOIN staff s1 ON ap.requested_by = s1.id
       LEFT JOIN staff s2 ON ap.reviewed_by = s2.id
       WHERE ap.type = ? ORDER BY ap.created_at DESC`,
      [type]
    );
    const approvals = rows.map(r => ({
      ...r,
      requested_by: r.requested_by_name || `Staff #${r.requested_by}`,
      role: r.requester_role || 'staff'
    }));
    return res.json({ approvals });
  } catch (err) {
    console.error('[Approvals by type error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createApproval = async (req, res) => {
  const { type, title, description, metadata } = req.body;
  const validTypes = ['promotion', 'refund', 'listing_deletion', 'financial_config', 'security_change'];
  if (!type || !validTypes.includes(type)) {
    return res.status(400).json({ message: `Type must be one of: ${validTypes.join(', ')}` });
  }
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO executive_approvals (type, title, description, requested_by, metadata, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [type, title, description || null, req.user.id, metadata ? JSON.stringify(metadata) : null]
    );

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, new_value, ip_address)
       VALUES (?, ?, 'create_approval', 'approvals', ?, ?, ?)`,
      [req.user.id, req.user.executive_role || 'admin', result.insertId, JSON.stringify({ type, title }), ip]
    );

    return res.status(201).json({ message: 'Approval request created', id: result.insertId });
  } catch (err) {
    console.error('[Create approval error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.reviewApproval = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }
  try {
    const [[approval]] = await pool.query('SELECT * FROM executive_approvals WHERE id = ?', [id]);
    if (!approval) return res.status(404).json({ message: 'Approval not found' });
    if (approval.status !== 'pending') return res.status(400).json({ message: 'Already reviewed' });

    await pool.query(
      'UPDATE executive_approvals SET status = ?, reviewed_by = ?, reviewed_at = NOW(), notes = ? WHERE id = ?',
      [status, req.user.id, notes || null, id]
    );

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, new_value, ip_address)
       VALUES (?, ?, ?, 'approvals', ?, ?, ?)`,
      [req.user.id, req.user.executive_role || 'admin', `review_${status}`, id, JSON.stringify({ status, notes }), ip]
    );

    return res.json({ message: `Approval ${status}` });
  } catch (err) {
    console.error('[Review approval error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRolePermissions = async (req, res) => {
  const { role } = req.params;
  const allowed = ['ceo', 'cio', 'coo', 'cmo', 'cfo'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ message: 'Invalid executive role' });
  }
  const permissions = {
    ceo: ['view_all_dashboards', 'manage_users', 'view_financials', 'approve_actions', 'view_audit_log', 'export_data'],
    cio: ['view_tech_dashboard', 'manage_staff', 'view_security_logs', 'approve_actions'],
    coo: ['view_operations_dashboard', 'manage_listings', 'manage_reports', 'manage_certificates', 'approve_actions'],
    cmo: ['view_marketing_dashboard', 'manage_promotions', 'view_engagement_metrics', 'manage_referrals'],
    cfo: ['view_financial_dashboard', 'manage_payments', 'view_revenue', 'approve_actions', 'export_data']
  };
  return res.json({ role, permissions: permissions[role] || [] });
};

const STAFF_ALLOWED_ROLES = ['admin', 'staff', 'moderator'];

exports.listStaff = async (req, res) => {
  try {
    const { page = 1, search, role: roleFilter } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let where = '1=1';
    const params = [];
    if (search) {
      where += ' AND (username LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (roleFilter) {
      where += ' AND role = ?';
      params.push(roleFilter);
    }
    const [staff] = await pool.query(
      `SELECT id, username, phone, role, executive_role, is_active, last_login, created_at
       FROM staff WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM staff WHERE ${where}`, params
    );
    return res.json({ staff, total, page: parseInt(page) });
  } catch (err) {
    console.error('[List staff error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createStaff = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { username, password, phone, role, executive_role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (role && !STAFF_ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${STAFF_ALLOWED_ROLES.join(', ')}` });
  }
  try {
    const [[existing]] = await pool.query('SELECT id FROM staff WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO staff (username, password_hash, phone, role, executive_role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, hash, phone || null, role || 'staff', executive_role || null]
    );

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, new_value, ip_address)
       VALUES (?, ?, 'create_staff', 'staff', ?, ?, ?)`,
      [req.user.id, req.user.executive_role || 'CEO', result.insertId, JSON.stringify({ username, role: role || 'staff' }), ip]
    );

    return res.status(201).json({ message: 'Staff account created', id: result.insertId });
  } catch (err) {
    console.error('[Create staff error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStaff = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { id } = req.params;
  const { phone, role, executive_role, is_active, password } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Staff not found' });

    const updates = [];
    const params = [];
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (role !== undefined) {
      if (!STAFF_ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: `Role must be one of: ${STAFF_ALLOWED_ROLES.join(', ')}` });
      }
      updates.push('role = ?'); params.push(role);
    }
    if (executive_role !== undefined) { updates.push('executive_role = ?'); params.push(executive_role || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?'); params.push(hash);
    }
    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });

    params.push(id);
    await pool.query(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`, params);

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, previous_value, new_value, ip_address)
       VALUES (?, ?, 'update_staff', 'staff', ?, ?, ?, ?)`,
      [req.user.id, req.user.executive_role || 'CEO', id, JSON.stringify({ username: existing.username }), JSON.stringify({ role, executive_role, is_active }), ip]
    );

    return res.json({ message: 'Staff updated' });
  } catch (err) {
    console.error('[Update staff error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const [[existing]] = await pool.query('SELECT * FROM staff WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Staff not found' });
    if (existing.executive_role === 'CEO') {
      return res.status(403).json({ message: 'Cannot delete the CEO account' });
    }
    if (existing.id === req.user.id) {
      return res.status(403).json({ message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM staff WHERE id = ?', [id]);

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, previous_value, ip_address)
       VALUES (?, ?, 'delete_staff', 'staff', ?, ?, ?)`,
      [req.user.id, req.user.executive_role || 'CEO', id, JSON.stringify({ username: existing.username }), ip]
    );

    return res.json({ message: 'Staff deleted' });
  } catch (err) {
    console.error('[Delete staff error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' });
  }
  try {
    const [[staff]] = await pool.query('SELECT * FROM staff WHERE id = ?', [req.user.id]);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const valid = await bcrypt.compare(currentPassword, staff.password_hash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE staff SET password_hash = ? WHERE id = ?', [hash, req.user.id]);

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, ip_address)
       VALUES (?, ?, 'change_password', 'auth', ?)`,
      [req.user.id, req.user.executive_role || 'admin', ip]
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Change password error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [[staff]] = await pool.query(
      'SELECT id, username, email, phone, role, executive_role FROM staff WHERE id = ? AND is_active = 1',
      [req.user.id]
    );
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    return res.json({ user: staff });
  } catch (err) {
    console.error('[Get profile error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id FROM staff WHERE id = ?', [req.user.id]);
    if (!existing) return res.status(404).json({ message: 'Staff not found' });

    if (email) {
      const [[dup]] = await pool.query('SELECT id FROM staff WHERE email = ? AND id != ?', [email, req.user.id]);
      if (dup) return res.status(400).json({ message: 'Email is already in use' });
    }

    await pool.query(
      'UPDATE staff SET username = COALESCE(?, username), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?',
      [name || null, email || null, phone || null, req.user.id]
    );

    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    await pool.query(
      `INSERT INTO executive_audit_log (staff_id, executive_role, action, module, ip_address, new_value)
       VALUES (?, ?, 'update_profile', 'profile', ?, ?)`,
      [req.user.id, req.user.executive_role || 'admin', ip, JSON.stringify({ name, email, phone })]
    );

    const [[updated]] = await pool.query(
      'SELECT id, username, email, phone, role, executive_role FROM staff WHERE id = ?',
      [req.user.id]
    );
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('[Update profile error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
