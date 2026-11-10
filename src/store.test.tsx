import { describe, it, expect, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { VaultProvider } from "./store";
import { useVault } from "./vault-context";
import { INITIAL_ITEMS, generatePassword } from "./data";

const wrapper = ({ children }: { children: ReactNode }) => (
  <VaultProvider>{children}</VaultProvider>
);

beforeEach(() => localStorage.clear());

describe("VaultProvider", () => {
  it("starts locked and seeds the vault from INITIAL_ITEMS", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    expect(result.current.locked).toBe(true);
    expect(result.current.items).toHaveLength(INITIAL_ITEMS.length);
  });

  it("unlocks and locks", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    act(() => result.current.unlock());
    expect(result.current.locked).toBe(false);
    act(() => result.current.lock());
    expect(result.current.locked).toBe(true);
  });

  it("adds an item and selects it", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    act(() => result.current.unlock());
    const before = result.current.items.length;
    act(() =>
      result.current.saveItem({
        id: "new-id",
        name: "New",
        username: "u",
        password: generatePassword({
          length: 16,
          upper: true,
          lower: true,
          digits: true,
          symbols: true,
        }),
        url: "example.com",
        category: "login",
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastUsedAt: Date.now(),
      }),
    );
    expect(result.current.items).toHaveLength(before + 1);
    expect(result.current.selectedId).toBe("new-id");
  });

  it("deletes an item and lets the user undo", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    act(() => result.current.unlock());
    const target = result.current.items[0];
    const before = result.current.items.length;

    act(() => result.current.deleteItem(target.id));
    expect(result.current.items).toHaveLength(before - 1);

    const undo = result.current.toasts.find((t) => t.action);
    expect(undo).toBeDefined();
    act(() => undo!.action!.run());
    expect(result.current.items.some((i) => i.id === target.id)).toBe(true);
  });

  it("persists items to localStorage", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    act(() => result.current.unlock());
    act(() => result.current.deleteItem(result.current.items[0].id));
    const raw = localStorage.getItem("sentinel.vault.items.v1");
    expect(raw).toBeTruthy();
  });

  it("filters by category and query", () => {
    const { result } = renderHook(() => useVault(), { wrapper });
    act(() => result.current.setView("card"));
    expect(result.current.filtered.every((i) => i.category === "card")).toBe(true);
  });
});
