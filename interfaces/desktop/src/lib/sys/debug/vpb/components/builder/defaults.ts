/**
 * @file src/lib/sys/debug/vpb/components/builder/defaults.ts
 * @description Block templates for VPB palette.
 *
 * Names and descriptions are copy (`[vpb.templates]`).
 *
 * @since 1.0.0
 */

import type { BlockNode } from "@devpulse/coldlight/blocks";
import { createBlock } from "./schema.js";

// ===========================================
// BLOCK TEMPLATES
// ===========================================

/**
 * Pre-configured block template.
 */
export interface BlockTemplate {
	id: string;
	category: "shell" | "surface" | "widget" | "chat";
	create: () => BlockNode;
}

/**
 * Available block templates.
 */
export const blockTemplates: BlockTemplate[] = [
	{
		id: "app-shell",
		category: "shell",
		create: () => createBlock("app-shell"),
	},
	{
		id: "glass-panel",
		category: "surface",
		create: () => createBlock("panel", { props: { surface: "glass-deep" } }),
	},
	{
		id: "matte-panel",
		category: "surface",
		create: () => createBlock("panel", { props: { surface: "matte-dark" } }),
	},
	{
		id: "glass-card",
		category: "surface",
		create: () => createBlock("card"),
	},
	{
		id: "chat-dock",
		category: "chat",
		create: () => createBlock("chat-dock"),
	},
	{
		id: "stat-widget",
		category: "widget",
		create: () => createBlock("stat-meter"),
	},
];

/**
 * Get template by ID.
 */
export function getTemplate(id: string): BlockTemplate | undefined {
	return blockTemplates.find((t) => t.id === id);
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(category: BlockTemplate["category"]): BlockTemplate[] {
	return blockTemplates.filter((t) => t.category === category);
}
