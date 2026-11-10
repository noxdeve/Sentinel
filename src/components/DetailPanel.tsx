import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Globe,
  KeyRound,
  UserRound,
  ShieldEllipsis,
  StickyNote,
  Clock,
  CalendarPlus,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { VaultItem, scorePassword, reltime, fullDate, Category } from "../data";
import { useVault } from "../vault-context";
import { Avatar, Badge, CopyButton, StrengthBar, MaskedPassword } from "./ui";
import { useNow } from "../hooks";
import { cn } from "../utils/cn";

function Field({
  icon,
  label,
  children,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-white/[0.06] bg-ink-850/70 px-4 py-3.5 transition-colors duration-200 hover:border-white/[0.12]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 uppercase">
          <span className="text-zinc-500">{icon}</span>
          {label}
        </div>
        {action}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const CAT_LABEL: Record<Category, string> = {
  login: "ورود",
  card: "کارت پرداخت",
  note: "یادداشت امن",
  identity: "هویت",
};

/**
 * Rendered with a `key={item.id}` so per-item UI state (reveal / confirm)
 * resets naturally when the selection changes — no sync effect required.
 */
function ItemBody({ item }: { item: VaultItem }) {
  const { reused, toggleFav, openEdit, deleteItem, select, settings } = useVault();
  const [revealed, setRevealed] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-9">
      {/* header */}
      <div className="flex items-start gap-3 sm:gap-4">
        <button
          onClick={() => select(null)}
          aria-label="بازگشت به فهرست"
          className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 transition-all hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90 md:hidden"
        >
          <ArrowRight size={16} />
        </button>
        <Avatar item={item} size={58} className="rounded-2xl" />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
              {item.name}
            </h1>
            <button
              onClick={() => toggleFav(item.id)}
              aria-label={item.favorite ? "حذف از موردعلاقه‌ها" : "افزودن به موردعلاقه‌ها"}
              aria-pressed={item.favorite}
              className="group shrink-0 rounded transition-transform focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-75"
            >
              <Star
                size={18}
                className={cn(
                  "transition-all duration-200",
                  item.favorite
                    ? "fill-warn text-warn drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    : "text-zinc-500 group-hover:text-zinc-300",
                )}
              />
            </button>
          </div>
          <a
            href={`https://${item.url}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[13px] font-medium break-all text-zinc-400 transition-colors hover:text-accent"
          >
            {item.url}
            <ExternalLink size={12} className="shrink-0" />
          </a>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(item)}
            title="ویرایش مورد"
            aria-label="ویرایش مورد"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 transition-all hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* status badges */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="neutral" className="px-2.5 py-1">
          {CAT_LABEL[item.category]}
        </Badge>
        {item.breached && (
          <Badge tone="danger" className="px-2.5 py-1">
            <ShieldAlert size={11} /> لو رفته — همین حالا تغییر دهید
          </Badge>
        )}
        {reused.has(item.id) && (
          <Badge tone="danger" className="px-2.5 py-1">
            رمز عبور تکراری
          </Badge>
        )}
        {item.twoFA ? (
          <Badge tone="accent" className="px-2.5 py-1">
            <ShieldCheck size={11} /> 2FA فعال
          </Badge>
        ) : item.category === "login" ? (
          <Badge tone="warn" className="px-2.5 py-1">
            بدون 2FA
          </Badge>
        ) : null}
      </div>

      {/* fields */}
      <div className="mt-6 space-y-3">
        <Field
          icon={<UserRound size={11} />}
          label="نام کاربری"
          action={<CopyButton value={item.username} label="نام کاربری کپی شد" />}
        >
          <span className="text-[14px] font-medium break-all text-zinc-100">
            {item.username}
          </span>
        </Field>

        <Field
          icon={<KeyRound size={11} />}
          label="رمز عبور"
          action={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRevealed((r) => !r)}
                aria-label={revealed ? "پنهان کردن رمز" : "نمایش رمز"}
                aria-pressed={revealed}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition-all hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
              >
                {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <CopyButton
                value={item.password}
                label={`رمز عبور کپی شد — پاک‌سازی در ${settings.clipboardClearSeconds} ثانیه`}
              />
            </div>
          }
        >
          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.span
                key="plain"
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.22 }}
                className="font-mono text-[14px] font-medium break-all text-accent-strong"
              >
                {item.password}
              </motion.span>
            ) : (
              <motion.span
                key="masked"
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.22 }}
              >
                <MaskedPassword className="text-[15px]" />
              </motion.span>
            )}
          </AnimatePresence>
          <StrengthBar strength={scorePassword(item.password)} className="mt-3" />
        </Field>

        <Field icon={<Globe size={11} />} label="وبگاه">
          <a
            href={`https://${item.url}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center gap-2 text-[14px] font-medium break-all text-zinc-200 transition-colors hover:text-accent"
          >
            {item.url}
            <ExternalLink size={13} className="shrink-0 text-zinc-500" />
          </a>
        </Field>

        {item.notes && (
          <Field icon={<StickyNote size={11} />} label="یادداشت‌ها">
            <p className="text-[13px] leading-relaxed text-zinc-300">{item.notes}</p>
          </Field>
        )}
      </div>

      {/* metadata */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: CalendarPlus, label: "ساخته‌شده", value: fullDate(item.createdAt) },
          { icon: RefreshCw, label: "تغییریافته", value: reltime(item.updatedAt) },
          { icon: Clock, label: "آخرین استفاده", value: reltime(item.lastUsedAt) },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-white/[0.05] bg-ink-850/50 px-3.5 py-3"
          >
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase">
              <Icon size={10} />
              {label}
            </div>
            <div className="mt-1.5 text-[12px] font-semibold text-zinc-200">{value}</div>
          </div>
        ))}
      </div>

      {/* danger zone */}
      <div className="mt-8 flex flex-wrap justify-end">
        {confirming ? (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            <span className="text-xs font-medium text-zinc-400">
              برای همیشه حذف شود؟
            </span>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
            >
              انصراف
            </button>
            <button
              onClick={() => deleteItem(item.id)}
              className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-ink-950 transition-all hover:shadow-[0_0_20px_rgba(251,113,133,0.4)] focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:outline-none active:scale-95"
            >
              حذف
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-semibold text-zinc-400 transition-all hover:border-danger/30 hover:bg-danger/[0.08] hover:text-danger focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:outline-none"
          >
            <Trash2 size={13} />
            حذف مورد
          </button>
        )}
      </div>
    </div>
  );
}

export default function DetailPanel() {
  useNow(60_000);
  const { selected: item } = useVault();

  return (
    <section
      aria-label="جزئیات مورد"
      className="noise relative flex h-full w-full min-w-0 flex-col overflow-hidden bg-ink-900/20"
    >
      <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-accent/[0.04] blur-[100px]" />

      <AnimatePresence mode="wait">
        {!item ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center"
          >
            <div className="relative">
              <div className="absolute -inset-10 rounded-full border border-white/[0.04]" />
              <div className="absolute -inset-20 rounded-full border border-white/[0.03]" />
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/[0.07] bg-ink-850 shadow-glow">
                <ShieldEllipsis size={40} className="text-accent/70" strokeWidth={1.4} />
              </div>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-zinc-200">
                گاوصندوق باز شد
              </p>
              <p className="mt-1.5 text-[13px] text-zinc-500">
                برای دیدن محتوای رمزنگاری‌شده، یک مورد را انتخاب کنید
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 overflow-y-auto"
          >
            <ItemBody item={item} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
