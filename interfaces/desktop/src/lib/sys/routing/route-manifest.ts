/**
 * @file Route manifest — the route tree, generated from `src/routes` at build.
 * @module @devpulse/sys/routing
 *
 * `import.meta.glob` is resolved by Vite at build into a static map, so the
 * tree below is the folder structure itself: a page exists because its
 * `+page.svelte` exists, and a folder's metadata is its own `_nav` export
 * (see `route-nav.ts`). Route groups such as `(app)` are kept in `routeId`
 * and dropped from `path`, exactly as SvelteKit does.
 *
 * Lists of routes (sidebar, submenus, dashboards) are built from this tree;
 * nothing names a route by hand.
 */

import type { Pathname, RouteId } from "$app/types";
import type { RouteNav } from "./route-nav.js";

/** Every page in the app. Lazy: only the keys are read here. */
const PAGES = import.meta.glob("/src/routes/**/+page.svelte");

/** Each folder's own `_nav`, from `+page.ts` and `+layout.ts`. */
const PAGE_NAVS = import.meta.glob<RouteNav | undefined>("/src/routes/**/+page.ts", {
	eager: true,
	import: "_nav",
});
const LAYOUT_NAVS = import.meta.glob<RouteNav | undefined>("/src/routes/**/+layout.ts", {
	eager: true,
	import: "_nav",
});

/** One folder of the route tree. */
export interface RouteNode {
	/** URL path, groups removed: `/devtools/system/datastores/turso`. */
	path: Pathname;
	/** SvelteKit route id, groups kept: `/(devtools)/devtools/system/datastores/turso`. */
	routeId: RouteId;
	/** Last path segment (`turso`); empty for the root. */
	segment: string;
	/** Whether the folder has its own `+page.svelte`. */
	hasPage: boolean;
	/** The folder's own metadata (`+page.ts` wins over `+layout.ts`). */
	nav: RouteNav;
	/** Child folders that contain at least one page, in display order. */
	children: RouteNode[];
}

const ROUTES_PREFIX = "/src/routes";

/** `/src/routes/(app)/latest/+page.svelte` → `/(app)/latest`. */
function routeIdOf(file: string): string {
	const dir = file.slice(ROUTES_PREFIX.length, file.lastIndexOf("/"));
	return dir === "" ? "/" : dir;
}

/**
 * A `_`-prefixed export of every route folder, by route id. Pass the eager
 * globs of `+layout.ts` and `+page.ts`; a folder's page fields win over its
 * layout's. Feature modules use this for their own exports (`_devtool`).
 */
export function exportsByRouteId<T extends object>(
	layouts: Record<string, T | undefined>,
	pages: Record<string, T | undefined>,
): Map<string, T> {
	const out = new Map<string, T>();
	for (const [file, value] of Object.entries(layouts)) if (value) out.set(routeIdOf(file), value);
	for (const [file, value] of Object.entries(pages)) {
		if (!value) continue;
		const id = routeIdOf(file);
		out.set(id, { ...out.get(id), ...value });
	}
	return out;
}

const isGroup = (segment: string): boolean => segment.startsWith("(") && segment.endsWith(")");

/** `/(app)/latest` → `/latest`. */
function pathOf(routeId: string): string {
	const segments = routeId.split("/").filter((s) => s !== "" && !isGroup(s));
	return `/${segments.join("/")}`;
}

function compareNodes(a: RouteNode, b: RouteNode): number {
	const ao = a.nav.order ?? Number.POSITIVE_INFINITY;
	const bo = b.nav.order ?? Number.POSITIVE_INFINITY;
	return ao === bo ? a.segment.localeCompare(b.segment) : ao - bo;
}

/** The tree plus lookups by URL path and by route id. */
interface RouteIndex {
	root: RouteNode;
	byPath: Map<string, RouteNode>;
	byId: Map<string, RouteNode>;
}

function buildTree(): RouteIndex {
	const navById = exportsByRouteId(LAYOUT_NAVS, PAGE_NAVS);

	const byId = new Map<string, RouteNode>();
	const node = (routeId: string): RouteNode => {
		const existing = byId.get(routeId);
		if (existing) return existing;
		const path = pathOf(routeId);
		const created: RouteNode = {
			// Built from the same folders SvelteKit generates `Pathname` and
			// `RouteId` from, so these strings are members of those unions.
			path: path as Pathname,
			routeId: routeId as RouteId,
			segment: path === "/" ? "" : path.slice(path.lastIndexOf("/") + 1),
			hasPage: false,
			nav: navById.get(routeId) ?? {},
			children: [],
		};
		byId.set(routeId, created);
		return created;
	};

	const root = node("/");
	for (const file of Object.keys(PAGES)) {
		const routeId = routeIdOf(file);
		node(routeId).hasPage = true;
		// Link every folder on the way down; groups attach to their parent.
		const parts = routeId.split("/").filter(Boolean);
		let parent = root;
		let id = "";
		for (const part of parts) {
			id = `${id}/${part}`;
			if (isGroup(part)) continue;
			const child = node(id);
			if (!parent.children.includes(child)) parent.children.push(child);
			parent = child;
		}
	}

	const byPath = new Map<string, RouteNode>();
	const visit = (n: RouteNode): void => {
		n.children.sort(compareNodes);
		byPath.set(n.path, n);
		for (const c of n.children) visit(c);
	};
	visit(root);
	return { root, byPath, byId };
}

const TREE = buildTree();

/** The whole route tree, rooted at `/`. */
export const routeTree: RouteNode = TREE.root;

/** The folder at a URL path (groups removed), if it holds a page. */
export function findRoute(path: string): RouteNode | undefined {
	return TREE.byPath.get(path);
}

/** The folder for a SvelteKit route id — use with `page.route.id`. */
export function findRouteById(routeId: string | null): RouteNode | undefined {
	return routeId === null ? undefined : TREE.byId.get(routeId);
}

/** The folder above a node; `undefined` for the root. */
export function parentOf(node: RouteNode): RouteNode | undefined {
	if (node.path === "/") return undefined;
	const up = node.path.slice(0, node.path.lastIndexOf("/"));
	return TREE.byPath.get(up === "" ? "/" : up);
}

/** The node's top-level ancestor (itself when it is top-level). */
export function topLevelOf(node: RouteNode): RouteNode {
	let current = node;
	for (let up = parentOf(current); up && up.path !== "/"; up = parentOf(current)) current = up;
	return current;
}

/** Every page at or below a node, depth-first in display order. */
export function pagesUnder(node: RouteNode): RouteNode[] {
	const out: RouteNode[] = [];
	const walk = (n: RouteNode): void => {
		if (n.hasPage) out.push(n);
		for (const c of n.children) walk(c);
	};
	walk(node);
	return out;
}
