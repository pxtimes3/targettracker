<script lang="ts">
    import { cls } from "@layerstack/tailwind";
	import { Field, SelectField, MenuItem, type MenuOption, Toggle, Button, Popover, Dialog } from "svelte-ux";
    import { CircleHelp, PlusSquare } from "lucide-svelte";
	import { TargetStore } from "@/stores/TargetImageStore";
	import { onMount } from "svelte";
	import AddEditAmmunition from "@/components/ammunition/AddEditAmmunition.svelte";
	import { type UUIDTypes } from "uuid";

    let { data } : { data: any } = $props();
    let dialogOpen = $state(false);
    let newAmmunitionId = $state<string | null>(null);

    // word boundary för capitalcase
	const re = /(\b[a-z](?!\s))/;

    const ammunitionOptions = data.gunsEvents.ammunition.map((amm: AmmunitionData) => ({
		value: amm.id,
		label: amm.name.replace(re, (l: string) => l.toUpperCase()),
		group: amm.type.replace(re, (l: string) => l.toUpperCase()),
	}))
	.sort((a: MenuOption, b: MenuOption) => {
        if(!a.group || !b.group) return;
        a.group.localeCompare(b.group)
    });
</script>

<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    <Field
        label="Ammunition"
        let:id
        placeholder="Select ammunition"
    >
        <SelectField
            bind:value={$TargetStore.info.ammunition}
            options={ammunitionOptions}
            name="info.ammunition"
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
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Button 
                class="ml-2 p-1"
                title="Add new ammunition"
                on:click={() => {
                    dialogOpen = true;
                    toggle();
                }}
            >
                <PlusSquare />
            </Button>
            <Dialog 
                {open} 
                on:close={() => {
                    dialogOpen = false;
                    toggleOff();
                }}
            >
                <div class="px-4 pt-4 pb-6">
                    <AddEditAmmunition
                        userId={data?.user?.id as unknown as UUIDTypes}
                        onSuccess={(ammunitionId) => {
                            console.debug('Gun created with ID:', ammunitionId);
                            newAmmunitionId = ammunitionId;
                            dialogOpen = false; // Close dialog on success
                        }}
                    />
                </div>
            </Dialog>
        </Toggle>
    </Field>
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Choose ammunition or create a new ammuntion entry.
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