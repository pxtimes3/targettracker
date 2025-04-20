<!-- src/lib/components/gun/addEditGun.svelte -->
<script lang="ts">
	import type { ChangeEventHandler } from "svelte/elements";
    import { validate } from "@/utils/forms";

    let { data, gunTypes }: { data: GunData, gunTypes: string } = $props();
    
    let selectedType = $state(data.type || '');

    function convertComma(event)
    {
        const newValue = event.target.value.replace(',', '.');
        event.target.value = newValue;
    }
</script>

<form>
    <div 
        class="grid grid-flow-row gap-2"
    >
        <input 
            type="hidden"
            id="id"
            name="id"
            value={data.id}
        />
        <input 
            type="text"
            id="name"
            maxlength="256"
            value={data.name}
        />

        <select bind:value={selectedType} name="type" id="type">
            <option value="" disabled>Select gun type</option>
            {#each gunTypes as type}
                <option value={type}>
                    {type.replace('-', ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')}
                </option>
            {/each}
        </select>

        <input 
            type="text"
            id="manufacturer"
            maxlength="256"
            value={data.manufacturer}
        />

        <input 
            type="text"
            id="model"
            maxlength="256"
            value={data.model}
        />

        <input 
            type="text"
            id="caliber"
            maxlength="256"
            pattern="(\d2)(,|\.)\d3"
            value={data.caliber}
            onkeypress={convertComma}
        />

        <input 
            type="text"
            id="barrel"
            maxlength="256"
            pattern="\d{0,2}(,|\.)\d{1,3}"
            value={data.barrel}
            onkeyup={validate}
        />
    </div>
</form>

<!--
    type: gunTypeEnum('type').notNull(),
	manufacturer: text('manufacturer'),
	caliber: text('caliber').notNull(),
	sights: text('sights'),
	barrel: text('barrel'),
	barrelLength: doublePrecision('barrelLength'),
	stock: text('stock'),
	note: text('note'),
	manufacturerOther: text('manufacturer_other'),
	barrelTwist: text('barrel_twist'),
	pictureOriginal: text('picture_original'),
	caliberMm: doublePrecision('caliber_mm'),
	model: text('model'),
	barrelLengthUnit: measurementsEnum('barrel_length_unit'),
	barrelTwistUnit: measurementsEnum('barrel_twist_unit'),
    -->