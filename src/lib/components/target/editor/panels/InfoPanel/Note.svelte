<script lang="ts">
	import { TextField, Toggle, Button, Popover } from "svelte-ux";
    import { CircleHelp } from "lucide-svelte";

    let { saved } : { saved: boolean } = $props();
</script>

<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    <TextField
        label="Note"
        name="info.note"
        multiline
        onchange={ () => {saved = false} }
        placeholder="Today was a nice day... "
    ></TextField>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Any useful notes... 
                </div>
            </Popover>
            <Button
                on:click={toggle}
                class="p-1"
            >
                <CircleHelp size="16" />
            </Button>
        </Toggle>
    </div>
</div>