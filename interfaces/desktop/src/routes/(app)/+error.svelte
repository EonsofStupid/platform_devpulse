<script lang="ts">
import { resolve } from "$app/paths";
import { page } from "$app/state";
</script>

<div class="flex flex-1 items-center justify-center text-white">
	<div class="text-center">
		<h1 class="text-3xl font-bold">{page.status}</h1>
		<p class="mt-2 text-white/60">{page.error?.message ?? "Something went wrong"}</p>
		<a
			href={resolve("/devpulse")}
			class="mt-4 inline-block text-sm text-white/40 underline hover:text-white/80"
		>
			Back to dashboard
		</a>
	</div>
</div>
