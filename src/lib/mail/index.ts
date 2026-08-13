import { Resend } from "resend";

/**
 * ILALI transactional email (WS-2).
 *
 * Thin, lazy Resend wrapper. EMAIL IS OPTIONAL AND NEVER BLOCKING:
 * - If RESEND_API_KEY is not set, every function logs a console.warn and
 *   returns { skipped: true } — callers must treat that as "email not sent",
 *   never as a failure of the surrounding flow (e.g. the admin approval).
 * - The Resend client is created lazily on first send, so importing this
 *   module never throws and never touches the network at module load.
 * - Send errors (unverified domain, bad key, network) are caught and returned
 *   as { sent: false, error } — they never throw into the caller.
 *
 * NOTE: ilali.co domain verification in Resend is PENDING (George's side —
 * Google Workspace domain, SPF record still missing). Until it lands, sends
 * will be rejected by Resend with a domain error and the admin approval flow
 * falls back to copying the temp password manually, exactly as before.
 */

export type MailResult =
  | { skipped: true }
  | { sent: true; id?: string }
  | { sent: false; error: string };

const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@ilali.co";

/** Public app URL used in email bodies (trailing slash trimmed). */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ilali.vercel.app").replace(/\/+$/, "");
}

let resendClient: Resend | null = null;

/** Lazy-init the Resend client. Returns null when RESEND_API_KEY is unset. */
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

