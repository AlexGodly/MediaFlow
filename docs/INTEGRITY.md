# MediaFlow v217 Integrity Notes

- Stable runtime base: MediaFlow v215 modular build, itself derived from stable MediaFlow v201.
- Stable v215 JS SHA256: `04eeb987df031254fdbd7ae4a444c26018ecd9025ab081b85b5d3baf6a5e0649`
- v217 executable JavaScript difference: only the human-readable Full Backup note identifies v217; `scripts/check.py` reverses that note and requires the result to hash exactly to the v215 stable runtime.
- Source layout change: 143 exact ordered fragments distributed across ownership folders.
- CSS runtime content and stylesheet order are retained from v215.
- Persistent schemas remain unchanged.
