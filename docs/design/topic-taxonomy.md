# Topic taxonomy

Defines the `topic/` labels secondthought applies to an item. There are eight.

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
cut, so the design assumes **one primary label with secondary labels allowed**.

**The largest mass does not split on keywords.** Splitting the 95 items under `topic/agents` into
harness, multi-agent, and practice collapsed: "AI 도입은 허상이다" (AI adoption is an illusion)
went to multi-agent and "JUST USE REACT" went to orchestration. Deciding this requires
understanding meaning, which is why secondthought exists. It is also why no sub-categories are cut
in advance.

## The eight categories

The sizes are **estimates** from the keyword pass above. They were not verified by hand and should
be replaced with real counts once the first full classification has run.

| Label | Display | Est. | What it holds |
| --- | --- | --- | --- |
| `topic/agents` | agents | ~95 | Agent design, harnesses, loop engineering, orchestration, multi-agent, autonomy |
| `topic/platform` | platform | ~40 | Servers, databases, Kubernetes, cloud, sandboxes and runtimes, Git, deployment |
| `topic/work` | work | ~40 | Ways of working, teams and orgs, careers, industry movement, company cases, essays |
| `topic/context` | context | ~30 | Context engineering, prompting, memory, retrieval and RAG, compaction |
| `topic/frontend` | frontend | ~30 | React, Next.js, CSS, browsers, bundlers, rendering |
| `topic/craft` | craft | ~30 | Architecture, design principles, code review and quality, testing, technical debt |
| `topic/agent-tools` | agent tools | ~25 | Claude Code, Codex, Cursor, skills, MCP, hooks, plugins |
| `topic/models` | models | ~25 | Model capability and choice, evaluation and benchmarks, hallucination, tokens and cost |

Eight is the count for these reasons. Fewer, and `topic/agents` swallows half the archive so the
label carries no information at all. More, and ghost categories under 20 items appear. The current
set runs from 25 to 95 items, so all eight are alive.

## Rules for applying

- There is exactly one primary label. Decide it by asking what the piece is ultimately about.
- Up to two secondary labels are allowed. None is fine.
- If nothing fits, **apply no label.** Inventing a label that means "unclassified" would make it a
  second `published`. This covers items with no content — `dump` (#302), `temp` (#92), `ddddd`
  (#292) — and personal records outside the topic axis such as a travel note (#270). Apply
  `secondthought/skipped` instead to take them out of the queue.
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

## Going forward

`topic/agents` sits at 30% of the archive, so it will have to be split eventually. It is
deliberately not split now. Once the first full classification reveals the real distribution, if a
single category keeps exceeding 25%, introduce a sub-axis then and record it in an ADR.

The **kind** axis on an item (`thought`, `curiosity`, `answer`, `leave a mark`) covers only eight
items today and was left alone. It gets decided separately once the topic axis has settled.
