/**
 * @file sys/bindings/sys/project-db/index.ts
 * @description Per-project LibSQL devtool surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const initProjectDb = commands.initProjectDb;
export const projectDbHealth = commands.projectDbHealth;
export const projectDbListTables = commands.projectDbListTables;
export const projectDbQuery = commands.projectDbQuery;

export type {
	ProjectDbHealth,
	ProjectDbInitResult,
	ProjectDbQueryResult,
	ProjectDbTableInfo,
} from "$lib/sys/generated/bindings.js";
