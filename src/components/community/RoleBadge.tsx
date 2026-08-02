import { Crown, HeartHandshake, User } from "lucide-react";
import type { ClubMembershipRole } from "@/lib/db/types";

const ROLE_STYLES: Record<
  ClubMembershipRole,
  { label: string; icon: React.ReactNode; className: string }
> = {
  organizer: {
    label: "Organizer",
    icon: <Crown className="h-3 w-3" aria-hidden="true" />,
    className: "bg-sunset-100 text-sunset-600",
  },
  volunteer: {
    label: "Volunteer",
    icon: <HeartHandshake className="h-3 w-3" aria-hidden="true" />,
    className: "bg-ilali-100 text-ilali-700",
  },
  parent: {
    label: "Parent",
    icon: <User className="h-3 w-3" aria-hidden="true" />,
    className: "bg-paper-warm text-ink-soft",
  },
};

interface RoleBadgeProps {
  role: ClubMembershipRole | string;
}

/** Small role pill for club member directories and volunteer teasers. */
export default function RoleBadge({ role }: RoleBadgeProps) {
  const config =
    ROLE_STYLES[role as ClubMembershipRole] ?? ROLE_STYLES.parent;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
