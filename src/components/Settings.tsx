import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings2, Lock, Timer, ClipboardCopy, Dices } from "lucide-react";
import { useVault } from "../vault-context";
import { useEscape, useFocusTrap, useScrollLock } from "../hooks";

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-850/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-accent">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-zinc-100">{title}</div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
            {description}
          </p>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

const selectClass =
  "h-10 w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 text-[13px] text-zinc-100 outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(52,227,155,0.08)]";

export default function SettingsPanel() {
  const { settings, setSettings, settingsOpen, setSettingsOpen, lock } = useVault();
  const panelRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => setSettingsOpen(false), [setSettingsOpen]);
  useEscape(settingsOpen, close);
  useScrollLock(settingsOpen);
  useFocusTrap(settingsOpen, panelRef);

  return (
    <AnimatePresence>
      {settingsOpen && (
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
            aria-label="تنظیمات"
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-white/[0.07] bg-ink-900 shadow-2xl shadow-black/70"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08]">
                  <Settings2 size={15} className="text-accent" />
                </div>
                <h2 className="font-display text-base font-bold text-white">
                  تنظیمات
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="بستن تنظیمات"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/[0.05] hover:text-white active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6 sm:px-6">
              <Row
                icon={<Timer size={15} />}
                title="قفل خودکار"
                description="گاوصندوق پس از مدتی بی‌کاری به‌صورت خودکار قفل می‌شود."
              >
                <select
                  value={settings.autoLockMinutes}
                  onChange={(e) =>
                    setSettings({ autoLockMinutes: Number(e.target.value) })
                  }
                  className={selectClass}
                >
                  <option value={1}>پس از ۱ دقیقه</option>
                  <option value={5}>پس از ۵ دقیقه</option>
                  <option value={15}>پس از ۱۵ دقیقه</option>
                  <option value={30}>پس از ۳۰ دقیقه</option>
                  <option value={0}>هرگز</option>
                </select>
              </Row>

              <Row
                icon={<ClipboardCopy size={15} />}
                title="پاک‌سازی کلیپ‌بورد"
                description="رمزهای کپی‌شده به‌صورت خودکار از کلیپ‌بورد پاک می‌شوند."
              >
                <select
                  value={settings.clipboardClearSeconds}
                  onChange={(e) =>
                    setSettings({ clipboardClearSeconds: Number(e.target.value) })
                  }
                  className={selectClass}
                >
                  <option value={15}>پس از ۱۵ ثانیه</option>
                  <option value={30}>پس از ۳۰ ثانیه</option>
                  <option value={45}>پس از ۴۵ ثانیه</option>
                  <option value={60}>پس از ۶۰ ثانیه</option>
                  <option value={0}>هرگز</option>
                </select>
              </Row>

              <Row
                icon={<Dices size={15} />}
                title="طول پیش‌فرض رمز عبور"
                description="طول آغازین برای تولیدکننده رمز عبور."
              >
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={8}
                    max={48}
                    value={settings.generatorLength}
                    onChange={(e) =>
                      setSettings({ generatorLength: Number(e.target.value) })
                    }
                    aria-label="طول پیش‌فرض رمز عبور"
                    className="w-full"
                    style={
                      {
                        "--fill": `${((settings.generatorLength - 8) / 40) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                  <span className="w-9 shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-center font-mono text-[12px] font-semibold text-accent">
                    {settings.generatorLength}
                  </span>
                </div>
              </Row>

              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  تنظیمات فقط روی همین دستگاه ذخیره می‌شود و هرگز از آن خارج نمی‌شود.
                </p>
              </div>

              <button
                onClick={() => {
                  close();
                  lock();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-[13px] font-semibold text-zinc-300 transition-all hover:border-danger/40 hover:bg-danger/10 hover:text-danger active:scale-[0.98]"
              >
                <Lock size={14} />
                همین حالا قفل کن
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
