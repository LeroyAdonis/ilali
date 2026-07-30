import { z } from "zod";

export const reviewSubmissionSchema = z.object({
  providerId: z.string().uuid("Invalid provider ID"),
  reviewerName: z.string().min(2, "Name must be at least 2 characters").max(100),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating max is 5"),
  content: z.string().min(10, "Review must be at least 10 characters").max(1000),
});

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
