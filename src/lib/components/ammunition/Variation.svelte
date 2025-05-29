<script lang="ts">
	import { Card } from "svelte-ux";
	import VariationPropellant from "./VariationPropellant.svelte";
    import VariationPrimer from "./VariationPrimer.svelte";
	import Note from "./Note.svelte";
	import VariationCoal from "./VariationCOAL.svelte";

    let { 
        data, 
        disabled = false, 
        embedded = false 
    }: {
        data: AmmunitionData, 
        disabled: boolean, 
        embedded: boolean|undefined
    } = $props();
</script>

<Card
    title="Variation"
>
    <div slot="header"><h2 class="">2. Variation</h2></div>
    <div slot="contents" class="grid grid-flow-row gap-x-2 mb-4 pb-2">
        <VariationPropellant {data} />
        <VariationPrimer {data} />
        <div class="grid grid-cols-3 gap-x-2 mb-2 items-stretch">
            <VariationCoal {data} />
            <Note {data} disabled={false} />
        </div>
    </div>
</Card>