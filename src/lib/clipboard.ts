/**
 * Clipboard helpers.
 *
 * `copyText` writes to the clipboard with a fallback for insecure contexts.
 * `scheduleClipboardClear` wipes the clipboard after a delay so copied
 * secrets do not linger (a new copy/schedule cancels the previous one).
 */

let clearTimer: ReturnType<typeof setTimeout> | undefined;

export function cancelClipboardClear(): void {
  if (clearTimer !== undefined) {
    clearTimeout(clearTimer);
    clearTimer = undefined;
  }
}

export function scheduleClipboardClear(delayMs: number): void {
  cancelClipboardClear();
  if (delayMs <= 0) return;
  clearTimer = setTimeout(() => {
    clearTimer = undefined;
    void writeClipboard("");
  }, delayMs);
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function copyText(text: string): Promise<boolean> {
  return writeClipboard(text);
}
