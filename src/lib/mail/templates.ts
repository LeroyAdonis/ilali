/**
 * ILALI notification templates — Painless Journeys Phase 3 (FR-6).
 *
 * Pure render functions: each takes a payload (context) and returns
 * { subject, text, html } in the ILALI voice — warm, human, no "Dear User".
 * Every field is OPTIONAL: templates degrade gracefully to a sensible
 * fallback so a missing childName/date/link never produces "undefined" or a
 * broken email. No side effects, no imports of the send layer.
 */

export type NotificationPayload = Record<string, unknown>;

export type NotificationType =
  | "saved"
  | "booking-confirmed"
  | "reminder-24h"
  | "review-nudge"
  | "digest-weekly"
  | "digest-monthly"
  | "provider-status"
  | "first-booking";

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

// ── Defensive string helpers ──

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** First non-empty string among candidates (allows "0"). */
function pick(...values: unknown[]): string {
  for (const v of values) {
    const s = str(v);
    if (s !== "") return s;
  }
  return "";
}

// ── HTML shell shared by every template (inline styles — mobile-safe) ──

function emailShell(heading: string, bodyHtml: string): string {
  return `<div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #0d9488;">${heading}</h2>
  ${bodyHtml}
  <p style="font-size: 13px; color: #6b7280; margin-top: 32px;">You're getting this because of your ILALI account. Manage your notifications any time from your profile settings.</p>
  <p>The ILALI Team</p>
</div>`;
}

function ctaButton(label: string, url: string): string {
  if (!url) return "";
  return `<p style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: bold;">${label}</a>
  </p>`;
}

function linesHtml(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("\n  ");
}

// ── saved ──
// "Notify me when booking opens" — user clicked notify-me, transactional.

function savedTemplate(payload: NotificationPayload): RenderedEmail {
  const activityName = pick(payload.activityName, payload.providerName) || "this activity";
  const providerName = pick(payload.providerName, payload.activityName) || "this provider";
  const childName = str(payload.childName);
  const link = str(payload.link);

  const subject = `You're on the list for ${activityName} 🎉`;
  const childLine = childName ? ` for ${childName}` : "";

  const text = `You're on the list for ${activityName}${childLine}!

We'll email you the moment booking opens — no need to keep checking.
${link ? `\nMeanwhile, here's the activity: ${link}\n` : ""}
If you'd rather not wait, ${providerName} is happy to hear from you directly.

The ILALI Team`;

  const html = emailShell(
    `You're on the list 🎉`,
    `${linesHtml([
      `You're on the list for <strong>${activityName}</strong>${childLine ? ` for <strong>${childName}</strong>` : ""}!`,
      "We'll email you the moment booking opens — no need to keep checking.",
    ])}
  ${ctaButton("View activity", link)}
  <p>If you'd rather not wait, ${providerName} is happy to hear from you directly.</p>`
  );

  return { subject, text, html };
}

// ── booking-confirmed ──
// Fired when a booking lands (WS-6). Stubbed until Paystack booking exists.

function bookingConfirmedTemplate(payload: NotificationPayload): RenderedEmail {
  const activityName = pick(payload.activityName, payload.providerName) || "your activity";
  const providerName = pick(payload.providerName, payload.activityName) || "your provider";
  const childName = str(payload.childName);
  const date = str(payload.date);
  const time = str(payload.time);
  const location = str(payload.location);
  const link = str(payload.link);

  const subject = `Your spot at ${activityName} is confirmed ✓`;
  const who = childName ? `${childName}'s` : "Your";

  const when = [date, time].filter((x) => x !== "").join(" at ");
  const whenLine = when ? `\nWhen:    ${when}` : "";
  const whereLine = location ? `\nWhere:   ${location}` : "";

  const text = `Great news — ${who} spot at ${activityName} with ${providerName} is confirmed.${whenLine}${whereLine}
${link ? `\nFull details: ${link}\n` : ""}
See you there!
The ILALI Team`;

  const paragraphs: string[] = [
    `Great news — <strong>${who} spot at ${activityName}</strong> with ${providerName} is confirmed.`,
  ];
  if (date) paragraphs.push(`<strong>When:</strong> ${when}`);
  if (location) paragraphs.push(`<strong>Where:</strong> ${location}`);

  const html = emailShell(
    `Your spot is confirmed ✓`,
    `${linesHtml(paragraphs)}
  ${ctaButton("View booking", link)}`
  );

  return { subject, text, html };
}

// ── reminder-24h ──
// "Reminder: [activity] tomorrow at [time] — here's what to bring"

