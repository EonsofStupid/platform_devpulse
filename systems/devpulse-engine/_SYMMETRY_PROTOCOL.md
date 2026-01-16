# SYMMETRY PROTOCOL: THE MIRROR LAW
> **Governing Law**: Every Component in `Maestro` (IP) MUST have a sanitized Facade in `Engine` (Public).

## The Mirror Map
| Maestro (Secret IP) | Engine (Public Facade) | Purpose |
| :--- | :--- | :--- |
| `cortex::minions` | `engine::facade::minions` | Exposed Agent Status / Public Profile |
| `cortex::reasoning` | `engine::facade::logic` | Exposed Decision Results / Confidence |
| `cortex::persistence` | `engine::facade::store` | Exposed Safe Storage Access / Quotas |

## Rules of Engagement
1. **Never Expose Instructions**: Maestro `instructions` string is NEVER defined in Engine types.
2. **Never Expose Keys**: Maestro `keys` are NEVER defined in Engine types.
3. **Lockstep Updates**: If you add a Minion to Maestro, you MUST add a Facade to Engine.
