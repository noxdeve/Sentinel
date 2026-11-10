import React from "react";
import {
  INITIAL_ITEMS,
  VaultItem,
  View,
  findReused,
  generatePassword,
  securityScore,
} from "./data";
import { copyText, cancelClipboardClear, scheduleClipboardClear } from "./lib/clipboard";
import {
  isTauri,
  loadVaultItems,
  saveVaultItems,
  lockVault,
} from "./lib/backend";
import { useIdle } from "./hooks";
import { VaultContext, type Settings, type Toast, type VaultStore } from "./vault-context";

/* ------------------------------------------------------------------ */
/* persistence                                                         */
/* ------------------------------------------------------------------ */

const ITEMS_KEY = "sentinel.vault.items.v1";
const SETTINGS_KEY = "sentinel.vault.settings.v1";

const DEFAULT_SETTINGS: Settings = {
  autoLockMinutes: 5,
  clipboardClearSeconds: 45,
  generatorLength: 20,
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as object) } as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode, quota); ignore */
  }
}

function loadItems(): VaultItem[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return INITIAL_ITEMS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as VaultItem[];
  } catch {
    /* fall through to seed */
  }
  return INITIAL_ITEMS;
}

/* ------------------------------------------------------------------ */
/* provider                                                            */
/* ------------------------------------------------------------------ */

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const tauri = isTauri();
  const [locked, setLocked] = React.useState(true);
  const [items, setItems] = React.useState<VaultItem[]>(() =>
    tauri ? [] : loadItems(),
  );
  // Guards persistence: the encrypted payload must not be written back before
  // it has been read, or unlocking would clobber the vault with an empty one.
  const [ready, setReady] = React.useState(() => !tauri);
  const [view, setView] = React.useState<View>("all");
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [settings, setSettingsState] = React.useState<Settings>(() =>
    loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS),
  );

  const [genOpen, setGenOpen] = React.useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<VaultItem | null>(null);
  const [navOpen, setNavOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toastSeq = React.useRef(0);
  const toastTimers = React.useRef(new Set<ReturnType<typeof setTimeout>>());
  const itemsRef = React.useRef(items);

  /* -- persistence -- */
  React.useEffect(() => {
    itemsRef.current = items;
    if (!ready) return;
    if (tauri) {
      saveVaultItems(items).catch((err) =>
        console.error("Failed to persist vault", err),
      );
    } else {
      saveJSON(ITEMS_KEY, items);
    }
  }, [items, ready, tauri]);
  React.useEffect(() => saveJSON(SETTINGS_KEY, settings), [settings]);

  /* -- toasts -- */
  const dismissToast = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = React.useCallback<VaultStore["notify"]>(
    (msg, opts) => {
      const id = ++toastSeq.current;
      const toast: Toast = { id, msg, tone: opts?.tone ?? "success", action: opts?.action };
      setToasts((t) => [...t.slice(-2), toast]);
      const ttl = toast.action ? 7000 : 3000;
      const timer = setTimeout(() => dismissToast(id), ttl);
      toastTimers.current.add(timer);
    },
    [dismissToast],
  );

  React.useEffect(() => {
    const timers = toastTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  /* -- derived -- */
  const reused = React.useMemo(() => findReused(items), [items]);
  const score = React.useMemo(() => securityScore(items, reused), [items, reused]);

  const counts = React.useMemo(
    () => ({
      all: items.length,
      favorites: items.filter((i) => i.favorite).length,
      login: items.filter((i) => i.category === "login").length,
      card: items.filter((i) => i.category === "card").length,
      note: items.filter((i) => i.category === "note").length,
      identity: items.filter((i) => i.category === "identity").length,
      alerts: items.filter((i) => i.breached || reused.has(i.id)).length,
    }),
    [items, reused],
  );

  const filtered = React.useMemo(() => {
    let arr = items;
    if (view === "favorites") arr = arr.filter((i) => i.favorite);
    else if (view !== "all" && view !== "watchtower")
      arr = arr.filter((i) => i.category === view);
    const q = query.trim().toLowerCase();
    if (q)
      arr = arr.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.username.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q),
      );
    return arr;
  }, [items, view, query]);

  const selected = React.useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  /* -- clipboard -- */
  const copy = React.useCallback<VaultStore["copy"]>(
    async (text, message = "در کلیپ‌بورد کپی شد") => {
      const ok = await copyText(text);
      if (!ok) {
        notify("کپی در کلیپ‌بورد ممکن نشد", { tone: "danger" });
        return false;
      }
      notify(message);
      scheduleClipboardClear(settings.clipboardClearSeconds * 1000);
      return true;
    },
    [notify, settings.clipboardClearSeconds],
  );

  /* -- locking -- */
  const lock = React.useCallback(() => {
    cancelClipboardClear();
    setGenOpen(false);
    setModalOpen(false);
    setNavOpen(false);
    setSettingsOpen(false);
    setQuery("");
    setView("all");
    setSelectedId(null);
    if (tauri) {
      // Drop the decrypted payload and the backend's in-memory key.
      void lockVault().catch(() => {});
      setReady(false);
      setItems([]);
    }
    setLocked(true);
  }, [tauri]);

  const unlock = React.useCallback(() => {
    if (!tauri) {
      setItems(loadItems());
      setReady(true);
      setLocked(false);
      return;
    }
    setLocked(false);
    loadVaultItems()
      .then((loaded) => {
        setItems(loaded);
        setReady(true);
      })
      .catch((err) => {
        console.error("Failed to load vault", err);
        notify("رمزگشایی گاوصندوق ممکن نشد", { tone: "danger" });
      });
  }, [tauri, notify]);

  useIdle(
    settings.autoLockMinutes * 60_000,
    lock,
    !locked && settings.autoLockMinutes > 0,
  );

  /* -- item mutations -- */
  const select = React.useCallback((id: string | null) => setSelectedId(id), []);

  // Section navigation: closes the mobile drawer and, on small screens where
  // the list and detail share a single column, dismisses the open item.
  const navigate = React.useCallback((v: View) => {
    setView(v);
    setNavOpen(false);
    if (window.matchMedia("(max-width: 767px)").matches) setSelectedId(null);
  }, []);

  const saveItem = React.useCallback(
    (item: VaultItem) => {
      const exists = itemsRef.current.some((i) => i.id === item.id);
      setItems((arr) =>
        exists ? arr.map((i) => (i.id === item.id ? item : i)) : [item, ...arr],
      );
      setSelectedId(item.id);
      setView((v) => (v === "watchtower" || v === "favorites" ? "all" : v));
      notify(exists ? "مورد ویرایش شد" : "مورد در گاوصندوق ذخیره شد");
    },
    [notify],
  );

  const deleteItem = React.useCallback(
    (id: string) => {
      const list = itemsRef.current;
      const index = list.findIndex((i) => i.id === id);
      if (index === -1) return;
      const removed = list[index];
      setItems((arr) => arr.filter((i) => i.id !== id));
      setSelectedId((cur) => (cur === id ? null : cur));
      notify("مورد حذف شد", {
        tone: "danger",
        action: {
          label: "بازگرداندن",
          run: () => {
            setItems((arr) => {
              if (arr.some((i) => i.id === removed.id)) return arr;
              const next = arr.slice();
              next.splice(Math.min(index, next.length), 0, removed);
              return next;
            });
            notify("مورد بازگردانده شد");
          },
        },
      });
    },
    [notify],
  );

  const toggleFav = React.useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      setItems((arr) =>
        arr.map((i) => (i.id === id ? { ...i, favorite: !i.favorite } : i)),
      );
      notify(item?.favorite ? "از موردعلاقه‌ها حذف شد" : "به موردعلاقه‌ها افزوده شد");
    },
    [notify],
  );

  const rotate = React.useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      setItems((arr) =>
        arr.map((i) =>
          i.id === id
            ? {
                ...i,
                password: generatePassword({
                  length: settings.generatorLength + 2,
                  upper: true,
                  lower: true,
                  digits: true,
                  symbols: true,
                }),
                breached: false,
                updatedAt: Date.now(),
                lastUsedAt: Date.now(),
              }
            : i,
        ),
      );
      notify(`رمز عبور ${item?.name ?? "مورد"} تغییر کرد`);
    },
    [notify, settings.generatorLength],
  );

  /* -- settings -- */
  const setSettings = React.useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  /* -- ui -- */
  const openNew = React.useCallback(() => {
    setEditTarget(null);
    setModalOpen(true);
  }, []);
  const openEdit = React.useCallback((item: VaultItem) => {
    setEditTarget(item);
    setModalOpen(true);
  }, []);
  const closeModal = React.useCallback(() => setModalOpen(false), []);

  const value: VaultStore = {
    locked,
    lock,
    unlock,
    items,
    filtered,
    selected,
    selectedId,
    select,
    view,
    setView,
    navigate,
    query,
    setQuery,
    reused,
    score,
    counts,
    saveItem,
    deleteItem,
    toggleFav,
    rotate,
    settings,
    setSettings,
    genOpen,
    setGenOpen,
    modalOpen,
    editTarget,
    openNew,
    openEdit,
    closeModal,
    navOpen,
    setNavOpen,
    settingsOpen,
    setSettingsOpen,
    toasts,
    notify,
    dismissToast,
    copy,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
