import { systemConfig } from "../setting";
import { logger } from "./log";

// Simple in-memory verification code store with expiry
interface CodeEntry {
  code: string;
  expiresAt: number;
}

class MailService {
  private codeStore: Map<string, CodeEntry> = new Map();

  // Clean expired codes periodically
  private cleanupTimer: NodeJS.Timeout | null = null;

  startCleanup() {
    // Clean expired codes every 60 seconds
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [email, entry] of this.codeStore) {
        if (now > entry.expiresAt) {
          this.codeStore.delete(email);
        }
      }
    }, 60000);
  }

  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Generate a 6-digit verification code
  generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Store a verification code for an email (valid for 5 minutes)
  storeCode(email: string, code: string): void {
    this.codeStore.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
  }

  // Verify a code for an email
  verifyCode(email: string, code: string): boolean {
    const entry = this.codeStore.get(email);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.codeStore.delete(email);
      return false;
    }
    if (entry.code !== code) return false;
    // Code used, delete it (one-time use)
    this.codeStore.delete(email);
    return true;
  }

  // Delete code for an email
  deleteCode(email: string): void {
    this.codeStore.delete(email);
  }

  // Send verification email via SMTP
  async sendVerificationCode(toEmail: string, code: string): Promise<boolean> {
    const cfg = systemConfig;
    if (!cfg?.smtpEnabled) {
      logger.warn("[Mail] SMTP not enabled, cannot send verification code");
      return false;
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, smtpSecure } = cfg;
    if (!smtpHost || !smtpUser || !smtpPass) {
      logger.warn("[Mail] SMTP config incomplete");
      return false;
    }

    // Use nodemailer if available, otherwise try direct SMTP
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpSecure ?? false,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        // Timeout
        connectionTimeout: 10000,
        greetingTimeout: 10000
      });

      const from = smtpFrom || smtpUser;
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: `MCSManager Verification Code: ${code}`,
        text: `Your MCSManager registration verification code is: ${code}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>MCSManager</h2>
          <p>Your verification code for registration is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f5f5f5; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #888;">This code will expire in 5 minutes.</p>
          <p style="color: #888;">If you did not request this code, please ignore this email.</p>
        </div>`
      });

      logger.info(`[Mail] Verification code sent to ${toEmail}, messageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`[Mail] Failed to send email: ${err.message}`);
      // Fallback: log the code to console so it can be used during testing
      logger.info(`[Mail] === VERIFICATION CODE for ${toEmail}: ${code} ===`);
      return false;
    }
  }
}

export default new MailService();
