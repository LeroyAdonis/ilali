import { inngest } from '@/inngest/client'

/**
 * Report an AI call failure to Inngest so the `aiFailureAlert` function can
 * notify us and the run shows up in the Inngest dashboard with its retries.
 *
 * Contract: this MUST NEVER THROW and must never make a caller fail. Every
 * ILALI AI route degrades gracefully (it returns a friendly fallback instead of
 * erroring), so the failure is invisible to the user — this is the only signal
 * that the AI quietly stopped working.
 */
export async function reportAiFailure(payload: {
  feature: string
  errorMessage: string
  model?: string
  entityId?: string
}) {
  try {
    if (!process.env.INNGEST_EVENT_KEY) {
      console.warn('[ai-failure] INNGEST_EVENT_KEY not set — skipping event send')
      return
    }

    await inngest.send({
      name: 'ilali/ai.failed',
      data: { ...payload, at: new Date().toISOString() },
    })
  } catch (err) {
    // A broken alert must never break the request that was already degrading.
    console.error('[ai-failure] failed to send Inngest event:', err)
  }
}
