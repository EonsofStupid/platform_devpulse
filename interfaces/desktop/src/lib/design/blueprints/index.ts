/**
 * @file Blueprint Registry
 * @description Central registry for ColdLight composition blueprints.
 */

import type { BlueprintDefinition } from "./types.js";

const blueprints = new Map<string, BlueprintDefinition>();

export function registerBlueprint(bp: BlueprintDefinition): void {
  blueprints.set(bp.id, bp);
}

export function getBlueprint(id: string): BlueprintDefinition | undefined {
  return blueprints.get(id);
}

export function getBlueprintsForKind(kind: string): BlueprintDefinition[] {
  return Array.from(blueprints.values()).filter((b) => b.kind === kind);
}

export type { BlueprintDefinition, SlotWiring } from "./types.js";
