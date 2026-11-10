import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Copy, Check, Dices } from "lucide-react";
import { generatePassword, scorePassword, GenOpts } from "../data";
import { useVault } from "../vault-context";
import { StrengthBar } from "./ui";
import { useEscape, useFocusTrap, useScrollLock } from "../hooks";
import { cn } from "../utils/cn";

function Toggle({
  label,
  sample,
  on,
  onChange,
}: {
  label: string;
  sample: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-[0.98]",
        on
          ? "border-accent/30 bg-accent/[0.07]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14]",
      )}
    >
      <div className="text-start">
        <div
          className={cn("text-[13px] font-semibold", on ? "text-zinc-100" : "text-zinc-400")}
        >
          {label}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">{sample}</div>
      </div>
      <div
        className={cn(
          "relative rounded-full transition-colors duration-200",
          on ? "bg-accent" : "bg-white/[0.1]",
        )}
        style={{ height: 22, width: 40 }}
      >
        <motion.div
          className="absolute top-[3px] h-4 w-4 rounded-full bg-ink-950"
          animate={{ left: on ? 22 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </div>
    </button>
  );
}

export default function GeneratorPanel() {
  const { genOpen, setGenOpen, copy, settings } = useVault();
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [opts, setOpts] = React.useState<GenOpts>({
    length: settings.generatorLength,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
  });
  const [pw, setPw] = React.useState(() => generatePassword(opts));
  const [copied, setCopied] = React.useState(false);
  const [spinning, setSpinning] = React.useState(0);

  const close = React.useCallback(() => setGenOpen(false), [setGenOpen]);
  useEscape(genOpen, close);
  useScrollLock(genOpen);
  useFocusTrap(genOpen, panelRef);

  const update = (patch: Partial<GenOpts>) => {
    const next = { ...opts, ...patch };
    setOpts(next);
    setPw(generatePassword(next));
    setSpinning((s) => s + 1);
  };

  const regenerate = () => {
    setPw(generatePassword(opts));
    setSpinning((s) => s + 1);
  };

  const strength = scorePassword(pw);

  return (
    <AnimatePresence>
      {genOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="تولیدکننده رمز عبور"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-white/[0.07] bg-ink-900 shadow-2xl shadow-black/70"
          >
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08]">
                  <Dices size={15} className="text-accent" />
                </div>
                <h2 className="font-display text-base font-bold text-white">
                  تولیدکننده رمز عبور
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="بستن تولیدکننده"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 sm:px-6">
              {/* output */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850 p-5">
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/[0.07] blur-3xl" />
                <div className="text-[10px] text-zinc-500 uppercase">
                  رمز تولیدشده
                </div>
                <div aria-live="polite" className="sr-only">
                  رمز عبور جدید تولید شد
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={spinning}
                    initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    exit={{ opacity: 0, filter: "blur(8px)", y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="mt-3 font-mono text-[17px] leading-relaxed font-medium break-all text-accent-strong"
                  >
                    {pw}
                  </motion.div>
                </AnimatePresence>
                <StrengthBar strength={strength} className="mt-4" />
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={regenerate}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[13px] font-bold text-ink-950 transition-all hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-[0.97]"
                  >
                    <RefreshCw size={14} />
                    تولید دوباره
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        await copy(
                          pw,
                          `رمز عبور کپی شد — پاک‌سازی در ${settings.clipboardClearSeconds} ثانیه`,
                        )
                      ) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1400);
                      }
                    }}
                    aria-label="کپی رمز تولیدشده"
                    className={cn(
                      "flex h-10 w-11 items-center justify-center rounded-xl border transition-all focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-90",
                      copied
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>

              {/* length */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="gen-length"
                    className="text-[13px] font-semibold text-zinc-200"
                  >
                    طول
                  </label>
                  <span className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-accent">
                    {opts.length}
                  </span>
                </div>
                <input
                  id="gen-length"
                  type="range"
                  min={8}
                  max={48}
                  value={opts.length}
                  onChange={(e) => update({ length: +e.target.value })}
                  className="w-full"
                  style={
                    {
                      "--fill": `${((opts.length - 8) / 40) * 100}%`,
                    } as React.CSSProperties
                  }
                />
                <div className="mt-2 flex justify-between font-mono text-[11px] text-zinc-500">
                  <span>8</span>
                  <span>48</span>
                </div>
              </div>

              {/* toggles */}
              <div className="grid grid-cols-2 gap-2.5">
                <Toggle
                  label="حروف بزرگ"
                  sample="A–Z"
                  on={opts.upper}
                  onChange={(v) => update({ upper: v })}
                />
                <Toggle
                  label="حروف کوچک"
                  sample="a–z"
                  on={opts.lower}
                  onChange={(v) => update({ lower: v })}
                />
                <Toggle
                  label="ارقام"
                  sample="0–9"
                  on={opts.digits}
                  onChange={(v) => update({ digits: v })}
                />
                <Toggle
                  label="نمادها"
                  sample="#$&"
                  on={opts.symbols}
                  onChange={(v) => update({ symbols: v })}
                />
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[11px] leading-relaxed text-zinc-400">
                  رمزها به‌صورت محلی روی همین دستگاه و با تصادفی‌سازی رمزنگاری قوی
                  ساخته می‌شوند. هیچ چیزی ارسال یا ثبت نمی‌شود.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
