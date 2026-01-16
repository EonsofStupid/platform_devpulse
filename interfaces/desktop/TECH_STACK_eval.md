# TECHNOLOGY STACK EVALUATION (Official Record)
> **Status**: APPROVED
> **Context**: Svelte 5 + Rust (Tauri) App.

## 1. State Management
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **Zustand** | 🔴 REJECT | React-centric. Redundant in Svelte 5. |
| **Jotai** | 🔴 REJECT | Atom-based pattern is native to Svelte 5 Runes. |
| **Svelte 5 Runes** | 🟢 **ADOPT** | Zero-runtime overhead. Fine-grained. "Rust-like" exactness. |

## 2. Virtualization
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **TanStack Virtual** | 🟢 **ADOPT** | Industry standard. Headless. Handles dynamic heights perfectly. |
| **Svelte Virtual** | 🟡 AVOID | Less maintained than TanStack. |

## 3. Data Sync
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **TanStack Query** | 🟢 **ADOPT** | Best for managing Async State (Loading/Error) from Tauri Invokes. |
| **Raw Promises** | 🔴 REJECT | Too much boilerplate for caching/deduping. |

## 4. DB/Table
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **TanStack Table** | 🟢 **ADOPT** | Headless control for complex data grids (Projects/Memories). |
| **Rust Native** | 🟢 **PRIORITY** | All *Storage* and *Filtration* happens in Rust (`Service::query`). Table just renders. |

**Final Protocol**: "Maximize Rust for Logic. Use Svelte Runes for UI State. Use TanStack for Complex UI behaviors."
