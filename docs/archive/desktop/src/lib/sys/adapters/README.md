# sys/adapters/

External integration boundary.

## Purpose

- API client wrappers
- Third-party SDK adapters
- Plugin interfaces
- External service boundaries

## Conventions

| File Pattern | Purpose |
|--------------|---------|
| `*.adapter.ts` | External service adapter |
| `*.client.ts` | API client implementation |
| `*.plugin.ts` | Plugin interface |

## Rules

1. All external API calls MUST go through adapters
2. Adapters handle error normalization
3. Adapters provide TypeScript types for external data
