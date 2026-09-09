# The QB Board

Clean NFL quarterback rankings site with Supabase-backed publishing and weekly history.

## v7 changes
- Key-icon login button in the public header.
- Private editor supports renaming QBs, adding QBs, removing QBs, and editing team/headshot metadata.
- QB records use stable IDs so renaming a QB does not break movement/history matching.
- Headshot support is built into player records. Existing records can use a headshot URL from the editor; transparent PNG/WebP assets are recommended.
- Weekly history preserves the published snapshot, including the player name and headshot metadata that existed when the week was published.

## Supabase
Keep the existing `config.js` values from the working project. Do not replace them with placeholders.

Run `supabase.sql` in the existing project if the table/policies have not already been created.


## v22 visual update
- Added a subtle full-page football/playbook-inspired background overlay.
- Uses layered gradients, faint field-style grid lines, diagonal accents, and a soft circular field/playbook element.
- Dark and light modes each use an appropriately toned version so the background stays understated and the QB cards remain the visual focus.
