import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { apiRequest } from "../api/client";

interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

let client: SupabaseClient | null = null;
let configPromise: Promise<SupabasePublicConfig> | null = null;

async function resolveSupabaseConfig(): Promise<SupabasePublicConfig> {
  if (!configPromise) {
    configPromise = apiRequest<SupabasePublicConfig>("/auth/config", { auth: false }).then((res) => ({
      url: res.url.replace(/\/$/, ""),
      anonKey: res.anonKey,
    }));
  }
  return configPromise;
}

export async function getSupabase(): Promise<SupabaseClient> {
  if (client) return client;
  const { url, anonKey } = await resolveSupabaseConfig();
  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      // Chỉ xử lý code ở AuthCallback — tránh double exchange làm mất code_verifier
      detectSessionInUrl: false,
      flowType: "pkce",
      autoRefreshToken: false,
      storageKey: "exe_supabase_auth",
    },
  });
  return client;
}

/** Xóa session Supabase local sau khi đã copy token sang BE client. */
export async function clearSupabaseLocalSession(): Promise<void> {
  if (!client) return;
  try {
    await client.auth.signOut({ scope: "local" });
  } catch {
    /* ignore */
  }
}
