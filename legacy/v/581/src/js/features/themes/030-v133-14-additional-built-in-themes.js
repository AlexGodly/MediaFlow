/* MediaFlow v133 — 14 additional built-in MediaFlow themes.
   12 are native-light designs; Aurora Night and Ink & Neon are dark. */
html[data-theme="porcelain"]{--bg:#f4f8fc;--panel:#ffffff;--panel-raised:#edf3f9;--border:#b9c9d9;--border-soft:#d8e2ec;--text:#182433;--text-dim:#52677c;--text-mute:#8193a5;--flow:#376f9f;--flow-dim:#9fc0da}
html[data-theme="matcha-cream"]{--bg:#f3f4e8;--panel:#fffef5;--panel-raised:#e5ead3;--border:#b7c29a;--border-soft:#d4dcc0;--text:#26301f;--text-dim:#5d6c4e;--text-mute:#879477;--flow:#718b52;--flow-dim:#b8c99c}
html[data-theme="lemon-sorbet"]{--bg:#fff9d8;--panel:#fffdf0;--panel-raised:#fff0a9;--border:#d5bf55;--border-soft:#eadb91;--text:#302b18;--text-dim:#6d6335;--text-mute:#988a50;--flow:#d19b00;--flow-dim:#efd46f}
html[data-theme="lilac-haze"]{--bg:#f6f1ff;--panel:#ffffff;--panel-raised:#eae0ff;--border:#c1afe8;--border-soft:#dbcef4;--text:#302542;--text-dim:#6d5a88;--text-mute:#9784b3;--flow:#8566cc;--flow-dim:#c4b2ea}
html[data-theme="coastal-breeze"]{--bg:#eef9fb;--panel:#ffffff;--panel-raised:#dff2f5;--border:#a8cfd6;--border-soft:#cce5e9;--text:#17343b;--text-dim:#4c7078;--text-mute:#7599a0;--flow:#1689a3;--flow-dim:#9bd0da}
html[data-theme="terracotta-studio"]{--bg:#fbf0e7;--panel:#fffaf6;--panel-raised:#f4d9c8;--border:#d2a184;--border-soft:#e7c5b0;--text:#3d2921;--text-dim:#765348;--text-mute:#a37667;--flow:#b95f3d;--flow-dim:#dfa98f}
html[data-theme="notebook"]{--bg:#f7f8f4;--panel:#fffef9;--panel-raised:#edf1f3;--border:#aebac2;--border-soft:#d5dde2;--text:#172630;--text-dim:#51636d;--text-mute:#7e8e97;--flow:#2f6db0;--flow-dim:#a9c7e7}
html[data-theme="rose-milk"]{--bg:#fff3f2;--panel:#fffdfc;--panel-raised:#f9dddd;--border:#e1afb1;--border-soft:#f0ced0;--text:#3c2529;--text-dim:#78545b;--text-mute:#a47b82;--flow:#d86f7e;--flow-dim:#edb6bd}
html[data-theme="seafoam-glass"]{--bg:#e9fbf7;--panel:#fafffd;--panel-raised:#d6f3ea;--border:#92cfbd;--border-soft:#bee5d9;--text:#12372e;--text-dim:#467466;--text-mute:#73a294;--flow:#1f9f7f;--flow-dim:#93d6c4}
html[data-theme="morning-sky"]{--bg:#f3f8ff;--panel:#ffffff;--panel-raised:#e5f0ff;--border:#afc9e9;--border-soft:#d1e0f3;--text:#1e3047;--text-dim:#58718f;--text-mute:#8298b2;--flow:#4d86c6;--flow-dim:#b2d0ef}
html[data-theme="pistachio"]{--bg:#f5f7e9;--panel:#fffef8;--panel-raised:#e7eccb;--border:#bdc98f;--border-soft:#d7dfb7;--text:#2e341d;--text-dim:#657047;--text-mute:#8e986c;--flow:#819a43;--flow-dim:#bfce8d}
html[data-theme="apricot"]{--bg:#fff3e6;--panel:#fffaf5;--panel-raised:#ffdfbd;--border:#e6b17e;--border-soft:#f1cfad;--text:#422b1d;--text-dim:#7d5a42;--text-mute:#aa7f61;--flow:#e57e38;--flow-dim:#f3b783}
html[data-theme="aurora-night"]{--bg:#071419;--panel:#0d2026;--panel-raised:#143039;--border:#2e5a62;--border-soft:#21464e;--text:#eefcff;--text-dim:#acd8dc;--text-mute:#719da2;--flow:#57e2b2;--flow-dim:#2d8d7b}
html[data-theme="ink-neon"]{--bg:#08090f;--panel:#0f111b;--panel-raised:#171a29;--border:#34394f;--border-soft:#262b3e;--text:#f6f7ff;--text-dim:#b5bad3;--text-mute:#777f9c;--flow:#50e3ff;--flow-dim:#734cff}

/* Native body treatments */
html[data-theme="porcelain"] body{background:linear-gradient(145deg,#ffffff 0%,var(--bg) 66%);}
html[data-theme="matcha-cream"] body{background:radial-gradient(circle at 10% 0%,#fffef5 0%,var(--bg) 56%);}
html[data-theme="lemon-sorbet"] body{background:linear-gradient(155deg,#fffef2 0%,var(--bg) 62%);}
html[data-theme="lilac-haze"] body{background:radial-gradient(circle at 85% 0%,#ffffff 0%,var(--bg) 55%);}
html[data-theme="coastal-breeze"] body{background:linear-gradient(180deg,#fbffff 0%,var(--bg) 68%);}
html[data-theme="terracotta-studio"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 64%);}
html[data-theme="notebook"] body{background-color:var(--bg);background-image:linear-gradient(#cfe0ee55 1px,transparent 1px),linear-gradient(90deg,#cfe0ee33 1px,transparent 1px);background-size:28px 28px;}
html[data-theme="rose-milk"] body{background:radial-gradient(circle at 78% 0%,#fffefd 0%,var(--bg) 58%);}
html[data-theme="seafoam-glass"] body{background:radial-gradient(circle at 16% 0%,#ffffff 0%,#e9fbf7 48%,var(--bg) 100%);}
html[data-theme="morning-sky"] body{background:linear-gradient(180deg,#ffffff 0%,#edf6ff 38%,var(--bg) 100%);}
html[data-theme="pistachio"] body{background:linear-gradient(150deg,#fffef7 0%,var(--bg) 64%);}
html[data-theme="apricot"] body{background:linear-gradient(145deg,#fffaf5 0%,var(--bg) 62%);}
html[data-theme="aurora-night"] body{background:radial-gradient(circle at 18% 0%,#124f4b 0%,transparent 33%),radial-gradient(circle at 88% 15%,#37245f 0%,transparent 30%),var(--bg);}
html[data-theme="ink-neon"] body{background:linear-gradient(135deg,#08090f 0%,#101326 55%,#07161b 100%);}

/* Structural signatures — these are intentionally more than simple recolors. */
html[data-theme="porcelain"] .card,html[data-theme="porcelain"] .stat-box{border-radius:5px;box-shadow:0 3px 12px rgba(41,74,105,.05)}
html[data-theme="porcelain"] .btn,html[data-theme="porcelain"] select{border-radius:5px}
html[data-theme="matcha-cream"] .card,html[data-theme="matcha-cream"] .stat-box,html[data-theme="matcha-cream"] .hero{border-radius:18px}
html[data-theme="matcha-cream"] .btn{border-radius:12px}
html[data-theme="lemon-sorbet"] .card,html[data-theme="lemon-sorbet"] .stat-box{border:2px solid var(--border);border-radius:7px;box-shadow:4px 4px 0 color-mix(in srgb,var(--flow) 20%,transparent)}
html[data-theme="lemon-sorbet"] .btn-primary{color:#2d250b}
html[data-theme="lilac-haze"] .card,html[data-theme="lilac-haze"] .stat-box,html[data-theme="lilac-haze"] .hero{border-radius:22px}
html[data-theme="lilac-haze"] .btn,html[data-theme="lilac-haze"] .pill{border-radius:999px}
html[data-theme="coastal-breeze"] .card,html[data-theme="coastal-breeze"] .stat-box{border-top:3px solid color-mix(in srgb,var(--flow) 65%,var(--border))}
html[data-theme="coastal-breeze"] .section-label{color:var(--flow)}
html[data-theme="terracotta-studio"] .view-title,html[data-theme="terracotta-studio"] .hero-name{font-family:Georgia,"Times New Roman",serif}
html[data-theme="terracotta-studio"] .card{border-left:4px solid color-mix(in srgb,var(--flow) 55%,var(--border))}
html[data-theme="notebook"] .card,html[data-theme="notebook"] .stat-box{border-radius:2px;box-shadow:none}
html[data-theme="notebook"] .section-label,html[data-theme="notebook"] .record-row .v{font-family:"Courier New",monospace}
html[data-theme="rose-milk"] .card,html[data-theme="rose-milk"] .stat-box,html[data-theme="rose-milk"] .hero{border-radius:24px;box-shadow:0 12px 28px rgba(171,92,105,.07)}
html[data-theme="seafoam-glass"] .card,html[data-theme="seafoam-glass"] .stat-box,html[data-theme="seafoam-glass"] .hero{background:color-mix(in srgb,var(--panel) 78%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 14px 35px rgba(24,116,96,.08)}
html[data-theme="morning-sky"] .card,html[data-theme="morning-sky"] .stat-box{border-radius:14px;box-shadow:0 8px 24px rgba(55,100,150,.06)}
html[data-theme="morning-sky"] .section-label{letter-spacing:.09em;color:var(--flow)}
html[data-theme="pistachio"] .card{border-style:dashed}
html[data-theme="pistachio"] .btn{border-radius:14px}
html[data-theme="apricot"] .btn-primary{background:linear-gradient(135deg,#f29a58,var(--flow));border-color:var(--flow)}
html[data-theme="apricot"] .card,html[data-theme="apricot"] .stat-box{border-radius:16px}
html[data-theme="aurora-night"] .card,html[data-theme="aurora-night"] .hero{background:color-mix(in srgb,var(--panel) 86%,transparent);box-shadow:0 16px 44px rgba(0,0,0,.24)}
html[data-theme="aurora-night"] .btn-primary{background:linear-gradient(135deg,#57e2b2,#8a64ff);border-color:transparent;color:#071419}
html[data-theme="ink-neon"] .card,html[data-theme="ink-neon"] .stat-box{border-radius:3px;border-left:2px solid var(--flow)}
html[data-theme="ink-neon"] .section-label{font-family:"Courier New",monospace;color:var(--flow);text-transform:uppercase}
html[data-theme="ink-neon"] .btn-primary{background:linear-gradient(135deg,#50e3ff,#8b5cff);border-color:transparent;color:#071014}

