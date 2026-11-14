/* MediaFlow v566 — FAQ entries for this release (About → FAQ). */
const MF566_FAQS=[
  ['Logging and XP','I kept a log open for days. Which day does it count on?','The day you consumed, not the day you saved. By default each episode, chapter or unit counts at the time it was logged; in Settings → Dashboard → Log time you can choose the time each title was added to the log instead. A log that spans several days is saved as one session per day, so your streak and History show every day you watched or read. XP is the same, just spread over those days.'],
  ['Library','Can I select every field at once in Details Recovery?','Yes. When you review what to save for a title, use Select all or Deselect all. They follow the "Show fields" filter and never pick protected or existing fields.'],
  ['Library','Does Details Recovery save ratings?','Yes. A verified rating Details Recovery finds is saved as the title\'s external rating, and it replaces an older automatic one when the value is newer. A later ratings refresh updates it when there\'s a newer value and leaves it as it is otherwise. Ratings you entered yourself are never changed.'],
  ['Appearance and updates','How do I know which of my devices need an update?','Open Get MediaFlow. "Your devices" lists every phone, PC and browser you use MediaFlow on, with the version each one has and whether it is up to date.'],
  ['Library','Why is the Recovery workspace smoother now?','While a recovery runs, MediaFlow now saves your account in small batches instead of after every title, and refreshes the progress a few times a second instead of after every step. If a recovery is interrupted, the last few titles are simply checked again.']
];
for(const [category,question,answer] of MF566_FAQS){
  if(!V383_FAQS.some(f=>f.question===question))V383_FAQS.push({category,question,answer});
}
