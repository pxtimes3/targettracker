<script lang="ts">
	import { Card, Field, Input } from "svelte-ux";
    import { validate } from "@/utils/forms";
	import BaseBullet from "./BaseBullet.svelte";
    import BasePropellant from "./BasePropellant.svelte";
	import BasePrimer from "./BasePrimer.svelte";
	import BaseCase from "./BaseCase.svelte";
	import Note from "./Note.svelte";


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
    title="Base"
>
    <div slot="header"><h2 class="">1. Base</h2></div>
    
    <div slot="contents" class="grid grid-flow-row gap-x-2 mb-4 pb-2">
        <Field 
            label="Name" 
            let:id
            class="mb-4"
        >
            <Input 
                name="name"
                {id}
                min={3}
                max={256}
                placeholder="Norma Core-Lokt .308"
                on:keyup={validate}
                value={data.baseRecipe.name}
                required
            />
        </Field>
        <BaseBullet { data } />
        <BasePropellant { data } />
        <BaseCase { data } />
        {#if data.baseRecipe.isFactory}
            <Note {data} disabled={disabled} />
        {/if}
    </div>
</Card>