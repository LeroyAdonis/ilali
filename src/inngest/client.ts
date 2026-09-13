import { Inngest } from "inngest";

/**
 * ILALI Inngest client.
 *
 * Event key fallback: the SDK reads `INNGEST_EVENT_KEY` and
 * `INNGEST_SIGNING_KEY` from the environment at send/serve time. Local dev can
 * set `INNGEST_DEV=1` to target a local dev server instead of Inngest Cloud.
 */
export const inngest = new Inngest({ id: "ilali" });