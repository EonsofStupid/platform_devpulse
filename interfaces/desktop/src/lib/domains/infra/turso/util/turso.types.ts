/**
 * @file Turso Types — re-exported from specta bindings.
 * @module @devpulse/domains/infra/turso/util/turso.types
 */

export type {
	TursoDatabase,
	TursoHealth,
	TursoHealthAll,
	TursoQueryResult,
	TursoTableInfo,
} from "$lib/sys/generated/bindings.js";

/** Devtool tab identifiers. */
export type TursoTab = "health" | "tables" | "console";

/** Database selector options. */
export interface DatabaseOption {
	label: string;
	value: "System" | "User";
	description: string;
}

export const DATABASE_OPTIONS: DatabaseOption[] = [
	{ label: "System", value: "System", description: "platform.db — sessions, projects, config" },
	{ label: "User", value: "User", description: "user.db — turns, preferences, api_keys" },
];
