---
sidebar_position: 2
title: "Header Compliance"
---

# Header Compliance

The DevPulse platform uses a schema-driven header system to enforce documentation standards.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm headers:check` | Report files with missing/wrong headers |
| `pnpm headers:inject` | Add headers to files with no header |
| `pnpm headers:fix` | Patch missing tags + inject missing headers |
| `pnpm headers:validate` | Strict: exit 1 if any file non-compliant |

## How It Works

1. `file-context.ts` resolves namespace, layer, and kind from file paths
2. `file-schema.ts` matches against 45+ rules (first match wins)
3. Each rule declares required tags and a header generator
4. `inject-headers.ts` checks, injects, or patches headers

## Tag Patching (fix mode)

Fix mode is non-destructive — it inserts missing tags without replacing existing header content:

- **JSDoc**: Tags inserted before `*/`
- **Svelte**: Tags inserted before `-->`
- **Rust**: Tags appended to `//!` block

Run `pnpm platform:scan` for current compliance numbers.
