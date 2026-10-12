# 09 — Connection slice family (plan 04 executed, INDEX)

> **SUPERSEDED — DO NOT EXECUTE (2026-10-12).** This family targeted the
> GB10 / Clyffy-server connection that the owner rolled back
> (`restore/pre-gb10`). Its generic parts (discovery ladder, honest per-attempt
> signals, ask-once + re-entry) are ported in
> `.plan/0001-engine--rebuild-onboarding-workflow.md` A4; the rest is dropped.

> Amnesia-grade execution of `../04-connection-audit-plan.md`'s remaining
> breaks, authored 2026-07-14 from live code reads (lib.rs probe loop,
> clyffy.rs commands, endpoint_discovery.rs builders, loader.rs
> ClyffyServiceEntry, connection_store.rs). Already landed elsewhere:
> C1 (62c61d50) · C5 (folded into 08/R6) · B7's wizard-step strings (die in
> 08/R5). Operator rulings 2026-07-14: Q-C1 = enable-assist (out of forward
> flow); Q-C4 = (a) REAL ConnectionMode.

## Slice DAG

| # | Slice | Fixes | Depends on | Status |
| --- | --- | --- | --- | --- |
| C2 | probe-loop status truth | B2 | — | PENDING |
| C3 | https-capable discovery (configured schemes) | B4 | — | PENDING |
| C4 | ConnectionMode REAL (local / network / gb10) | B3 | 08/R2, 08/R4a, C3 | PENDING |
| C6 | copy + vocabulary → SSOT (collab view, indicators) | B7 rest | 08/R2 pattern | PENDING |
| B8.n | cortex-purge series (census-bucketed sweep) | B8 | 08/R5 | PENDING |
| CV | checkpoint — operator walks connect end-to-end | — | ALL | PENDING |

Execution order: **08 family first (R1→R7), then C2 → C3 → C4 → C6 → B8.n → CV.**
C2 may run any time after R1 (independent of the UI slices) if the operator
wants the status-truth fix early.

Verification law identical to 08's INDEX (pnpm check 0/0 · targeted cargo
check · no-raw-values · diff ⊆ FILES · one commit per slice, pushed · known
reds = the recorded baseline only).

APPROVED BY OPERATOR: ____________
