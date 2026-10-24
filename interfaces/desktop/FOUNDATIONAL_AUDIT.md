# FOUNDATIONAL AUDIT & STANDARDIZATION PLAN
> **Goal**: Lock the Desktop Architecture with explicit standards. No more "Drift".
> **Scope**: `interfaces/desktop`

## 1. The Alias Standard (The "Shortcuts of Truth")
To ensure methodic imports and zero-relative-path-madness, we will standardize these aliases:

| Alias | Path | Purpose |
| :--- | :--- | :--- |
| **`$lib`** | `src/lib` | standard Svelte library root. |
| **`$cfg`** | `src/lib/cfg` | **SSOT** for Configs & Flags. (e.g., `import { flags } from '$cfg/flags'`) |
| **`$sys`** | `src/lib/sys` | System Core (Runes, Assets, Utils). |
| **`$domains`**| `src/lib/domains` | The Feature Modules. |

**Audit Action**:
- [ ] Update `vite.config.ts` to include `$cfg`, `$sys`, `$domains`.
- [ ] Update `tsconfig.json` to include exact type mappings.

## 2. The Topology Standard (The "Map")
| Domain Location | Scope | Content |
| :--- | :--- | :--- |
| **`$domains/clyffy`** | **SHARED** | The AI Kernel (Cortex, Minions). Available to App & Chat. |
| **`$domains/chat`** | **SHARED** | The Chat Engine (Interactions, Tools). |
| **`$domains/app/*`** | **PRIVATE** | Product Silos (`devpulse`, `overmind`, `wiredfront`). |

**Audit Action**:
- [ ] Verify `lib/domains` file structure matches this map.
- [ ] Ensure `overmind` is strictly inside `$domains/app/overmind`.

## 3. The Entry Standard (The "Boot")
| File | Role |
| :--- | :--- |
| **`src/main.ts`** | **Bootloader**. Mounts `App.svelte`. |
| **`src/App.svelte`** | **Router**. Imports `$sys/runes/global` to switch Domains. |
| **`src/index.html`** | **Host**. Loads `/main.ts`. |

**Audit Action**:
- [ ] Verify `index.html` source tag.
- [ ] Verify `main.ts` mount target.

## 4. Execution Plan
1.  **Configure**: Update Vite & TSConfig with the full Alias Suite.
2.  **Verify**: Run a clean build (`pnpm build`) to prove imports resolve.
3.  **Lock**: Commit this structure as the "Golden State".
