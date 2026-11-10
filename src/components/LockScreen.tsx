import React from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  User,
  Loader2,
} from "lucide-react";
import { useVault } from "../vault-context";
import { createAccount, isTauri, unlockVault, userExists } from "../lib/backend";
import { cn } from "../utils/cn";

async function checkUser(): Promise<boolean> {
  try {
    return await userExists();
  } catch (error) {
    console.error("User status error:", error);
    return false;
  }
}

export default function LockScreen() {
  const { unlock } = useVault();
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [un, setUn] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const tauri = isTauri();
  // Outside the Tauri shell there is no backend to authenticate against;
  // start straight on the unlock form for the local browser-preview vault.
  const [userStatus, setUserStatus] = React.useState<boolean | null>(
    tauri ? null : true,
  );
  const errorTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (tauri) checkUser().then(setUserStatus);
    return () => clearTimeout(errorTimer.current);
  }, [tauri]);

  const flashError = (message: string) => {
    setError(message);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(""), 2400);
  };

  async function submit() {
    if (busy || !pw) return;
    setError("");
    if (!tauri) {
      setBusy(true);
      setTimeout(unlock, 400);
      return;
    }
    try {
      const result = await unlockVault(pw);
      if (result) {
        setBusy(true);
        setTimeout(unlock, 1100);
      } else {
        flashError("رمز عبور نادرست است.");
        checkUser().then(setUserStatus);
      }
    } catch (e) {
      flashError("تأیید رمز عبور ممکن نشد. دوباره تلاش کنید.");
      console.error(e);
    }
  }

  async function signup() {
    setError("");

    if (un.trim().length < 3) {
      flashError("نام کاربری باید دست‌کم ۳ نویسه باشد.");
      return;
    }
    if (pw.length < 6) {
      flashError("رمز عبور باید دست‌کم ۶ نویسه باشد.");
      return;
    }
    if (pw !== pw2) {
      flashError("رمزهای عبور یکسان نیستند.");
      return;
    }

    try {
      setBusy(true);
      await createAccount(un.trim(), pw);
      const status = await checkUser();
      setUserStatus(status);
      if (status) setTimeout(unlock, 500);
    } catch (err) {
      console.error("Signup error:", err);
      flashError("ساخت حساب کاربری ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  const statusText = busy
    ? "ساخت کلیدها · رمزگشایی گاوصندوق…"
    : error
      ? error
      : "همه‌چیز امن است.";

  return (
    <motion.div
      className="noise bg-grid relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-ink-950"
      exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* ambient orbs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
      <div className="float-y pointer-events-none absolute top-1/4 -left-32 h-72 w-72 rounded-full bg-violet/[0.08] blur-[100px]" />
      <div
        className="float-y pointer-events-none absolute right-[-60px] bottom-1/4 h-80 w-80 rounded-full bg-accent/[0.06] blur-[110px]"
        style={{ animationDelay: "-3s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-[400px] flex-col items-center px-4 sm:px-6"
      >
        {/* logo mark */}
        <img src="/logo.png" alt="نشان سنتینل" className="logo" />

        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sentinel
        </h1>
        <p className="mt-2 text-center text-[10px] text-zinc-500 uppercase sm:text-[11px]">
          گاوصندوق صفر-دانش · AES-256
        </p>

        {/* unlock / signup card */}
        {userStatus === null ? (
          <div
            className="mt-10 flex items-center gap-2 text-[12px] text-zinc-500"
            role="status"
          >
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            بررسی گاوصندوق…
          </div>
        ) : userStatus ? (
          <div
            className={cn(
              "mt-10 w-full rounded-2xl border border-white/[0.07] bg-ink-850/80 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-shadow duration-300",
              busy && "shadow-glow",
              error && "shake border-danger/40",
            )}
          >
            <div className="flex items-center gap-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                ) : (
                  <Lock className="h-5 w-5 text-zinc-400" strokeWidth={1.8} />
                )}
              </div>
              <input
                type={show ? "text" : "password"}
                autoFocus
                value={pw}
                disabled={busy}
                aria-label="رمز اصلی"
                aria-invalid={Boolean(error)}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="رمز اصلی"
                className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-zinc-100 outline-none placeholder:font-sans placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                tabIndex={-1}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}                  aria-label="باز کردن گاوصندوق"
                className="group flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink-950 transition-all duration-200 hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 disabled:opacity-70"
              >
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                />
              </button>
            </div>
          </div>
        ) : (
          <section className="w-full">
            <div
              className={cn(
                "mt-10 w-full rounded-2xl border border-white/[0.07] bg-ink-850/80 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-shadow duration-300",
                busy && "shadow-glow",
                error && "shake border-danger/40",
              )}
            >
              <div className="flex items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  ) : (
                    <User className="h-5 w-5 text-zinc-400" strokeWidth={1.8} />
                  )}
                </div>
                <input
                  type="text"
                  autoFocus
                  value={un}
                  disabled={busy}
                  aria-label="نام کاربری"
                  onChange={(e) => setUn(e.target.value)}
                  placeholder="نام کاربری"
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-zinc-100 outline-none placeholder:font-sans placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div
              className={cn(
                "mt-5 w-full rounded-2xl border border-white/[0.07] bg-ink-850/80 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-shadow duration-300",
                busy && "shadow-glow",
                error && "shake border-danger/40",
              )}
            >
              <div className="flex items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  ) : (
                    <Lock className="h-5 w-5 text-zinc-400" strokeWidth={1.8} />
                  )}
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={pw}
                  disabled={busy}
                  aria-label="رمز عبور"
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="رمز عبور"
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-zinc-100 outline-none placeholder:font-sans placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              className={cn(
                "mt-5 w-full rounded-2xl border border-white/[0.07] bg-ink-850/80 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl transition-shadow duration-300",
                busy && "shadow-glow",
                error && "shake border-danger/40",
              )}
            >
              <div className="flex items-center gap-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
                  {busy ? (
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  ) : (
                    <Lock className="h-5 w-5 text-zinc-400" strokeWidth={1.8} />
                  )}
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={pw2}
                  disabled={busy}
                  aria-label="تأیید رمز عبور"
                  onChange={(e) => setPw2(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && signup()}
                  placeholder="تأیید رمز عبور"
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-zinc-100 outline-none placeholder:font-sans placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={signup}
                  disabled={busy}
                  aria-label="ساخت گاوصندوق"
                  className="group flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-ink-950 transition-all duration-200 hover:bg-accent-strong hover:shadow-glow focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none active:scale-95 disabled:opacity-70"
                >
                  <ArrowLeft
                    size={18}
                    className="transition-transform duration-200 group-hover:-translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          </section>
        )}

        <div
          role="status"
          aria-live="polite"
          className={cn(
            "mt-4 flex items-center gap-2 rounded-full border px-3.5 py-1.5 transition-colors duration-300",
            error
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-white/[0.06] bg-white/[0.03] text-zinc-400",
          )}
        >
          <KeyRound size={12} />
          <span className="text-[11px] font-medium">{statusText}</span>
        </div>
      </motion.div>

      {/* footer */}
      <div className="absolute bottom-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 text-center text-[10px] text-zinc-500 uppercase sm:bottom-8 sm:gap-x-6">
        <span>رمزنگاری سرتاسری</span>
        <span className="h-1 w-1 rounded-full bg-zinc-600" />
        <span>ذخیره محلی</span>
        <span className="h-1 w-1 rounded-full bg-zinc-600" />
        <span>v0.5.0</span>
      </div>
    </motion.div>
  );
}
