## MediaFlow v580 Stable

### Titles logged by parts in Advanced logging
Advanced logging now logs a by-parts title the same way Log any title and Quick logging do, in all three tabs:
- **Progress Reached:** the parts panel, with each part's **Match reached** box.
- **Amount Consumed:** the parts panel, with each part's **Amount** box.
- **Per Unit:** the same parts panel; each unit still has its own row and time below it, now labelled **Part** instead of Season.

Chips pick the parts, each chosen part has its card (*Match 4 → 7 (+3 matches) · 45m* and its bar) and the panel ends with **+N in all · time**. Adding a by-parts title to Advanced logging (Logging Library, "Use recommended title") starts it on the part logged last, one unit. A part's box sets that part's units in the Advanced draft, so totals, runtime, XP preview and History are the ones Advanced logging already uses.

### "+ add" under Amount boxes
Every Amount box has a small second bar: type the next amount and press **+** (or Enter) — it is added to the box and the sum is shown (**3 + 4 = 7**), so you don't add in your head. In Quick logging, Advanced logging (Amount Consumed), Batch Log, and each part's Amount box.

### Customize total runtime: Batch Log, stopwatch and calculator
- **Batch Log** rows have **Customize total runtime** (HH:MM:SS), like Advanced logging; turned off, the row goes back to its automatic minutes.
- Every Customize total runtime (Advanced logging and Batch Log) has **Use stopwatch time** and **Use runtime calculator**: they fill in the Stopwatch's time or the Runtime Calculator's result (from the Dashboard).

### Task goal XP
A recommendation's goal now pays XP (Settings → System Respect XP → **Task goal XP**, all editable, can be turned off):
- reaching the **minimum**: **+100 XP**;
- reaching the **maximum**: **+300 XP** more;
- **each unit past the maximum**: **+10 XP**, up to **+100**.

Once per task, by whichever log gets there — Logging, Batch Log or Log any title (everything logged in the task's category since it was recommended counts). The day streak multiplies it like other session XP. The XP previews in Logging and Batch Log show it ("Task goal +100 XP · minimum (2) +100"), and it is saved on the log that earned it. MediaFlow Recommends shows what the goal is worth ("Goal XP: reach 2 for +100 · 4 for +300 more · +10 each past it").

### Also
- "4 matchs in draft" → "4 matches in draft" (the unit's real plural) in Advanced logging.

Matches MediaFlow app 10.1.0.580.
