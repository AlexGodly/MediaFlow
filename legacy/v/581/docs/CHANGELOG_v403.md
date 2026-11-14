# MediaFlow v403 — Evidence-Qualified Single-Provider No-Fresh Verification

**Version:** v403 Modular  
**Baseline:** MediaFlow v402 Modular  
**Release date:** October 13, 2026  
**Developer:** Alex Godly  
**Type:** Targeted Fresh Episodes accuracy and reliability patch  
**Database migration:** None

## 1. Summary

MediaFlow v403 addresses a remaining Automatic Multi-Provider 2 verification edge case: when one trustworthy provider supplies explicit, conclusive airing evidence, a missing episode catalogue from four other providers should not necessarily keep the title in an unresolved state.

The reported scenario was **84/84 MAL identities matched, 70 confirmed fresh, 13 caught up, 1 unresolved**, with the last fully trusted title count remaining at 69. The remaining title, MAL **#62922**, had AniList reporting **2 aired / 0 fresh**, while Tenrai, AniZip, TVmaze, and Kitsu could not provide usable episode lists. v402 required two independent usable provider results to certify a *No Fresh* decision, regardless of the quality of the single provider's schedule evidence.

v403 adds a narrow, evidence-qualified path for **Automatic Multi-Provider 2 only**. It does not assert that every single-provider zero can be trusted.

## 2. New no-fresh evidence rules

The standard v402 rules remain the default:

- Check every applicable provider for the title.
- Use the **highest verified fresh-episode count** if any credible provider confirms aired, unwatched episodes.
- A plain zero or undated count is not independently sufficient to mark a title *No Fresh*.
- Two independent usable providers remain sufficient for the existing multi-source *No Fresh* rule.
- When there is still insufficient trustworthy evidence, the result is *Unknown*, not an invented zero.

**New v403 exception:** If **AniList is the sole usable provider**, reports zero unwatched aired episodes, and has independently validated identity and conclusive release evidence, the title may be certified **No Fresh**.

Qualifying explicit evidence is one of:

1. **Dated next episode:** AniList reports a future `nextAiringEpisode.airingAt` and its `episode` number minus one **exactly equals** the aired count returned by the existing AniList adapter. The date must be more than five minutes in the future.
2. **Completed series:** AniList identifies the anime as `FINISHED`, has a positive final `episodes` total, and that total matches the episode count verified by its adapter.
3. **Not yet released:** AniList explicitly identifies the anime as `NOT_YET_RELEASED` and the adapter reports zero aired episodes.

Additional identity requirements:

- MAL-linked checks require the AniList `idMal` to match the title's verified MAL ID.
- When no MAL ID is available but a saved verified AniList ID exists, AniList's native media `id` must match exactly. Any existing MAL mapping must also agree.
- A conflicting identity, incompatible episode numbering, an already-aired next episode, missing air-date evidence, or provider request error **does not** qualify.
- Even after verifying the airing evidence, **saved Library progress must cover all confirmed aired episodes** for *No Fresh*.

This only relaxes a **high-quality single-provider negative**, not the provider checks in general. It does not change any fresh-positive result or switch the algorithm to first-provider fallback.

## 3. Behavior for the reported title

For a title with two watched and two confirmed aired episodes:

| Source | Example response | Decision |
|---|---|---|
| Tenrai | Missing usable episode list | Not evidence of zero |
| AniZip | Undated episode entries | Not evidence of zero |
| AniList | Two aired, next episode explicitly dated in the future | Qualified single-source No Fresh |
| TVmaze | No confident match | Not evidence of zero |
| Kitsu | No verified MAL mapping | Not evidence of zero |

**Result when actual AniList release metadata satisfies the criteria:** *No Fresh*, with AniList identified as the source. If this is the sole unresolved anime and all other titles remain verified, the scan can become **fully certified** instead of retaining an outdated aggregate.

**Result if AniList lacks a reliable next-airing date or final-status evidence:** The anime stays **Unknown**; the partial scan warning remains accurate. The fix cannot manufacture episode schedules that upstream APIs do not provide.

## 4. Diagnostics and traceability

- Provider results preserve the new `v403Proof` evidence on the AniList result.
- The proof records whether certification succeeded, a source-specific reason, evidence kind, and applicable aired/next-episode information.
- An expandable **Single-source verified airing schedules** section shows which titles were confirmed caught up by explicit AniList evidence, despite missing catalogue information elsewhere.
- Failed proof attempts do not silently remove the title from unresolved diagnostics; the reason stays attached to the provider result.
- Previously certified results, Unknown-safe recommendations, and v402 verification-status behavior remain intact.

