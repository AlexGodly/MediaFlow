# MediaFlow v325 — Native Workspace Pages Inside Public Profiles

**Version:** 325  
**Codename:** Native Workspace Public Mirrors  
**Base:** v324 Community Modular  
**Release Date:** October 9, 2026  
**Created by:** Alex Godly  
**Status:** Community Beta — Requires database migration and owner republication

## 1. Why this release exists

v323 and v324 created public-profile pages that only approximated the familiar Workspace pages. That did not meet the requirement: a visitor browsing someone's public Library, Collections, Personal Order, Old System, History, or Statistics should see **that owner's Workspace design and data**, not simplified imitation cards.

v325 changes the architecture. The public tabs now **call MediaFlow's original Workspace renderers** against a *separate published copy of the profile owner's state*, with editing, deleting, moving, logging, import/export and other write controls removed. The visitor's own Workspace state is restored immediately and is never used as the viewed owner's source.

## 2. Public Library — native `renderLibrary()`

The public Library is rendered by the same `renderLibrary()` used in Workspace, including its original header, overview, category/status controls, title rows/cards/covers, progress information and the supported search, filtering, sorting, view and pagination actions. Original Workspace styling is retained. A read-only title detail view opens on title selection. Mutation controls are not rendered as active actions.

## 3. Public Collections — native `v274RenderCollectionsPage()`

Public Collections uses the original private-Collection page renderer, with its own source collection data and cover/title references. Browsing controls remain available where safely supported; creation, editing, deletion, moving titles and other writes are omitted. Collections remain independent of public Library visibility: the required title records are published for Collections separately.

## 4. Public Personal Order — native `v287RenderOrder()` / `renderOrder()`

The profile owner's actual ordered queue, published title data, assigned Collections and category metadata feed the native Personal Order renderer. Familiar grouping and navigation are retained when safe. The order cannot be modified by visitors. Order title and collection data can be published separately from the full Library for visibility control.

## 5. Public Old System — native `renderOldSystem()`

The original Old System renderer receives a published representation of the owner's balances, conversion rules and recorded transactions. Page views and suitable navigation remain accessible. Private conversion/credit mutations cannot be invoked from a public profile.

## 6. Public History — native `renderHistory()`

The same consumption History renderer used by Workspace displays the owner's published sessions, categories, and consumption information, with supported browsing controls. Log editing, deleting and changing private consumption records are unavailable to visitors.

## 7. Public Statistics — original published Workspace `renderStats()` snapshot

Statistics continues to display the owner's actual Workspace-generated Statistics markup through the previously introduced sanitized, sandboxed read-only snapshot system. It does **not** execute the owner's live private Statistics engine in a guest session.

## 8. Native look without private write access

- Rendering functions are called only within a synchronous, temporary owner-public-state scope.
- The visitor's own application state and persistence functions are restored immediately afterward, including on renderer errors.
- Public HTML is sanitized; scripts, inline event handlers, write controls, and unsafe delegated actions are stripped or blocked.
- Supported read-only controls are routed back to the original Workspace browsing functions within the temporary public scope.
- Existing CSS variables are mapped to the public profile theme / signed-in visitor's selected MediaFlow theme.
- Read-only mode and last-published time are displayed clearly above the native page.

**Functional limitation:** The page *rendering functions* are shared, but not every private Workspace control can or should run on someone else's data. Features requiring an authenticated owner, a write, or private-only data are intentionally disabled. Some complex nonmutating controls may remain unavailable until audited individually. Therefore v325 does not promise byte-for-byte duplication of every Workspace interaction.

## 9. New full-fidelity public data publication

The v323 public tables alone did not contain all the information needed by native Workspace renderers. v325 publishes a safe, owner-approved projection of the relevant state, excluding credentials, authenticated tokens, account backups and unrelated private app state.

Supported published sections: `meta`, `library`, `history`, `collections`, `collection_titles`, `order`, `order_titles`, `order_collections`, `old`, and `old_transactions`.

- Records are uploaded in chunks of up to 150 entries.
- Public profile tab visibility and existing publication flags control which sections are available to guests through database RLS.
- A hidden public Library does not automatically block title references intentionally published within a visible public Collection or Personal Order.
- The owner must click **Save and publish** or **Refresh published pages** after deploying and installing the migration; previously published v323/v324 data does not automatically populate v325's new table.
- Public records reflect their *last published* version, not every subsequent private change.
- Re-publication reconciles obsolete chunk pages and removes data for sections hidden by the owner.

**Privacy review:** Public Library entries may include description/notes and History entries may include logged notes. The owner should review their content before publishing. Turning off a public tab hides its data from normal guest table reads, but any information previously public may already have been copied by a visitor.

## 10. Required SQL migration

`docs/SQL_v325_workspace_public_state.sql` creates `public.mf_public_workspace_v325`, enables RLS, and installs authenticated-owner CRUD / guest read-if-public policies. Anonymous API users are granted SELECT only, not INSERT, UPDATE, DELETE or TRUNCATE.

This migration is **required** for the native v325 public pages. The v323 migration is a prerequisite. No existing Library rows or old public data tables are rewritten by this SQL script.

The migration is **included but is not applied automatically** to the live Supabase database during release packaging.

## 11. Compatibility

All existing private Workspace UI, Community features, Friends, Inbox, profile identity, favorites, Profile Studio configuration, XP and Level systems, dynamic themes, PWA and cloud backup formats are preserved. Public pages never edit the profile owner's private Workspace data.

Existing data formats remain: Cloud Sync v201, Full Backup v29, Settings Presets v1, Personal Order v5, Collections v2.

## 12. Technical assets

- `src/js/components/249-v325-native-workspace-public.js`
- `assets/css/181-v325-native-workspace-public.css`
- `docs/SQL_v325_workspace_public_state.sql`
- `scripts/test-v325-native-workspace.py`
- `assets/js/mediaflow-v325.bundle.js`
- `assets/js/mediaflow-v325-react-ui.js`
- PWA shell cache: `mediaflow-pwa-v325-shell-v1`

## 13. Validation and limitations

Local browser regression tests verify actual native Workspace page markup, profile-owner data scoping, read-only interaction protection, and safe restoration of the visitor's state across multiple responsive widths. Additional inherited app regression tests are run against the v325 bundle.

Live Supabase/RLS multi-account behavior, large real Library publication time, and deployment through GitHub Pages should be validated once the SQL migration and new website assets are installed. Do not interpret mocked browser test success as production RLS verification.

## Version progression

**v323** → Public Profile Studio, owner-controlled six-tab published showcases, guest/profile theming and public database permissions.  
**v324** → Workspace-inspired public tab visuals, but still separate simplified renderers.  
**v325** → **Original Workspace renderers and profile-owner data in public read-only tabs, with isolated state, safe browsing actions, richer opt-in published data, and a new RLS-protected full-fidelity publication table.**
