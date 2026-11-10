import React, { useEffect } from "react";
import { motion } from "framer-motion";

import {
  LayoutGrid,
  Star,
  Radar,
  Globe,
  CreditCard,
  FileText,
  Fingerprint,
  ChevronLeft,
  LogOut,
  Settings2,
  X,
} from "lucide-react";
import { useVault } from "../vault-context";
import { getUsername } from "../lib/backend";
import { cn } from "../utils/cn";

function NavRow({
  icon,
  label,
  count,
  active,
  alert,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
  alert?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none",
        active ? "text-white" : "text-zinc-400 hover:text-zinc-100",
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg border border-white/[0.07] bg-white/[0.05]"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span
        className={cn(
          "relative z-10 transition-colors",
          active ? "text-accent" : "text-zinc-500 group-hover:text-zinc-300",
        )}
      >
        {icon}
      </span>
      <span className="relative z-10 flex-1 text-start">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "relative z-10 rounded-md px-1.5 py-0.5 font-mono text-[11px]",
            alert
              ? "bg-danger/15 text-danger"
              : active
                ? "bg-accent/15 text-accent"
                : "bg-white/[0.05] text-zinc-400 group-hover:text-zinc-300",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function Sidebar() {
  const { view, navigate, counts, score, lock, navOpen, setNavOpen } = useVault();

  const scoreColor =
    score >= 80 ? "#34e39b" : score >= 55 ? "#fbbf24" : "#fb7185";

  const [name, setName] = React.useState("در حال بارگذاری…");

  useEffect(() => {
    let alive = true;
    getUsername()
      .then((res) => alive && setName(String(res || "").trim() || "ناشناس"))
      .catch(() => alive && setName("ناشناس"));
    return () => {
      alive = false;
    };
  }, []);

  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <aside
      aria-label="پیمایش گاوصندوق"
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex h-full w-[272px] max-w-[85vw] shrink-0 flex-col border-l border-white/[0.06] bg-ink-900 transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-[252px] lg:max-w-none lg:translate-x-0",
        navOpen ? "translate-x-0 shadow-2xl shadow-black/60" : "translate-x-full",
      )}
    >
      {/* brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <img src="/logo.png" alt="نشان سنتینل" className="w-10 h-10" />
        <div className="flex-1">
          <div className="font-display text-[15px] font-bold tracking-tight text-white">
            Sentinel
          </div>
          <div className="text-[10px] text-zinc-500 uppercase">
            گاوصندوق شخصی
          </div>
        </div>
        <button
          onClick={() => setNavOpen(false)}
          aria-label="بستن منو"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90 lg:hidden"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="px-3 pt-2 pb-2 text-[10px] font-semibold text-zinc-500 uppercase">
          گاوصندوق
        </div>
        <div className="space-y-0.5">
          <NavRow
            icon={<LayoutGrid size={15} />}
            label="همه موارد"
            count={counts.all}
            active={view === "all"}
            onClick={() => navigate("all")}
          />
          <NavRow
            icon={<Star size={15} />}
            label="موردعلاقه‌ها"
            count={counts.favorites}
            active={view === "favorites"}
            onClick={() => navigate("favorites")}
          />
          <NavRow
            icon={<Radar size={15} />}
            label="دیده‌بان"
            count={counts.alerts}
            alert={counts.alerts > 0}
            active={view === "watchtower"}
            onClick={() => navigate("watchtower")}
          />
        </div>

        <div className="px-3 pt-6 pb-2 text-[10px] font-semibold text-zinc-500 uppercase">
          دسته‌بندی‌ها
        </div>
        <div className="space-y-0.5">
          <NavRow
            icon={<Globe size={15} />}
            label="ورودها"
            count={counts.login}
            active={view === "login"}
            onClick={() => navigate("login")}
          />
          <NavRow
            icon={<CreditCard size={15} />}
            label="کارت‌ها"
            count={counts.card}
            active={view === "card"}
            onClick={() => navigate("card")}
          />
          <NavRow
            icon={<FileText size={15} />}
            label="یادداشت‌های امن"
            count={counts.note}
            active={view === "note"}
            onClick={() => navigate("note")}
          />
          <NavRow
            icon={<Fingerprint size={15} />}
            label="هویت‌ها"
            count={counts.identity}
            active={view === "identity"}
            onClick={() => navigate("identity")}
          />
        </div>

        {/* security meter */}
        <button
          onClick={() => navigate("watchtower")}
          className="group mt-8 w-full rounded-xl border border-white/[0.06] bg-ink-850/80 p-4 text-start transition-all duration-300 hover:border-accent/25 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 uppercase">
              سلامت گاوصندوق
            </span>
            <ChevronLeft
              size={13}
              className="text-zinc-500 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-accent"
            />
          </div>
          <div className="mt-2.5 flex items-end gap-1.5">
            <span
              className="font-display text-3xl leading-none font-bold"
              style={{ color: scoreColor }}
            >
              {score}
            </span>
            <span className="pb-0.5 text-[11px] font-medium text-zinc-500">
              / 100
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: scoreColor, boxShadow: `0 0 12px ${scoreColor}` }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </div>
        </button>
      </nav>

      {/* user footer */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03]">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-violet/30 bg-gradient-to-br from-violet/25 to-violet/5 font-display text-[13px] font-bold text-violet"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-zinc-200">
              {name}
            </div>
            <div className="text-[11px] font-medium text-zinc-500">
اشتراک حرفه‌ای
            </div>
          </div>
          <SettingsButton />
          <button
            onClick={lock}
            title="قفل کردن گاوصندوق"
            aria-label="قفل کردن گاوصندوق"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-400 transition-all duration-200 hover:border-danger/40 hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SettingsButton() {
  const { setSettingsOpen } = useVault();
  return (
    <button
      onClick={() => setSettingsOpen(true)}
      title="تنظیمات"
      aria-label="باز کردن تنظیمات"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-400 transition-all duration-200 hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
    >
      <Settings2 size={14} />
    </button>
  );
}
