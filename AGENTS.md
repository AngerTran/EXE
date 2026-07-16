# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single product ("AssetBox" / "EXE") split into two apps:

- `BE/` — ASP.NET Core Web API (.NET 10), EF Core + Npgsql against a **remote hosted Supabase Postgres**. Listens on `http://localhost:5180` (Swagger at `/swagger`).
- `FE/AssetServiceInterfaceDesign/` — React 18 + TypeScript + Vite frontend. Listens on `http://localhost:5173` (`strictPort`).

### Running

- Start both together from the repo root: `npm run dev` (uses `concurrently` to run BE + FE). See `package.json` for the individual `dev:be` / `dev:fe` scripts.
- The FE is fully integrated with the BE (real API calls, not localStorage mock — older `README`/`CLAUDE.md` mock notes are stale). The FE fetches its Supabase public config from the BE `GET /api/v1/auth/config`, so **the BE must be running** for FE auth/data to work.

### Non-obvious caveats

- **.NET 10 SDK** is required and is installed at `/usr/local/dotnet` (symlinked to `/usr/local/bin/dotnet`). This is a one-off system install captured in the VM snapshot, so it is intentionally NOT in the update script.
- The BE starts in the **Production** hosting environment by default (no `ASPNETCORE_ENVIRONMENT` set), and reads `BE/appsettings.json`, which already contains **live remote Supabase DB + auth credentials**. There is no local database to start — DB-backed endpoints (e.g. `/api/v1/subscription-plans`, `/api/v1/assets`) work out of the box.
- The FE uses **npm** (committed `package-lock.json`); there is no `pnpm-lock.yaml` despite README/`pnpm-workspace.yaml` mentioning pnpm.
- Optional integrations (non-blocking): set `Ai:ApiKey` (OpenAI) in `BE/appsettings.json` for real AI chat (otherwise it returns a fallback response); set `Supabase:ServiceRoleKey` to enable asset file/image upload + signed downloads.

### Lint / test / build

- BE build/compile check: `dotnet build` in `BE/` (no separate lint config; the build surfaces warnings/errors).
- FE build: `npm run build` in `FE/AssetServiceInterfaceDesign/`. There is no FE lint script and no automated test suite (no test projects in `BE/`, no test script in the FE `package.json`).
