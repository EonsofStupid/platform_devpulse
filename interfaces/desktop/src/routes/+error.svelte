<script lang="ts">
import { resolve } from "$app/paths";
import { page } from "$app/state";
</script>

<div class="flex min-h-screen items-center justify-center bg-void-950 text-white">
	<div class="text-center">
		<h1 class="text-4xl font-bold">{page.status}</h1>
		<p class="mt-2 text-lg text-white/60">{page.error?.message ?? "Page not found"}</p>
		<a href={resolve("/")} class="mt-6 inline-block text-sm text-white/40 underline hover:text-white/80">
			Back to DevPulse
		</a>
	</div>
</div>
