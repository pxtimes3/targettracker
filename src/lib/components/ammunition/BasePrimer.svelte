<script lang="ts">
	import { Field, Input, SelectField, MenuItem, Switch, type MenuOption } from "svelte-ux";
    import { createBulletOptions, createTypeOptions, fetchPredefinedBullets, setCaliberMm } from "@/utils/addeditammunition";
	import { cls } from "@layerstack/tailwind";
    import { validate } from "@/utils/forms";
    
	let { data } = $props();

    const primerTypes: PrimerType[] = [
        'small rifle', 
        'small rifle magnum', 
        'large rifle', 
        'large rifle magnum', 
        'small pistol', 
        'small pistol magnum', 
        'large pistol', 
        'large pistol magnum', 
        'shotgun'
    ];

    let selectedPrimerType: PrimerType|undefined = $derived(data.primerType || undefined);
    let primerTypeOptions: MenuOption[] = $derived(createTypeOptions(primerTypes));
</script>

<div class="grid grid-cols-3 gap-x-2 mb-2 items-stretch children-h-full">
    <SelectField
        label="Type"
        name="primerType"
        options={primerTypeOptions}
        bind:value={selectedPrimerType}
        placeholder="Select primer type"
        required
    >
        <MenuItem
            slot="option"
            let:option
            let:index
            let:selected
            let:highlightIndex
            class={cls(
                index === highlightIndex && "bg-surface-content/5",
                option === selected && "font-semibold"
            )}
            scrollIntoView={index === highlightIndex}
        >
            {option.label}
        </MenuItem>
    </SelectField>

    <Field label="Manufacturer" let:id>
        <Input 
            {id}
            name="manufacturerPrimer"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.manufacturerPrimer || ''}
        />
    </Field>

    <Field label="Name" let:id>
        <Input 
            {id}
            name="propellantName"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.propellantName || ''}
        />
    </Field>
</div>