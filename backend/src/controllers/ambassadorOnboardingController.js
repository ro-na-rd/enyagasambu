const pool = require('../config/db');

exports.getOnboardingTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT * FROM ambassador_onboarding_tasks
       WHERE user_id = ?
       ORDER BY sort_order ASC, created_at ASC`,
      [req.user.id]
    );

    if (tasks.length === 0) {
      const defaultTasks = [
        { title: 'Complete your ambassador profile', description: 'Fill in your name, phone, and profile photo', category: 'profile', sort_order: 1 },
        { title: 'Obtain your ambassador certificate', description: 'Pay for and receive your official E-Nyagasambu ambassador certificate', category: 'certificate', sort_order: 2 },
        { title: 'Share your referral code', description: 'Share your unique referral code with potential ambassadors', category: 'promotion', sort_order: 3 },
        { title: 'Recruit your first supplier', description: 'Onboard at least one supplier or vendor to the platform', category: 'recruitment', sort_order: 4 },
        { title: 'Create an awareness campaign', description: 'Plan and execute a campaign to promote E-Nyagasambu in your community', category: 'campaign', sort_order: 5 },
        { title: 'Review platform policies', description: 'Read and understand the E-Nyagasambu ambassador code of conduct', category: 'policy', sort_order: 6 },
        { title: 'Make your first referral', description: 'Successfully refer another ambassador who completes certificate payment', category: 'referral', sort_order: 7 },
        { title: 'Attend a training session', description: 'Join an online or in-person ambassador training session', category: 'training', sort_order: 8 },
      ];

      for (const t of defaultTasks) {
        await pool.query(
          `INSERT INTO ambassador_onboarding_tasks (user_id, title, description, category, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [req.user.id, t.title, t.description, t.category, t.sort_order]
        );
      }

      const [inserted] = await pool.query(
        `SELECT * FROM ambassador_onboarding_tasks WHERE user_id = ? ORDER BY sort_order ASC`,
        [req.user.id]
      );
      return res.json({ tasks: inserted });
    }

    return res.json({ tasks });
  } catch (err) {
    console.error('[Ambassador onboarding tasks error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const [[task]] = await pool.query(
      'SELECT id, completed FROM ambassador_onboarding_tasks WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const newStatus = task.completed ? 0 : 1;
    await pool.query(
      'UPDATE ambassador_onboarding_tasks SET completed = ?, completed_at = ? WHERE id = ?',
      [newStatus, newStatus ? new Date() : null, taskId]
    );

    return res.json({ message: newStatus ? 'Task completed' : 'Task uncompleted', completed: !!newStatus });
  } catch (err) {
    console.error('[Ambassador toggle task error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getOnboardingProgress = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ambassador_onboarding_tasks WHERE user_id = ?`,
      [req.user.id]
    );
    const [[{ completed }]] = await pool.query(
      `SELECT COUNT(*) AS completed FROM ambassador_onboarding_tasks WHERE user_id = ? AND completed = 1`,
      [req.user.id]
    );
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return res.json({ total, completed, percentage });
  } catch (err) {
    console.error('[Ambassador onboarding progress error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getGuidelines = async (req, res) => {
  return res.json({
    guidelines: [
      {
        title: 'Platform Overview',
        content: 'E-Nyagasambu is Rwanda\'s leading online marketplace connecting buyers, sellers, renters, and service providers. As an ambassador, you represent the platform in your community.',
      },
      {
        title: 'Your Role',
        content: 'Your primary responsibilities include promoting the platform, recruiting suppliers and vendors, supporting new user onboarding, and conducting awareness campaigns.',
      },
      {
        title: 'Best Practices',
        items: [
          'Always represent the platform professionally and ethically',
          'Provide accurate information about E-Nyagasambu services',
          'Support new users through their first transactions',
          'Report any issues or concerns to the admin team promptly',
          'Attend regular training and update sessions',
        ],
      },
      {
        title: 'Commission Structure',
        content: 'You earn 200 RWF for each ambassador you refer who pays for their certificate. Additional rewards may be earned through recruitment targets and campaign milestones.',
      },
    ],
  });
};
