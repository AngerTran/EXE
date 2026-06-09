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

export async function cleanupEmptyAiSessions(
  keepId?: string | null
): Promise<{ deleted: number }> {
  const q = keepId ? `?keep=${encodeURIComponent(keepId)}` : "";
  return apiRequest<{ deleted: number }>(`/ai/sessions/empty${q}`, { method: "DELETE" });
}

export async function exportAiSession(
  id: string
): Promise<{ format: string; content: string }> {
  return apiRequest<{ format: string; content: string }>(`/ai/sessions/${id}/export`);
}

const ACTIVE_SESSION_KEY = "assetbox_ai_active_session";

export function getStoredAiSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredAiSessionId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_SESSION_KEY, id);
    else localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
