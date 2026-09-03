# Labels are split into three namespaces and `learn` is replaced by `published`

293 of 319 items carried a single `learn` label, and the app gated publication on exactly that
label. So the labels held no topic information at all, and the publish gate was named after
something that had nothing to do with publishing. Labels are therefore split into three namespaces
by who owns them.

| Namespace | Owner | Labels |
| --- | --- | --- |
| unprefixed | human | `published`, `draft`, `secret`, plus the kind labels |
| `topic/` | secondthought | eight of them, `topic/agents` and so on |
| `secondthought/` | secondthought | `secondthought/needs-topic`, `secondthought/skipped` |

One rule defines the boundary: **a label whose name contains a `/` belongs to the machine, one
without belongs to a human.** secondthought's write permission expressed in that rule is simply
"only labels containing a `/`", which means no misjudgment of the agent's can reach the publish
gate or `secret`. That is the single biggest reason for choosing this shape.

`learn` was renamed to `published`. Because GitHub's label rename was used rather than creating a
new label and re-applying it, the label stayed attached to all 293 items. `published` also sits in
exact opposition to the existing `draft`.

## Considered Options

- **Redefining `learn` as a topic label.** The publish gate would have to move to some other
  mechanism, and it becomes a migration that changes the meaning of 293 items at once. Nothing is
  gained.
- **`public`.** It opposes the existing `secret` neatly, but whether something is on the site
  (published) and whether it holds nothing private (public) are different questions, and this
  drives both into one label.
- **Giving state labels a namespace too, as in `state/published`.** All three axes become
  explicit, but `draft` and `secret` would have to move along for it to be consistent, and every
  label turns verbose.
- **Naming the queue label `secondthought:need-category`.** A `:` separator makes it read as a
  second family next to `topic/`, and "category" is a word `CONTEXT.md` places under `_Avoid_`.

## Consequences

The app now needs a display-name mapping. `app/p/page.tsx` draws label names directly as chips, so
left alone the list would expose the string `topic/agents`. `lib/labels.ts` takes on selecting only
`topic/` labels and mapping them to short display names, and state labels are not drawn at all.

Introducing a queue label gave labels a lifecycle. `secondthought/needs-topic` must come off once
applied, and secondthought is the only thing that takes it off. Leaving an undecidable item in the
queue — one with no body, or a personal record outside the topic axis — would keep the queue from
ever emptying, so `secondthought/skipped` was created alongside it as the exit.

## A side effect found and fixed

Verifying the rename surfaced a separate problem. Item #109 demonstrably carried the label and was
still missing from label-filtered queries, which meant it was not appearing in the site's list. Its
timeline shows the label being removed and re-applied on 2025-08-27, and GitHub's filter index
appears to have gone out of sync from that point. The omission predates the rename and is unrelated
to it. Toggling the label once more forced a re-index and resolved it.

Since removing and re-applying a label can produce that state, secondthought should change only
what needs changing and never re-apply a label pointlessly.