function reminder24hTemplate(payload: NotificationPayload): RenderedEmail {
  const activityName = pick(payload.activityName, payload.providerName) || "your activity";
  const providerName = pick(payload.providerName, payload.activityName) || "your provider";
  const childName = str(payload.childName);
  const time = str(payload.time);
  const location = str(payload.location);
  const whatToBring = str(payload.whatToBring);
  const link = str(payload.link);

  const subject = time
    ? `Reminder: ${activityName} tomorrow at ${time}`
    : `Reminder: ${activityName} is tomorrow`;
  const forChild = childName ? ` for <strong>${childName}</strong>` : "";
  const bringLine = whatToBring ? `Here's what to bring: ${whatToBring}.` : "Double-check the details below.";
  const whereLine = location ? ` at ${location}` : "";

  const text = `Quick reminder — ${activityName} is on tomorrow${time ? ` at ${time}` : ""}${forChild.replace(/<[^>]+>/g, "")} with ${providerName}${location ? `, ${location}` : ""}.

${bringLine}
${link ? `\nEverything you need: ${link}` : ""}

Have a great time!
The ILALI Team`;

  const html = emailShell(
    `See you tomorrow 👋`,
    `${linesHtml([
      `Quick reminder — <strong>${activityName}</strong> is on tomorrow${time ? ` at <strong>${time}</strong>` : ""}${forChild} with ${providerName}${whereLine}.`,
      bringLine,
    ])}
  ${ctaButton("Full details", link)}`
  );

  return { subject, text, html };
}

// ── review-nudge ──
// Post-activity: "How was [activity]? Tell other parents"

function reviewNudgeTemplate(payload: NotificationPayload): RenderedEmail {
  const activityName = pick(payload.activityName, payload.providerName) || "your activity";
  const providerName = pick(payload.providerName, payload.activityName) || "your provider";
  const childName = str(payload.childName);
  const link = str(payload.link);

  const subject = `How was ${activityName}?`;
  const forChild = childName ? `${childName} had a` : "You had";

  const text = `Hope ${childName ? `${childName} had a` : "you had a"} great time at ${activityName} with ${providerName}.

Parents trust other parents — take 30 seconds and tell them how it went:
${link ? link + "\n" : ""}
It helps ${providerName} grow and helps the next parent choose.

The ILALI Team`;

  const html = emailShell(
    `How was it? 💬`,
    `${linesHtml([
      `Hope ${forChild} great time at <strong>${activityName}</strong> with ${providerName}.`,
      "Parents trust other parents — take 30 seconds and tell them how it went. It helps the provider grow and helps the next parent choose.",
    ])}
  ${ctaButton("Leave a review", link)}`
  );

  return { subject, text, html };
}

// ── provider-status ──
// Draft → Submitted → Reviewing → Live. Friendly label per status.

function providerStatusLabel(status: string): { from: string; to: string } {
  switch (status) {
    case "submitted":
      return { from: "Draft", to: "Submitted" };
    case "reviewing":
      return { from: "Submitted", to: "Reviewing" };
    case "live":
      return { from: "Reviewing", to: "Live" };
    case "rejected":
      return { from: "Reviewing", to: "Not accepted" };
    default:
      return { from: "Submitted", to: "Updated" };
  }
}

function providerStatusTemplate(payload: NotificationPayload): RenderedEmail {
  const providerName = pick(payload.providerName, payload.activityName) || "your activity";
  const activityName = pick(payload.activityName, payload.providerName);
  const status = str(payload.status || "live").toLowerCase();
  const link = pick(payload.link, payload.dashboardUrl);
  const { from, to } = providerStatusLabel(status);

  const isLive = status === "live";
  const isRejected = status === "rejected";

  const subject = isLive
    ? `You're live on ILALI! 🎉`
    : isRejected
      ? `An update on your ILALI application`
      : `Your ILALI listing: ${from} → ${to}`;

  const statusLine = `Your listing${activityName ? ` — ${activityName}` : ""} went from ${from} to ${to}.`;

  const text = `${providerName}, here's where your listing stands:

  ${statusLine}

${
  isLive
    ? `Share your link with parents and start filling those spots!
  ${link || appUrlFallback()}`
    : isRejected
      ? `Not the news we hoped to share — reply to this email and we'll help you get unstuck.`
      : `We'll take it from here.${link ? ` Follow along here: ${link}` : ""}`
}
The ILALI Team`;

  const html = emailShell(
    isLive ? `You're live! 🎉` : `Your listing just moved`,
    `${linesHtml([
      `${providerName}, here's where your listing stands: <strong>${statusLine}</strong>`,
      isLive
        ? "Share your link with parents and start filling those spots!"
        : isRejected
          ? "Not the news we hoped to share — reply to this email and we'll help you get unstuck."
          : "We'll take it from here.",
    ])}
  ${isLive ? ctaButton("Go to your dashboard", link || appUrlFallback()) : ctaButton("Follow along", link)}`
  );

  return { subject, text, html };
}

// ── first-booking ──
// Provider celebration + next steps (fired when the first booking lands, WS-6).

function firstBookingTemplate(payload: NotificationPayload): RenderedEmail {
  const providerName = pick(payload.providerName) || "provider";
  const activityName = pick(payload.activityName) || "your activity";
  const childName = str(payload.childName);
  const date = str(payload.date);
  const link = str(payload.link);

  const subject = "Your first booking on ILALI! 🎉";
  const who = childName ? `${childName} is coming for ${activityName}` : `Someone booked ${activityName}`;
  const whenLine = date ? ` on ${date}` : "";

  const text = `You did it, ${providerName} — your first booking on ILALI. 🎉

