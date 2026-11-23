import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings2,
  Lock,
  Timer,
  ClipboardCopy,
  Dices,
  Fingerprint,
  Loader2,
} from "lucide-react";
import { useVault } from "../vault-context";
import { useEscape, useFocusTrap, useScrollLock } from "../hooks";
import { unlockVault } from "../lib/backend";
import {
  enrollBiometric,
  forgetBiometricCredential,
  getBiometryStatus,
  hasBiometricCredential,
} from "../lib/biometric";
import { cn } from "../utils/cn";

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
  const { settings, setSettings, settingsOpen, setSettingsOpen, lock, notify } =
    useVault();
  const panelRef = React.useRef<HTMLDivElement>(null);

  const [bioAvailable, setBioAvailable] = React.useState(false);
  const [bioEnabled, setBioEnabled] = React.useState(() => hasBiometricCredential());
  const [bioPassword, setBioPassword] = React.useState("");
  const [bioError, setBioError] = React.useState("");
  const [bioBusy, setBioBusy] = React.useState(false);
  const [enrolling, setEnrolling] = React.useState(false);

  const close = React.useCallback(() => {
    setSettingsOpen(false);
    setBioPassword("");
    setBioError("");
    setEnrolling(false);
  }, [setSettingsOpen]);
  useEscape(settingsOpen, close);
  useScrollLock(settingsOpen);
  useFocusTrap(settingsOpen, panelRef);

  // Re-check the device each time the panel opens: biometrics can be enrolled,
  // removed, or locked out while the app is running.
  React.useEffect(() => {
    if (!settingsOpen) return;
    let cancelled = false;
    void getBiometryStatus().then((status) => {
      if (!cancelled) setBioAvailable(Boolean(status));
    });
    return () => {
      cancelled = true;
    };
  }, [settingsOpen]);

  async function enableBiometric(event: React.FormEvent) {
    event.preventDefault();
    if (bioBusy || !bioPassword) return;
    setBioBusy(true);
    setBioError("");
    try {
      // Verify first so a typo can never be wrapped and stored as the
      // biometric credential.
      if (!(await unlockVault(bioPassword))) {
        setBioError("رمز اصلی نادرست است.");
        return;
      }
      const result = await enrollBiometric(bioPassword);
      if (result === "enrolled") {
        setBioEnabled(true);
        setBioPassword("");
        setEnrolling(false);
        notify("ورود با اثر انگشت فعال شد");
      } else if (result === "cancelled") {
        setBioError("درخواست اثر انگشت لغو شد.");
      } else {
        setBioError("فعال‌سازی ورود بیومتریک ممکن نشد.");
      }
    } catch (error) {
      console.error("Biometric enrollment failed", error);
      setBioError("فعال‌سازی ورود بیومتریک ممکن نشد.");
    } finally {
      setBioBusy(false);
    }
  }

  function disableBiometric() {
    forgetBiometricCredential();
    setBioEnabled(false);
    setBioPassword("");
    setEnrolling(false);
    setBioError("");
    notify("ورود با اثر انگشت غیرفعال شد");
  }

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
                <h2 className="font-display text-base font-bold text-white">تنظیمات</h2>
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

              {(bioAvailable || bioEnabled) && (
                <Row
                  icon={<Fingerprint size={15} />}
                  title="ورود با اثر انگشت"
                  description="بدون تایپ رمز اصلی، گاوصندوق را با اثر انگشت یا چهره باز کنید."
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] text-zinc-400">
                      {bioEnabled ? "فعال" : "غیرفعال"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={bioEnabled}
                      aria-label="ورود با اثر انگشت"
                      disabled={bioBusy}
                      onClick={() => {
                        if (bioEnabled) {
                          disableBiometric();
                        } else {
                          setBioError("");
                          setEnrolling(true);
                        }
                      }}
                      className={cn(
                        "relative h-6 w-11 rounded-full border transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none disabled:opacity-60",
                        bioEnabled
                          ? "border-accent/40 bg-accent/80"
                          : "border-white/[0.12] bg-white/[0.06]",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200",
                          bioEnabled ? "start-[calc(100%-1.375rem)]" : "start-0.5",
                        )}
                      />
                    </button>
                  </div>

                  {enrolling && !bioEnabled && (
                    <form onSubmit={enableBiometric} className="mt-3 space-y-2">
                      <input
                        type="password"
                        value={bioPassword}
                        disabled={bioBusy}
                        autoFocus
                        aria-label="رمز اصلی برای فعال‌سازی اثر انگشت"
                        placeholder="رمز اصلی را وارد کنید"
                        onChange={(e) => setBioPassword(e.target.value)}
                        className="h-10 w-full rounded-lg border border-white/[0.08] bg-ink-900 px-3 font-mono text-[13px] text-zinc-100 outline-none transition-all placeholder:font-sans placeholder:text-zinc-500 focus:border-accent/40 focus:shadow-[0_0_0_3px_rgba(52,227,155,0.08)]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={bioBusy || !bioPassword}
                          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-[12px] font-bold text-ink-950 transition-all hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60"
                        >
                          {bioBusy ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Fingerprint size={14} />
                          )}
                          فعال‌سازی
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEnrolling(false);
                            setBioPassword("");
                            setBioError("");
                          }}
                          className="h-9 rounded-lg border border-white/[0.08] px-3 text-[12px] text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-200"
                        >
                          انصراف
                        </button>
                      </div>
                      {bioError && (
                        <p className="text-[11px] text-danger" role="alert">
                          {bioError}
                        </p>
                      )}
                    </form>
                  )}

                  {!enrolling && bioError && (
                    <p className="mt-2 text-[11px] text-danger" role="alert">
                      {bioError}
                    </p>
                  )}
                </Row>
              )}

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
