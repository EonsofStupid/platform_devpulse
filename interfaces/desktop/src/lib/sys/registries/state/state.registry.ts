/**
 * @file sys/registries/state/state.registry.ts
 * @module @devpulse/sys/registries/state
 * @description State modules registry for domain state lookup
 */

import {
	type StateRegistry as IStateRegistry,
	type StateModuleMetadata,
	StateModuleMetadataContract,
} from "../../contracts/index.js";
import { BaseRegistry } from "../base.registry.js";

/** Every state module in the app. Lazy: only the keys are read, nothing is loaded. */
const STATE_MODULES = import.meta.glob("/src/lib/**/*.state.svelte.ts");

/** Folders under `lib/domains` that hold domains rather than being one. */
const NAMESPACES = new Set(["app", "infra"]);

/**
 * What a state module's path says about it:
 * `/src/lib/domains/app/models/feature/downloader/data-access/downloader.state.svelte.ts`
 * is namespace `app`, domain `models`, feature `downloader`.
 */
export function stateModuleOf(file: string): StateModuleMetadata {
	const path = file.replace(/^\/src\//, "");
	const [, layer = "", ...rest] = path.split("/");
	const name = (rest.pop() ?? "").replace(".state.svelte.ts", "");
	const folders = rest.filter((segment) => segment !== "data-access");

	let namespace: string;
	let domain: string;
	let inner: string[];
	if (layer === "domains" && NAMESPACES.has(folders[0] ?? "")) {
		namespace = folders[0] ?? layer;
		domain = folders[1] ?? namespace;
		inner = folders.slice(2);
	} else if (layer === "domains") {
		namespace = layer;
		domain = folders[0] ?? layer;
		inner = folders.slice(1);
	} else if (layer === "devtools") {
		namespace = layer;
		domain = folders.join("/");
		inner = [];
	} else {
		namespace = layer;
		domain = folders[0] ?? layer;
		inner = folders.slice(1);
	}

	const feature = inner[0] === "feature" ? inner[1] : inner[0];
	return {
		id: `${namespace}.${domain}.${name}`,
		namespace,
		domain,
		...(feature === undefined ? {} : { feature }),
		path,
	};
}

/**
 * State registry implementation
 * Tracks all *.state.svelte.ts modules across domains
 */
class StateRegistryImpl extends BaseRegistry<StateModuleMetadata> implements IStateRegistry {
	private namespaceIndex = new Map<string, Set<string>>(); // namespace -> ids
	private domainIndex = new Map<string, Set<string>>(); // namespace/domain -> ids

	private fromIndex(ids: Set<string> | undefined): StateModuleMetadata[] {
		if (!ids) return [];
		return Array.from(ids).flatMap((id) => this.get(id) ?? []);
	}

	getByNamespace(namespace: string): StateModuleMetadata[] {
		return this.fromIndex(this.namespaceIndex.get(namespace));
	}

	getByDomain(namespace: string, domain: string): StateModuleMetadata[] {
		return this.fromIndex(this.domainIndex.get(`${namespace}/${domain}`));
	}

	getByFeature(
		namespace: string,
		domain: string,
		feature: string,
	): StateModuleMetadata | undefined {
		const domainModules = this.getByDomain(namespace, domain);
		return domainModules.find((m) => m.feature === feature);
	}

	getByOwner(owner: string): StateModuleMetadata[] {
		const [first = "", second] = owner.split("/");
		return second === undefined
			? this.getByDomain("domains", first)
			: this.getByDomain(first, second);
	}

	override register(id: string, item: StateModuleMetadata): void {
		StateModuleMetadataContract.assert(item);
		super.register(id, item);

		// Update namespace index
		const namespaceIds = this.namespaceIndex.get(item.namespace) ?? new Set<string>();
		this.namespaceIndex.set(item.namespace, namespaceIds.add(id));

		// Update domain index
		const domainKey = `${item.namespace}/${item.domain}`;
		const domainIds = this.domainIndex.get(domainKey) ?? new Set<string>();
		this.domainIndex.set(domainKey, domainIds.add(id));
	}

	override unregister(id: string): boolean {
		const item = this.get(id);
		if (item) {
			this.namespaceIndex.get(item.namespace)?.delete(id);
			this.domainIndex.get(`${item.namespace}/${item.domain}`)?.delete(id);
		}
		return super.unregister(id);
	}

	override clear(): void {
		super.clear();
		this.namespaceIndex.clear();
		this.domainIndex.clear();
	}
}

/** Singleton state registry */
export const stateRegistry = new StateRegistryImpl();

for (const file of Object.keys(STATE_MODULES)) {
	const metadata = stateModuleOf(file);
	stateRegistry.register(metadata.id, metadata);
}
