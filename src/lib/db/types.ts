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
  createdAt: Date;
  updatedAt: Date;
};
