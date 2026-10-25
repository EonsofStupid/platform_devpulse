/**
 * @file LibSQL Types — re-exported from specta bindings.
 * @module @devpulse/domains/infra/libsql/util/libsql.types
 */

export type {
	LibSqlDatabase,
	LibSqlHealth,
	LibSqlHealthAll,
	LibSqlQueryResult,
	LibSqlTableInfo,
} from "$lib/sys/generated/bindings.js";

/** Devtool tab identifiers. */
export type LibSqlTab = "health" | "tables" | "console";

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
