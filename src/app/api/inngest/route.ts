import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { aiFailureAlert } from '@/inngest/functions'

// Inngest Cloud calls this endpoint to discover and run our functions.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [aiFailureAlert],
})
