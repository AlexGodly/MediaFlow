# MediaFlow v501 Beta — Library-Equivalent Missing Covers in Logging

## Requested change

Logging's **added titles** and **Use Recommended Title** panel must show an actual category icon instead of a blank poster when media artwork is missing. Both the poster and icon must react to the existing cover-size settings together, like the Library.

## Implementation

- Unified the four Logging cover surfaces (Advanced, Quick, picker, and Use Recommended Title) through `mf501CoverHtml`, while retaining v500's source-level prohibition of generic circle-arrow icons.
- Source selection goes through **the original Library cover policy** (`v417LibraryCoverSource` → `v200TitleCoverSource`): genuine cover first; category-default missing image when enabled; otherwise category icon. Broken URLs reveal the same category icon.
- Partial recommended-title objects now recover the correct saved Library title by ID (or unique title when no categoryId is available), so the correct category is shown even when recommendation metadata is incomplete.
- The category icon is supplied by the **existing `v144CategoryIconHtml`**, supporting category emoji, built-in SVG and custom image icons; an actual generic Library icon is only used when the title has no usable category.
- Category icon fallback spans the entire poster and uses a dedicated CSS inline-size container. Inner SVG/image/emoji scales using container query units `cqw`, without fixed pixel icon sizes or extra "Missing Cover" text.
- Fixed narrow-phone sizing so Advanced, Quick and recommended posters respond to their existing independent Settings cover-size controls; the fallback icon scales with the poster.
- Retains existing responsive poster ratios, keyboard accessibility and click-to-Title-Details; no circled-arrow overlay.
- No Library content, category definitions, title URL, Logging drafts, History, XP, cloud sync, or Supabase persistence changes.

## Regression and browser checks

- `scripts/test-v501-category-cover-parity.cjs`: title/categorical sources, Library category-default toggle, real original cover, temporary v200 fallback, partial recommendation, broken-image handler, real category icon, safe click and zero state mutation.
- `scripts/test-v501-category-cover-browser.cjs` + `tests/fixtures/v501-category-cover-browser.html`: real CSS layout and visibility of category icons, broken cover URL becoming icon, icon-size change alongside poster-size adjustment, 360px phone / 800px tablet / 1440px desktop, no overflow.
- Previous v500 through v483 regressions retained for Logging cover sizing, circular-arrow suppression, appearance, theme ownership, rendering and recovery.
- Build and PWA integrity checks, full archive to `legacy/v/501`, GitHub Pages deploy and numeric release `501` (full ZIP and checksum).

## Follow-up

v502 can continue responsive polish and visual consistency across the Library and Logging without duplicating fallback implementations.
