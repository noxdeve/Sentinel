export type Category = "login" | "card" | "note" | "identity";
export type View = "all" | "favorites" | Category | "watchtower";

export interface VaultItem {
  id: string;
  name: string;
  username: string;
  password: string;
  url: string;
  category: Category;
  favorite: boolean;
  breached?: boolean;
  twoFA?: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
}

const H = 3600_000;
const D = 24 * H;
const NOW = Date.now();

export const INITIAL_ITEMS: VaultItem[] = [
  {
    id: "gh",
    name: "GitHub",
    username: "mara@sentinel.app",
    password: "Qx9!vRz#2mLt$wKp7@nB",
    url: "github.com",
    category: "login",
    favorite: true,
    twoFA: true,
    notes: "حساب کاری اصلی. کدهای بازیابی در صندوق امانات نگهداری می‌شود.",
    createdAt: NOW - 540 * D,
    updatedAt: NOW - 12 * D,
    lastUsedAt: NOW - 2 * H,
  },
];

/* ---------------- password intelligence ---------------- */

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: "خالی", color: "#fb7185" };
  let pts = 0;
  if (pw.length >= 8) pts++;
  if (pw.length >= 12) pts++;
  if (pw.length >= 16) pts++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) pts++;
  if (/\d/.test(pw)) pts++;
  if (/[^a-zA-Z0-9]/.test(pw)) pts++;
  if (/(.)\1{2,}/.test(pw)) pts--;
  if (/^(password|hunter|letmein|qwerty|admin|sunset|coffee)/i.test(pw)) pts -= 2;
  const map: Strength[] = [
    { score: 0, label: "بحرانی", color: "#fb7185" },
    { score: 1, label: "ضعیف", color: "#fb7185" },
    { score: 2, label: "متوسط", color: "#fbbf24" },
    { score: 3, label: "قوی", color: "#34e39b" },
    { score: 4, label: "بسیار قوی", color: "#6ff2b8" },
  ];
  const idx = Math.max(0, Math.min(4, Math.round(pts * 0.66)));
  return map[idx];
}

export function isWeak(item: VaultItem) {
  return scorePassword(item.password).score <= 1;
}

export function findReused(items: VaultItem[]): Set<string> {
  const seen = new Map<string, number>();
  items.forEach((i) => {
    if (i.category === "login")
      seen.set(i.password, (seen.get(i.password) ?? 0) + 1);
  });
  const reusedPw = new Set(
    [...seen.entries()].filter(([, c]) => c > 1).map(([p]) => p),
  );
  return new Set(
    items.filter((i) => reusedPw.has(i.password)).map((i) => i.id),
  );
}

export function isOld(item: VaultItem) {
  return Date.now() - item.updatedAt > 365 * 24 * 3600_000;
}

export function securityScore(items: VaultItem[], reused: Set<string>): number {
  const logins = items.filter((i) => i.category === "login");
  if (!logins.length) return 100;
  let penalty = 0;
  logins.forEach((i) => {
    if (isWeak(i)) penalty += 7;
    if (reused.has(i.id)) penalty += 6;
    if (i.breached) penalty += 12;
    if (isOld(i)) penalty += 3;
  });
  return Math.max(4, Math.min(100, Math.round(100 - penalty)));
}

/* ---------------- generator ---------------- */

const SETS = {
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  lower: "abcdefghijkmnopqrstuvwxyz",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{}<>?",
};

export interface GenOpts {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
}

/**
 * Cryptographically secure random integer in [0, max) using rejection
 * sampling so every index is equally likely (no modulo bias).
 */
function secureRandomIndex(max: number): number {
  if (max <= 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  for (;;) {
    crypto.getRandomValues(buf);
    const value = buf[0];
    if (value < limit) return value % max;
  }
}

export function generatePassword(o: GenOpts): string {
  let pool = "";
  const required: string[] = [];
  (Object.keys(SETS) as (keyof typeof SETS)[]).forEach((k) => {
    if (o[k]) {
      pool += SETS[k];
      required.push(SETS[k][secureRandomIndex(SETS[k].length)]);
    }
  });
  if (!pool) pool = SETS.lower;
  const out = required.slice();
  while (out.length < o.length) out.push(pool[secureRandomIndex(pool.length)]);
  // Fisher–Yates shuffle with a secure source of randomness.
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

/* ---------------- misc ---------------- */

export function reltime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "همین حالا";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} روز پیش`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} ماه پیش`;
  return `${Math.floor(mo / 12)} سال پیش`;
}

export function fullDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fa-IR", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function avatarGradient(name: string): {
  from: string;
  to: string;
} {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return {
    from: `hsl(${h}, 65%, 52%)`,
    to: `hsl(${(h + 48) % 360}, 70%, 30%)`,
  };
}

export const uid = () => {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
};
