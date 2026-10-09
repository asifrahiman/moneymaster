"use client";

/*
 * Installable-app plumbing. Chrome fires `beforeinstallprompt` once, early, when the
 * app can be installed; we keep the event so an "Install app" menu item can show the
 * prompt later. Subscribers are told when it becomes (un)available.
 */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function initPwa() {
  if (typeof window === "undefined" || (window as { __mmPwa?: boolean }).__mmPwa) return;
  (window as { __mmPwa?: boolean }).__mmPwa = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we offer it from the menu instead of Chrome's mini-bar
    deferred = e as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });

  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }
}

export const canInstall = () => deferred !== null;

export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall() {
  const e = deferred;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  deferred = null;
  emit();
  return outcome === "accepted";
}
