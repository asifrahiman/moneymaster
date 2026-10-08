/**
 * Tiny event bus so the transaction list refreshes after an add / edit / delete
 * happens anywhere on the page (the list keeps its own client-side cache).
 */
const EVENT = "mm-ledger-changed";

export function notifyLedgerChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function onLedgerChanged(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
