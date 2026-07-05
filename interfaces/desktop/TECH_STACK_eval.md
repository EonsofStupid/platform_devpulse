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

## 5. Performance Profiling
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **Tracy** | 🟢 **MANDATORY** | Nanosecond-precision profiling for Rust. Essential for diagnosing local AI latency. |

## 6. IPC (The Nervous System)
| Option | Verdict | Reasoning |
| :--- | :--- | :--- |
| **Iceoryx2** | 🟢 **MANDATORY** | True Zero-Copy shared memory. Required for video frames/vector data between Engine<->GUI. |
| **Tauri Events** | 🟡 FALLBACK | Good for small signals, too slow for bulk data. |

**Final Protocol**: "Maximize Rust for Logic. Svelte for UI. TanStack for State. Tracy for speed. Iceoryx2 for data."
