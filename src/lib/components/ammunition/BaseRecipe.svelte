<script lang="ts">
	import { Card } from "svelte-ux";
	import BaseBullet from "./BaseBullet.svelte";
    import BasePropellant from "./BasePropellant.svelte";
	import BasePrimer from "./BasePrimer.svelte";


    let { data, embedded = false } = $props();
</script>

<Card
    title="Base"
>
    <div slot="header"><h2 class="">1. Base</h2></div>
    <div slot="contents" class="grid grid-flow-row gap-x-2 pb-2">
        <BaseBullet { data } />
        <BasePropellant { data } />
        <BasePrimer { data } />
    </div>
</Card>