# Cross-Reference Legend — Tool Frustration Matrix

| Field | Value |
|-------|-------|
| **Status** | `LIVING DOCUMENT` |
| **Version** | `1.0.0` |
| **Last Updated** | `2026-04-23` |
| **Tools Covered** | 4 (Replit, Lovable, Bolt, Base44) |
| **Patterns Tracked** | 25 |

This matrix is the differentiating asset. Shows which frustrations are universal across tools vs tool-specific — genuinely valuable for users evaluating AI coding tools.

Grows as each new tool audit completes.

---

## Pattern Matrix

| Issue Pattern | Replit | Lovable | Bolt | Base44 |
|---------------|--------|---------|------|--------|
| Billing loops / credit death spiral | ✓ R006 | ✓ L002,L004 | ✓ B002 | ✓ 44-002 |
| Context rot in long sessions | ✓ R011 | ✓ L012 | ✓ B001 | ✓ 44-001 |
| RLS / auth security gaps | *(gap)* | ✓ L001 | ✓ B003 | — |
| Hardcoded secrets in client code | — | — | ✓ B009 | — |
| App Store rejection (Guideline 2.5.2) | ✓ R003 | *(gap)* | *(gap)* | N/A (PWA) |
| Stripe webhook silent failure | ✓ R009 | *(gap)* | *(gap)* | — |
| Generated code overwrites manual fixes | — | ✓ L002 | ✓ B007 | ✓ 44-011 |
| Vendor lock-in / proprietary infra | ✓ R012 | ✓ L005 | — | ✓ 44-003 |
| Editor lag on large projects | ✓ R015 | ✓ L008 | ✓ B010 | — |
| Mandatory free-tier branding | — | ✓ (in L) | ✓ B008 | ✓ 44-007 |
| Multi-file refactor instability | — | ✓ (in L) | — | ✓ 44-010 |
| Mobile responsive CSS failures | — | ✓ (in L) | — | ✓ 44-005 |
| No credit top-up option | — | ✓ (in L) | — | ✓ 44-006 |
| False deployment success reports | ✓ (in R) | — | — | ✓ 44-008 |
| Hallucinated library imports | — | ✓ (in L) | ✓ B011 | ✓ 44-014 |
| OAuth issues (non-Google) | — | ✓ (in L) | — | ✓ 44-013 |
| No real-time code collaboration | — | ✓ (in L) | — | ✓ 44-015 |
| Next.js hydration failures | — | ✓ (in L) | ✓ B005 | — |
| Shadcn/Radix asChild pattern | — | ✓ (in L) | ✓ B013 | — |
| Supabase auth deadlock | — | ✓ (in L) | ✓ B014 | — |
| Session timeout state loss | ✓ (in R) | — | ✓ B015 | — |
| NPM hallucinated versions | — | ✓ (in L) | ✓ B011 | — |
| Node.js only backend | — | ✓ (in L) | ✓ B012 | — |
| Background task credit drain | — | — | — | ✓ 44-004 |
| File upload size limits | — | — | — | ✓ 44-009 |


## Universal Patterns (Confirmed Across ALL 4 Tools)

These are the baseline AI-builder problems. Any new tool audited will almost certainly show these:

1. **Billing loops / credit death spiral** — agent gets stuck, burns tokens/credits attempting fixes that don't work
2. **Context rot in long sessions** — agent forgets earlier instructions as conversation grows
3. **Generated code overwrites manual fixes** — agent regenerates entire files, wiping hand-written changes

## Near-Universal (3 of 4 Tools)

4. **Vendor lock-in / proprietary infra** — all except Bolt tie you to their backend
5. **Editor lag on large projects** — browser-based editors struggle past ~2k lines / 50 files
6. **Mandatory free-tier branding** — all except Replit require paid tier for badge removal

## Gaps That Need Filling (Next Audit Runs Should Address)

- **Replit** missing: RLS/auth entry (other 3 tools have it — likely applies)
- **Lovable** missing: App Store rejection, Stripe webhook (Replit/Bolt both cross-tag)
- **Bolt** missing: App Store rejection, Stripe webhook
- **Base44**: Apple 2.5.2 may not apply (PWA architecture) — verify in next update

## Tool-Unique Frustrations (Differentiators)

Base44's "half-export" problem is currently unique (only frontend exports, backend stays proprietary). This is the single worst lock-in documented.

Bolt's WebContainer architecture creates unique issues around:
- Chromium-only dependency
- Node.js-only backend
- Session timeout wiping dev state

Lovable's removed GitHub 2-way sync is a unique dealbreaker.

## Publishing Value

This matrix is itself a content asset. A blog post titled:

> "The 25 Universal Frustrations of AI Coding Tools (Based on 407 Verified Findings Across 4 Platforms)"

...is directly publishable on AngryViber and carries SEO weight no competitor has.
