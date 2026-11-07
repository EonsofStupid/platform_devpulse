/**
 * @file src/lib/design/taxonomy/slots.ts
 * @layer taxonomy
 *
 * Slot definitions and constraints for block composition.
 * Uses const arrays with derived types for compile-time validation.
 */

import { z } from "zod";
import type { BlockKind } from "./kind/kinds";

// ===========================================
// SLOT CONFIGURATION SCHEMA
// ===========================================

export const DsSlotConfigSchema = z.object({
  required: z.boolean().default(false),
  maxChildren: z.number().default(0),
  allowedKinds: z.array(z.string()).default([]),
  defaultChildRecipe: z.string().optional(),
});

export type DsSlotConfig = z.infer<typeof DsSlotConfigSchema>;

// ===========================================
// SLOT NAME CONSTANTS (SSOT)
// ===========================================

// -----------------------------------------
// SHELL SLOTS
// -----------------------------------------

export const AppShellSlots = ["topBar", "sideNav", "main", "statusBar", "dock"] as const;
export const TopBarSlots = ["left", "center", "right"] as const;
export const SideNavSlots = ["header", "body", "footer"] as const;
export const StatusBarSlots = ["left", "center", "right"] as const;
export const DockSlots = ["content"] as const;

// -----------------------------------------
// SURFACE SLOTS
// -----------------------------------------

export const PanelSlots = ["header", "body", "footer"] as const;
export const CardSlots = ["header", "body", "footer"] as const;
export const ModalSlots = ["header", "body", "footer"] as const;
export const GlassFrameSlots = ["content"] as const;

// -----------------------------------------
// WIDGET SLOTS
// -----------------------------------------

export const WidgetSlots = ["header", "body"] as const;
export const StatMeterSlots = ["value", "label"] as const;
export const ChartSlots = ["header", "chart"] as const;

// -----------------------------------------
// CHAT SLOTS
// -----------------------------------------

export const ChatDockSlots = ["header", "messages", "input"] as const;
export const ChatThreadSlots = ["messages"] as const;
export const ChatBubbleSlots = ["content", "meta"] as const;

// ===========================================
// DERIVED TYPES
// ===========================================

export type AppShellSlot = (typeof AppShellSlots)[number];
export type TopBarSlot = (typeof TopBarSlots)[number];
export type SideNavSlot = (typeof SideNavSlots)[number];
export type StatusBarSlot = (typeof StatusBarSlots)[number];
export type DockSlot = (typeof DockSlots)[number];

export type PanelSlot = (typeof PanelSlots)[number];
export type CardSlot = (typeof CardSlots)[number];
export type ModalSlot = (typeof ModalSlots)[number];
export type GlassFrameSlot = (typeof GlassFrameSlots)[number];

export type WidgetSlot = (typeof WidgetSlots)[number];
export type StatMeterSlot = (typeof StatMeterSlots)[number];
export type ChartSlot = (typeof ChartSlots)[number];

export type ChatDockSlot = (typeof ChatDockSlots)[number];
export type ChatThreadSlot = (typeof ChatThreadSlots)[number];
export type ChatBubbleSlot = (typeof ChatBubbleSlots)[number];

// ===========================================
// SLOT CONFIGURATIONS
// ===========================================

export const appShellSlotConfig: Record<AppShellSlot, DsSlotConfig> = {
  topBar: { required: false, maxChildren: 1, allowedKinds: ["topBar"], defaultChildRecipe: "shell.topBar.default" },
  sideNav: { required: false, maxChildren: 1, allowedKinds: ["sideNav"], defaultChildRecipe: "shell.sideNav.default" },
  main: { required: true, maxChildren: 0, allowedKinds: ["panel", "widget"], defaultChildRecipe: "panel.glass.deep" },
  statusBar: { required: false, maxChildren: 1, allowedKinds: ["statusBar"], defaultChildRecipe: "shell.statusBar.default" },
  dock: { required: false, maxChildren: 1, allowedKinds: ["dock", "chatDock"], defaultChildRecipe: "chat.dock.default" },
};

export const topBarSlotConfig: Record<TopBarSlot, DsSlotConfig> = {
  left: { required: false, maxChildren: 0, allowedKinds: [] },
  center: { required: false, maxChildren: 0, allowedKinds: [] },
  right: { required: false, maxChildren: 0, allowedKinds: [] },
};

export const sideNavSlotConfig: Record<SideNavSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  body: { required: true, maxChildren: 0, allowedKinds: [] },
  footer: { required: false, maxChildren: 1, allowedKinds: [] },
};

export const statusBarSlotConfig: Record<StatusBarSlot, DsSlotConfig> = {
  left: { required: false, maxChildren: 0, allowedKinds: [] },
  center: { required: false, maxChildren: 0, allowedKinds: [] },
  right: { required: false, maxChildren: 0, allowedKinds: [] },
};

export const dockSlotConfig: Record<DockSlot, DsSlotConfig> = {
  content: { required: true, maxChildren: 0, allowedKinds: [] },
};

