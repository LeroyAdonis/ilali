import PosterImportClient from "./poster-import-client";

export const dynamic = "force-dynamic";

export default function PosterImportPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <PosterImportClient />
    </main>
  );
}
