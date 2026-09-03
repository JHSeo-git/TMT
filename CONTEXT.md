# TMT

"Too many thoughts". A personal archive of writing that has been read, carried over, and chewed
on. The writing itself lives as issues in a separate repository, `JHSeo-git/TMT-items`; the app in
this repository reads them and publishes the site.

## Language

**Item**:
One issue in the `TMT-items` repository. The unit of a single piece of writing on the site.
_Avoid_: post, entry, issue (use "issue" only when referring to the storage form)

**Source**:
The outside piece of writing that an item translates or summarizes.
_Avoid_: origin, reference, link

**Publish gate**:
The one label that decides whether an item appears on the site. `published` holds this role.
_Avoid_: visibility flag, publish state

**Topic**:
The axis that says what an item is about. Expressed as a label carrying the `topic/` prefix.
_Avoid_: category, tag, field

**Display name**:
The name a `topic/` label is shown under on the site. Corresponds one-to-one with the label name.
_Avoid_: alias, caption

**Queue**:
The set of items whose topic secondthought has not decided yet. The items carrying the
`secondthought/needs-topic` label are the queue.
_Avoid_: backlog, waitlist, list

**secondthought**:
The agent that re-reads an item when it is opened or edited, decides its topic, and applies a
`topic/` label. It applies and removes only labels whose name contains a `/`.
_Avoid_: bot, classifier, triager
