<script lang="ts">
	import { Field, Input, Switch } from "svelte-ux";
    import { validate } from "@/utils/forms";

    let { data }: { data: AmmunitionData } = $props();
</script>


<div class="grid grid-cols-1 grid-rows-[fit_auto] gap-x-2 mb-2 place-content-start">
    <h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">COAL</h3>
    <Field label="Cartridge Overall Length" let:id >
        <Input 
            {id}
            name="variationCoal"
            min={3}
            max={256}
            type="number"
            on:keyup={validate}
            placeholder="1.23"
            value={data.loadVariation.cartridgeOal || ''}
        />
        <div class="grid gap-2 z-10 p-0 m-0">
            <label class="flex gap-2 items-center text-sm">
                <span class={data.loadVariation.cartridgeOalUnit == 'metric' ? 'font-bold' : ''}>cm</span>
                <Switch
                    name="variationCoalUnit" 
                    checked={data.loadVariation.cartridgeOalUnit == 'metric' ? true : false}
                />
                <span class={data.loadVariation.cartridgeOalUnit == 'imperial' || undefined ? 'font-bold' : ''}>in</span>
            </label>
        </div>
    </Field>
</div>