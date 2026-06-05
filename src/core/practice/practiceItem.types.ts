import type { FeedbackResult } from "../drills/drill.types.js";

export type PracticeFeedbackInput = {
  userId: string;
  attemptId: string;
  drill: {
    promptRu: string;
  };
  feedback: FeedbackResult;
};

export type PracticeResult = "success" | "fail";
