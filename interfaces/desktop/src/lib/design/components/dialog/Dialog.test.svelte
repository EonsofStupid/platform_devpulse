<script lang="ts">
import * as Dialog from "./index.js";

// Side-effect: register recipe + blueprint
import "$lib/design/recipes/components/dialog/index.js";
import "$lib/design/blueprints/components/dialog/index.js";

interface Props {
	open?: boolean;
	triggerText?: string;
	titleText?: string;
	descriptionText?: string;
	closeText?: string;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	"data-id"?: string;
}

let {
	open = $bindable(false),
	triggerText = "Open Dialog",
	titleText = "Dialog Title",
	descriptionText = "Dialog description text.",
	closeText = "Close",
	closeOnEscape = true,
	closeOnOutsideClick = true,
	"data-id": dataId,
}: Props = $props();
</script>

<Dialog.Root bind:open {closeOnEscape} {closeOnOutsideClick} data-id={dataId}>
  <Dialog.Trigger>{triggerText}</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{titleText}</Dialog.Title>
        <Dialog.Description>{descriptionText}</Dialog.Description>
      </Dialog.Header>
      <Dialog.Footer>
        <Dialog.Close>{closeText}</Dialog.Close>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
