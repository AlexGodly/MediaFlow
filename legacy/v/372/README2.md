# MediaFlow v372 — Logging Interface 3.0, Settings Icon System & Collections Stability

**Release:** v372 Modular — Personal Edition  
**Baseline:** v371  
**Built:** October 10, 2026  
**Developer:** Alex Godly

Logging Interface 3.0 adds a richer, theme-native visual design to Per unit and Quick Logging, with session headers, live draft metrics, premium title panels, and matching status/category/priority badges across Quick Logging's Amount Consumed and Last Progress modes. Every Settings accordion uses exactly one meaningful section icon on mobile, tablet and desktop, without the unwanted circle-arrow reinjection. Collections Batch Delete now refreshes the visible list and counters immediately after confirmation instead of waiting for cloud persistence.

**Tests:** JavaScript and PWA builds; v369/v370 regressions; v372 adaptation of v371 collapse/input preservation; Quick Logging badge parity; dynamic theme changes; all 28 Settings icons; and immediate Collections deletion with a delayed cloud-save stub. Chromium viewports: 320, 390, 430, 820 and 1280px (as applicable). Physical devices and authenticated cross-device cloud sync remain unverified.

See [the detailed v372 changelog](docs/CHANGELOG_v372.md).
