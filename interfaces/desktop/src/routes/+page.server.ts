/**
 * @file routes/+page.server.ts
 * @description Root redirect to devpulse dashboard
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
  redirect(302, '/devpulse');
};
