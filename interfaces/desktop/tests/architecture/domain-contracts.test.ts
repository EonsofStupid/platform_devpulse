/**
 * Every sidebar hub has a contract, and the contract tells the truth about its
 * folders. A hub's id is its route folder, its owner is a domain under
 * `lib/domains` that re-exports the contract, its order is what the folder's
 * `_nav` reads, and its features are that domain's `feature/` folders and the
 * hub's child routes. The folders are read from disk here, independently of
 * the manifest.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_DOMAINS, DomainMetadataContract } from "#lib/sys/contracts/index.js";
import { domainRegistry } from "#lib/sys/registries/routing/domain.registry.js";
import { findRoute, routeTree } from "#lib/sys/routing/route-manifest.js";

const DOMAINS = join(__dirname, "../../src/lib/domains");

/** The hubs the app sidebar lists, by the same rule it uses. */
const sidebarHubs = routeTree.children.filter(
	(n) => n.group === "(app)" && n.hasPage && (n.nav.placement ?? "primary") === "primary",
);

function featureFolders(owner: string): string[] {
	const dir = join(DOMAINS, owner, "feature");
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
}

describe("hub contracts", () => {
	it("every sidebar hub has one", () => {
		expect(
			sidebarHubs.filter((hub) => !domainRegistry.has(hub.segment)).map((h) => h.path),
		).toEqual([]);
	});

	it("the registry holds exactly the declared contracts, each valid", () => {
		expect(domainRegistry.getIds().sort()).toEqual(APP_DOMAINS.map((d) => d.id).sort());
		for (const domain of APP_DOMAINS) DomainMetadataContract.assert(domain);
	});

	for (const domain of APP_DOMAINS) {
		describe(domain.id, () => {
			const hub = findRoute(`/${domain.id}`);

			it("is a route folder with a page, unless hidden", () => {
				if (domain.status !== "hidden") expect(hub?.hasPage).toBe(true);
			});

			it("gives the folder its order", () => {
				if (hub) expect(hub.nav.order).toBe(domain.order);
			});

			it("names an owner that re-exports the contract", () => {
				const barrel = join(DOMAINS, domain.owner, "index.ts");
				expect(existsSync(barrel), barrel).toBe(true);
				expect(readFileSync(barrel, "utf8")).toMatch(/\b[A-Z_]+_DOMAIN\b/);
			});

			it("lists every feature folder of its owner", () => {
				const listed: readonly string[] = domain.features;
				expect(featureFolders(domain.owner).filter((f) => !listed.includes(f))).toEqual([]);
			});

			it("lists only features that exist, as a folder or a child route", () => {
				const folders = featureFolders(domain.owner);
				const routes = hub?.children.map((child) => child.segment) ?? [];
				const missing = domain.features.filter((f) => !folders.includes(f) && !routes.includes(f));
				expect(missing).toEqual([]);
			});
		});
	}
});
