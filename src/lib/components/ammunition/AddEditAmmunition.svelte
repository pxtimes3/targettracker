<!-- src/lib/components/ammunition/AddEditAmmunition.svelte -->
<script lang="ts">
    import { validate, createOriginalDataCopy, convertComma, convertCommaString, convertInchToMm } from "@/utils/forms";
    import { Field, Input, Switch, TextField, SelectField, MenuItem, Button, type MenuOption, Collapse, Card, Checkbox } from "svelte-ux";
    import { cls } from "@layerstack/tailwind";
    import { createEmptyLoadRecipe, createTypeOptions, createAmmunitionOptions, fetchPredefinedAmmunition } from "@/utils/addeditammunition";
	import type { UUIDTypes } from "uuid";
	import { AmmunitionStore } from "@/stores/AmmunitionStore";
    import { invalidate } from '$app/navigation';
	import { fetchCsrfToken } from "@/utils/security";
	import BaseRecipe from "./BaseRecipe.svelte";
	import Variation from "./Variation.svelte";

    let { 
        data: initialData = createEmptyLoadRecipe(),
        userId,
        onSuccess,
    }: { 
        data?: AmmunitionData,
        userId: UUIDTypes,
        onSuccess?: (ammunitionId: string, updatedAmmunition?: AmmunitionData) => void,
    } = $props();

    let data: AmmunitionData = $state(initialData);

    // let selectedType: AmmunitionType|string = $derived(data.type || '');
    
    let caliberMm: number|null = $derived(data.baseRecipe.caliberMm || 0);
    let csrfToken: string = $state('');
    // let ammunitionTypeOptions: MenuOption[] = $derived(createTypeOptions(ammunitionTypes));
    
    let submitting: boolean = $state(false);
    let errorMessage: string = $state('');
    let successMessage: string = $state('');
    let predefinedManufacturerAmmunition: AmmunitionData[] = $state<AmmunitionData[]>([]);
    let predefinedUserAmmunition: AmmunitionData[] = $state<AmmunitionData[]>([]);
    let predefinedAmmunition: AmmunitionData[] = $derived<AmmunitionData[]>([...predefinedUserAmmunition, ...predefinedManufacturerAmmunition]);
    let selectedPredefinedAmmunition: string|null = $state<string | null>(null);
    let selectedUserPredefinedAmmunition: string|null = $state<string | null>(null);
    let selectedType: AmmunitionType|string = $derived(data.baseRecipe.type || '');
    let selectedPrimerType: AmmunitionType|string = $derived(data.loadVariation.primerType || '');
    let isFactory: boolean = $derived(data.baseRecipe.isFactory || false);
    let loadingAmmunition: boolean = $state(false);
    let loadingUserAmmunition: boolean = $state(false);
    let ammunitionOptions: MenuOption[] = $derived(createAmmunitionOptions(predefinedUserAmmunition, predefinedManufacturerAmmunition));

    // advanced data
    let advanced: [key: string] = ['bullet']
    let advancedOpen: boolean = $state(isFactoryAmmunition());

    function isFactoryAmmunition(): boolean
    {
        return data.baseRecipe.isFactory ? false : true;
    }

    async function handleFormSubmit(e: Event): Promise<void>
    {
        // console.debug('ammunition handleFormSubmit');
        e.preventDefault();
        if (!e.target) return;

        submitting = true;
        errorMessage = '';
        successMessage = '';

        try {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const dataObj = Object.fromEntries(formData);
            
            // console.debug(dataObj);

            const response = await fetch('/api/ammunition', {
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                method: 'POST',
                body: JSON.stringify(dataObj)
            });

            const result = await response.json();

            if (result.success) {
                AmmunitionStore.updateAmmunition(result.ammunition);
                successMessage = 'Ammunition saved successfully!';
                invalidate('pixi');
                
                if (onSuccess) {
                    onSuccess(result.ammunition.id, result.ammunition);
                    // console.log('success!', result.ammunition.id)
                }
            }
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : 'Unknown error';
        } finally {
            submitting = false;
        }
    }
    
    function handleFormReset(e: Event):void
    {
        // handleReset(e, originalData);
    }

    function handlePredefinedAmmunitionSelect(selectedId: HTMLOptionElement): void 
    {
        console.debug(`handlePredefinedAmmunitionSelect`, $state.snapshot(selectedId));
        if (!selectedId) return;
        
        if (selectedId.value != 'createnew') {
            const selected = predefinedAmmunition.find((ammo) => ammo.baseRecipe.id === selectedId.value);
            if (selected) {
                data = { ...createEmptyLoadRecipe(), ...selected };
                
                selectedType = data.baseRecipe.type || '';
                selectedPrimerType = data.loadVariation.primerType || undefined;
                caliberMm = data.baseRecipe.caliberMm || 0;
                
                selectedPredefinedAmmunition = null;
                
                data = { ...data };

                console.debug('data:', $state.snapshot(data));
            } else {
                console.debug(`found nothing! selectedId.value = ${selectedId.value}`);
                console.debug(`predefiunedAmmunition:`, $state.snapshot(predefinedAmmunition));
            }
        } else {
            data = { ...createEmptyLoadRecipe() }
        }
    }

    $effect(() => {
        fetchCsrfToken().then(token => csrfToken = token);
        fetchPredefinedAmmunition()
            .then(ammunitionData => {
                console.debug('Setting predefined manufacturer ammunition:', ammunitionData);
                predefinedManufacturerAmmunition = ammunitionData;
            })
            .catch(err => {
                console.error('Failed to load ammunition data:', err);
                errorMessage = 'Failed to load predefined ammunition data';
            });
        // fetchUserPredefinedAmmunition()
        //     .then(ammunitionData => {
        //         console.debug('Setting predefined user ammunition:', ammunitionData);
        //         predefinedUserAmmunition = ammunitionData;
        //     })
        //     .catch(err => {
        //         console.error('Failed to load user ammunition data:', err);
        //         errorMessage = 'Failed to load user predefined ammunition data';
        //     });
        
        // console.debug('Current ammunition data:', data);
        // console.debug('Data changed:', data);
    });
