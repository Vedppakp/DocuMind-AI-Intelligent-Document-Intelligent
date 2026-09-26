const nodemailer = require('nodemailer');

/**
 * Configure email transporter if SMTP credentials are provided in environment variables.
 * Supports:
 * - GMAIL_USER & GMAIL_PASS (or App Password)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
function createTransporter() {
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

/**
 * Send 6-digit password reset verification code to user email.
 * If no SMTP is configured, logs to console and returns simulated status.
 */
async function sendPasswordResetEmail(email, name, code) {
  const transporter = createTransporter();

  console.log(`\n=======================================================`);
  console.log(`🔑 [DocuMind AI] PASSWORD RESET VERIFICATION CODE`);
  console.log(`📨 Recipient:   ${name} <${email}>`);
  console.log(`🔢 Code:        ${code}`);
  console.log(`⏰ Expiration:  15 minutes`);
  console.log(`=======================================================\n`);

  if (!transporter) {
    return {
      success: true,
      simulated: true,
      message: 'SMTP not configured. Verification code logged to server console and available in dev mode.',
    };
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 800;">DocuMind AI</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Intelligent PDF Document Assistant</p>
      </div>

      <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
        <p style="font-size: 14px; color: #e2e8f0; margin-top: 0;">Hello <strong>${name || 'Researcher'}</strong>,</p>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
          We received a request to reset your password for your registered DocuMind AI account (<strong>${email}</strong>).
        </p>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5;">
          Use the following 6-digit verification code to complete your password reset:
        </p>

        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #4f46e5, #6366f1); border-radius: 10px; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #ffffff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
            ${code}
          </div>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0; text-align: center;">
          ⏱️ This code will expire in <strong>15 minutes</strong>.
        </p>
      </div>

      <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
        If you did not request this password reset, please ignore this email. Your password will remain unchanged.
      </p>
    </div>
  `;

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@documind.ai';
    await transporter.sendMail({
      from: `"DocuMind AI Security" <${fromAddress}>`,
      to: email,
      subject: `Your DocuMind AI Password Reset Code: ${code}`,
      text: `Hello ${name || ''},\n\nYour 6-digit verification code to reset your DocuMind AI password is: ${code}\n\nThis code is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: htmlContent,
    });

    console.log(`[DocuMind AI] ✉️ Real email sent successfully to ${email}`);
    return { success: true, simulated: false };
  } catch (error) {
    console.warn(`[DocuMind AI] Failed to send live email via SMTP:`, error.message);
    return {
      success: true,
      simulated: true,
      error: error.message,
    };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
