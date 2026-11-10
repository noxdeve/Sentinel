import React from "react";
import {
  CreditCard,
  FileText,
  Fingerprint,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { VaultItem, Category, avatarGradient, Strength } from "../data";
import { useVault } from "../vault-context";
import { cn } from "../utils/cn";

/* ---------------- avatar ---------------- */

export function CategoryGlyph({
  category,
  className,
}: {
  category: Category;
  className?: string;
}) {
  const C =
    category === "card"
      ? CreditCard
      : category === "note"
        ? FileText
        : category === "identity"
          ? Fingerprint
          : Globe;
  return <C className={className} strokeWidth={1.8} />;
}

export function Avatar({
  item,
  size = 38,
  className,
}: {
  item: VaultItem;
  size?: number;
  className?: string;
}) {
  const g = avatarGradient(item.name);
  const isLogin = item.category === "login";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${g.from}22, ${g.to}44)`,
        border: `1px solid ${g.from}33`,
      }}
      aria-hidden="true"
    >
      {isLogin ? (
        <span
          className="font-display font-semibold"
          style={{ color: g.from, fontSize: size * 0.42, lineHeight: 1 }}
        >
          {item.name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <CategoryGlyph category={item.category} className="h-[45%] w-[45%]" />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${g.from}2e, transparent 65%)`,
        }}
      />
    </div>
  );
}

/* ---------------- badges ---------------- */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "warn" | "accent" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "bg-white/[0.06] text-zinc-300 border-white/[0.06]",
    danger: "bg-danger/10 text-danger border-danger/20",
    warn: "bg-warn/10 text-warn border-warn/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    violet: "bg-violet/10 text-violet border-violet/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- strength bar ---------------- */

export function StrengthBar({
  strength,
  className,
}: {
  strength: Strength;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={strength.score}
      aria-label={`قدرت رمز عبور: ${strength.label}`}
    >
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{
              background:
                i < strength.score ? strength.color : "rgba(255,255,255,0.08)",
              boxShadow:
                i < strength.score ? `0 0 8px ${strength.color}66` : "none",
            }}
          />
        ))}
      </div>
      <span
        className="text-[11px] font-semibold whitespace-nowrap"
        style={{ color: strength.color }}
      >
        {strength.label}
      </span>
    </div>
  );
}

/* ---------------- copy button ---------------- */

export function CopyButton({
  value,
  label = "در کلیپ‌بورد کپی شد",
  className,
  size = 15,
}: {
  value: string;
  /** Toast message shown after a successful copy. */
  label?: string;
  className?: string;
  size?: number;
}) {
  const { copy } = useVault();
  const [ok, setOk] = React.useState(false);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={async (e) => {
        e.stopPropagation();
        if (await copy(value, label)) {
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        }
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100 focus-visible:border-accent/50 focus-visible:outline-none active:scale-90",
        ok && "text-accent! border-accent/30! bg-accent/10!",
        className,
      )}
    >
      {ok ? <Check size={size} /> : <Copy size={size} />}
    </button>
  );
}

/* ---------------- masked dots ---------------- */

export function MaskedPassword({ className }: { className?: string }) {
  return (
    <span className={cn("font-mono tracking-[0.22em] text-zinc-400", className)}>
      ••••••••••
    </span>
  );
}
