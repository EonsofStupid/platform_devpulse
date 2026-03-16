// ── Overlay patterns ────────────────────────────────────────
export { useDismissLayer } from "./dismiss-layer/index.js";
export type { DismissLayerConfig } from "./dismiss-layer/index.js";

export { useEscapeLayer } from "./escape-layer/index.js";
export type { EscapeLayerConfig } from "./escape-layer/index.js";

export { useFocusTrap } from "./focus-trap/index.js";
export type { FocusTrapConfig } from "./focus-trap/index.js";

export { usePresence } from "./presence/index.js";
export type { PresenceConfig, PresenceReturn } from "./presence/index.js";

export { useScrollLock } from "./scroll-lock/index.js";

// ── Navigation patterns ─────────────────────────────────────
export { useRovingFocus } from "./roving-focus/index.js";
export type { RovingFocusConfig } from "./roving-focus/index.js";

// ── Selection patterns ──────────────────────────────────────
export { useActiveDescendant } from "./active-descendant/index.js";
export type { ActiveDescendantConfig, ActiveDescendantReturn } from "./active-descendant/index.js";

// ── Search patterns ─────────────────────────────────────────
export { useTypeahead } from "./typeahead/index.js";
export type { TypeaheadConfig, TypeaheadReturn } from "./typeahead/index.js";

// ── Announcements ───────────────────────────────────────────
export { announce, useLiveRegion } from "./live-region/index.js";
export type { Politeness, LiveRegionReturn } from "./live-region/index.js";
