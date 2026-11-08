# Tenrai episode-data repair (local hotfix for v378)

Separates HTTP/network failures from genuine missing provider episode lists.

- Empty episode lists are resolved using MAL catalogue metadata when reliable.
- Not-yet-aired shows have **zero released episodes**, not a transport failure.
- Finished shows with a known total use that completed total only if episodes were not provided.
- Currently-airing shows with no episode list remain **unverified**, never inferred from scheduled/total episodes.
- Adds a distinct **Retry Missing Episode Data** list and action.
- Keeps the last verified aggregate until every relevant title can be reliably accounted for.
- Uses existing stored MAL IDs, title editor, and data persistence.

**Important:** A provider that has no episode data for currently-airing shows cannot be repaired entirely in the client. This hotfix makes the results truthful and recoverable; it does not create nonexistent episode records.

This is a focused testing hotfix on v378, **not the full planned v379 release**. No GitHub actions performed.
