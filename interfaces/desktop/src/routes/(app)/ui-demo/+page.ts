/** What this route folder says about itself (plan 0008). */

import { Palette } from "lucide-svelte";
import { UIDEMO_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Palette, order: UIDEMO_DOMAIN.order };
