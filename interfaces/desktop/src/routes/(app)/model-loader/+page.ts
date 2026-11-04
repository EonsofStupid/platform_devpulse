/** What this route folder says about itself (plan 0008). */

import { Cpu } from "lucide-svelte";
import { MODEL_LOADER_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Cpu, order: MODEL_LOADER_DOMAIN.order };
