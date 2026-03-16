const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: to,
        subject,
        message: html,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EmailJS send failed: ${text}`);
  }

  return { success: true };
}

export async function sendOtpEmail(to: string, otp: number, name?: string) {
  return sendEmail(
    to,
    "Your OTP Code - Total Spray Care",
    `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a3a3a;">Two-Factor Authentication</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>Your one-time verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a3a3a;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Total Spray Care</p>
      </div>
    `
  );
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  name?: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  return sendEmail(
    to,
    "Reset Your Password - Total Spray Care",
    `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a3a3a;">Password Reset</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #1a3a3a; color: white; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Total Spray Care</p>
      </div>
    `
  );
}

export async function sendTicketResolvedEmail(
  to: string,
  contactName: string,
  ticketNo: number,
  siteName: string,
  assetName: string,
  comment: string,
) {
  return sendEmail(
    to,
    `TSC #${ticketNo} - Your ticket has been resolved`,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Hi ${escapeHtml(contactName)},</p>
        <p>Your Total Spray Care Support Ticket <strong>#${ticketNo}</strong> has been marked as <strong>resolved</strong>.</p>
        <p>Please find details of the ticket below.</p>
        <p><strong>Site</strong>: ${escapeHtml(siteName)}</p>
        <p><strong>Asset</strong>: ${escapeHtml(assetName)}</p>
        <p><strong>Resolution Comment</strong>:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 10px 0;">
          ${escapeHtml(comment)}
        </div>
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Total Spray Care</p>
      </div>
    `
  );
}

export async function sendInviteEmail(
  to: string,
  authcode: string,
  inviterName?: string
) {
  const inviteUrl = `${APP_URL}/invite?email=${encodeURIComponent(to)}&token=${authcode}`;
  return sendEmail(
    to,
    "You're Invited to Total Spray Care",
    `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a3a3a;">You've Been Invited!</h2>
        <p>${inviterName ? `${inviterName} has` : "You've been"} invited you to join Total Spray Care.</p>
        <p>Click the button below to set up your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="background: #1a3a3a; color: white; padding: 12px 32px; border-radius: 10px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
        <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">Total Spray Care</p>
      </div>
    `
  );
}
