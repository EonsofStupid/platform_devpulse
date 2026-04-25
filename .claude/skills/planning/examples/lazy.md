# Wire SurrealDB sidecar status

> ⚠ This is the **anti-pattern example.** Every section below
> illustrates a failure mode the planning skill is designed to prevent.
> Do not produce plans that look like this. Annotations in
> `> ❌ ...` blockquotes call out what's wrong.

```yaml
status: ready
target: wire the surreal status
slug: quick-wire-surreal
opened: 2026-04-22
```

## 1. Intake

User wants the surreal status wired up like ollama.

> ❌ FAILURE: paraphrased, not verbatim. No clarifying questions. We
> don't know if "like ollama" means same Tauri shape, same polling
> cadence, same fallback behavior — and the agent didn't ask. This is
> where sycophantic plans start: the agent assumes it knows what the
> user means and proceeds.

## 2. Surrounding code map

- `surrealdb_sidecar.rs` — surreal sidecar
- `ollama_sidecar.rs` — ollama sidecar
- the devtool page

> ❌ FAILURE: paths aren't qualified, "the devtool page" is not a
> path. One-line summaries just restate what the filename says.
> Reader gains nothing from reading this section.

## 3. Detailed reads

I read the surreal sidecar and the ollama sidecar. They look similar.
The wiring needs to follow the ollama pattern.

> ❌ FAILURE: zero citations. No `path:line` references. "They look
> similar" is opinion masquerading as research. The note-collapse
> pattern: notes that just restate the prompt and add no new
> information. Could have been written before reading anything.
> Notice also: the agent missed that `current_status()` does not
> exist on the Surreal sidecar — the very contradiction that would
> have changed the plan.

## 4. External research

This is internal so no research needed.

> ❌ FAILURE: that may be true, but the assertion is unsupported.
> Could have been wrong (the engine might use an external library
> with a known issue). The skill requires a one-sentence
> justification of why §4 is empty, not just a hand-wave.

## 5. Constraints discovered

The frontend uses Svelte 5 runes. The backend uses Tauri commands.

> ❌ FAILURE: these aren't constraints discovered by *this* research
> — they are facts from CLAUDE.md the agent already knew. No
> constraints from the actual code reads. No `### Contradictions to
> the ask` subsection — this is the explicit sycophancy guard, and
> it's been skipped. The agent never noticed that the user's premise
> ("wire it the same way") was wrong because the accessor doesn't
> exist yet.

## 6. Open questions

None.

> ❌ FAILURE: there were no clarifying questions in §1, so of course
> there are no open questions here. The skill requires ≥3 questions
> in §1 specifically to force this section to be substantive.

## 7. Risks / pre-mortem

It might not work the first time. We can fix it if it breaks.

> ❌ FAILURE: zero distinct risks. "It might not work" is not a risk;
> it's a tautology. No mitigation. No steel-man of the not-chosen
> alternative. The skill requires ≥3 distinct risks for a reason —
> the adversarial pass is what catches the issues that ship to prod.

## 8. Plan

1. Add a status command for surreal
2. Wire it in the frontend
3. Test it

> ❌ FAILURE: zero citations. No step references a Q-ID, finding,
> or constraint. The plan is unsourced. Step 1 silently assumes
> `current_status()` exists — the actual research would have shown it
> doesn't. This plan, executed, would fail at step 1 because the
> accessor is missing. The whole point of the citation rule is to
> catch this exact class of failure: a confident plan grounded in
> nothing.

## 9. Verification

It compiles and the page shows the status.

> ❌ FAILURE: "it compiles" is not a runtime signal — compile-green ≠
> product-works. No specific log scope to tail, no specific UI path
> to check, no specific transition to verify. The skill explicitly
> requires a runtime check, not a typecheck.

---

STATUS: complete

> ❌ META-FAILURE: this plan is marked `complete` but it is not. It
> would fail in execution because:
> 1. Step 1 assumes a non-existent accessor.
> 2. The user's premise was never tested ("like ollama" — but Surreal
>    isn't structured like Ollama yet).
> 3. The verification doesn't actually verify anything.
>
> Producing a plan that *looks* finished but is hollow is worse than
> producing no plan, because it gets approved and executed. The
> citation rule, the contradictions section, and the runtime
> verification requirement exist specifically to catch this shape.
>
> If your scratchpad is starting to look like this one, stop. Go back
> to the phase that's underdeveloped and finish it.
