require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const { logger } = require('./config/logger');

const WORKERS = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;
const ENABLE_SCHEDULERS = process.env.ENABLE_SCHEDULERS === 'true';

if (cluster.isPrimary) {
  logger.info('[Cluster] Master starting', {
    pid: process.pid,
    workers: WORKERS,
    cpus: os.cpus().length,
    schedulers: ENABLE_SCHEDULERS,
  });

  // Run background schedulers only in the master process so scheduled jobs
  // (expiry, reminders, auctions, payment reconciliation) are not duplicated
  // across every clustered HTTP worker.
  if (ENABLE_SCHEDULERS) {
    require('./services/renewalScheduler').startRenewalScheduler();
    require('./services/expiryScheduler').startExpiryScheduler();
    require('./services/reminderScheduler').startReminderScheduler();
    require('./services/auctionScheduler').startAuctionScheduler();
    require('./services/paymentReconciliationScheduler').startPaymentReconciliationScheduler();
    logger.info('[Cluster] Background schedulers running in master process');
  }

  for (let i = 0; i < WORKERS; i++) cluster.fork();

  cluster.on('online', (worker) => {
    logger.info('[Cluster] Worker online', { worker: worker.id, pid: worker.process.pid });
  });

  // Route socket.io broadcast messages between workers so real-time events
  // reach users connected to any worker instance.
  cluster.on('message', (worker, message) => {
    if (message && message.type === 'socket:broadcast') {
      for (const id in cluster.workers) {
        if (cluster.workers[id].id !== worker.id) {
          cluster.workers[id].send(message);
        }
      }
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.warn('[Cluster] Worker exited', {
      worker: worker.id,
      pid: worker.process.pid,
      code,
      signal,
      restarting: true,
    });
    // Auto-restart dead workers so capacity is maintained under load.
    cluster.fork();
  });

  cluster.on('disconnect', (worker) => {
    logger.info('[Cluster] Worker disconnected', { worker: worker.id, pid: worker.process.pid });
  });

  process.on('SIGTERM', () => {
    logger.info('[Cluster] Master received SIGTERM, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
    process.exit(0);
  });
} else {
  // Worker process: run the Express + Socket.IO HTTP server.
  require('./index');
}
