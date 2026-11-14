# MediaFlow v435 Beta — OMDb Verification & Diagnostic Hotfix

The rest of v434's providers and data model remain untouched. This is an OMDb-focused bug fix.

- Correctly distinguish OMDb API key rejection / pending email activation from no title match.
- Report OMDb's daily request limit and safe provider-side errors, rather than treating all HTTP 200 JSON bodies as successful.
- Add a bounded exact-title (`t`) fallback when the broader OMDb search (`s`) returns no matching title. A verified IMDb ID (`i`) remains first priority.
- Require a real OMDb matching record before marking its connection tested and allowing background cover searches.
- Revoke OMDb's previously tested state if a repeat test fails, without touching other sources or manual External IDs.
- Do not expose secrets, add API key endpoints, change the daily global/user limits, or use new Supabase tables.
- Preserve the entire v434 gateway and Cover Recovery/Find Cover implementation, 360px mobile layout, user dynamic themes, and existing provider selections.

**The code fix improves diagnostics and title-search matching; it cannot activate an invalid OMDb key.** If OMDb reports that its API key is invalid or not activated, the user must follow the email activation link or replace `OMDB_API_KEY` in the personal Supabase project's Edge Function secrets.
