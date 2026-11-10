import React from "react";
import { ShieldAlert } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so a single crash doesn't leave the user with a
 * blank window. Offers a reload action.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Sentinel crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center gap-5 bg-ink-950 px-6 text-center text-zinc-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
          <ShieldAlert size={28} className="text-danger" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold text-white">
            مشکلی پیش آمد
          </h1>
          <p className="mt-1.5 max-w-sm text-[13px] text-zinc-500">
            سنتینل با خطای پیش‌بینی‌نشده‌ای روبه‌رو شد. داده‌های گاوصندوق شما دست‌نخورده است — برای ادامه صفحه را دوباره بارگذاری کنید.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-bold text-ink-950 transition-all hover:bg-accent-strong active:scale-95"
        >
          بارگذاری دوباره برنامه
        </button>
      </div>
    );
  }
}
