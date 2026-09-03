# Intent and decisions are recorded as files in the TMT repository

The writing (items) lives as issues in the `TMT-items` repository, but the record of how this
project is built and why it was decided that way is collected in this repository, alongside the
app. Terminology goes in `CONTEXT.md`, decisions that are hard to reverse in `docs/adr/`,
reversible design in `docs/design/`, and visible change in `CHANGELOG.md`. A record has to ride in
the same commit as the code for it to reach review, and for `git log` to answer "why" later on.

## Considered Options

- **Recording as items (issues).** Write each decision as a `TMT-items` issue and publish it
  straight to the site. Self-referentially appealing, and comments would even preserve the
  discussion — but it cannot be `grep`ed or `diff`ed, and it is not bound to the same review unit
  as the code change. It also runs against the *file over app* principle kept in archive item #188.
- **A single `DECISIONS.md`.** Light to start, but one decision cannot be linked to on its own, and
  navigation collapses once the file passes a few hundred lines.

## Consequences

The record and the workflow end up in different repositories. secondthought's GitHub Actions
workflow has to live in `TMT-items`, where the issue events happen, so that repository holds only a
pointer to this set of documents and the actual explanation is maintained here alone. Copying the
same content into both places guarantees they drift.

`docs/generate/` is where agent output used to be parked, and its contents are already stale — it
records the site's name as "Taking My Time" when the actual name is "Too many thoughts". Generated
output and deliberately kept records will not share a directory going forward.
