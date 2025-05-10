<script lang="ts">
	import { cls } from "@layerstack/tailwind";
	import { Field, MenuItem, type MenuOption, SelectField, Toggle, Button, Popover } from "svelte-ux";
    import { CircleHelp } from "lucide-svelte";

    let { saved } : { saved: boolean } = $props();
    
    let visibilitySelectedValue = $state(false);
    const visibilityOptions: MenuOption[] = [
		{
			label: 'Hidden',
			description: 'Not shown on your public page.',
			value: false
		},
		{
			label: 'Visible',
			description: 'Shown on your public page (if its set to public).',
			value: true
		},
	]; // default för visibility
    
</script>
<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    <Field
        label="Visibility"
        let:id
    >
        <SelectField
            name="info.public"
            options={visibilityOptions}
            bind:value={visibilitySelectedValue}
            on:change={() => saved = false}
        >
        <MenuItem
            slot="option"
            let:option
            let:index
            let:selected
            let:highlightIndex
            class={cls(
                index === highlightIndex && "bg-surface-content/5",
                option === selected && "font-semibold",
                option.label ? "px-4" : "px-2",
            )}
            scrollIntoView={index === highlightIndex}
        >
            <div>
                <div class="">{option.label}</div>
                <div class="text-sm text-surface-content/50">
                    {option.group} {option.caliber}
                </div>
            </div>
        </MenuItem>
    </SelectField>

    </Field>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Display your best targets on your public page (if your profile is set to public).
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