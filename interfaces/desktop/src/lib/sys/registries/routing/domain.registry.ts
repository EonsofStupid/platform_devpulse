/**
 * @file sys/registries/routing/domain.registry.ts
 * @module @devpulse/sys/registries/routing
 * @description Domain registry implementation (metadata-only, URL-driven)
 *
 * The owner's implementation from SPRINT-01B Task 6.1: sidebar status gates and
 * ordering, no page loading. It reached git only as a line in the barrel, under
 * the `/core/` folder that sprint forbade. Filled from the hub contracts.
 */

import {
	APP_DOMAINS,
	type DomainMetadata,
	DomainMetadataContract,
	type DomainRegistry,
	type DomainStatus,
} from "../../contracts/index.js";
import { BaseRegistry } from "../base.registry.js";

const byOrder = (a: DomainMetadata, b: DomainMetadata): number => a.order - b.order;

class DomainRegistryImpl extends BaseRegistry<DomainMetadata> implements DomainRegistry {
	getActive(): DomainMetadata[] {
		return this.getByStatus("active");
	}

	getByStatus(status: DomainStatus): DomainMetadata[] {
		return Array.from(this.items.values())
			.filter((d) => d.status === status)
			.sort(byOrder);
	}

	getVisible(): DomainMetadata[] {
		return Array.from(this.items.values())
			.filter((d) => d.status !== "hidden")
			.sort(byOrder);
	}

	override register(id: string, item: DomainMetadata): void {
		DomainMetadataContract.assert(item);
		super.register(id, item);
	}
}

/** Singleton domain registry */
export const domainRegistry = new DomainRegistryImpl();

for (const domain of APP_DOMAINS) domainRegistry.register(domain.id, domain);
