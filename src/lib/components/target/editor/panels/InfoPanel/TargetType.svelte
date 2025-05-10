<script lang="ts">
    import { Field, SelectField, Toggle, Button, Popover } from "svelte-ux";
    import { CircleHelp } from "lucide-svelte";

    let { saved } : { saved: boolean } = $props();
    
	const targetTypeOptions = [
		{
			value: 'one',
			label: 'oneLabel',
			description: 'one'
		}
	];
</script>
<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto] opacity-40">
    <Field
        label="Target Type"
        let:id
    >
        <SelectField
            options={targetTypeOptions}
            disabled
            name="type"
            on:change={ () => {saved = false} }
        >
        </SelectField>
    </Field>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Used for automatic scoring of your target. (Coming Soon&trade;)
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