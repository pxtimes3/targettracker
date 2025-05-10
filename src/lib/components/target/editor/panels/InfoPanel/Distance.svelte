<script lang="ts">
    import { Field, Input, SelectField, Toggle, Button, Popover, type MenuOption } from "svelte-ux";
    import { CircleHelp } from "lucide-svelte";

    let { saved, distanceSelected } : { saved: boolean, distanceSelected?: any } = $props();
    
	const distanceOptions: MenuOption[] = [
		{
			value: "meters",
			label: "Meters",
			description: "Range is in meters."
		},
		{
			value: "yards",
			label: "Yards",
			description: "Range is in yards."
		},
	];
</script>
<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    <Field
        label="Distance"
        let:id
    >
        <Input 
            {id} 
            name="target.range" 
            placeholder=80
            type="number"
            on:keypress={ () => {saved = false} }
            required
        />
        <SelectField
            name="target.rangeUnit"
            options={distanceOptions}
            bind:value={distanceSelected}
            onchange={ () => {saved = false} }
            class="max-w-36"
        >
        </SelectField>
    </Field>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Distance to target.
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