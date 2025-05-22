<script lang="ts">
	import { Collapse, Field, Input, Switch } from "svelte-ux";
    import { cls } from "@layerstack/tailwind";
    import { setCaliberMm } from "./addeditammunition";
    import { validate, createOriginalDataCopy, convertComma, convertCommaString, convertInchToMm } from "@/utils/forms";

    let { data, isFactory, advancedOpen, } = $props();
    let caliberMm: number|undefined = $state();
</script>

<input type="hidden"
    name="caliberMm"
    value={caliberMm}
/>

<Collapse
    name="Advanced data"
    bind:open={advancedOpen}
>
    <div class="grid grid-cols-2 gap-x-2 items-stretch children-h-full">
        <Field label="Bullet weight" let:id disabled={!isFactory}>
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
                        disabled={!isFactory}
                    />
                    <span class={data.bulletWeightUnit == 'gr' || undefined ? 'font-bold' : ''}>gr</span>
                </label>
            </div>
        </Field>
            
        
        <Field 
            label="Caliber" 
            let:id
            class={cls('StretchHeight')}
            disabled={!isFactory}
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
    <div class="grid grid-cols-3 gap-x-2 items-stretch children-h-full">
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
</Collapse>