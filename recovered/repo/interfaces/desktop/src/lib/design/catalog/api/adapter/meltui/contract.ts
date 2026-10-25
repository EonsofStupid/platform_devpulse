/**
 * @file MeltUI Adapter Contract (Taxonomy Declaration)
 * @description Declares the capabilities and constraints of the MeltUI adapter.
 *
 * This lets the scanner know what "meltui mapping completeness" means
 * without pulling in Melt itself. The scanner uses this to:
 *   - Know which adapter IDs exist
 *   - Know which primitives MeltUI backs (builder inventory)
 *   - Enforce naming/folder rules for adapter mapping folders
 *   - Validate that every meltui-backed primitive has a 1:1 mapping on disk
 */

import type { MeltBuilderEntry, MeltManagedAttr, MeltPrimitive } from "./types.js";

// =============================================================================
// IDENTITY
// =============================================================================

export const ADAPTER_ID = "meltui" as const;
export const ADAPTER_SOURCE = "@melt-ui/svelte" as const;
export const ADAPTER_ROLE = "ariaStateProvider" as const;

// =============================================================================
// MANAGED ATTRIBUTES (adapter-wide)
// =============================================================================

/** Attributes MeltUI owns across all primitives - never override */
export const MANAGED_ATTRS: readonly MeltManagedAttr[] = [
	"role",
	"aria-modal",
	"aria-labelledby",
	"aria-describedby",
	"aria-selected",
	"aria-expanded",
	"aria-disabled",
	"aria-pressed",
	"aria-checked",
	"aria-orientation",
	"aria-controls",
	"aria-haspopup",
	"aria-activedescendant",
	"tabindex",
	"id",
];

// =============================================================================
// BUILDER INVENTORY
// =============================================================================

/**
 * Canonical builder inventory - every MeltUI-backed primitive and its builder.
 * Scanner uses this to validate adapter mapping folder completeness.
 */
export const BUILDER_INVENTORY: readonly MeltBuilderEntry[] = [
	{
		kind: "accordion",
		builder: "createAccordion",
		manages: ["aria-expanded", "aria-controls", "id"],
	},
	{
		kind: "alert-dialog",
		builder: "createDialog",
		manages: ["role", "aria-modal", "aria-labelledby", "aria-describedby", "tabindex", "id"],
	},
	{ kind: "checkbox", builder: "createCheckbox", manages: ["role", "aria-checked", "tabindex"] },
	{
		kind: "collapsible",
		builder: "createCollapsible",
		manages: ["aria-expanded", "aria-controls", "id"],
	},
	{
		kind: "combobox",
		builder: "createCombobox",
		manages: ["role", "aria-expanded", "aria-activedescendant", "aria-controls", "id"],
	},
	{ kind: "context-menu", builder: "createContextMenu", manages: ["role", "aria-haspopup", "id"] },
	{
		kind: "dialog",
		builder: "createDialog",
		manages: ["role", "aria-modal", "aria-labelledby", "aria-describedby", "tabindex", "id"],
	},
	{
		kind: "dropdown-menu",
		builder: "createDropdownMenu",
		manages: ["role", "aria-haspopup", "aria-expanded", "id"],
	},
	{ kind: "label", builder: "createLabel", manages: ["id"] },
	{ kind: "link-preview", builder: "createLinkPreview", manages: ["role", "id"] },
	{
		kind: "menubar",
		builder: "createMenubar",
		manages: ["role", "aria-haspopup", "aria-expanded", "id"],
	},
	{ kind: "pagination", builder: "createPagination", manages: ["aria-label", "aria-disabled"] },
	{ kind: "pin-input", builder: "createPinInput", manages: ["aria-label", "id"] },
	{
		kind: "popover",
		builder: "createPopover",
		manages: ["role", "aria-expanded", "aria-controls", "id"],
	},
	{ kind: "progress", builder: "createProgress", manages: ["role", "aria-valuenow"] },
	{
		kind: "radio-group",
		builder: "createRadioGroup",
		manages: ["role", "aria-checked", "tabindex"],
	},
	{
		kind: "select",
		builder: "createSelect",
		manages: ["role", "aria-expanded", "aria-selected", "aria-controls", "id"],
	},
	{ kind: "separator", builder: "createSeparator", manages: ["role", "aria-orientation"] },
	{ kind: "slider", builder: "createSlider", manages: ["role", "aria-orientation", "tabindex"] },
	{ kind: "switch", builder: "createSwitch", manages: ["role", "aria-checked", "tabindex"] },
	{
		kind: "tabs",
		builder: "createTabs",
		manages: ["role", "aria-selected", "aria-orientation", "tabindex", "id"],
	},
	{ kind: "tags-input", builder: "createTagsInput", manages: ["role", "aria-selected", "id"] },
	{ kind: "toggle", builder: "createToggle", manages: ["aria-pressed"] },
	{ kind: "toggle-group", builder: "createToggleGroup", manages: ["role", "aria-pressed"] },
	{ kind: "toolbar", builder: "createToolbar", manages: ["role", "aria-orientation"] },
	{ kind: "tooltip", builder: "createTooltip", manages: ["role", "id"] },
	{
		kind: "tree",
		builder: "createTreeView",
		manages: ["role", "aria-expanded", "aria-selected", "tabindex"],
	},
];

/** Quick lookup: kind → builder entry */
export const BUILDER_INDEX = new Map(
	BUILDER_INVENTORY.map((entry) => [entry.kind, entry] as const),
);

// =============================================================================
// SUPPORTED PRIMITIVES
// =============================================================================

/** All primitives MeltUI provides builders for */
export const SUPPORTED_PRIMITIVES: readonly MeltPrimitive[] = BUILDER_INVENTORY.map(
	(e) => e.kind,
) as unknown as readonly MeltPrimitive[];

// =============================================================================
// FOLDER RULES (scanner enforcement)
// =============================================================================

/**
 * Rules the scanner enforces for meltui adapter folders.
 * Every meltui-backed kind must have these files.
 */
export const REQUIRED_FILES = ["factory.ts", "mapping.ts", "index.ts"] as const;

/** Adapter folder path pattern */
export const PATH_PATTERN = "api/adapters/meltui/<kind>/" as const;

// =============================================================================
// ASSEMBLED CONTRACT
// =============================================================================

export const contract = {
	id: ADAPTER_ID,
	source: ADAPTER_SOURCE,
	role: ADAPTER_ROLE,
	managedAttrs: MANAGED_ATTRS,
	supportedPrimitives: SUPPORTED_PRIMITIVES,
	builderInventory: BUILDER_INVENTORY,
	builderIndex: BUILDER_INDEX,
	folderRules: {
		pathPattern: PATH_PATTERN,
		requiredFiles: REQUIRED_FILES,
	},
} as const;
