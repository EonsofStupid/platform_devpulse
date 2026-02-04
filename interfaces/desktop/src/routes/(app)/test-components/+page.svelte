<script lang="ts">
  import * as Dialog from "$lib/design/components/dialog/index.js";

  // Side-effect: register recipe + blueprint
  import "$lib/design/recipes/dialog.recipe.js";
  import "$lib/design/blueprints/dialog.blueprint.js";

  let open = $state(false);
</script>

<div class="p-8 space-y-8">
  <h1 class="text-2xl font-bold text-white">Component Test: Dialog</h1>

  <section class="space-y-4">
    <h2 class="text-lg text-white/70">Default Dialog (glass.void recipe)</h2>

    <Dialog.Root bind:open>
      <Dialog.Trigger>Open Dialog</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Dialog Title</Dialog.Title>
            <Dialog.Description>
              This is a test dialog with the glass-void recipe applied.
              It should have backdrop blur, rounded corners, and glass morphism styling.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <p class="text-sm text-white/50">
      Dialog is {open ? "open" : "closed"}
    </p>
  </section>
</div>
