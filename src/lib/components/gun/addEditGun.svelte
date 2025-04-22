<!-- src/lib/components/gun/addEditGun.svelte -->
<script lang="ts">
	import { validate, convertComma } from "@/utils/forms";
    import CaliberDropdown from "../caliber/CaliberDropdown.svelte";
    import { UserSettingsStore } from "$src/lib/stores/UserSettingsStore";
    import { convertCaliberToMm, validateCaliberInput } from "@/utils/caliber";
	import { onMount } from "svelte";

    let { data, gunTypes }: { data: GunData, gunTypes: string } = $props();
    
    let selectedType = $state(data.type || '');
    let selectedCaliber = $state(data.caliber || '');
    let caliberMm = $state(data.caliberMm || 0);

    function handleCaliberInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const input = target.value;
        
        if (validateCaliberInput(input)) {
            // Convert to mm
            caliberMm = convertCaliberToMm(input);
            
            // Update hidden field
            const mmInput = document.getElementById('caliber_mm') as HTMLInputElement;
            if (mmInput) {
                mmInput.value = caliberMm.toString();
            }
            
            target.classList.remove('invalid');
            target.classList.add('valid');
        } else {
            target.classList.remove('valid');
            target.classList.add('invalid');
        }
    }
    
    // Listen for caliber selection from dropdown
    function onCaliberSelected(caliberId: string) {
        selectedCaliber = caliberId;
    }
    
    // Listen for the custom event from the dropdown
    onMount(() => {
        document.addEventListener('caliber-selected', ((e: CustomEvent) => {
            caliberMm = e.detail.mm;
            
            // Update hidden field
            const mmInput = document.getElementById('caliber_mm') as HTMLInputElement;
            if (mmInput) {
                mmInput.value = caliberMm.toString();
            }
        }) as EventListener);
    });
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
            type="hidden"
            id="caliber_mm"
            name="caliber_mm"
            value={caliberMm}
        />
        
        <!-- Caliber dropdown -->
        <CaliberDropdown 
            value={selectedCaliber}
            onChange={onCaliberSelected}
            name="caliber"
        />
        
        <!-- alt -->
        <!--
        <div class="relative">
            <input 
                type="text"
                id="caliber_manual"
                name="caliber_manual"
                placeholder={$UserSettingsStore.isometrics ? "Enter caliber in mm" : "Enter caliber in inches"}
                onkeyup={handleCaliberInput}
            />
            <div class="text-xs text-surface-content/70 mt-1">
                {$UserSettingsStore.isometrics ? 
                    "Examples: 9, 5.56, 7.62" : 
                    "Examples: .308, .223, .45"}
            </div>
        </div>
        -->
        
        <input 
            type="text"
            id="barrel"
            maxlength="256"
            pattern="\d{2}(,|\.)\d{3}"
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