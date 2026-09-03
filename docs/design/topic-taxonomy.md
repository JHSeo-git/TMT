# Topic taxonomy

Defines the `topic/` labels secondthought applies to an item. There are nine.

## What is actually being classified

As of 2026-09-03 `TMT-items` holds 319 items (#1–#321). Three facts shaped the design.

**The archive has two eras.** Topic density by half-year shows a clean break.

| Period | Items | Dominant subject |
| --- | --- | --- |
| 2024H2 – 2025H1 | 107 | Kubernetes, Spring, frontend, design (notes written first-hand) |
| 2025H2 – 2026H2 | 212 | AI agents and LLM engineering (translations and summaries of outside writing) |

From 2026 onward, 57 of every 88 items in a half-year are agent-related. Between 60% and 65% of the
whole archive is one mass of AI agents and LLMs. How that mass gets divided is therefore
effectively the whole of this design.

**A topic does not fit in one slot.** Building eight keyword buckets and matching against them,
only 37 of 319 items land in exactly one bucket, while 194 land in three or more. A piece like
"에이전트형 코딩 평가에서 인프라 노이즈를 정량적으로 측정하기" (#202, quantifying
infrastructure noise in agentic coding evaluations) belongs to agents, evaluation, and
infrastructure at once. A mutually exclusive single classification turns arbitrary however it is
cut, so the design allows **more than one label per item, all of equal weight**.

**The largest mass does not split on keywords.** Splitting the 95 items under `topic/agents` into
harness, multi-agent, and practice collapsed: "AI 도입은 허상이다" (AI adoption is an illusion)
went to multi-agent and "JUST USE REACT" went to orchestration. Deciding this requires
understanding meaning, which is why secondthought exists. It is also why no sub-categories are cut
in advance.

## The nine categories

Counts below are **measured**, taken after the first full pass over the archive on 2026-09-03. The
`Est.` column keeps the pre-pass keyword estimate so the two can be compared. Note that measured
counts include an item's every label while the estimates assumed one per item, so the totals are
not directly comparable — 293 items carry 412 label assignments. The ordering is what moved.

| Label | Display | Est. | Actual | Share | What it holds |
| --- | --- | --- | --- | --- | --- |
| `topic/agents` | agents | ~95 | 105 | 35.8% | Agent design, harnesses, loop engineering, orchestration, multi-agent, autonomy |
| `topic/work` | work | ~40 | 57 | 19.5% | Ways of working, teams and orgs, careers, industry movement, company cases, essays |
| `topic/agent-tools` | agent tools | ~25 | 55 | 18.8% | Claude Code, Codex, Cursor, skills, MCP, hooks, plugins |
| `topic/context` | context | ~30 | 52 | 17.7% | Context engineering, prompting, memory, retrieval and RAG, compaction |
| `topic/platform` | platform | ~40 | 45 | 15.4% | Servers, databases, Kubernetes, cloud, sandboxes and runtimes, Git, deployment |
| `topic/craft` | craft | ~30 | 33 | 11.3% | Architecture, design principles, code review and quality, testing, technical debt |
| `topic/frontend` | frontend | ~30 | 30 | 10.2% | React, Next.js, CSS, browsers, bundlers, rendering |
| `topic/models` | models | ~25 | 29 | 9.9% | Model capability and choice, evaluation and benchmarks, hallucination, tokens and cost |
| `topic/devex` | devex | — | 6 | 2.0% | Local dev environment, editors, shells, small utilities |

The keyword pass was closest on `topic/frontend` (exact) and `topic/craft` (+2), and furthest off on
`topic/agent-tools` (+30). Tool-specific writing hides from keywords because a piece about Claude
Code or Cursor names the tool once and then discusses loops, context, or review for the rest of its
length — which is also why deciding these needs a reading rather than a match.

Eight is the count for these reasons. Fewer, and `topic/agents` swallows half the archive so the
label carries no information at all. More, and ghost categories under 20 items appear. The current
set runs from 29 to 105 items for the eight that carry the archive, with `topic/devex` sitting
deliberately small at 6.

## Rules for applying

- Give the item the label for what it is ultimately about, then up to two more that are equally
  true of it. **All of an item's labels carry equal weight** — GitHub stores them as an unordered
  set, so there is no primary among them. One label is the common case; 174 of 293 items carry one
  and 119 carry two.
- If nothing in the list fits and the piece has real content, **add a topic** rather than forcing
  the nearest label. A forced label makes the label mean less for every item already carrying it.
  A topic is worth adding when several items would carry it and none of the existing ones describes
  them; `topic/devex` came out of exactly that. `queue.ts add-topic` handles the mechanical half.
- `secondthought/skipped` is for an item with no body to read at all — `dump` (#302), `temp`
  (#92), `ddddd` (#292). Nothing in the archive currently carries it.
- Never touch a label without a `/` in its name. The publish gate (`published`), `secret`, and
  `draft` belong to a human.

## Boundary rules

Most conflicts resolve in the order below. **The more specific side wins.**

1. If the body of the piece is how to use a particular tool, it is `topic/agent-tools`. "Claude
   Code에서 Claude 모델과 effort 수준 고르기" (#244, choosing models and effort levels in Claude
   Code) mentions models, but tool usage is the argument.
2. If the body is how to fill and shrink the context, it is `topic/context`. "Claude 5 세대 모델을
   위한 컨텍스트 엔지니어링의 새로운 규칙" (#272) is one of these.
3. If the body is a property of the model itself or how to measure one, it is `topic/models`. #202
   above is evaluation methodology, so it goes here.
4. If the body is the **substrate the agent runs on**, it is `topic/platform`. "2026년의 AI
   에이전트 샌드박싱" (#320, AI agent sandboxing in 2026) has "agent" in its title but is a runtime
   comparison.
5. Otherwise, if the body is an agent's structure, operation, or autonomy, it is `topic/agents`.

**When a piece is about people and organizations rather than a technical implementation,
`topic/work` wins.** "에이전트로 인한 숙련도 감퇴" (#314, skill atrophy from agents) and "사람의
판단은 소프트웨어 공장을 떠나지 않습니다" (#301, human judgment does not leave the software
factory) merely take agents as their material; they are about people.

**When a piece argues about what makes code good or bad, `topic/craft` wins.** "에이전트 시대의
코드 품질" (#288, code quality in the age of agents) and "코드 리뷰를 없애는 법" (#298, how to
eliminate code review) are these.

## What the first full pass exposed

**`topic/agents` needs splitting.** At 35.8% it is past the 25% line this document set as the
trigger. 105 items is too many to browse, and the cluster visibly contains at least three different
things: harness and loop design, multi-agent orchestration, and case studies of working with
agents. Splitting it needs its own ADR.

**Labels are equal-weight, and that is now deliberate.** The first pass followed a
primary-plus-secondary rule, then found that nothing records which label was primary, because
GitHub labels are an unordered set. Rather than build a device to persist the distinction, the rule
was dropped: an item's labels all carry the same weight. Asking "what is this mainly about" stays
in the skill as a way to think, since it stops labeling by loose association, but it no longer
implies a slot.

**`topic/devex` was added, and the skips went away with it.** Four items had been skipped for want
of a home: a macOS keyboard setting (#91), a README badge generator (#75), a zsh/arch problem in
VS Code (#68), and a YouTube transcript utility (#38). A `uv` task runner (#117) had been forced
into `topic/platform` for the same reason. All five now sit under `topic/devex`, along with #188
(an Obsidian setup). At 6 items it is the smallest topic by a wide margin, which is expected — it
exists to stop small tooling notes from distorting the topics that carry real weight.

Adding a topic is now a documented action in the skill rather than a request to file, and
`queue.ts add-topic` handles the mechanical half: writing the entry into `lib/labels.ts` and
creating the label on GitHub. Recording it here stays a judgment call.

**Three items are near-duplicates, and they stay that way.** #305 and #301 carry essentially the
same body — the same author's software-factory piece under two titles — and #261 is the long-form
version. They were labeled independently, so their labels differ. Left as is deliberately: they
are three separate items in the archive, and collapsing them is a content decision, not a
labeling one.

The **kind** axis on an item (`thought`, `curiosity`, `answer`, `leave a mark`) covers only eight
items today and was left alone. It gets decided separately once the topic axis has settled.
