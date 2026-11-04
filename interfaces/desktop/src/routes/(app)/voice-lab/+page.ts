/** What this route folder says about itself (plan 0008). */

import { AudioLines } from "lucide-svelte";
import { VOICE_LAB_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: AudioLines, order: VOICE_LAB_DOMAIN.order };
