/**
 * @file sys/bindings/sys/grammar/index.ts
 * @description Structured-output grammar engine — kind / enable / disable.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getGrammarState = commands.getGrammarState;
export const setGrammarKind = commands.setGrammarKind;
export const enableGrammar = commands.enableGrammar;
export const disableGrammar = commands.disableGrammar;

export type {
	GrammarFailure,
	GrammarKind,
	GrammarSnapshot,
	GrammarStatus,
} from "$lib/sys/generated/bindings.js";
