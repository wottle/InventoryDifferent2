Package a new release of InventoryDifferent.

If the user provided a version number as an argument, use it. Otherwise, read `web/src/lib/releaseNotes.ts` to find the current `APP_VERSION`, suggest the next logical semantic version (e.g. if current is 1.0.0, suggest 1.1.0), and ask the user to confirm or provide a different version.

Then perform these steps:

1. Read `web/src/lib/releaseNotes.ts`
2. Update `APP_VERSION` to the new version string
3. In the `releaseNotes` array, find the entry where `version === 'Unreleased'`:
   - Set its `version` to the new version number
   - Set its `date` to today's date in YYYY-MM-DD format
4. Prepend a new entry at the top of the `releaseNotes` array:
   ```ts
   {
     version: 'Unreleased',
     date: '',
     added: [],
     changed: [],
     fixed: [],
   },
   ```
5. Read `CHANGELOG.md` and apply the same rename: replace `## [Unreleased]` with `## [X.Y.Z] - YYYY-MM-DD`, and add a new empty `## [Unreleased]` section at the top.
6. Commit both files with the message `Release vX.Y.Z` (plus the Co-Authored-By trailer per commit style).

Do not push — leave that to the user.