export const panelSlotConfig: Record<PanelSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  body: { required: true, maxChildren: 0, allowedKinds: [] },
  footer: { required: false, maxChildren: 1, allowedKinds: [] },
};

export const cardSlotConfig: Record<CardSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  body: { required: true, maxChildren: 0, allowedKinds: [] },
  footer: { required: false, maxChildren: 1, allowedKinds: [] },
};

export const modalSlotConfig: Record<ModalSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  body: { required: true, maxChildren: 0, allowedKinds: [] },
  footer: { required: false, maxChildren: 1, allowedKinds: [] },
};

export const glassFrameSlotConfig: Record<GlassFrameSlot, DsSlotConfig> = {
  content: { required: true, maxChildren: 0, allowedKinds: [] },
};

export const widgetSlotConfig: Record<WidgetSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  body: { required: true, maxChildren: 0, allowedKinds: [] },
};

export const statMeterSlotConfig: Record<StatMeterSlot, DsSlotConfig> = {
  value: { required: true, maxChildren: 1, allowedKinds: [] },
  label: { required: false, maxChildren: 1, allowedKinds: [] },
};

export const chartSlotConfig: Record<ChartSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  chart: { required: true, maxChildren: 1, allowedKinds: [] },
};

export const chatDockSlotConfig: Record<ChatDockSlot, DsSlotConfig> = {
  header: { required: false, maxChildren: 1, allowedKinds: [] },
  messages: { required: true, maxChildren: 0, allowedKinds: ["chatThread", "chatBubble"], defaultChildRecipe: "chat.bubble.user" },
  input: { required: true, maxChildren: 1, allowedKinds: ["inputFrame"], defaultChildRecipe: "input.glass.default" },
};

export const chatThreadSlotConfig: Record<ChatThreadSlot, DsSlotConfig> = {
  messages: { required: true, maxChildren: 0, allowedKinds: ["chatBubble"], defaultChildRecipe: "chat.bubble.user" },
};

export const chatBubbleSlotConfig: Record<ChatBubbleSlot, DsSlotConfig> = {
  content: { required: true, maxChildren: 1, allowedKinds: [] },
  meta: { required: false, maxChildren: 1, allowedKinds: [] },
};

// ===========================================
// SLOT REGISTRY
// ===========================================

export const kindSlots: Partial<Record<BlockKind, Record<string, DsSlotConfig>>> = {
  // Shell kinds
  appShell: appShellSlotConfig,
  topBar: topBarSlotConfig,
  sideNav: sideNavSlotConfig,
  statusBar: statusBarSlotConfig,
  dock: dockSlotConfig,

  // Surface kinds
  panel: panelSlotConfig,
  card: cardSlotConfig,
  modal: modalSlotConfig,
  glassFrame: glassFrameSlotConfig,

  // Widget kinds
  widget: widgetSlotConfig,
  statMeter: statMeterSlotConfig,
  chart: chartSlotConfig,

  // Chat kinds
  chatDock: chatDockSlotConfig,
  chatThread: chatThreadSlotConfig,
  chatBubble: chatBubbleSlotConfig,
};

// ===========================================
// SLOT LOOKUP BY KIND
// ===========================================

/**
 * Maps block kinds to their slot arrays for compile-time validation.
 */
export const SlotsByKind = {
  appShell: AppShellSlots,
  topBar: TopBarSlots,
  sideNav: SideNavSlots,
  statusBar: StatusBarSlots,
  dock: DockSlots,
  panel: PanelSlots,
  card: CardSlots,
  modal: ModalSlots,
  glassFrame: GlassFrameSlots,
  widget: WidgetSlots,
  statMeter: StatMeterSlots,
  chart: ChartSlots,
  chatDock: ChatDockSlots,
  chatThread: ChatThreadSlots,
  chatBubble: ChatBubbleSlots,
} as const;

export type SlotName<K extends keyof typeof SlotsByKind> = (typeof SlotsByKind)[K][number];

// ===========================================
// HELPERS
// ===========================================

/**
 * Get slot configuration for a kind.
 */
export function getKindSlots(kind: BlockKind): Record<string, DsSlotConfig> | undefined {
  return kindSlots[kind];
}

/**
 * Check if a child kind is allowed in a slot.
 */
export function isChildAllowed(parentKind: BlockKind, slotName: string, childKind: BlockKind): boolean {
  const slots = kindSlots[parentKind];
  if (!slots) return true;
  const slot = slots[slotName];
  if (!slot) return false;
  if (slot.allowedKinds.length === 0) return true;
  return slot.allowedKinds.includes(childKind);
}

/**
 * Type-safe slot validator for a specific kind.
 */
export function isValidSlotForKind<K extends keyof typeof SlotsByKind>(
  kind: K,
  slot: string
): slot is SlotName<K> {
  return (SlotsByKind[kind] as readonly string[]).includes(slot);
}