${who}${whenLine}. Here's what to do next:

1. Confirm the details with the parent
2. Add it to your schedule
3. Keep your listing up to date so it keeps working for you
${link ? `\nManage it all here: ${link}` : ""}

Here's to many more!
The ILALI Team`;

  const html = emailShell(
    `Your first booking! 🎉`,
    `${linesHtml([
      `You did it, <strong>${providerName}</strong> — your first booking on ILALI.`,
      `<strong>${who}${whenLine}</strong>. Here's what to do next:`,
    ])}
  <ol>
    <li>Confirm the details with the parent</li>
    <li>Add it to your schedule</li>
    <li>Keep your listing up to date so it keeps working for you</li>
  </ol>
  ${ctaButton("Go to your dashboard", link)}`
  );

  return { subject, text, html };
}

// ── digest-weekly ──
// Provider: views / enquiries / bookings — simple, no analytics overload.

function digestWeeklyTemplate(payload: NotificationPayload): RenderedEmail {
  const providerName = pick(payload.providerName) || "provider";
  const views = str(payload.views) || "0";
  const enquiries = str(payload.enquiries) || "0";
  const bookings = str(payload.bookings) || "0";
  const link = str(payload.link);

  const subject = `Your ILALI week: ${enquiries} new ${enquiries === "1" ? "enquiry" : "enquiries"}`;

  const text = `Here's your week on ILALI, ${providerName}:

  Views:      ${views}
  Enquiries:  ${enquiries}
  Bookings:   ${bookings}

${link ? `Keep the momentum going — check your listing: ${link}` : "Keep the momentum going — check your listing on ILALI."}

The ILALI Team`;

  const html = emailShell(
    `Your week on ILALI 📊`,
    `<table style="border-collapse: collapse; margin: 16px 0; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 8px 16px; width: 100%;">
      <tr><td style="padding: 6px 12px; color: #0f766e;">Views</td><td style="padding: 6px 12px; text-align: right; font-weight: bold;">${views}</td></tr>
      <tr><td style="padding: 6px 12px; color: #0f766e;">Enquiries</td><td style="padding: 6px 12px; text-align: right; font-weight: bold;">${enquiries}</td></tr>
      <tr><td style="padding: 6px 12px; color: #0f766e;">Bookings</td><td style="padding: 6px 12px; text-align: right; font-weight: bold;">${bookings}</td></tr>
    </table>
  <p>Keep the momentum going — check your listing.</p>
  ${ctaButton("Open ILALI", link)}`
  );

  return { subject, text, html };
}

// ── digest-monthly ──
// Parent: "New things for your kids near [suburb]".

function digestMonthlyTemplate(payload: NotificationPayload): RenderedEmail {
  const parentName = str(payload.parentName);
  const suburb = pick(payload.suburb, payload.location) || "you";
  const itemCount = str(payload.itemCount);
  const link = str(payload.link);

  const subject = `New things for your kids near ${suburb}`;
  const greeting = parentName ? `Hi ${parentName},` : "Hi there,";
  const countLine = itemCount
    ? `There ${itemCount === "1" ? "is a new activity" : `are ${itemCount} new activities`} for your kids near ${suburb}.`
    : `There are new things for your kids near ${suburb}.`;

  const text = `${greeting}

${countLine}

${link ? `Take a look: ${link}` : "Browse activities on ILALI."}

The ILALI Team`;

  const html = emailShell(
    `New things for your kids 🧡`,
    `${linesHtml([greeting, `${countLine} Take a peek and see what catches their eye.`])}
  ${ctaButton("Explore activities", link)}`
  );

  return { subject, text, html };
}

// ── Dispatch ──

const TEMPLATES: Record<NotificationType, (p: NotificationPayload) => RenderedEmail> = {
  saved: savedTemplate,
  "booking-confirmed": bookingConfirmedTemplate,
  "reminder-24h": reminder24hTemplate,
  "review-nudge": reviewNudgeTemplate,
  "digest-weekly": digestWeeklyTemplate,
  "digest-monthly": digestMonthlyTemplate,
  "provider-status": providerStatusTemplate,
  "first-booking": firstBookingTemplate,
};

/** Render a notification by state-machine type. Returns null for unknown types. */
export function renderNotificationEmail(
  type: string,
  payload: NotificationPayload
): RenderedEmail | null {
  const render = TEMPLATES[type as NotificationType];
  return render ? render(payload) : null;
}

// ── Small shared URL fallback (kept local — mirrors mail/index appUrl) ──

function appUrlFallback(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ilali.vercel.app").replace(/\/+$/, "");
}
