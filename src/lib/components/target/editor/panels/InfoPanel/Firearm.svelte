<script lang="ts">
    import { cls } from "@layerstack/tailwind";
	import { Field, SelectField, Dialog, MenuItem, type MenuOption, Toggle, Button, Popover } from "svelte-ux";
    import { CircleHelp, PlusSquare, Target } from "lucide-svelte";
    import AddEditGun from "@/components/gun/AddEditGun.svelte";
    import { type UUIDTypes } from "uuid";
    import { GunStore } from "@/stores/GunStore";
	import { TargetStore } from "@/stores/TargetImageStore";
	import { ConsoleLogWriter } from "drizzle-orm";

    let { data, selected = $bindable(), gunId } : { data: any, selected: string, gunId?: string } = $props();

    let firearmsOptions: MenuOption[] = $state([]);
    let newGunId = $state<string | null>(null);
    let dialogOpen = $state(false);

    // word boundary för capitalcase
	const re = /(\b[a-z](?!\s))/;

    $effect(() => {
        const guns = $GunStore.guns;
    
		if (guns && guns.length > 0) {
			const newOptions = guns.map(gun => ({
				value: gun.id,
				label: gun.name.replace(re, (l: string) => l.toUpperCase()),
				group: gun.type?.replace(re, (l: string) => l.toUpperCase()) || 'unknown',
				caliber: gun.caliber
			}))
			.sort((a, b) => a.group.localeCompare(b.group));
			
			const optionsChanged = JSON.stringify(newOptions) !== JSON.stringify(firearmsOptions);
			
			if (optionsChanged) {
				console.debug('Updating firearmsOptions with new data');
				firearmsOptions = newOptions;
                console.debug('selected is:', selected)
			}
		}

        if (selected) {
            onChangeHandler();
        }
    
        if (!dialogOpen && newGunId && firearmsOptions.some(option => option.value === newGunId)) {
            console.debug('Setting selected to newGunId:', newGunId);
            selected = newGunId;
            newGunId = null; // Reset after use
        }
    })

    function onChangeHandler(e?: Event)
    {
        if (selected) {
            console.log('selected:', selected);
            $TargetStore.info.firearm = selected;
        } else if (!selected && $TargetStore.info.firearm) {
            selected = $TargetStore.info.firearm
        }
    }
</script>

<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
    {#if firearmsOptions}
    <Field
        label="Firearm"
        let:id
        placeholder="Select firearm"
    >
        <SelectField
            bind:value={selected}
            on:change={onChangeHandler}
            options={firearmsOptions}
            name="info.firearm"
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
                title="Add new firearm"
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
                    <AddEditGun
                        userId={data?.user?.id as unknown as UUIDTypes}
                        onSuccess={(gunId) => {
                            console.debug('Gun created with ID:', gunId);
                            newGunId = gunId;
                            dialogOpen = false; // Close dialog on success
                        }}
                    />
                </div>
            </Dialog>
        </Toggle>
    </Field>
    {/if}
    <div class="ml-2">
        <Toggle let:on={open} let:toggle let:toggleOff>
            <Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
                <div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
                    Choose a firearm or create a new firearm.
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