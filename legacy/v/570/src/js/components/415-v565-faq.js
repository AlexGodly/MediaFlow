/* MediaFlow v565 — FAQ entries for this release (About → FAQ). */
const MF565_FAQS=[
  ['Logging and XP','What does "Task progress finishes at" do?','In Settings → Floating Controls you choose where the task card reaches 100%: at the goal\'s minimum (9 of a 9–13 goal, the default) or its maximum. You also choose how going over the maximum looks: keep counting past 100% (default), a warning colour, or the status text only.'],
  ['Logging and XP','How do I log a title outside my task?','Use "Log any title" in the + menu or on the Dashboard. It opens Batch Log on any page, with or without a session, and keeps your task as it is.'],
  ['Logging and XP','Can I save and get my next task from anywhere?','Yes. While a log is open, the + menu shows "Save & get next task". It shows the XP the log earns and saves exactly like the button in the log form.'],
  ['Library','Can one title use its own unit?','Yes. In the title editor, set "Unit for this title" (for example "matches") and, if you like, its runtime per unit. Logging and the task card use that unit; tasks, time and XP convert it to the category\'s unit using the runtimes.'],
  ['Library','Can titles show in English, Romanised Japanese or other languages?','Yes. A title can keep names in many languages; Details Recovery adds the ones it finds, and you can add your own. Choose the language shown in Settings → Title Names, per category, or per title. Search finds a title by any of its names.'],
  ['Order and Collections','Can a collection use a title\'s cover?','Yes. In the collection editor choose "From this collection" or "From the Library". The collection follows that title\'s cover when it changes, and keeps the last cover if the title is deleted.'],
  ['Logging and XP','Do I earn XP for things other than logging?','Yes. Every action that changes your account earns XP for its kind (the same action on the same thing earns once every 5 minutes). Automatic backups, finished recoveries and fresh-episode checks earn XP too. All of it can be changed in Settings → XP for Every Action.'],
  ['Logging and XP','Do I earn XP while MediaFlow is closed?','Yes. Time away earns XP at its own rate (by default a quarter of active time), credited the next time you open MediaFlow on any device. Website time also keeps counting while the tab is in the background.'],
  ['Appearance and updates','Where do I get the MediaFlow apps?','Open "Get MediaFlow" from the + menu or Settings → App & Updates. It always shows the latest Android, Windows and iPhone downloads, the web app install, and whether each of your devices is up to date.'],
  ['Cloud and backups','Why do automatic backups say they are paused?','Browsers only keep permission to write to a folder for one visit unless you allow it on every visit. When that happens MediaFlow shows a notice; click "Allow folder" and backups continue.']
];
for(const [category,question,answer] of MF565_FAQS){
  if(!V383_FAQS.some(f=>f.question===question))V383_FAQS.push({category,question,answer});
}
