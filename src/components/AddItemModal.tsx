import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Globe,
  CreditCard,
  FileText,
  Fingerprint,
  Sparkles,
  Eye,
  EyeOff,
  ShieldPlus,
} from "lucide-react";
import { Category, VaultItem, generatePassword, scorePassword, uid } from "../data";
import { useVault } from "../vault-context";
import { StrengthBar } from "./ui";
import { useEscape, useFocusTrap, useScrollLock } from "../hooks";
import { cn } from "../utils/cn";

const CATS: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: "login", label: "ورود", icon: <Globe size={14} /> },
  { id: "card", label: "کارت", icon: <CreditCard size={14} /> },
  { id: "note", label: "یادداشت", icon: <FileText size={14} /> },
  { id: "identity", label: "هویت", icon: <Fingerprint size={14} /> },
];

const fieldClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-ink-850 px-3.5 text-[13px] text-zinc-100 transition-all outline-none placeholder:text-zinc-500 focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(52,227,155,0.08)]";
const labelClass =
  "mb-1.5 block text-[10px] font-semibold text-zinc-400 uppercase";

function Input({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} {...props} className={fieldClass} />
    </div>
  );
}

/**
 * Keyed by the edit target so form state is seeded fresh each time the
 * dialog opens — avoids synchronising props into state with an effect.
 */
function ItemForm({
  initial,
  onClose,
}: {
  initial: VaultItem | null;
  onClose: () => void;
}) {
  const { saveItem, settings } = useVault();
  const uidPrefix = React.useId();
  const editing = Boolean(initial);

  const [name, setName] = React.useState(initial?.name ?? "");
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [username, setUsername] = React.useState(initial?.username ?? "");
  const [password, setPassword] = React.useState(initial?.password ?? "");
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [category, setCategory] = React.useState<Category>(
    initial?.category ?? "login",
  );
  const [show, setShow] = React.useState(false);

  const save = () => {
    if (!name.trim()) return;
    const now = Date.now();
    saveItem({
      id: initial?.id ?? uid(),
      name: name.trim(),
      url: url.trim() || "—",
      username: username.trim() || "—",
      password:
        password ||
        generatePassword({
          length: settings.generatorLength,
          upper: true,
          lower: true,
          digits: true,
          symbols: true,
        }),
      notes: notes.trim() || undefined,
      category,
      favorite: initial?.favorite ?? false,
      twoFA: initial?.twoFA ?? false,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      lastUsedAt: now,
    });
    onClose();
  };

  return (
    <>
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-accent/[0.07] blur-3xl" />

      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08]">
            <ShieldPlus size={15} className="text-accent" />
          </div>
          <h2 className="font-display text-base font-bold text-white">
            {editing ? "ویرایش مورد" : "مورد جدید گاوصندوق"}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="بستن پنجره"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        {/* category */}
        <div role="radiogroup" aria-label="دسته‌بندی" className="grid grid-cols-4 gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95",
                category === c.id
                  ? "border-accent/40 bg-accent/[0.08] text-accent"
                  : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/[0.14] hover:text-zinc-200",
              )}
            >
              {c.icon}
              <span className="text-[11px] font-semibold">{c.label}</span>
            </button>
          ))}
        </div>

        <Input
          id={`${uidPrefix}-title`}
          label="عنوان"
          placeholder="مثلاً گیت‌هاب"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id={`${uidPrefix}-user`}
            label={category === "card" ? "شماره کارت" : "نام کاربری"}
            placeholder={category === "card" ? "•••• 4007" : "you@site.com"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            id={`${uidPrefix}-url`}
            label="وبگاه"
            placeholder="example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={`${uidPrefix}-password`} className={labelClass}>
            {category === "card" ? "پین / CVV" : "رمز عبور"}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <input
                id={`${uidPrefix}-password`}
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="برای ساخت خودکار خالی بگذارید"
                className={cn(fieldClass, "pe-10 font-mono")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
                aria-pressed={show}
                className="absolute top-1/2 end-2 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                setPassword(
                  generatePassword({
                    length: settings.generatorLength,
                    upper: true,
                    lower: true,
                    digits: true,
                    symbols: true,
                  }),
                )
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-3.5 text-[12px] font-semibold text-accent transition-all hover:bg-accent/[0.14] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 sm:justify-start"
            >
              <Sparkles size={13} />
              تولید
            </button>
          </div>
          {password && (
            <StrengthBar strength={scorePassword(password)} className="mt-2.5" />
          )}
        </div>

        <div>
          <label htmlFor={`${uidPrefix}-notes`} className={labelClass}>
            یادداشت‌ها
          </label>
          <textarea
            id={`${uidPrefix}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="نکات بازیابی، دسترسی مشترک، تاریخ انقضا…"
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-ink-850 px-3.5 py-3 text-[13px] text-zinc-100 transition-all outline-none placeholder:text-zinc-500 focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(52,227,155,0.08)]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4 sm:px-6">
        <button
          onClick={onClose}
          className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-[13px] font-semibold text-zinc-300 transition-all hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95"
        >
          انصراف
        </button>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-ink-950 transition-all hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {editing ? "ذخیره تغییرات" : "ذخیره در گاوصندوق"}
        </button>
      </div>
    </>
  );
}

export default function AddItemModal() {
  const { modalOpen, editTarget, closeModal } = useVault();
  const dialogRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => closeModal(), [closeModal]);
  useEscape(modalOpen, close);
  useScrollLock(modalOpen);
  useFocusTrap(modalOpen, dialogRef);

  return (
    <AnimatePresence>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={editTarget ? "ویرایش مورد" : "مورد جدید گاوصندوق"}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900 shadow-2xl shadow-black/70"
          >
            <ItemForm
              key={editTarget?.id ?? "new"}
              initial={editTarget}
              onClose={close}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
