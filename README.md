# Sentinel

A local-first, encrypted password vault built with **Tauri 2**, **React 19** and
**TypeScript**. Secrets never leave the device: the master password is stretched
with Argon2id into a 256-bit key that encrypts the entire vault with
AES-256-GCM before it is written to SQLite.

## Features

- **Master-password unlock** — Argon2id verification; the password itself is
  never stored.
- **Encrypted at rest** — the whole vault payload is sealed with AES-256-GCM
  (fresh random nonce on every write). Only the derived key is held in memory,
  and only while unlocked.
- **Password intelligence** — strength scoring, reuse detection, stale-password
  detection and a weighted vault health score.
- **Watchtower** — a security audit view that flags weak, reused, breached and
  stale credentials, with one-click rotation.
- **Built-in generator** — cryptographically secure (rejection-sampled, no
  modulo bias) with configurable length and character sets.
- **Everyday ergonomics** — categories, favorites, search (`/`), keyboard
  navigation, auto-lock on idle, and automatic clipboard wiping.
- **Offline web preview** — running `npm run dev` outside the Tauri shell falls
  back to `localStorage`, so the UI is fully explorable in a browser.

## Security model

| Concern            | Approach                                                             |
| ------------------ | -------------------------------------------------------------------- |
| Password storage   | Argon2id PHC hash (`user.password`); the plaintext is never persisted |
| Vault key          | `Argon2id(master_password, random 16-byte salt)` → 32 bytes           |
| Vault payload      | `AES-256-GCM(key, JSON(items))` with a fresh random nonce per save    |
| Key lifetime       | Cached in backend memory only while unlocked; zeroed on lock          |
| Locking            | Manual lock, auto-lock on inactivity, or app restart                  |

The database lives in the platform app-data directory (`vault.db`). On first run
a legacy `user.db` from the working directory is migrated automatically.

## Getting started

```bash
npm install
npm run tauri dev      # desktop app (Rust backend + encrypted vault)
```

Browser-only preview of the UI (no backend, uses `localStorage`):

```bash
npm run dev
```

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Vite dev server for the frontend             |
| `npm run build`     | Type-check-free production build of the UI   |
| `npm run tauri dev` | Run the full desktop app                     |
| `npm run tauri build` | Package the desktop app                    |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm test`          | Vitest in watch mode                         |
| `npm run test:run`  | Vitest once                                  |
| `npm run lint`      | ESLint                                       |
| `npm run format`    | Prettier                                     |

Rust tests (crypto round-trips, hashing) live alongside the backend:

```bash
cd src-tauri && cargo test
```

## Project layout

```
src/
  components/       UI: lock screen, sidebar, list, detail, generator, …
  lib/backend.ts    Typed bridge to the Tauri commands + isTauri() detection
  lib/clipboard.ts  Clipboard copy with timed wiping
  data.ts           Domain types, scoring, secure generator
  store.tsx         Vault state, persistence, toasts, locking
src-tauri/
  src/lib.rs        Commands: auth, encrypted load/save, lock
```

## Backend commands

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `user_status`    | Whether a master account exists                     |
| `add_user`       | Create the account and an empty encrypted vault     |
| `check_password` | Verify the password and cache the derived key       |
| `get_username`   | Display name of the account                         |
| `load_items`     | Decrypt and return the vault payload (JSON)         |
| `save_items`     | Encrypt and persist the vault payload               |
| `lock_vault`     | Zero and drop the in-memory key                     |

## License

MIT
