import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  ArrowDownAZ,
  History,
  SearchX,
  KeyRound,
  UserRound,
} from "lucide-react";
import { reltime, isWeak } from "../data";
import { Avatar, Badge } from "./ui";
import { useVault } from "../vault-context";
import { useNow } from "../hooks";
import { cn } from "../utils/cn";

const TITLES: Record<string, string> = {
  all: "همه موارد",
  favorites: "موردعلاقه‌ها",
  login: "ورودها",
  card: "کارت‌ها",
  note: "یادداشت‌های امن",
  identity: "هویت‌ها",
};

export default function VaultList() {
  useNow(60_000);
  const {
    filtered: items,
    view,
    query,
    setQuery,
    selectedId,
    select,
    reused,
    copy,
    settings,
  } = useVault();

  const [sort, setSort] = React.useState<"recent" | "az">("recent");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rowRefs = React.useRef(new Map<string, HTMLDivElement>());

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const sorted = React.useMemo(() => {
    const arr = [...items];
    if (sort === "az") arr.sort((a, b) => a.name.localeCompare(b.name));
    else arr.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    return arr;
  }, [items, sort]);

  const focusOffset = (id: string, dir: 1 | -1) => {
    const index = sorted.findIndex((i) => i.id === id);
    const next = sorted[index + dir];
    if (!next) return;
    select(next.id);
    rowRefs.current.get(next.id)?.focus();
  };

  return (
    <section
      aria-label="موارد گاوصندوق"
      className="flex h-full w-full flex-col border-white/[0.06] bg-ink-900/50 md:border-l"
    >
      {/* header */}
      <div className="border-b border-white/[0.06] px-4 pt-5 pb-4 sm:px-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-tight text-white">
            {TITLES[view] ?? "همه موارد"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-zinc-400">
              {sorted.length} مورد
            </span>
            <button
              onClick={() => setSort((s) => (s === "recent" ? "az" : "recent"))}
              title={sort === "recent" ? "مرتب‌شده بر اساس آخرین فعالیت" : "مرتب‌شده بر اساس الفبا"}
              aria-label={
                sort === "recent" ? "مرتب‌سازی بر اساس آخرین فعالیت" : "مرتب‌سازی الفبایی"
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-zinc-400 transition-all hover:border-white/15 hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
            >
              {sort === "recent" ? <History size={13} /> : <ArrowDownAZ size={13} />}
            </button>
          </div>
        </div>

        {/* search */}
        <div className="group mt-4 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-ink-850 px-3.5 transition-all duration-200 focus-within:border-accent/40 focus-within:shadow-[0_0_0_3px_rgba(52,227,155,0.08)]">
          <Search
            size={15}
            className="shrink-0 text-zinc-500 transition-colors group-focus-within:text-accent"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی گاوصندوق…"
            aria-label="جستجوی گاوصندوق"
            className="h-10 min-w-0 flex-1 bg-transparent text-[13px] text-zinc-100 outline-none placeholder:text-zinc-500"
          />
          <kbd className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
            /
          </kbd>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto p-2.5">
        <AnimatePresence mode="popLayout">
          {sorted.map((item, i) => {
            const active = item.id === selectedId;
            const weak = item.category === "login" && isWeak(item);
            const isReused = reused.has(item.id);
            return (
              <motion.div
                layout
                key={item.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(item.id, el);
                  else rowRefs.current.delete(item.id);
                }}
                role="button"
                tabIndex={0}
                aria-current={active ? "true" : undefined}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: 0.25,
                  delay: Math.min(i * 0.03, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => select(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focusOffset(item.id, 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    focusOffset(item.id, -1);
                  } else if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select(item.id);
                  }
                }}
                className={cn(
                  "group relative mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none",
                  active
                    ? "bg-gradient-to-l from-accent/[0.1] to-accent/[0.02]"
                    : "hover:bg-white/[0.035]",
                )}
              >
                {active && (
                  <motion.div
                    layoutId="row-indicator"
                    className="absolute top-1/2 start-0 h-7 w-[3px] -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(52,227,155,0.8)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Avatar item={item} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-semibold text-zinc-100">
                      {item.name}
                    </span>
                    {item.favorite && (
                      <Star
                        size={11}
                        className="shrink-0 fill-warn text-warn"
                        aria-label="موردعلاقه"
                      />
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-[12px] text-zinc-400">
                      {item.username}
                    </span>
                  </div>
                </div>

                {/*
                  Timestamps + status badges. The quick copy actions replace the
                  badges on hover (pointer devices only); on touch devices the
                  badges stay visible and copying happens in the detail panel.
                */}
                <div className="relative flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] font-medium text-zinc-500">
                    {reltime(item.lastUsedAt)}
                  </span>
                  <div className="flex items-center gap-1 transition-opacity duration-200 sm:group-hover:opacity-0">
                    {item.breached && <Badge tone="danger">لو رفته</Badge>}
                    {!item.breached && weak && <Badge tone="warn">ضعیف</Badge>}
                    {!item.breached && !weak && isReused && (
                      <Badge tone="danger">تکراری</Badge>
                    )}
                    {!item.breached && !weak && !isReused && item.twoFA && (
                      <Badge tone="accent">2FA</Badge>
                    )}
                  </div>
                  <div className="absolute end-0 bottom-0 hidden translate-y-1 items-center gap-0.5 opacity-0 transition-all duration-200 sm:flex sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      title="کپی نام کاربری"
                      aria-label="کپی نام کاربری"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await copy(item.username, "نام کاربری کپی شد");
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-ink-800 text-zinc-300 transition-all hover:text-accent active:scale-90"
                    >
                      <UserRound size={11} />
                    </button>
                    <button
                      type="button"
                      title="کپی رمز عبور"
                      aria-label="کپی رمز عبور"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await copy(
                          item.password,
                          `رمز عبور کپی شد — پاک‌سازی در ${settings.clipboardClearSeconds} ثانیه`,
                        );
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.08] bg-ink-800 text-zinc-300 transition-all hover:text-accent active:scale-90"
                    >
                      <KeyRound size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sorted.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 pt-24 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <SearchX size={20} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">
                موردی یافت نشد
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">
                {query ? "عبارت جستجوی دیگری را امتحان کنید" : "این بخش خالی است"}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
