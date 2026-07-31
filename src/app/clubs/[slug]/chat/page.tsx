import { notFound } from "next/navigation";
import ClubChat from "@/components/chat/ClubChat";
import { getProviderBySlug } from "@/lib/data-source";

export default async function ClubChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Club chat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chat with other parents and the club organizers.
        </p>
      </div>

      {/* CHAT SLOT — live polling club chat (Task 4) */}
      <ClubChat clubId={dbProvider.id} clubName={dbProvider.name} />
    </div>
  );
}
