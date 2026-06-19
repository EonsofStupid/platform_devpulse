# WardenClyffe Plugin (Phase 3)

Bundles the WardenClyffe Claude extensions into one installable plugin, in the
official Anthropic marketplace/plugin format (verified against
`anthropics/claude-plugins-official`).

## Structure

```
plugin/
  .claude-plugin/marketplace.json     # marketplace listing (one plugin: wardenclyffe)
  plugins/wardenclyffe/
    .claude-plugin/plugin.json         # plugin manifest
    .mcp.json                          # Clyffy MCP connector (Streamable HTTP)
    skills/                            # ← bundled from ../../skills at package time
      signal-routing/SKILL.md
      memory-ledger/SKILL.md
    commands/                          # slash commands (see below)
```

**Skills bundling:** the canonical skills live at `docs/wardenclyffe/skills/`. Copy
(or symlink) them into `plugins/wardenclyffe/skills/` when packaging — kept single-
source to avoid drift. Both are zero-context by design (progressive disclosure).

## Install

```bash
# from a clone of this repo
claude plugin marketplace add ./docs/wardenclyffe/plugin
claude plugin install wardenclyffe@wardenclyffe-marketplace
```

Or publish the `plugin/` tree as its own repo and add it via the Directory.

## What it provides

- **Connector** `clyffy` — points Claude Desktop/Code at your self-hosted
  `devpulse-mcp` server (Streamable HTTP). Set `WARDENCLYFFE_TOKEN` and the real
  endpoint (replace `mcp.wardenclyffe.local`) for your 2U/Blackwell deployment.
- **Skills** `signal-routing`, `memory-ledger`.
- **Commands** (drop into `commands/` as `.md` files):

`commands/scaffold-site.md`:
```markdown
---
description: Scaffold a new WardenClyffe site (casual | professional | community) from the shared shell.
---
Create a new Lovable-compatible site using the shared ColdLight shell. Ask for the
audience tier (casual/professional/community) and domain, then: 1) fork the shell
template, 2) apply the matching ColdLight theme tokens, 3) wire the `clyffy`
connector + Supabase project, 4) open the first PR. Reuse components; never fork them.
```

`commands/theme-swap.md`:
```markdown
---
description: Swap a site's ColdLight theme between casual and professional without forking components.
---
Re-theme the current site by switching ColdLight token sets only. Verify every
component still renders against the new tokens (run the ColdLight verify pass).
Same primitives, different brand — no component duplication.
```

## Verification (on the build box)

1. `claude plugin marketplace add ./docs/wardenclyffe/plugin` resolves.
2. `claude plugin install wardenclyffe@...` lists the `clyffy` connector + 2 skills.
3. The `clyffy` connector authenticates and the MCP Inspector lists `reason` /
   `context_search` (see `../clyffy-mcp-server-spec.md`).
