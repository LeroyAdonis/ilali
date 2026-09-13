import { inngest } from './client'
import { sendEmail } from '@/lib/mail'

/**
 * Alert us when an ILALI AI call fails.
 *
 * ILALI's AI routes deliberately degrade instead of erroring (a parent sees a
 * friendly fallback), so without this nobody would notice the AI had stopped
 * answering. The function reports the failure and, when a recipient is
 * configured, emails it.
 */
export const aiFailureAlert = inngest.createFunction(
  {
    id: 'ai-failure-alert',
    triggers: [{ event: 'ilali/ai.failed' }],
    onFailure: async ({ error }) => {
      // A failed alert must itself be visible, otherwise this silently reports nothing.
      console.error('[inngest] aiFailureAlert failed:', error)
    },
  },
  async ({ event, step }) => {
    await step.run('report-ai-failure', async () => {
      const data = (event.data ?? {}) as {
        feature?: string
        errorMessage?: string
        model?: string
        entityId?: string
        at?: string
      }

      const summary = {
        source: 'ilali',
        feature: data.feature ?? 'unknown',
        model: data.model ?? 'unknown',
        errorMessage: data.errorMessage ?? 'unknown',
        entityId: data.entityId ?? null,
        at: data.at ?? new Date().toISOString(),
      }

      // Structured line FIRST: the ilali.co domain is not yet verified in Resend
      // (George's SPF record), so the email below can be rejected. This always lands.
      console.error('[ai-failure-alert]', JSON.stringify(summary))

      const to = process.env.AI_ALERT_EMAIL || 'leroyadonis3@gmail.com'
      const text = [
        'An ILALI AI call failed.',
        '',
        `Feature:   ${summary.feature}`,
        `Model:     ${summary.model}`,
        `Entity:    ${summary.entityId ?? 'n/a'}`,
        `Time:      ${summary.at}`,
        '',
        'Error:',
        summary.errorMessage,
      ].join('\n')

      const escape = (v: string) =>
        v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

      const html = [
        '<h2>ILALI AI call failed</h2>',
        '<table style="border-collapse:collapse;margin:16px 0">',
        `<tr><td style="padding:4px 12px;font-weight:bold">Feature</td><td style="padding:4px 12px">${escape(summary.feature)}</td></tr>`,
        `<tr><td style="padding:4px 12px;font-weight:bold">Model</td><td style="padding:4px 12px">${escape(summary.model)}</td></tr>`,
        `<tr><td style="padding:4px 12px;font-weight:bold">Entity</td><td style="padding:4px 12px">${escape(summary.entityId ?? 'n/a')}</td></tr>`,
        `<tr><td style="padding:4px 12px;font-weight:bold">Time</td><td style="padding:4px 12px">${escape(summary.at)}</td></tr>`,
        '</table>',
        '<h3>Error</h3>',
        `<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto">${escape(summary.errorMessage)}</pre>`,
      ].join('\n')

      const result = await sendEmail({
        to,
        subject: `[ILALI] AI call failed — ${summary.feature}`,
        text,
        html,
      })

      if ('skipped' in result) {
        console.warn('[ai-failure-alert] no RESEND_API_KEY — alert email skipped')
      } else if (result.sent === false) {
        console.warn('[ai-failure-alert] alert email not delivered:', result.error)
      }
    })
  }
)
