# MediaFlow v249 — PWA / App Update Scope Correction

MediaFlow v249 corrects the UI scope of the managed update features introduced in v248.

## Main changes

- Restored the separate **Install MediaFlow** PWA card to its v247 layout and behavior.
- Removed the v248 **Install update** button from the PWA card.
- Removed the v248 managed-update progress/success/failure UI from the PWA card.
- Removed the v248 dynamic application-release badge/icon treatment from the PWA card.
- Restored the PWA actions to **Install app**, **Reload app / Reload update**, and **Check PWA update**.
- Preserved **PWA Diagnostics**, **Run PWA Test**, and **Repair app cache** from v247.
- Kept the v248 managed update experience in **APP UPDATES / Automatic update checking**, including dynamic update states, Install update, progress feedback, and automatic update installation.
- Kept the v248 Settings navigation responsiveness, mouse/pen drag scrolling, and APP UPDATES active-section fix.
- Corrected the restored PWA status text so it reports the current MediaFlow runtime instead of a hard-coded v247 label.
- Advanced MediaFlow to v249 and retained automatic VERSION-aware PWA cache generation.

No Library, History, cloud, backup, Settings Preset, Personal Order, or XP schema migration is required.
