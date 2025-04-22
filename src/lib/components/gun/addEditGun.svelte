<!-- src/lib/components/gun/addEditGun.svelte -->
<script lang="ts">
	import { validate, convertComma } from "@/utils/forms";
    import CaliberDropdown from "../caliber/CaliberDropdown.svelte";
    import { UserSettingsStore } from "$src/lib/stores/UserSettingsStore";
    import { convertCaliberToMm, validateCaliberInput } from "@/utils/caliber";
    import { sanitizeInput, validatePattern } from "@/utils/security";
	import { onMount } from "svelte";

    let { data, gunTypes }: { data: GunData, gunTypes: string } = $props();
    
    let selectedType = $state(data.type || '');
    let selectedCaliber = $state(data.caliber || '');
    let caliberMm = $state(data.caliberMm || 0);
    let barrelTwist = $state(data.barrelTwist);
    let barrelLength = $state(data.barrelLength);
    let note = $state(data.note || '');
    let csrfToken = '';

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
    onMount(async () => {
        document.addEventListener('caliber-selected', ((e: CustomEvent) => {
            caliberMm = e.detail.mm;
            
            // Update hidden field
            const mmInput = document.getElementById('caliber_mm') as HTMLInputElement;
            if (mmInput) {
                mmInput.value = caliberMm.toString();
            }
        }) as EventListener);

        try {
            const response = await fetch('/api/csrf-token');
            const data = await response.json();
            csrfToken = data.csrfToken;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
  });
  
async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!event.target) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Convert FormData to a plain object
    const formDataObj = Object.fromEntries(formData);
    formDataObj.userId = data.userId;

    console.log('formDataObj:', formDataObj);
    
    try {
        const response = await fetch('/api/gun/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify(formDataObj)
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('success!');
        } else {
            console.log('OMG! ERROR!');
        }
    } catch (error) {
        console.error('Form submission error:', error);
    }
}
</script>

<form onsubmit={handleSubmit}>
    <div 
        class="grid grid-flow-row gap-2"
    >
        <input 
            type="hidden"
            id="id"
            name="id"
            value={data.id}
        />

        <label for="name">Name</label>
        <input 
            type="text"
            id="name"
            name="name"
            min="3"
            max="512"
            value={data.name}
            onkeyup={validate}
        />

        <label for="type">Type</label>
        <select bind:value={selectedType} name="type" id="type">
            <option value="" disabled>Select gun type</option>
            {#each gunTypes as type}
                <option value={type}>
                    {type.replace('-', ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.substring(1)).join(' ')}
                </option>
            {/each}
        </select>

        <label for="manufacturer">Manufacturer</label>
        <input 
            type="text"
            id="manufacturer"
            name="manufacturer"
            max="512"
            min="3"
            value={data.manufacturer}
            onkeyup={validate}
        />

        <label for="model">Model</label>
        <input 
            type="text"
            id="model"
            name="model"
            max="512"
            min="1"
            value={data.model}
        />

        <input 
            type="hidden"
            id="caliber_mm"
            name="caliber_mm"
            value={caliberMm}
        />
        
        <!-- Caliber dropdown -->
        <label for="caliber">Caliber</label>
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
        
        <div
            class="grid grid-flow-col grid-cols-[1fr_auto] grid-rows-2 gap-x-4"
        >
            <label class="row-start-1" for="barrellength">Barrel length</label>
            <input 
                type="text"
                id="barrellength"
                name="barrellength"
                max="8"
                pattern="\d{2}(,|\.)?(\d{2})?"
                min="3"
                bind:value={barrelLength}
                onkeyup={(e) => {if (barrelLength) convertComma(e); validate(e)}}
                class="row-start-2"
            />
            <div class="row-start-2">
                {#if $UserSettingsStore.isometrics === true}
                    cm
                {:else}
                    in
                {/if}
            </div>
        </div>

        <label for="barreltwist">Barrel twist</label>
        <input 
            type="text"
            id="barreltwist"
            name="barreltwist"
            max="8"
            min="3"
            pattern="1:\d{2}"
            placeholder="1:nn"
            bind:value={barrelTwist}
            onkeyup={(e) => {if (barrelTwist) convertComma(e); validate(e)}}
        />

        <label for="stock">Stock</label>
        <input 
            type="text"
            id="stock"
            name="stock"
            max="512"
            min="1"
            onkeyup={validate}
        />

        <label for="note">Notes</label>
        <textarea
            id="note"
            name="note"
            spellcheck="false"
            style="resize:vertical;min-height:4.55rem;height:4.55rem;"
            bind:value={note}
            onkeyup={validate}
        ></textarea>
    </div>
    <button
        type="submit"
    >Save</button>
</form>