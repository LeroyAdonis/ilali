import { IlaliSpinner } from "@/components/IlaliSpinner";

/**
 * Spinner preview — admin-only (guarded by /admin/layout.tsx).
 * Shows every size / variant / label combo plus a realistic
 * "background process" usage. Safe to delete once integrated.
 */
export default function SpinnerPreviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">
        IlaliSpinner preview
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        “The dot goes out to fetch” — the i-dot orbits the letter and completes
        the logo once per revolution. Use for any background process.
      </p>

      {/* Sizes × labels */}
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-faint">
          Sizes
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-10 rounded-xl border border-ink/10 bg-white p-8">
          <IlaliSpinner size="sm" label="Syncing…" />
          <IlaliSpinner size="md" label="Approving application…" />
          <IlaliSpinner size="lg" label="Crunching the posters" />
        </div>
      </section>

      {/* Bare mark, no label */}
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-faint">
          Bare mark (no label)
        </h2>
        <div className="mt-4 flex items-center gap-10 rounded-xl border border-ink/10 bg-white p-8">
          <IlaliSpinner size="sm" />
          <IlaliSpinner size="md" />
          <IlaliSpinner size="lg" />
        </div>
      </section>

      {/* Inverse variant on brand tile */}
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-faint">
          Inverse (on dark / teal)
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-10 rounded-xl bg-teal-deep p-8">
          <IlaliSpinner variant="inverse" size="sm" label="Saving…" />
          <IlaliSpinner variant="inverse" size="md" label="Uploading flyer…" />
          <IlaliSpinner variant="inverse" size="lg" label="Publishing" />
        </div>
      </section>

      {/* Realistic background-process usage */}
      <section className="mt-10">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-faint">
          Realistic usage — bulk action in progress
        </h2>
        <div className="relative mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="p-6">
            <div className="h-4 w-1/3 rounded bg-ink/5" />
            <div className="mt-3 h-4 w-2/3 rounded bg-ink/5" />
            <div className="mt-6 flex gap-2">
              <div className="h-8 w-24 rounded-lg bg-teal-deep/90" />
              <div className="h-8 w-24 rounded-lg bg-red-50" />
            </div>
          </div>
          {/* Overlay: spinner floats over the dimmed panel */}
          <div className="absolute inset-0 flex items-center justify-center bg-paper/80 backdrop-blur-[1px]">
            <IlaliSpinner label="Approving 3 applications…" />
          </div>
        </div>
      </section>

      <p className="mt-12 text-xs text-ink-faint">
        Respects <code className="rounded bg-ink/5 px-1 font-mono">prefers-reduced-motion</code> —
        the dot pulses in place instead of orbiting. Component:
        <code className="rounded bg-ink/5 px-1 font-mono">src/components/IlaliSpinner.tsx</code>
      </p>
    </div>
  );
}
