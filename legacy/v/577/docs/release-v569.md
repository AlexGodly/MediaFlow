## MediaFlow v569 Stable

Released together with the MediaFlow app 7.1.1.569.

### A title's own unit and runtime in logging
- A title with its own unit and runtime (Edit title → Unit for this title, Runtime per unit) now counts its own runtime in the log's minutes: 3 matches of 20 minutes is 60 minutes, not 3 of the category's episodes. This applies to quick logging and to Batch Log's default minutes in progress mode (itemized logging already did).
- The itemized log names the title's own unit ("Log another match", "Match 4").
- Titles without their own runtime keep exactly the same numbers as before.
