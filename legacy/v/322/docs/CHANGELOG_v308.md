# MediaFlow v308 — Community Theme Parity

- **Guests:** continue using the existing dark-purple Community look, independent of any previous theme stored in the browser.
- **Signed-in users:** public Community homepage, Browse, Collections, Ratings, Users and public profiles inherit `--bg`, `--panel`, `--panel-raised`, `--border`, `--text`, `--flow`, and other active MediaFlow Workspace theme variables.
- **Themes:** standard, custom, platform, full-style and dynamic cover colors adapt using the existing theme engine, not a duplicate palette preference.
- **Appearance:** existing global light/dark override participates through the same CSS variables.
- **Messaging:** signed-in Friends/Inbox components and desktop chat widget follow matching Workspace theme colors.
- **Live updates:** changing the Workspace theme automatically updates Community visual colors without republishing user data or refreshing the browser.
- **Privacy:** signed-in theme reads only the current user’s local authenticated settings; viewing someone else’s public profile does not load their theme.
- **Compatibility:** no database migration; v307 navigation, authentication, public profiles, private Workspace, backups, Community sharing and messaging remain intact.
- **PWA:** mediaflow-pwa-v308-shell-v1.
