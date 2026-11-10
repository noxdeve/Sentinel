import React from "react";
import type { VaultItem, View } from "./data";

/* ------------------------------------------------------------------ */
/* public types                                                        */
/* ------------------------------------------------------------------ */

export interface Settings {
  /** Minutes of inactivity before the vault locks. 0 disables auto-lock. */
  autoLockMinutes: number;
  /** Seconds before a copied secret is wiped from the clipboard. 0 disables. */
  clipboardClearSeconds: number;
  /** Default length used by the password generator. */
  generatorLength: number;
}

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  msg: string;
  tone: "success" | "danger";
  action?: ToastAction;
}

export interface VaultStore {
  locked: boolean;
  lock: () => void;
  unlock: () => void;

  items: VaultItem[];
  filtered: VaultItem[];
  selected: VaultItem | null;
  selectedId: string | null;
  select: (id: string | null) => void;

  view: View;
  setView: (v: View) => void;
  navigate: (v: View) => void;
  query: string;
  setQuery: (q: string) => void;

  reused: Set<string>;
  score: number;
  counts: {
    all: number;
    favorites: number;
    login: number;
    card: number;
    note: number;
    identity: number;
    alerts: number;
  };

  saveItem: (item: VaultItem) => void;
  deleteItem: (id: string) => void;
  toggleFav: (id: string) => void;
  rotate: (id: string) => void;

  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;

  genOpen: boolean;
  setGenOpen: (open: boolean) => void;
  modalOpen: boolean;
  editTarget: VaultItem | null;
  openNew: () => void;
  openEdit: (item: VaultItem) => void;
  closeModal: () => void;

  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  toasts: Toast[];
  notify: (
    msg: string,
    opts?: { tone?: Toast["tone"]; action?: ToastAction },
  ) => void;
  dismissToast: (id: number) => void;

  copy: (text: string, message?: string) => Promise<boolean>;
}

/* ------------------------------------------------------------------ */
/* context + hook                                                      */
/* ------------------------------------------------------------------ */

export const VaultContext = React.createContext<VaultStore | null>(null);

export function useVault(): VaultStore {
  const ctx = React.useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within <VaultProvider>");
  return ctx;
}
