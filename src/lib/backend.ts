/**
 * Typed bridge to the Rust backend.
 *
 * Every call ultimately hits a Tauri command. In a plain browser (e.g.
 * `npm run dev` outside the Tauri shell) there is no backend, so callers
 * must check {@link isTauri} and fall back to local storage.
 */
import { invoke, isTauri as isTauriRuntime } from "@tauri-apps/api/core";
import type { VaultItem } from "../data";

/** True when running inside the Tauri webview with the Rust backend attached. */
export function isTauri(): boolean {
  try {
    return isTauriRuntime();
  } catch {
    return false;
  }
}

/** Whether a master account exists on this device. */
export function userExists(): Promise<boolean> {
  return invoke<boolean>("user_status");
}

/** The master account's display name. */
export function getUsername(): Promise<string> {
  return invoke<string>("get_username");
}

/** Create the master account and an empty encrypted vault. */
export function createAccount(username: string, password: string): Promise<boolean> {
  return invoke<boolean>("add_user", { username, password });
}

/** Verify the master password and cache the derived key for this session. */
export function unlockVault(password: string): Promise<boolean> {
  return invoke<boolean>("check_password", { password });
}

/** Decrypt and load the vault payload. */
export async function loadVaultItems(): Promise<VaultItem[]> {
  const raw = await invoke<string>("load_items");
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as VaultItem[]) : [];
}

/** Encrypt and persist the vault payload. */
export function saveVaultItems(items: VaultItem[]): Promise<void> {
  return invoke<void>("save_items", { items: JSON.stringify(items) });
}

/** Drop the in-memory key so the vault locks. */
export function lockVault(): Promise<void> {
  return invoke<void>("lock_vault");
}
