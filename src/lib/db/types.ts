export type ProviderStatus = "pending" | "contacted" | "approved" | "rejected";
export type UserRole = "parent" | "provider" | "admin";

export type ChildProfile = {
  id: string;
  parentId: string;
  name: string;
  age: number;
  interests: string[] | null;
  availability: { days: string[]; timeSlots: string[] } | null;
  suburb: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationPreferences = {
  id: string;
  userId: string;
  notifyNewProviders: boolean;
  notifyCommunity: boolean;
  notifyRewards: boolean;
  notifyBookings: boolean;
  notifyReminders: boolean;
  notifyDigest: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ── Community Layer ──

export type ClubEventType = "practice" | "game" | "event" | "other";

export type ClubEvent = {
  id: string;
  providerId: string;
  title: string;
  eventType: ClubEventType;
  startTime: Date;
  endTime: Date | null;
  location: string | null;
  createdAt: Date;
};

export type ClubMembershipRole = "parent" | "volunteer" | "organizer";
export type ClubMembershipStatus = "active" | "inactive";

export type ClubMembership = {
  id: string;
  providerId: string;
  parentId: string;
  childIds: string[];
  role: ClubMembershipRole;
  status: ClubMembershipStatus;
  invitedBy: string | null;
  joinedAt: Date;
};

export type RideDirection = "to" | "from";
export type RideRequestStatus = "open" | "claimed" | "completed";

export type RideRequest = {
  id: string;
  eventId: string;
  parentId: string;
  childId: string;
  direction: RideDirection;
  status: RideRequestStatus;
  claimedBy: string | null;
  requesterConfirmed: boolean;
  claimerConfirmed: boolean;
  createdAt: Date;
};

export type ClubMessage = {
  id: string;
  clubId: string;
  senderId: string;
  content: string;
  createdAt: Date;
};

// ── Rewards ──

export type RewardPoint = {
  id: string;
  userId: string;
  amount: number;
  action: string;
  referenceId: string | null;
  createdAt: Date;
};

export type RewardRedemption = {
  id: string;
  userId: string;
  pointsSpent: number;
  rewardType: string;
  providerId: string | null;
  createdAt: Date;
};

// ── Community Contributions ──

export type ContributionType =
  | "venue-help"
  | "event-support"
  | "community-building"
  | "knowledge-sharing"
  | "outreach";

export type ContributionStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "flagged";

export type ContributionValidationPath = "leader" | "peer";

export type CommunityContribution = {
  id: string;
  userId: string;
  clubId: string;
  type: ContributionType;
  description: string | null;
  points: number;
  validationPath: ContributionValidationPath;
  status: ContributionStatus;
  confirmedBy: string | null;
  createdAt: Date;
  confirmedAt: Date | null;
};

export type ContributionVouch = {
  id: string;
  contributionId: string;
  voucherId: string;
  createdAt: Date;
};

export type ReputationTier = "newcomer" | "trusted" | "elder";

export type ClubHealth = "green" | "yellow" | "red";

// ── Provider Portal ──

export type ProviderInquiry = {
  id: string;
  providerId: string;
  query: string;
  parentId: string | null;
  matchedAt: Date;
};

export type ReviewReply = {
  id: string;
  reviewId: string;
  providerId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
