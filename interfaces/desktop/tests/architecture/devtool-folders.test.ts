/**
 * Every devtools folder carries what the dashboard and the shell read from
 * it (plan 0008): tiers a tone, buckets an icon, devtools an icon and an
 * accent. Dashboards are found from the folders that declare a tier tone.
 */

import { describe, expect, it } from "vitest";
import { devtoolNav, devtoolTiers } from "#lib/devtools/devtool-manifest.js";
import { parentOf, type RouteNode, routeTree } from "#lib/sys/routing/route-manifest.js";

function allNodes(node: RouteNode, out: RouteNode[] = []): RouteNode[] {
	out.push(node);
	for (const child of node.children) allNodes(child, out);
	return out;
}

const tierFolders = allNodes(routeTree).filter((n) => devtoolNav(n).tone !== undefined);
const dashboards = [...new Set(tierFolders.map((t) => parentOf(t)).filter((d) => d !== undefined))];

describe("devtools folders", () => {
	it("has a devtools dashboard", () => {
		expect(dashboards.length).toBeGreaterThan(0);
	});

	for (const dashboard of dashboards) {
		const tiers = devtoolTiers(dashboard);

		it(`${dashboard.path}: every tier folder declares a tone`, () => {
			for (const tier of dashboard.children) {
				expect(devtoolNav(tier).tone, tier.path).toBeDefined();
			}
		});

		it(`${dashboard.path}: every bucket declares an icon`, () => {
			for (const tier of tiers) {
				for (const bucket of tier.buckets)
					expect(bucket.node.nav.icon, bucket.node.path).toBeDefined();
			}
		});

		it(`${dashboard.path}: every devtool declares an icon and an accent`, () => {
			for (const tier of tiers) {
				for (const bucket of tier.buckets) {
					for (const tool of bucket.tools) {
						expect(tool.nav.icon, tool.path).toBeDefined();
						expect(devtoolNav(tool).accent, tool.path).toBeDefined();
					}
				}
			}
		});
	}
});
