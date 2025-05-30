<script lang="ts">
	import { TextField } from "svelte-ux";

    let { 
        data, 
        disabled = false
    }: {
        data: AmmunitionData, 
        disabled?: boolean
    } = $props();
</script>


<div class="grid grid-cols-1 grid-rows-[fit_auto] gap-x-2 mb-2 place-content-start {data.baseRecipe.isFactory ? '' : 'col-span-2'}">
    <h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">Notes</h3>
    <TextField
        name="note"
        value={data.loadVariation.note || data.baseRecipe.note || ''}
        multiline
        placeholder="Notes... " 
        classes={{ input: "h-[2.5rem]" }}
    />
</div>