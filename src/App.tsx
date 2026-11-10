import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Dices,
  CloudCheck,
  CheckCircle2,
  AlertTriangle,
  Menu,
  Settings2,
} from "lucide-react";
import { useVault } from "./vault-context";
import LockScreen from "./components/LockScreen";
import Sidebar from "./components/Sidebar";
import VaultList from "./components/VaultList";
import DetailPanel from "./components/DetailPanel";
import GeneratorPanel from "./components/GeneratorPanel";
import Watchtower from "./components/Watchtower";
import AddItemModal from "./components/AddItemModal";
import SettingsPanel from "./components/Settings";
import { cn } from "./utils/cn";

export default function App() {
  const {
    locked,
    selected,
    view,
    navOpen,
    setNavOpen,
    setGenOpen,
    openNew,
    setSettingsOpen,
    toasts,
    dismissToast,
  } = useVault();

  // Lock the vault when the window is closed/hidden briefly is handled by
  // idle detection in the store; here we just make sure the drawer closes
  // when we switch to the locked screen.
  React.useEffect(() => {
    if (locked) setNavOpen(false);
  }, [locked, setNavOpen]);

  return (
    <div className="h-dvh w-full overflow-hidden bg-ink-950 font-sans text-zinc-200 antialiased">
      <AnimatePresence mode="wait">
        {locked ? (
          <LockScreen key="lock" />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full"
          >
            {/* mobile drawer backdrop */}
            <AnimatePresence>
              {navOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setNavOpen(false)}
                  className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
                />
              )}
            </AnimatePresence>

            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
              {/* top bar */}
              <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-ink-900/60 px-3 backdrop-blur sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={() => setNavOpen(true)}
                    aria-label="باز کردن منو"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-300 transition-all hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90 lg:hidden"
                  >
                    <Menu size={17} />
                  </button>
                  <div className="hidden items-center gap-2 text-[11px] font-medium text-zinc-400 sm:flex">
                    <CloudCheck size={14} className="shrink-0 text-accent" />
                    <span className="truncate">
                      رمزنگاری سرتاسری · همگام‌سازی{" "}
                      <span className="text-zinc-300">همین حالا</span>
                    </span>
                    <span className="ms-1 inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(52,227,155,0.8)]" />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    title="تنظیمات"
                    aria-label="باز کردن تنظیمات"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] text-zinc-300 transition-all hover:border-accent/30 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 lg:hidden"
                  >
                    <Settings2 size={15} />
                  </button>
                  <button
                    onClick={() => setGenOpen(true)}
                    title="تولیدکننده رمز عبور"
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[12px] font-semibold text-zinc-300 transition-all hover:border-accent/30 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 sm:px-3.5"
                  >
                    <Dices size={14} />
                    <span className="hidden sm:inline">تولید رمز</span>
                  </button>
                  <button
                    onClick={openNew}
                    title="مورد جدید"
                    className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-[12px] font-bold text-ink-950 transition-all hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 sm:px-4"
                  >
                    <Plus size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">مورد جدید</span>
                  </button>
                </div>
              </header>

              {view === "watchtower" ? (
                <Watchtower />
              ) : (
                <div className="flex min-h-0 flex-1">
                  <div
                    className={cn(
                      "min-h-0 w-full shrink-0 md:w-[330px] lg:w-[380px]",
                      selected ? "hidden md:flex" : "flex",
                    )}
                  >
                    <VaultList />
                  </div>
                  <div
                    className={cn(
                      "min-h-0 min-w-0 flex-1",
                      selected ? "flex" : "hidden md:flex",
                    )}
                  >
                    <DetailPanel />
                  </div>
                </div>
              )}
            </div>

            <GeneratorPanel />
            <AddItemModal />
            <SettingsPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex w-[calc(100%-2rem)] max-w-fit -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={cn(
                "pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full border py-2.5 pr-3 pl-3.5 shadow-2xl shadow-black/60 backdrop-blur-xl",
                t.tone === "danger"
                  ? "border-danger/30 bg-ink-850/95"
                  : "border-accent/25 bg-ink-850/95",
              )}
            >
              {t.tone === "danger" ? (
                <AlertTriangle size={15} className="shrink-0 text-danger" />
              ) : (
                <CheckCircle2 size={15} className="shrink-0 text-accent" />
              )}
              <span className="text-[12px] font-semibold text-zinc-100">
                {t.msg}
              </span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action?.run();
                    dismissToast(t.id);
                  }}
                  className="ms-1 shrink-0 rounded-full border border-white/[0.1] px-3 py-1 text-[11px] font-bold text-accent transition-colors hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                >
                  {t.action.label}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
