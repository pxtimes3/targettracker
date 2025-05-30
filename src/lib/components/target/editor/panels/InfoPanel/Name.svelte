<script lang="ts">
    import { Field, Input, Toggle, Button, Popover, type MenuOption } from "svelte-ux";
    import { CircleHelp } from "lucide-svelte";
    import { TargetStore } from "@/stores/TargetImageStore";
    import { DateTime } from "luxon";

    let { saved, value } : { saved: boolean, value: string } = $props();
</script>
<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    <Field 
        label="Name"
        let:id
    >
        <Input 
            {id} 
            name="info.name" 
            placeholder={ `Target #1 (${DateTime.now().toISODate()})` }
            bind:value={$TargetStore.info.name}
            on:keypress={ () => {saved = false} }
            required
        />
    </Field>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    A friendly name for the target so you can find it later.
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