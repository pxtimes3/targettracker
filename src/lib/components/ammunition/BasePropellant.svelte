<script lang="ts">
	import { Field, Input, Switch } from "svelte-ux";
    import { validate } from "@/utils/forms";
	import { cls } from "@layerstack/tailwind";

    let { data }: { data: AmmunitionData } = $props();
</script>

<h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">Propellant</h3>
<div class="grid grid-cols-2 gap-x-2 mb-4 items-stretch children-h-full">
    <Field label="Manufacturer" let:id class={cls('StretchHeight')}>
        <Input 
            {id}
            name="manufacturerPropellant"
            min={3}
            max={256}
            on:keyup={validate}
            placeholder="ACME Explosives"
            value={data.baseRecipe.manufacturerPropellant || ''}
        />
    </Field>
    
    <Field label="Name" let:id class={cls('StretchHeight')}>
        <Input 
            {id}
            name="propellantName"
            min={3}
            max={256}
            on:keyup={validate}
            placeholder="N420"
            value={data.baseRecipe.propellantName || ''}
        />
    </Field>

    <!-- <Field label="Charge weight" let:id>
        <Input 
            {id}
            name="propellantCharge"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.propellantCharge?.toString() || ''}
        />
        <div class="grid gap-2 z-10 p-0 m-0">
            <label class="flex gap-2 items-center text-sm">
                <span class={data.propellantWeightUnit == 'g' ? 'font-bold' : ''}>g</span>
                <Switch
                    name="barrelunit" 
                    checked={data.propellantWeightUnit == 'gr' ? true : false}
                />
                <span class={data.propellantWeightUnit == 'gr' || undefined ? 'font-bold' : ''}>gr</span>
            </label>
        </div>
    </Field> -->
</div>