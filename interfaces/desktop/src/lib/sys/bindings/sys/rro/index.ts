/**
 * @file sys/bindings/sys/rro/index.ts
 * @description RRO state machine — depth / proximity / gather / purge / fork.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getRroState = commands.getRroState;
export const setRroDepth = commands.setRroDepth;
export const triggerRroGather = commands.triggerRroGather;
export const triggerRroPurge = commands.triggerRroPurge;
export const triggerRroFork = commands.triggerRroFork;
export const setRroProximity = commands.setRroProximity;

export type {
	RoutingConfig,
	RoutingMode,
	RroDepth,
	RroState,
	RroStateSnapshot,
	RroStateTransition,
} from "$lib/sys/generated/bindings.js";
