/**
 * @file Transport Types
 * @description Generic typed bridge between MeltUI adapter and ColdLight contracts.
 * Shared by all ~40 primitive transports. Every slot and state uses ColdLight vocabulary.
 */

import type { Readable, Writable } from "svelte/store";

/**
 * Store that connectSlot action consumes — opaque to components.
 * Typed as `any` because slot stores carry adapter-specific builder metadata
 * (e.g., MeltUI's SomeBuilder) that components never introspect.
 * They only pass these to connectSlot, which knows the concrete type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SlotStore = any;

/**
 * Typed transport adapter. Components interact with this, never MeltUI directly.
 * TSlot = ColdLight slot union from taxonomy (e.g., DialogSlot)
 * TStates = record of state stores keyed by ColdLight state tokens
 */
export interface TransportAdapter<
  TSlot extends string,
  TStates extends Record<string, Readable<boolean> | Writable<boolean>>,
> {
  /** Per-slot stores keyed by ColdLight slot name */
  readonly slots: Record<TSlot, SlotStore>;
  /** State stores keyed by ColdLight state token */
  readonly states: TStates;
}
