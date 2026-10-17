# MediaFlow v225 — Personal Order Clarity & Global Button Icons

**Release:** MediaFlow v225  
**Base:** MediaFlow v224 Modular  
**Stable data/feature base:** MediaFlow v201  
**Created by:** Alex Godly

MediaFlow v225 is a UI clarity and interaction-language release. It keeps v224 behavior intact while making Personal Order sorting easier to understand and giving action buttons a consistent icon system across MediaFlow.

## Personal Order — Add Titles toolbar

The Add Titles controls are reorganized into clearly labeled fields:

- **Categories**
- **Sort by**
- **Direction**
- **Status**
- **Priority**

The toolbar uses a responsive card-like layout instead of visually ambiguous compact controls. The existing v224 sort behavior is unchanged: the sort field and direction are independent, with **Alphabetic · ASC** as the default.

## Global button icon system

v225 introduces a centralized runtime icon enhancer. It applies icons after each render and also watches future DOM changes, so newly rendered action buttons follow the same visual language automatically.

Dedicated icon families cover:

- Skip / Confirm / Cancel
- Give me something else / Reroll / Reroll history
- Edit / Details / Delete / Empty / Remove
- Fix / Repair / Scan and Fix
- Calculate / Reset / Restore
- Save / Save & Get Next Task
- Add / Clear / Clear filters / Use
- Previous / Next / Back / directional movement
- Stopwatch Start / Pause / Set / Add / Minus / Reset / Clear / Use
- Normal and Dynamic Library
- List / Compact / Cards / Covers / Covers + Titles
- Import / Export / Backup / Sync Now
- All Titles / By Category / Clear Order
- Old System: System / View / Date View / Stats
- Amount Consumed / Last Progress
- Normal / Advanced
- Light / Normal / Marathon
- Add Category / Check Now
- Log In / Log Out
- About / external-app / contact actions

Controls that are already icon-only or have a dedicated built-in icon are not given a second icon. Toggles, swatches and numeric pagination are also intentionally excluded.

## Account page polish

- Text, email, password and URL fields now use a more consistent raised-field design.
- Hover and focus states are clearer.
- Button groups wrap more cleanly on narrow screens.
- Account actions participate in the global icon system.

## Architecture

New v225 runtime modules:

- `pages/personal-order/156-v225-personal-order-toolbar-polish.js`
- `components/157-v225-global-button-icons.js`

New stylesheet:

- `assets/css/95-v225-icons-personal-order.css`

The global icon system is runtime-driven and does not change persistent user data.

## Persistent schemas

No schema bump is required.

- **Cloud Sync:** v201
- **Full Backup:** Schema v29
- **Settings Preset:** Schema v1
