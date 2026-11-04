/**
 * @file sys/bindings/knowledge/index.ts
 * @description Knowledge-entry retrieval + reaction logging.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const getKnowledgeEntry = commands.getKnowledgeEntry;
export const recordKnowledgeReaction = commands.recordKnowledgeReaction;

export type { KnowledgeEntryDto } from "#lib/sys/generated/bindings.js";
