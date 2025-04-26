<!-- src/lib/components/gun/addEditGun.svelte -->
<script lang="ts">
    import { validate } from "@/utils/forms";
    import CaliberDropdown from "../caliber/CaliberDropdown.svelte";
    import { UserSettingsStore } from "$src/lib/stores/UserSettingsStore";
    import { Field, Input, Switch, TextField, SelectField, MenuItem, Button } from "svelte-ux";
    import { cls } from "@layerstack/tailwind";
    import { 
        createGunTypeOptions,
        onCaliberSelected, 
        setupCaliberListener, 
        fetchCsrfToken, 
        handleReset,
        createEmptyGun,
        createOriginalDataCopy
    } from "./addeditgun";
	import type { UUIDTypes } from "uuid";
	import { GunStore } from "@/stores/GunStore";

    const gunTypes: GunType[] = ['rifle', 'pistol', 'air-rifle', 'air-pistol'];
    
    let { 
        data = createEmptyGun(), // Default to empty gun if not provided
        userId,
        onSuccess
    }: { 
        data?: GunData, 
        userId: UUIDTypes
        onSuccess?: (gunId: string, updatedGun?: GunData) => void 
    } = $props();

    console.log('AddEditGun received data:', data);
    
    let selectedType = $state(data.type || '');
    let selectedCaliber = $state(data.caliber || '');
    let caliberMm = $state(data.caliberMm || 0);
    let note = $state(data.note || '');
    let csrfToken = $state('');
    let originalData = $state(createOriginalDataCopy(data));
    let gunTypeOptions = $derived(createGunTypeOptions(gunTypes));
    let submitting = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    const updateOriginalData = () => {
        originalData = createOriginalDataCopy(data);
    }

    async function handleFormSubmit(e: Event) {
        e.preventDefault();
        if (!e.target) return;

        submitting = true;
        errorMessage = '';
        successMessage = '';

        try {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const dataObj = Object.fromEntries(formData);
            
            console.log(dataObj);

            const response = await fetch('/api/gun', {
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                method: 'POST',
                body: JSON.stringify(dataObj)
            });

            const result = await response.json();

            if (result.success) {
                console.log('success', result);
                GunStore.updateGun(result.gun);
                successMessage = 'Gun saved successfully!';
                
                if (onSuccess) {
                    onSuccess(result.gun.id, result.gun);
                }
            } else {
                errorMessage = result.message || 'Failed to save gun';
                console.error(result.message);
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
        } finally {
            submitting = false;
        }
    }
    
    function handleFormReset(e: Event) {
        handleReset(e, originalData);
    }
    
    $effect(() => {
        // console.log('selectedCaliber changed:', selectedCaliber);
        // console.log('data.caliber:', data.caliber);
    
        if (selectedCaliber && selectedCaliber !== data.caliber) {
            data.caliber = selectedCaliber;
        }

        const cleanup = setupCaliberListener((value) => caliberMm = value);
        fetchCsrfToken().then(token => csrfToken = token);
        return cleanup;
    });
</script>
  
<form onsubmit={handleFormSubmit} onreset={handleFormReset}>
    {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <span class="block sm:inline">{errorMessage}</span>
        </div>
    {/if}
    
    {#if successMessage}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
            <span class="block sm:inline">{successMessage}</span>
        </div>
    {/if}

    <div class="grid grid-flow-row gap-2">
		<input 
			type="hidden"
			id="id"
			name="id"
			value={data.id}
		/>

        <input 
			type="hidden"
			id="userId"
			name="userId"
			value={userId}
		/>
  
		<Field label="Name" let:id>
			<Input 
			name="name"
			{id}
			min={3}
			max={256}
			placeholder="Winchester R93 .17 Hornet"
			on:keyup={validate}
			value={data.name}
			required
			/>
		</Field>
	
		<SelectField
			label="Type"
			name="type"
			options={gunTypeOptions}
			bind:value={selectedType}
			placeholder="Select gun type"
			required
		>
			<MenuItem
			slot="option"
			let:option
			let:index
			let:selected
			let:highlightIndex
			class={cls(
				index === highlightIndex && "bg-surface-content/5",
				option === selected && "font-semibold"
			)}
			scrollIntoView={index === highlightIndex}
			>
			{option.label}
			</MenuItem>
		</SelectField>

        <Field label="Manufacturer" let:id>
            <Input 
                {id}
                name="manufacturer"
                min={3}
                max={256}
                placeholder="Winchester R93 .17 Hornet"
                on:keyup={validate}
                value={data.manufacturer || ''}
            />
        </Field>

        <Field label="Model" let:id>
            <Input 
                {id}
                name="model"
                min={3}
                max={256}
                placeholder=""
                on:keyup={validate}
                value={data.model || ''}
            />
        </Field>

        <input 
            type="hidden"
            id="caliber_mm"
            name="caliber_mm"
            value={selectedCaliber}
        />
        
        <!-- Caliber dropdown -->
        <Field label="Caliber" let:id>
            <CaliberDropdown 
				value={selectedCaliber}
                onChange={(caliberId: string) => onCaliberSelected(caliberId, (value) => selectedCaliber = value, data)}
				name="caliber"
            />
        </Field>
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
        
        <Field label="Barrel length" let:id>
            <Input 
                {id}
                name="barrellength"
                min={3}
                max={256}
                placeholder='12"'
                on:keyup={validate}
                value={data.barrelLength?.toString()}
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.barrelLengthUnit == 'imperial' ? 'font-bold' : ''}>in</span>
                    <Switch
                        name="barrelunit" 
                        checked={data.barrelLengthUnit == 'metric' ? true : false}
                    />
                    <span class={data.barrelLengthUnit == 'metric' || undefined ? 'font-bold' : ''}>cm</span>
                </label>
            </div>
        </Field>

        <Field label="Barrel twist" let:id>
            <Input 
                {id}
                name="barreltwist"
                min={3}
                max={256}
                placeholder='1:nn'
                on:keyup={validate}
                value={data.barrelTwist || ''}
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.barrelLengthUnit || undefined == 'imperial' ? 'font-bold' : ''}>in</span>
                    <Switch
                        name="barreltwistunit" 
                        checked={data.barrelTwistUnit == 'metric' ? false : true}
                    />
                    <span class={data.barrelLengthUnit == 'metric' ? 'font-bold' : ''}>cm</span>
                </label>
            </div>
        </Field>

        <Field label="Stock / Chassis" let:id>
            <Input 
                {id}
                name="stock"
                min={3}
                max={256}
                placeholder="Spuhr Bravo"
                on:keyup={validate}
                value={data.stock || ''}
            />
        </Field>

        <TextField 
            label="Note:" 
            multiline 
            classes={{ input: "h-[4.55rem]" }} 
            id="note"
            name="note"
            spellcheck="false"
            bind:value={note}
        />

		<div class="grid grid-flow-col place-content-between">
            <Button
                variant="fill"
                color="neutral"
                type="reset"
                class="w-fit px-8"
                disabled={submitting}
            >Reset</Button>

            <Button
                variant="fill"
                color="primary"
                type="submit"
                class="w-fit px-8"
                disabled={submitting}
            >{submitting ? 'Saving...' : 'Save'}</Button>
        </div>
    </div>
</form>