The new diagnostic view is read-only and does not create Library changes, History, or XP.

## 5. Data and backwards compatibility

- Uses the existing `v377JikanLedger` and `v402FreshScan` data; no new tables, separate account system, or destructive migrations.
- Adds optional evidence metadata to the existing per-provider result array.
- Old ledger entries without a v403 proof remain readable.
- Automatic Multi-Provider 1, individual providers, and Manual Fresh Episodes behavior are unchanged.
- **Only recommend titles with fresh episodes** keeps the v402 rule: Unknown titles stay eligible; reliably confirmed caught-up titles are excluded.
- Read/write and import/export mechanisms remain the established v402 data formats.
- Corrects current-release stamps in backup, Settings, Personal Order, and Collections export wrappers to **v403**, with no schema number changes.

## 6. Source and release changes

| File | Description |
|---|---|
| `src/js/components/296-v403-single-source-airing-evidence.js` | New focused AniList airing-evidence certification, integrated with v402 Automatic 2 and its diagnostics |
| `src/js/components/294-v402-data-integrity-release-audit.js` | Bumps the release stamp used by preserved export/backup compatibility wrappers to 403 |
| `src/js/runtime-order.json` | Registers v403 extension after v402 to preserve established behavior |
| `assets/js/mediaflow-v403.bundle.js` | Rebuilt modular bundle |
| `index.html`, `VERSION`, `version.json`, `package.json`, `sw.js` | Current release metadata, asset and PWA cache references |
| `README.md` | **Evolution section only**, following the permanent repository rule |
| `README2.md` | New v403 technical notes |
| `scripts/test-v403-single-source-proof.py` | Focused positive/negative proof cases across five viewport sizes |
| `scripts/test-v403-84-title-scan.py` | Full synthetic 84-title reproduction of the reported coverage issue |
| `scripts/test-v403-auto2-regression.py`, `scripts/test-v403-data-regression.py`, `scripts/test-v403-pwa-update.py` | v402 regression coverage rerun against the v403 production bundle |

## 7. Verification and test results

**Controlled local Chromium tests; no live provider calls or authenticated Supabase actions.**

| Test | Result |
|---|---|
| Single AniList strong future next-airing proof | Passed |
| Two aired/two watched, four providers missing | Passed, No Fresh certified |
| AniList with only an undated or incomplete airing record | Passed, remains Unknown |
| Explicit FINISHED plus matching final total | Passed |
| Future next episode number inconsistent with verified count | Passed, remains Unknown |
| Failed proof request | Passed, remains Unknown |
| MAL identity mismatch | Passed, proof rejected |
| All five providers still queried | Passed |
| Strict recommendation excludes confirmed No Fresh | Passed |
| Existing Automatic 2 highest-fresh-count rule | Passed |
| Automatic 1 remains original ordered fallback | Passed |
| Synthetic 84-title verification (70 fresh / 13 usual no-fresh / 1 AniList only) | Passed: **70 fresh, 14 caught up, 0 unresolved** |
| Synthetic previously certified count 69 updated to current certified count | Passed: **69 → 70** |
| v402 data-integrity compatibility and export release stamps | Passed |
| PWA cache/version and interrupted-update simulation | Passed |
| Bundle build and JavaScript syntax validation | Passed |

Focused no-fresh tests ran at **320, 390, 820, 1280, and 1920px**. The full 84-title fixture executed **420 mocked episode-provider checks**, plus the targeted proof query, and confirmed each anime was counted once.

### Verification boundaries

The real AniList response for MAL #62922 **was not retrieved in these tests**. The title will resolve on a real v403 check only if upstream data actually contains qualifying schedule/status evidence. Real production provider mappings, offline/online Cloud Sync, 100,000-title performance, physical Android/iOS devices, and deployed PWA behavior were not verified in the test environment. No real-user data or remote services were modified.

## 8. Version evolution

- **v401:** Introduced Automatic Multi-Provider 2 and fresh-only recommendations.
- **v402:** Improved identity coverage, highest verified counts, multi-provider no-fresh decisions, Unknown eligibility, data integrity, and PWA reliability.
- **v403:** Adds confident, identity-verified AniList single-source *No Fresh* certification to address remaining partial-scan edge cases without weakening other checks.

**MediaFlow v403 — Strong Evidence, Fewer False Unknowns.**
