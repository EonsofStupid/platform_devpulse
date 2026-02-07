/**
 * @file src/lib/sys/debug/vpb/components/builder/defaults.ts
 * @description Block templates for VPB palette.
 *
 * @since 1.0.0
 */

import { type BlockNode, createBlock } from "./schema";

// ===========================================
// BLOCK TEMPLATES
// ===========================================

/**
 * Pre-configured block template.
 */
export interface BlockTemplate {
	id: string;
	name: string;
	description: string;
	category: "shell" | "surface" | "widget" | "chat";
	create: () => BlockNode;
}

/**
 * Available block templates.
 */
export const blockTemplates: BlockTemplate[] = [
	{
		id: "app-shell",
		name: "App Shell",
		description: "Full application shell with 5-layer structure",
		category: "shell",
		create: () => createBlock("appShell"),
	},
	{
		id: "glass-panel",
		name: "Glass Panel",
		description: "Translucent glass panel with backdrop blur",
		category: "surface",
		create: () => createBlock("panel", { props: { padding: "md", variant: "glass" } }),
	},
	{
		id: "matte-panel",
		name: "Matte Panel",
		description: "Solid matte panel",
		category: "surface",
		create: () => createBlock("panel", { props: { padding: "md", variant: "solid" } }),
	},
	{
		id: "glass-card",
		name: "Glass Card",
		description: "Glass card for content display",
		category: "surface",
		create: () => createBlock("card"),
	},
	{
		id: "chat-dock",
		name: "Chat Dock",
		description: "Floating chat panel",
		category: "chat",
		create: () => createBlock("chatDock", { props: { position: "right", expanded: true } }),
	},
	{
		id: "stat-widget",
		name: "Stat Widget",
		description: "Single metric display",
		category: "widget",
		create: () => createBlock("statMeter"),
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
