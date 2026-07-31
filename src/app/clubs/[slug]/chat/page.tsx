import { notFound } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getProviderBySlug, getClubMessages } from "@/lib/data-source";

/** Time-ago helper for the read-only message list. */
function timeAgo(d: Date): string {
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function ClubChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dbProvider = await getProviderBySlug(slug);
  if (!dbProvider) notFound();

  // CHAT SLOT — Task 4 mounts the interactive club chat component here
  // (send messages, replies). Until then we render a static, read-only
  // list of recent club messages from getClubMessages.
  const messages = await getClubMessages(dbProvider.id, 20);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Club chat</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chat with other parents and the club organizers. Interactive chat
          arrives soon — here&apos;s what&apos;s been said recently.
        </p>
      </div>

      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ilali-100 to-sunset-100 text-xs font-bold text-ilali-700">
                  {(msg.senderName ?? "?").charAt(0)}
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {msg.senderName ?? "Club member"}
                </p>
                <span className="ml-auto text-xs text-slate-400">
                  {msg.createdAt ? timeAgo(msg.createdAt) : "—"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <MessageSquare
            className="mx-auto h-8 w-8 text-slate-400"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-slate-600">
            No messages yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Club conversations will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
