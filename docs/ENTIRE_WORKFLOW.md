# Hunchlane Runners and Trails

A Trail groups a branch's proposed changes, review findings and evaluations. For this GitHub-backed repository, Entire uses a GitHub pull request for CI. Runners evaluate changes and publish either findings, scores or a summary; they do not replace local tests or human merge review.

## Verified setup

On October 10, 2026, the CLI authenticated as `github:NiKHiLkr23`. Repository settings read back with Runners, Trails and Auto build on push enabled. The six generated configurations in `.entire/runners/` were reviewed, tailored and pushed on the default branch `codex/hunchlane` in commit `3079871`.

| Runner | Purpose |
|---|---|
| Review | Concrete bugs, regressions and data loss findings |
| Security | Owner authorization, shares and credential boundaries |
| Risk | Duplicate charges, recovery and private report exposure |
| Confidence | Tests and observed evidence supporting the change |
| Drift | Domain/server/API boundaries and repository conventions |
| Summary | Reviewer explanation of the actual change |

The configurations retain read-only repository tokens. Their prompts prohibit reading credential stores, using live databases, making paid research calls or publishing deployments. They distinguish sample data and connection probes from verified sponsor workflows.

## First Trail

[Verify Hunchlane Entire workflow](https://entire.io/gh/NiKHiLkr23/hunchlane/trails/1) was created successfully with ID `01M4K02J705TVMXQR4Y9XGJM0C`, branch `codex/entire-workflow`, and base `codex/hunchlane`.

After pushing documentation commit `a9a29d4ac09f566d1d5001c55f5f53ebe98d16ed`, `entire trail show --json` reported `trail-review` completed against that exact head: the findings gate passed, `reviewed_head` was true, and review was no longer in flight. `entire trail finding --json` returned zero findings at every severity. The branch was up to date with its base. Human approval remained required; no merge was performed. No CI checks were reported.

The individual Runner-results endpoint returned `repo not in this region (locate it via /me's jurisdiction)` despite working Trail CLI reads. Completion of confidence, risk, drift, security and summary is therefore unverified. Check these in the Trail's Entire UI before presenting all-six completion as evidence. The attempted CI-PR API call was not reached after the preceding read failed; no GitHub PR URL was verified.

For example, a future live-research change can use a Trail to collect review findings about citations and uncertain charges. Pushes update its evaluations; fix concrete findings, run relevant local checks, and inspect fresh results before human review and merge.

Use installed `entire agent-help trail` and each subcommand's help for current syntax. Inspect the current Trail with `entire trail show --json`, and open findings with `entire trail finding --json`. An empty findings list alone does not prove that every Runner completed successfully.

Repository access and public sharing are separate. The account currently reports this repository as private in Entire, with public checkpoint sharing disabled. A Trail URL does not establish judge access. No merge or deployment is part of this setup.
