// pnpm add resend --filter @finmy/lib
import { Resend } from "resend";

export type ResendConfig = {
  apiKey: string;
  from: string;
};

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export function createResendClient(config: ResendConfig): {
  sendEmail(opts: EmailOptions): Promise<void>;
} {
  return {
    async sendEmail(opts: EmailOptions): Promise<void> {
      const client = new Resend(config.apiKey);
      const { error } = await client.emails.send({
        from: config.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo !== undefined ? { replyTo: opts.replyTo } : {}),
      });
      if (error) {
        throw new Error(`Email send failed: ${error.message}`);
      }
    },
  };
}
