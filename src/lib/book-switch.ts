/**
 * Filters live in the URL (?range=…&month=…). They belong to the book that set
 * them, so drop them before switching: the next render then uses the new book's
 * default duration (All time for lifetime books, this month for monthly ones).
 */
export function clearFilterQuery() {
  if (typeof window !== "undefined" && window.location.search) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}
