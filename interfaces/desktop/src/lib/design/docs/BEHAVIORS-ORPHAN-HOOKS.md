# Orphan Behavior Hooks — Decision Log

> **Purpose**: every hook under `design/behaviors/` either maps to a component folder with the same name, or it is an intentional shared primitive. This document closes the decision on every hook that was flagged as "no matching component folder" during the ARIA compliance audit (Phase 0F, 2026-04-11).

**Rule**: a hook is only "orphan" if it is a per-component behavior that has no consumer. Shared primitives, composition helpers, and internal utility hooks are NOT orphans — they are intentionally consumed by many components.

## Categories

### Category A — Shared low-level primitives (intentional, keep as-is)

These hooks are consumed by multiple components and are NOT meant to have their own component folder. They live under `behaviors/interaction/**` and `behaviors/_shared/**`.

| Hook | Path | Consumed by | Verdict |
|---|---|---|---|
| `useFocus` | `behaviors/interaction/focus/` | button, input, combobox, select, switch, slider, color-* — every focusable element | KEEP |
| `useFocusRing` | `behaviors/interaction/focus-ring/` | Every interactive component that shows a visible focus indicator | KEEP |
| `useFocusWithin` | `behaviors/interaction/focus-within/` | Compound components that react to descendant focus (popover, menu, form-field) | KEEP |
| `useHover` | `behaviors/interaction/hover/` | button, link, card, tooltip, menu-item | KEEP |
| `useKeyboard` | `behaviors/interaction/keyboard-handler/` | Shared key handling utility | KEEP |
| `useLongPress` | `behaviors/interaction/long-press/` | Mobile / touch interactions on buttons, menu items | KEEP |
| `useMove` | `behaviors/interaction/move/` | slider, color-area, color-wheel, draggable overlays | KEEP |
| `usePress` | `behaviors/interaction/press/` | button, link, menu-item — the canonical press abstraction across pointer/keyboard/touch | KEEP |
| `useDragAndDrop` | `behaviors/interaction/drag-and-drop/` | file-upload, sortable lists, kanban future work | KEEP |
| `useDropZone` | `behaviors/interaction/drop-zone/` | file-upload, chat attachment drop areas | KEEP |
| `useVirtualizer` | `behaviors/interaction/virtualizer/` | data-table, combobox listbox, long scroll areas | KEEP |
| `useLocale` | `behaviors/locale/` | calendar, date-field, number-field — locale-aware formatting | KEEP |
| `useFilter` | `behaviors/filter/` | combobox, select — fuzzy / contains / startsWith filtering | KEEP |

### Category B — Compound primitives (intentional, keep as-is)

These hooks implement ARIA patterns that are shared across multiple compound components. Each is the canonical implementation of a WAI-APG pattern.

| Hook | Path | Consumed by | Verdict |
|---|---|---|---|
| `useDisclosure` | `behaviors/overlays/disclosure/` | `collapsible`, `accordion` items | KEEP — `collapsible` folder aliases this hook |
| `useMenu` | `behaviors/navigation/menu/` | `menubar`, `nav`, `navigation-menu` | KEEP — three component folders share the menu primitive |
| `useListbox` | `behaviors/inputs/listbox/` | `select`, `combobox` | KEEP — internal primitive |
| `useFileTrigger` | `behaviors/inputs/file-trigger/` | `file-upload` | KEEP — internal sub-primitive |
| `useProgressCircle` | `behaviors/display/progress-circle/` | `progress`, `spinner`, `meter` variants | KEEP — shared visualisation primitive |
| `useLink` | `behaviors/navigation/link/` | Every `<a>`-rendering component that needs press + focus + download handling | KEEP |
| `useBreadcrumbs` | `behaviors/navigation/breadcrumbs/` | NOT YET consumed — component folder `breadcrumbs/` does not exist | **ACTION**: build the component |
| `useGridList` | `behaviors/navigation/grid-list/` | NOT YET consumed — component folder `grid-list/` does not exist | **ACTION**: build the component |
| `useTagGroup` | `behaviors/display/tag-group/` | NOT YET consumed — component folder `tag-group/` does not exist | **ACTION**: build the component |
| `useContent` | `behaviors/display/content/` | Shared wrapper used by blocks/layouts for content body sections | KEEP |

### Category C — Pending component authoring (hooks ready, components missing)

These hooks define real user-facing patterns with no current consumer. They are not deleted — the component folders should be authored in a follow-up sprint so the WAI-APG coverage is complete.

| Hook | Pending component | Notes |
|---|---|---|
| `useBreadcrumbs` | `components/breadcrumbs/` | Standard breadcrumb trail. WAI-APG pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ |
| `useGridList` | `components/grid-list/` | Grid-list is a flat selectable list rendered as a grid. WAI-APG pattern: https://www.w3.org/WAI/ARIA/apg/patterns/grid/ |
| `useTagGroup` | `components/tag-group/` | Tag group with optional removal. Useful for filter chips, applied filters on HF search. |

**Tracked action**: these three are added to the "deferred components" backlog. They do not block Phase A compliance since the hooks exist and pass WAI-APG review — only the component wrappers are missing.

## Non-orphan confirmations

The earlier audit listed 23 "orphan" hooks against 37 component folders without direct matches. After classification above, the real picture is:

- **13 hooks** are shared low-level primitives (Category A) — NOT orphans, every one is consumed via `useX()` calls inside other hooks.
- **7 hooks** are compound primitives consumed by component folders with a different name (Category B) — `useDisclosure` → `collapsible`/`accordion`, `useMenu` → `menubar`/`nav`/`navigation-menu`, `useListbox` → `select`/`combobox`, `useFileTrigger` → `file-upload`, `useProgressCircle` → `progress`/`spinner`/`meter`, `useLink` → every anchor-rendering component, `useContent` → block/layout consumers.
- **3 hooks** (`useBreadcrumbs`, `useGridList`, `useTagGroup`) are genuinely awaiting component wrappers. Tracked.

**Zero hooks are deleted.** Every existing behavior hook is either actively consumed or pending a component wrapper. The 2-layer ADR-001 architecture is fully honoured; the "no matching folder" metric was a false positive that conflated direct-name matching with actual consumption.

## Verification

To re-audit in the future:

```bash
# List every behavior hook
find interfaces/desktop/src/lib/design/behaviors -name 'use-*.svelte.ts' -o -name 'use-*.ts' | sed -E 's|.*/use-||; s|\.svelte\.ts$||; s|\.ts$||' | sort -u > /tmp/hooks.txt

# List every component kind
ls interfaces/desktop/src/lib/design/components | grep -v '^_\|^index\|\.ts$\|\.md$' | sort > /tmp/kinds.txt

# Show only the genuinely-orphan hooks (not in Categories A/B above)
comm -13 /tmp/kinds.txt /tmp/hooks.txt
```

Any entries in that `comm` output that are NOT explicitly listed in Category A, B, or C of this document are new orphans and require a decision.

---

**Authored**: Phase A.6 of the ARIA Gap Sweep sprint, 2026-04-11.
**Owner of this list**: update when a hook is added, deleted, or has its consumer relationship change.
