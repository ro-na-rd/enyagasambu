const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendPasswordResetEmail(to, resetUrl) {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"E-Nyagasambu" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset Your Password - E-Nyagasambu',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
        <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="height:4px;background:linear-gradient(90deg,#0f1e42,#E85D04);"></div>
          <div style="padding:40px 32px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#E85D04,#E85D04cc);line-height:48px;font-size:20px;font-weight:900;color:#111;">E</div>
            </div>
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;text-align:center;">Reset Your Password</h1>
            <p style="margin:0 0 28px;font-size:14px;color:#666;text-align:center;">We received a request to reset the password for your E-Nyagasambu account.</p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#E85D04,#E85D04dd);color:#fff;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;letter-spacing:0.5px;">Reset Password</a>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#999;text-align:center;">This link expires in 1 hour.</p>
            <p style="margin:0 0 20px;font-size:13px;color:#999;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
            <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">&copy; ${new Date().getFullYear()} E-Nyagasambu Ltd. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
