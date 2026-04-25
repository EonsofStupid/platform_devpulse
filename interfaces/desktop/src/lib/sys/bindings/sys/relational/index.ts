/**
 * @file sys/bindings/sys/relational/index.ts
 * @description LibSQL relational store devtool surface.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const libsqlHealthAll = commands.libsqlHealthAll;
export const libsqlListTables = commands.libsqlListTables;
export const libsqlQuery = commands.libsqlQuery;

export type {
	LibSqlDatabase,
	LibSqlHealth,
	LibSqlHealthAll,
	LibSqlQueryResult,
	LibSqlTableInfo,
} from "$lib/sys/generated/bindings.js";
