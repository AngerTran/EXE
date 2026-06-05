import { apiRequest } from "./client";
import type {
  AiSessionDetail,
  AiSessionListItem,
  SendAiMessageResult,
} from "./types/ai";

export async function fetchAiSessions(): Promise<AiSessionListItem[]> {
  return apiRequest<AiSessionListItem[]>("/ai/sessions");
}

export async function createAiSession(title?: string): Promise<AiSessionDetail> {
  return apiRequest<AiSessionDetail>("/ai/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function fetchAiSession(id: string): Promise<AiSessionDetail> {
  return apiRequest<AiSessionDetail>(`/ai/sessions/${id}`);
}

export async function sendAiMessage(
  sessionId: string,
  content: string
): Promise<SendAiMessageResult> {
  return apiRequest<SendAiMessageResult>(`/ai/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteAiSession(id: string): Promise<void> {
  return apiRequest<void>(`/ai/sessions/${id}`, { method: "DELETE" });
}
