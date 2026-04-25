/**
 * @file sys/bindings/projects/index.ts
 * @description Project CRUD + active-project + cross-references.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const createProject = commands.createProject;
export const listProjects = commands.listProjects;
export const getProject = commands.getProject;
export const deleteProject = commands.deleteProject;
export const restoreProject = commands.restoreProject;
export const getActiveProject = commands.getActiveProject;
export const setActiveProject = commands.setActiveProject;
export const clearActiveProject = commands.clearActiveProject;
export const addProjectReference = commands.addProjectReference;
export const listProjectReferences = commands.listProjectReferences;
export const removeProjectReference = commands.removeProjectReference;

export type {
	AddReferenceInput,
	CreateProjectInput,
	Project,
	ProjectReference,
	ProjectRow,
} from "$lib/sys/generated/bindings.js";
