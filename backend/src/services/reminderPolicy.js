const SIX_HOURS_WINDOW = { min: 5, max: 7.5 };
const TWO_HOURS_WINDOW = { min: 0, max: 2.5 };

function classifyReminderTier({ hoursLeft, reminder6hSent, reminder2hSent }) {
  if (!Number.isFinite(hoursLeft) || hoursLeft <= 0) return null;

  const within = (w) => hoursLeft >= w.min && hoursLeft <= w.max;

  if (!reminder2hSent && within(TWO_HOURS_WINDOW)) return 2;
  if (!reminder6hSent && within(SIX_HOURS_WINDOW)) return 6;
  return null;
}

function buildReminderMessages(title, expiresAt, tier) {
  const when = tier === 2 ? 'in about 2 hours' : 'in about 6 hours';
  const expiry = new Date(expiresAt).toUTCString();
  const sms = `E-Nyagasambu: Your listing "${title}" expires ${when} (${expiry}). Repost it to stay visible to buyers.`;
  const subject = `Your listing "${title}" expires soon`;
  const message = `Your listing expires ${when} (${expiry}). Repost to keep it live.`;
  const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="height:4px;background:linear-gradient(90deg,#0f1e42,#E85D04);"></div>
          <div style="padding:40px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;text-align:center;">Your Listing Expires Soon</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#666;text-align:center;">${title}</p>
            <p style="margin:0 0 20px;font-size:14px;color:#666;text-align:center;">This listing expires <strong>${when}</strong> on ${expiry}.</p>
            <p style="margin:0 0 20px;font-size:14px;color:#666;text-align:center;">Repost it from your My Listings page to keep it visible to buyers.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">&copy; ${new Date().getFullYear()} E-Nyagasambu Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  return { sms, subject, message, html };
}

module.exports = { classifyReminderTier, buildReminderMessages, SIX_HOURS_WINDOW, TWO_HOURS_WINDOW };
