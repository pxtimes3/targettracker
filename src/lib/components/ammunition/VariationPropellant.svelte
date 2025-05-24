<script lang="ts">
	import { Field, Input, Switch } from "svelte-ux";
    import { validate } from "@/utils/forms";

    let { data } = $props();
</script>

<h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">Charge</h3>
<div class="grid grid-cols-3 gap-x-2 mb-2 items-stretch children-h-full">
    <Field label="Manufacturer" let:id >
        <Input 
            {id}
            name="variationManufacturerPropellant"
            min={3}
            max={256}
            on:keyup={validate}
            placeholder="ACME Explosives"
            value={data.manufacturerPropellant || ''}
        />
    </Field>
    
    <Field label="Name" let:id >
        <Input 
            {id}
            name="variationPropellantName"
            min={3}
            max={256}
            on:keyup={validate}
            placeholder="N420"
            value={data.propellantName || ''}
        />
    </Field>
    <Field 
        label="Charge weight" 
        let:id
    >
        <Input 
            {id}
            name="variationPropellantCharge"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.variationPropellantCharge?.toString() || ''}
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
    </Field>
</div>