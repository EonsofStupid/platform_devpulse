/**
 * @file sys/bindings/sys/relational/index.ts
 * @description Turso relational store devtool surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const tursoHealthAll = commands.tursoHealthAll;
export const tursoListTables = commands.tursoListTables;
export const tursoQuery = commands.tursoQuery;

export type {
	TursoDatabase,
	TursoHealth,
	TursoHealthAll,
	TursoQueryResult,
	TursoTableInfo,
} from "$lib/sys/generated/bindings.js";
