export interface AiSuggestedAsset {
  assetId: string;
  title: string;
  thumbnailUrl?: string | null;
  relevanceScore?: number | null;
}

export interface AiMessage {
  id: string;
  role: string;
  content: string;
  xuCharged: number;
  createdAt: string;
  suggestedAssets?: AiSuggestedAsset[] | null;
}

export interface AiSessionListItem {
  id: string;
  title: string;
  totalXuUsed: number;
  isArchived: boolean;
  updatedAt: string;
}

export interface AiSessionDetail {
  id: string;
  title: string;
  isArchived: boolean;
  messages: AiMessage[];
}

export interface SendAiMessageResult {
  userMessage: AiMessage;
  assistantMessage: AiMessage;
  walletBalance: number;
  isUnlimited: boolean;
}
