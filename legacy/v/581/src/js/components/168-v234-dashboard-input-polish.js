/* ============================================================
   MediaFlow v234 — Dashboard Quick Input Polish
   ------------------------------------------------------------
   - Gives Rate Your Library a readable, stable rating input size.
   - Gives Missing Covers a polished URL field matching the rating input.
   - Styling lives in the v234 stylesheet; runtime module owns versioning.
   ============================================================ */

const V234_RUNTIME_VERSION=234;

/* Dashboard queue behavior is intentionally unchanged. v234 only improves the
   quick-entry surfaces, so rating XP, cover saving, skipping and queue state
   continue using their existing implementations. */
MediaFlowRuntime.version=V234_RUNTIME_VERSION;
