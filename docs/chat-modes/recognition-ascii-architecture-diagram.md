# ASCII architecture diagram as the spec

> The diagram IS the design. Mirror it node-for-node.

**Verified triggers (corpus document-frequency):** `│` (49 hits), `└─` (41), `┌` (17).
**Promote to:** skill — `mirror-the-diagram`.

## When this mode is active

User has authored an ASCII diagram inside a code fence — Unicode box-drawing characters, vertical arrows, file-tree branches, labeled boxes. The diagram is preceded by a heading like `## Architecture` or `## Module Structure`.

This is not a sketch. It is the complete design.

## What it means

The user has already done the design work. They want the code laid out exactly like the diagram — same module names, same edges, same direction of flow. They are not asking for opinions on the architecture.

## Automatic actions

- Treat each labeled box as a required module / struct / file with the exact name shown.
- Treat arrows as the only allowed dependency edges; do not introduce shortcuts or back-edges.
- Mirror file-tree diagrams 1:1 — create exactly those files in exactly those directories.
- Quote the diagram back at the top of the implementation as a comment or doc-block so drift is visible.
- If something in the diagram is impossible (cycle, missing dep), surface that single fact and stop — do not silently substitute.

## Anti-patterns

- Proposing an alternate layering "for cleanliness".
- Renaming boxes ("I called it `FooHandler` instead of `FooSlot`").
- Adding intermediate adapters or facades the diagram does not show.
- Asking which box should be implemented first when the arrows imply a topological order.
- Skipping a box because "we can stub it later".