</script>

<form onsubmit={handleFormSubmit} onreset={handleFormReset} class="min-w-96 max-w-[36rem]">
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

    <div class="grid grid-flow-row gap-2 gap-x-2 card">
        <div class="mb-4">
            <SelectField
                label="Select Ammunition"
                options={ammunitionOptions}
                bind:value={selectedPredefinedAmmunition}
                on:change={(e) => handlePredefinedAmmunitionSelect(e.detail as unknown as HTMLOptionElement)}
                placeholder={loadingAmmunition ? "Loading ammunition data..." : "Search for ammunition..."}
                searchable
                disabled={loadingAmmunition}
                loading={loadingAmmunition}
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
        </div>

        <input 
			type="hidden"
			id="isFactory"
			name="isFactory"
			value={data.baseRecipe.isFactory}
		/>

    	<input 
			type="hidden"
			id="id"
			name="id"
			value={data.baseRecipe.id}
		/>

        <input 
			type="hidden"
			id="userId"
			name="userId"
			value={userId}
		/>
  
		<BaseRecipe 
            data={ data } 
            disabled={ data.baseRecipe.isFactory ? true : false } 
            embedded={ false }
        />

        <!-- {#if !isFactory} -->
            <Variation
                data={ data } 
                disabled={ data.baseRecipe.isFactory ? true : false } 
                embedded={ false }
            />
        <!-- {/if} -->

        <div class="grid grid-flow-col grid-cols-[auto_auto] justify-end my-4">
            <Checkbox 
                name="createmore"
                class="align-middle mr-4"
            >Add another variation</Checkbox>
            <Button
                variant='fill'
                color='success'
                type='submit'
                class={cls(
                    'w-fit px-8 place-self-end'
                )}
            >Save</Button>
        </div>
    </div>
</form>