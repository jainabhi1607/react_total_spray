import { Resend } from "resend";

const RESEND_KEYS = [
  process.env.RESEND_API_KEY,
  process.env.RESEND_API_KEY1,
  process.env.RESEND_API_KEY2,
  process.env.RESEND_API_KEY3,
].filter(Boolean) as string[];

const FROM_EMAIL = "Total Spray Care <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendWithFallback(
  sendFn: (resend: Resend) => Promise<{ data: any; error: any }>
) {
  for (let i = 0; i < RESEND_KEYS.length; i++) {
    const resend = new Resend(RESEND_KEYS[i]);
    try {
      const { data, error } = await sendFn(resend);
      if (error) {
        // Rate limit error — try next key
        if (error.statusCode === 429 || error.message?.includes("rate limit")) {
          console.warn(`Resend key ${i} rate limited, trying next key...`);
          continue;
        }
        throw new Error(error.message || "Email send failed");
      }
      return data;
    } catch (err: any) {
      if (i === RESEND_KEYS.length - 1) throw err;
      console.warn(`Resend key ${i} failed: ${err.message}, trying next key...`);
    }
  }
  throw new Error("All Resend API keys exhausted");
}

export async function sendOtpEmail(to: string, otp: number, name?: string) {
  return sendWithFallback((resend) =>
    resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your OTP Code - Total Spray Care",
      html: `
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
      `,
    })
  );
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  name?: string
) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
  return sendWithFallback((resend) =>
    resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset Your Password - Total Spray Care",
      html: `
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
      `,
    })
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
  return sendWithFallback((resend) =>
    resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `TSC #${ticketNo} - Your ticket has been resolved`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hi ${contactName},</p>
          <p>Your Total Spraybooth Care Support Ticket <strong>#${ticketNo}</strong> has been marked as <strong>resolved</strong>.</p>
          <p>Please find details of the ticket below.</p>
          <p><strong>Site</strong>: ${siteName}</p>
          <p><strong>Asset</strong>: ${assetName}</p>
          <p><strong>Resolution Comment</strong>:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 10px; margin: 10px 0;">
            ${comment}
          </div>
          <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Total Spray Care</p>
        </div>
      `,
    })
  );
}

export async function sendInviteEmail(
  to: string,
  authcode: string,
  inviterName?: string
) {
  const inviteUrl = `${APP_URL}/invite?email=${encodeURIComponent(to)}&token=${authcode}`;
  return sendWithFallback((resend) =>
    resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "You're Invited to Total Spray Care",
      html: `
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
      `,
    })
  );
}
