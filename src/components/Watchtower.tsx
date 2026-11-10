import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  ShieldAlert,
  Repeat2,
  Skull,
  Hourglass,
  RefreshCw,
  Zap,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { isWeak, isOld, fullDate } from "../data";
import { useVault } from "../vault-context";
import { Avatar, Badge } from "./ui";
import { useNow } from "../hooks";
import { cn } from "../utils/cn";

function Gauge({ score }: { score: number }) {
  const R = 84;
  const C = 2 * Math.PI * R;
  const color = score >= 80 ? "#34e39b" : score >= 55 ? "#fbbf24" : "#fb7185";
  const label =
    score >= 80 ? "عالی" : score >= 55 ? "نیاز به بهبود" : "در خطر";

  return (
    <div className="relative h-[220px] w-[220px]">
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label={`امتیاز امنیتی گاوصندوق ${score} از ۱۰۰ — ${label}`}
      >
        <circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - score / 100) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 16 }}
          className="font-display text-6xl font-bold"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="mt-1 text-[11px] text-zinc-400 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function Watchtower() {
  useNow(60_000);
  const { items, reused, score, rotate, select, setView, setQuery, notify } =
    useVault();
  const [scanning, setScanning] = React.useState(false);
  const [scannedAt, setScannedAt] = React.useState(() => Date.now());

  const weak = items.filter((i) => i.category === "login" && isWeak(i));
  const breached = items.filter((i) => i.breached);
  const reusedItems = items.filter((i) => reused.has(i.id));
  const old = items.filter((i) => i.category === "login" && isOld(i));

  const risk = items.filter(
    (i) =>
      i.breached ||
      reused.has(i.id) ||
      (i.category === "login" && isWeak(i)),
  );

  const logins = items.filter((i) => i.category === "login").length;

  const stats = [
    { icon: ShieldAlert, label: "رمزهای ضعیف", n: weak.length, tone: "#fbbf24" },
    { icon: Repeat2, label: "رمزهای تکراری", n: reusedItems.length, tone: "#fb7185" },
    { icon: Skull, label: "سایت‌های لو رفته", n: breached.length, tone: "#fb7185" },
    { icon: Hourglass, label: "کهنه (بیش از یک سال بدون تغییر)", n: old.length, tone: "#a78bfa" },
  ];

  const rescan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedAt(Date.now());
      notify("اسکن کامل شد — گزارش به‌روزرسانی شد");
    }, 1400);
  };

  const openItem = (id: string) => {
    select(id);
    setView("all");
    setQuery("");
  };

  return (
    <div className="noise relative flex-1 overflow-y-auto">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-danger/[0.05] blur-[100px]" />
      <div className="mx-auto w-full max-w-[880px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-9">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/[0.08]">
                <Radar size={18} className="text-accent" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                دیده‌بان
              </h1>
            </div>
            <p className="mt-2.5 text-[13px] text-zinc-400">
              پایش پیوسته رمزهای ضعیف، تکراری و لو رفته.
            </p>
          </div>
          <button
            onClick={rescan}
            disabled={scanning}
            className="flex items-center justify-center gap-2 self-start rounded-xl border border-white/[0.08] px-4 py-2.5 text-[12px] font-semibold text-zinc-200 transition-all hover:border-accent/30 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw size={13} className={cn(scanning && "animate-spin")} />
            {scanning ? "در حال اسکن…" : "اجرای اسکن کامل"}
          </button>
        </div>

        {/* gauge + stats */}
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-ink-850/70 py-8"
          >
            <Gauge score={score} />
            <p className="mt-5 max-w-[220px] text-center text-[11px] leading-relaxed text-zinc-400">
              بر پایه {logins} ورود · به‌روزرسانی {fullDate(scannedAt)}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map(({ icon: Icon, label, n, tone }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-ink-850/70 p-5 transition-colors duration-300 hover:border-white/[0.14]"
              >
                <div className="flex items-center justify-between">
                  <Icon size={17} style={{ color: tone }} aria-hidden="true" />
                  <span
                    className="font-display text-4xl leading-none font-bold"
                    style={{ color: n > 0 ? tone : "#525a6a" }}
                  >
                    {n}
                  </span>
                </div>
                <span className="mt-4 text-[12px] font-medium text-zinc-400">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* risk list */}
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-white">
              مواردی که نیاز به توجه دارند
            </h2>
            <span className="text-[11px] text-zinc-500 uppercase">
              {risk.length} مورد علامت‌خورده
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {risk.map((item) => (
              <motion.div
                layout
                key={item.id}
                exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mb-2.5 flex flex-wrap items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/70 px-4 py-4 sm:gap-4 sm:px-5"
              >
                <Avatar item={item} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-zinc-100">
                      {item.name}
                    </span>
                    <span className="truncate text-[12px] text-zinc-500">
                      {item.username}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5">
                    {item.breached && <Badge tone="danger">در نشت یافت شد</Badge>}
                    {reused.has(item.id) && <Badge tone="warn">تکراری</Badge>}
                    {item.category === "login" && isWeak(item) && (
                      <Badge tone="warn">ضعیف</Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openItem(item.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 transition-all hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
                  title="بررسی مورد"
                  aria-label={`بررسی ${item.name}`}
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  onClick={() => rotate(item.id)}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-[12px] font-bold text-ink-950 transition-all hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95"
                >
                  <Zap size={13} />
                  تغییر رمز
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {risk.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-accent/20 bg-accent/[0.04] py-14"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/[0.08] shadow-glow">
                <ShieldCheck size={24} className="text-accent" />
              </div>
              <div className="text-center">
                <p className="font-display text-lg font-bold text-white">
                  همه‌چیز امن است
                </p>
                <p className="mt-1 text-[13px] text-zinc-400">
                  همه رمزهای گاوصندوق شما در بازبینی امنیتی قبول شدند.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
