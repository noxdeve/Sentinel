import { describe, it, expect } from "vitest";
import {
  generatePassword,
  scorePassword,
  findReused,
  securityScore,
  reltime,
  avatarGradient,
  uid,
  type VaultItem,
} from "./data";

const base: Omit<VaultItem, "id" | "name"> = {
  username: "u",
  password: "aaaaaaaaaaaa!",
  url: "example.com",
  category: "login",
  favorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastUsedAt: Date.now(),
};

function make(id: string, password: string): VaultItem {
  return { ...base, id, name: id, password };
}

describe("generatePassword", () => {
  it("respects the requested length", () => {
    for (const length of [8, 20, 48]) {
      expect(
        generatePassword({
          length,
          upper: true,
          lower: true,
          digits: true,
          symbols: true,
        }),
      ).toHaveLength(length);
    }
  });

  it("only uses the selected character sets", () => {
    const pw = generatePassword({
      length: 200,
      upper: false,
      lower: false,
      digits: true,
      symbols: false,
    });
    expect(pw).toMatch(/^[0-9]+$/);
  });

  it("includes every enabled set", () => {
    const pw = generatePassword({
      length: 8,
      upper: true,
      lower: true,
      digits: true,
      symbols: true,
    });
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[0-9]/);
    expect(pw).toMatch(/[^A-Za-z0-9]/);
  });

  it("produces distinct values across calls", () => {
    const opts = { length: 24, upper: true, lower: true, digits: true, symbols: true };
    const set = new Set(Array.from({ length: 50 }, () => generatePassword(opts)));
    expect(set.size).toBeGreaterThan(45);
  });
});

describe("scorePassword", () => {
  it("flags empty and trivial passwords as weak", () => {
    expect(scorePassword("").score).toBe(0);
    expect(scorePassword("password123").score).toBeLessThanOrEqual(1);
  });

  it("scores long mixed passwords highly", () => {
    expect(scorePassword("Qx9!vRz#2mLt$wKp7@nBz").score).toBe(4);
  });
});

describe("findReused", () => {
  it("flags logins sharing a password", () => {
    const items = [make("a", "same"), make("b", "same"), make("c", "unique!")];
    const reused = findReused(items);
    expect(reused.has("a")).toBe(true);
    expect(reused.has("b")).toBe(true);
    expect(reused.has("c")).toBe(false);
  });
});

describe("securityScore", () => {
  it("returns 100 when there are no logins", () => {
    expect(securityScore([], new Set())).toBe(100);
  });

  it("penalises weak and breached credentials", () => {
    const items = [make("a", "password123")];
    items[0].breached = true;
    const score = securityScore(items, new Set());
    expect(score).toBeLessThan(100);
  });
});

describe("helpers", () => {
  it("reltime formats recent timestamps", () => {
    expect(reltime(Date.now())).toBe("همین حالا");
    expect(reltime(Date.now() - 3 * 3600_000)).toBe("3 ساعت پیش");
  });

  it("avatarGradient is deterministic", () => {
    expect(avatarGradient("GitHub")).toEqual(avatarGradient("GitHub"));
  });

  it("uid returns unique hex ids", () => {
    expect(uid()).toMatch(/^[0-9a-f]{16}$/);
    expect(uid()).not.toBe(uid());
  });
});