async function sendEmail(payload: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<MailResult> {
  const client = getResend();
  if (!client) {
    console.warn(`[mail] RESEND_API_KEY not set — skipping "${payload.subject}" to ${payload.to}`);
    return { skipped: true };
  }
  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    if (error) {
      console.warn(
        `[mail] Resend rejected "${payload.subject}" to ${payload.to}:`,
        (error as { message?: string }).message ?? error
      );
      return { sent: false, error: (error as { message?: string }).message ?? String(error) };
    }
    return { sent: true, id: data?.id };
  } catch (e) {
    // Network errors / SDK throws — never let this bubble to the caller's flow.
    console.warn(`[mail] Send failed for "${payload.subject}" to ${payload.to}:`, e);
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Welcome email sent to a provider whose application was just approved.
 * Contains their temp password + first-login instructions.
 *
 * The temp password has NO expiry in the codebase — the provider is simply
 * forced to set a new password + recovery passphrase on first login
 * (passwordResetRequired=true, handled by /api/auth/create-password).
 */
export function sendProviderWelcomeEmail({
  to,
  providerName,
  tempPassword,
}: {
  to: string;
  providerName: string;
  tempPassword: string;
}): Promise<MailResult> {
  const subject = "Welcome to ILALI — your provider account is ready";
  const signInUrl = `${appUrl()}/auth/signin`;

  const text = `Hi ${providerName},

Great news — your ILALI provider account has been created.

Your sign-in details:
  Email:          ${to}
  Temp password:  ${tempPassword}

Sign in here: ${signInUrl}

On your first sign-in you'll be asked to:
  1. Create a new password (at least 8 characters), and
  2. Create a recovery passphrase (3 or more words, e.g. "green elephant dances quietly").

Your temp password must be changed on first login — it stops working as soon as
you set your own password. There is no expiry, so don't stress about timing.

If you ever forget your password, go to ${appUrl()}/auth/forgot-password and enter
your email plus your recovery passphrase — no reset codes or links needed.

Welcome aboard!
The ILALI Team`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #0d9488;">Welcome to ILALI</h2>
  <p>Hi ${providerName},</p>
  <p>Great news — your ILALI provider account has been created. Here are your sign-in details:</p>
  <table style="border-collapse: collapse; margin: 16px 0; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px 16px; width: 100%;">
    <tr><td style="padding: 6px 12px; font-weight: bold; color: #0f766e;">Email</td><td style="padding: 6px 12px;">${to}</td></tr>
    <tr><td style="padding: 6px 12px; font-weight: bold; color: #0f766e;">Temp password</td><td style="padding: 6px 12px; font-family: monospace; font-weight: bold;">${tempPassword}</td></tr>
  </table>
  <p>Sign in here: <a href="${signInUrl}" style="color: #0d9488;">${signInUrl}</a></p>
  <p>On your first sign-in you'll be asked to create a <strong>new password</strong> (at least 8 characters) and a <strong>recovery passphrase</strong> (3 or more words, e.g. "green elephant dances quietly"). Your temp password must be changed on first login — it stops working once you set your own password.</p>
  <p>If you ever forget your password, go to <a href="${appUrl()}/auth/forgot-password" style="color: #0d9488;">${appUrl()}/auth/forgot-password</a> and enter your email plus your recovery passphrase — no reset codes or links needed.</p>
  <p>Welcome aboard!<br/>The ILALI Team</p>
</div>`;

  return sendEmail({ to, subject, text, html });
}

/**
 * Magic-link sign-in email (email-first auth, WS-1 "Painless Journeys").
 * Contains the one-tap link; no passwords or secrets beyond the short-lived
 * single-use token. Safe to send from the Better Auth magicLink plugin's
 * sendMagicLink hook — never throws, returns the standard MailResult.
 */
export function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}): Promise<MailResult> {
  const subject = "Your ILALI sign-in link";

  const text = `Hi there,

You're one tap away from ILALI.

Open this link to sign in (it works once and expires in 5 minutes):
${url}

If you didn't ask for this link, you can safely ignore this email.

The ILALI Team`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #0d9488;">You're one tap away 🎉</h2>
  <p>Hi there,</p>
  <p>Click the button below to continue to ILALI. This link works once and expires in <strong>5 minutes</strong>.</p>
  <p style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">Continue to ILALI</a>
  </p>
  <p style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br/><a href="${url}" style="color: #0d9488;">${url}</a></p>
  <p style="font-size: 13px; color: #6b7280;">If you didn't ask for this link, you can safely ignore this email.</p>
  <p>The ILALI Team</p>
</div>`;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Welcome email sent to a brand-new user right after their first magic-link
 * sign-up. Warm, human, no "Dear User". Non-blocking by design — never throws.
 */
export function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<MailResult> {
  const subject = "Welcome to ILALI 👋";
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const text = `${greeting}

Welcome to ILALI — the easiest way to find amazing activities for your kids in Cape Town.

You can browse, search and match with activities whenever you like. We'll keep you posted about anything you save or book — nothing spammy, promise.

Start exploring: ${appUrl()}/browse

The ILALI Team`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #0d9488;">Welcome to ILALI 👋</h2>
  <p>${greeting}</p>
  <p>Welcome to ILALI — the easiest way to find amazing activities for your kids in Cape Town.</p>
  <p>You can browse, search and AI-match activities whenever you like. We'll keep you posted about anything you save or book — nothing spammy, promise.</p>
  <p style="margin: 24px 0; text-align: center;">
    <a href="${appUrl()}/browse" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">Start exploring</a>
  </p>
  <p>The ILALI Team</p>
</div>`;

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Informational password-reset email. The existing forgot-password flow is
 * fully passphrase-based (no codes/tokens/emails) — this email just reminds
 * the provider where to go and what they'll need. Safe to fire from anywhere
 * (e.g. an admin-assisted reset); it contains no secrets.
 */
export function sendPasswordResetEmail({
  to,
  providerName,
}: {
  to: string;
  providerName: string;
}): Promise<MailResult> {
  const subject = "Reset your ILALI provider password";
  const forgotUrl = `${appUrl()}/auth/forgot-password`;

  const text = `Hi ${providerName},

Did you forget your ILALI provider password? No problem — ILALI uses
passphrase-based recovery, so there are no reset codes or links to wait for.

1. Go to ${forgotUrl}
2. Enter your email address
3. Enter your recovery passphrase (the 3+ word phrase you chose when you set up your account)
4. Choose a new password and a new recovery passphrase

If you've forgotten your recovery passphrase too, contact the ILALI team for help.

The ILALI Team`;

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #0d9488;">Reset your ILALI provider password</h2>
  <p>Hi ${providerName},</p>
  <p>Did you forget your ILALI provider password? No problem — ILALI uses passphrase-based recovery, so there are no reset codes or links to wait for.</p>
  <ol>
    <li>Go to <a href="${forgotUrl}" style="color: #0d9488;">${forgotUrl}</a></li>
    <li>Enter your email address</li>
    <li>Enter your recovery passphrase (the 3+ word phrase you chose when you set up your account)</li>
    <li>Choose a new password and a new recovery passphrase</li>
  </ol>
  <p>If you've forgotten your recovery passphrase too, contact the ILALI team for help.</p>
  <p>The ILALI Team</p>
</div>`;

  return sendEmail({ to, subject, text, html });
}
