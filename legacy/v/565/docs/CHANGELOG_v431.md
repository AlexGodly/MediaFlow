# MediaFlow v431 Beta — Verified Cover URL Auto-Save & Navigation Cleanup

- Fix Dashboard Missing Covers auto-save: verified image loading, not the appearance of a URL, is the trigger for Save cover & Next.
- Allow a valid pasted/typed URL and a consciously selected search result to save and advance when opt-in is enabled; enabling the option after a validated URL is already present also works.
- Wait for the v235 image validator on the Find Cover Automatically selection path before committing, preserving the original queue/XP semantics.
- Keep provider-generated unattended cover selection conservative: automatic search result acceptance requires exactly one uniquely ID-verified high-confidence match. Ambiguous results require explicit selection.
- Add cross-title, account, request and duplicate-save guards.
- Suppress the unwanted circled-arrow/action icon from Level/Streak in desktop top and bottom navigation, including first paint.
- Preserve MediaFlow dynamic theme, Settings, databases, all personal Library content, and tablet/mobile layouts.

## Verification
v431 targeted regression checks, legacy recovery tests, build/syntax checks, and browser smoke are run by the v431 GitHub Actions quality gate.
