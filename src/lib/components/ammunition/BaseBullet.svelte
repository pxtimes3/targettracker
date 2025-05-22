<script lang="ts">
	import { Field, Input, SelectField, MenuItem, Switch, type MenuOption } from "svelte-ux";
    import { createBulletOptions, createTypeOptions, fetchPredefinedBullets, setCaliberMm } from "@/utils/addeditammunition";
	import { cls } from "@layerstack/tailwind";
    import { validate } from "@/utils/forms";
    
	let { data } = $props();

    const ammunitionTypes: AmmunitionType[] = ['centerfire', 'rimfire', 'shotgun', 'airgun'];

    let ammunitionTypeOptions: MenuOption[] = $derived(createTypeOptions(ammunitionTypes));
    let predefinedBullets: BulletData[] = $state<BulletData[]>([]);
    let bulletOptions = $derived(createBulletOptions(predefinedBullets));
    let selectedType: AmmunitionType|string = $derived(data.type || '');
    let selectedBullet = $state();

    $effect(() => {
        fetchPredefinedBullets()
            .then((bulletData) => {
                console.debug(`Fetched bullet data`, bulletData);
                predefinedBullets = bulletData;
            });
    });
</script>

<h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">Bullet</h3>
<SelectField
    label="Bullets"
    name="bullet"
    options={bulletOptions}
    bind:value={selectedBullet}
    class="mb-2"
/>

{#if selectedBullet === 'createnew'}
    <div class="grid grid-cols-3 gap-x-2 items-stretch children-h-full mb-2">
        <Field label="Manufacturer" let:id>
            <Input 
                {id}
                name="manufacturerBullet"
                min={3}
                max={256}
                on:keyup={validate}
                value={data.manufacturerBullet || ''}
            />
        </Field>

        <Field label="Name" let:id>
            <Input 
                {id}
                name="bulletName"
                min={3}
                max={256}
                on:keyup={validate}
                value={data.bulletName || ''}
                placeholder="Varminator FMJHP"
            />
        </Field>
        <SelectField
            label="Type"
            name="type"
            options={ammunitionTypeOptions}
            bind:value={selectedType}
            placeholder="Select ammunition type"
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
    </div>

    <div class="grid grid-cols-2 gap-x-2 mb-2 items-stretch children-h-full">
        <Field label="Bullet weight" let:id disabled={!data.isFactory}>
            <Input 
                {id}
                name="bulletWeight"
                min={3}
                max={256}
                on:keyup={validate}
                value={data.bulletWeight?.toString() || ''}
                class="min-w-[8ch]"
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.bulletWeightUnit == 'g' ? 'font-bold' : ''}>g</span>
                    <Switch
                        name="barrelunit" 
                        checked={data.bulletWeightUnit == 'gr' ? true : false}
                        disabled={!data.isFactory}
                    />
                    <span class={data.bulletWeightUnit == 'gr' || undefined ? 'font-bold' : ''}>gr</span>
                </label>
            </div>
        </Field>
            
        
        <Field 
            label="Bullet Caliber" 
            let:id
            class={cls('StretchHeight')}
            disabled={!data.isFactory}
        >
            <Input 
                {id}
                name="caliber"
                min={3}
                max={256}
                on:keyup={() => { validate; setCaliberMm(data.caliber) }}
                value={data.caliber || ''}
                class="w-16ch"
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.caliberUnit == 'imperial' ? 'font-bold' : ''}>in</span>
                    <Switch
                        name="caliberUnit" 
                        checked={data.caliberUnit == 'metric' || undefined ? true : false}
                    />
                    <span class={data.caliberUnit == 'metric' || undefined ? 'font-bold' : ''}>mm</span>
                </label>
            </div>
        </Field>
    </div>
    <div class="grid grid-cols-3 gap-x-2 mb-4 items-stretch children-h-full">
        <Field label="BC (G1)" let:id>
            <Input 
                {id}
                name="bulletBcG1"
                min={3}
                max={256}
                on:keyup={validate}
                class="min-w-[8ch]"
                value={data.bulletBcG1?.toString() || ''}
            />
        </Field>
        <Field label="BC (G7)" let:id>
            <Input 
                {id}
                name="bulletBcG7"
                min={3}
                max={256}
                on:keyup={validate}
                class="min-w-[8ch]"
                value={data.bulletBcG7?.toString() || ''}
            />
        </Field>
        <Field label="Sectional Density" let:id>
            <Input 
                {id}
                name="bulletSD"
                min={3}
                max={256}
                on:keyup={validate}
                class="min-w-[8ch]"
                value={data.bulletSD?.toString() || ''}
            />
        </Field>
    </div>
{/if}