/** Supabase recovery link thường về Site URL (localhost:3000/) — chuyển sang /auth/reset giữ hash. */
export function redirectAuthHashIfNeeded(): void {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;
  if (window.location.pathname === "/auth/reset") return;

  const params = new URLSearchParams(hash.slice(1));
  const isRecovery =
    params.has("access_token") &&
    (!params.get("type") || params.get("type") === "recovery");
  const isAuthError = params.has("error");

  if (isRecovery || isAuthError) {
    window.location.replace(`/auth/reset${hash}`);
  }
}
