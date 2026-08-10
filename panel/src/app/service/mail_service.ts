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

  async sendCodeEmail(
    toEmail: string,
    code: string,
    scene: "register" | "reset" = "register"
  ): Promise<boolean> {
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

    const isReset = scene === "reset";
    const title = isReset ? "重置密码验证码" : "注册验证码";
    const actionText = isReset ? "重置密码" : "注册";

    try {
      const nodemailer = require("nodemailer");
      const port = smtpPort || 587;
      const isSecure = smtpSecure ?? (port === 465);

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure: isSecure,
        requireTLS: !isSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
      });

      const from = smtpFrom || smtpUser;
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: `[SY MCSManager] ${title}: ${code}`,
        text: `您在 SY MCSManager 面板的${actionText}验证码是: ${code}\n\n验证码 5 分钟内有效。\n\n如非本人操作，请忽略此邮件。`,
        html: `<div style="font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 24px; max-width: 480px;">
          <h2 style="color: #C59724; margin-bottom: 8px;">SY MCSManager</h2>
          <p style="color: #555;">您的${title}：</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 24px; background: #FCFAF5; text-align: center; border-radius: 10px; border: 1px solid #E8E0D0; margin: 16px 0; color: #292524;">
            ${code}
          </div>
          <p style="color: #999; font-size: 13px;">验证码 5 分钟内有效，请勿泄露。</p>
          <p style="color: #bbb; font-size: 12px;">如非本人操作，请忽略此邮件。</p>
        </div>`
      });

      logger.info(`[Mail] ${title} sent to ${toEmail}, messageId: ${info.messageId}`);
      return true;
    } catch (err: any) {
      logger.error(`[Mail] Failed to send email: ${err.message}`);
      logger.info(`[Mail] === ${title} for ${toEmail}: ${code} ===`);
      return false;
    }
  }

  // Send verification email via SMTP
  async sendVerificationCode(toEmail: string, code: string): Promise<boolean> {
    return this.sendCodeEmail(toEmail, code, "register");
  }

  async sendPasswordResetCode(toEmail: string, code: string): Promise<boolean> {
    return this.sendCodeEmail(toEmail, code, "reset");
  }
}

export default new MailService();
