<!-- src/lib/components/ammunition/AddEditAmmunition.svelte -->
<script lang="ts">
    import { handleReset, validate, createOriginalDataCopy, convertComma, convertCommaString, convertInchToMm } from "@/utils/forms";
    import { Field, Input, Switch, TextField, SelectField, MenuItem, Button, type MenuOption } from "svelte-ux";
    import { cls } from "@layerstack/tailwind";
    import { createEmptyAmmunition, createTypeOptions } from "./addeditammunition";
	import type { UUIDTypes } from "uuid";
	import { GunStore } from "@/stores/GunStore";
    import { invalidate } from '$app/navigation';

    const ammunitionTypes: AmmunitionType[] = ['centerfire', 'rimfire', 'shotgun', 'airgun'];
    const primerTypes: PrimerType[] = [
        'small rifle', 
        'small rifle magnum', 
        'large rifle', 
        'large rifle magnum', 
        'small pistol', 
        'small pistol magnum', 
        'large pistol', 
        'large pistol magnum', 
        'shotgun'
    ];
    
    let { 
        data = createEmptyAmmunition(),
        userId,
        onSuccess,
    }: { 
        data?: AmmunitionData, 
        userId: UUIDTypes,
        onSuccess?: (ammunitionId: string, updatedAmmunition?: AmmunitionData) => void,
    } = $props();

    let selectedType = $state(data.type || '');
    let selectedPrimerType = $state(data.primerType || '');
    let caliberMm = $state(data.caliberMm || 0);
    let csrfToken = $state('');
    let originalData = $state(createOriginalDataCopy(data));
    let ammunitionTypeOptions: MenuOption[] = $derived(createTypeOptions(ammunitionTypes));
    let primerTypeOptions: MenuOption[] = $derived(createTypeOptions(primerTypes));
    let submitting = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    async function handleFormSubmit(e: Event): Promise<void>
    {
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
                GunStore.updateGun(result.gun);
                successMessage = 'Gun saved successfully!';
                invalidate('pixi');
                
                if (onSuccess) {
                    onSuccess(result.gun.id, result.gun);
                    console.log('success!', result.gun.id)
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
        handleReset(e, originalData);
    }

    function setCaliberMm(): void
    {
        const caliberInput = document.getElementsByName('caliber');
        if (!caliberInput[0]) return;
        
        const input: HTMLInputElement = caliberInput[0] as unknown as HTMLInputElement;
        let value = input.value;
        
        if (value.match(/\d+,\d+/)) {
            caliberMm = convertCommaString(value);
        } else if (value.match(/\.\d+/)) {
            caliberMm = convertInchToMm(parseFloat(value) * 10);
        } else {
            caliberMm = parseFloat(value);
        }
    }
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
                placeholder="Norma Core-Lokt .308"
                on:keyup={validate}
                value={data.name}
                required
			/>
		</Field>

        <SelectField
			label="Type"
			name="type"
			options={ammunitionTypeOptions}
			bind:value={selectedType}
			placeholder="Select ammunition type"
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

        <p class="mt-2">Bullet</p>

        <div class="grid grid-cols-2 gap-x-2 items-stretch children-h-full">
            <Field label="Manufacturer" let:id>
                <Input 
                    {id}
                    name="manufacturerBullet"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.manufacturerBullet || ''}
                />
            </Field>

            <Field label="Name" let:id>
                <Input 
                    {id}
                    name="bulletName"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.bulletName || ''}
                />
            </Field>
        </div>
        
        <div class="grid grid-cols-3 gap-x-2 items-stretch children-h-full">
            <Field label="Bullet weight" let:id>
                <Input 
                    {id}
                    name="bulletWeight"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.bulletWeight?.toString() || ''}
                />
                <div class="grid gap-2 z-10">
                    <label class="flex gap-2 items-center text-sm">
                        <span class={data.bulletWeightUnit == 'g' ? 'font-bold' : ''}>g</span>
                        <Switch
                            name="barrelunit" 
                            checked={data.bulletWeightUnit == 'gr' ? true : false}
                        />
                        <span class={data.bulletWeightUnit == 'gr' || undefined ? 'font-bold' : ''}>gr</span>
                    </label>
                </div>
            </Field>
                
            <Field label="Ballistic Coefficient" let:id>
                <Input 
                    {id}
                    name="bulletBc"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.bulletBc?.toString() || ''}
                />
                <div class="grid gap-2 z-10">
                    <label class="flex gap-2 items-center text-sm">
                        <span class={data.bulletBcModel == 'g1' ? 'font-bold' : ''}>G1</span>
                        <Switch
                            name="barrelunit" 
                            checked={data.bulletBcModel == 'g7' ? true : false}
                        />
                        <span class={data.bulletBcModel == 'g7' || undefined ? 'font-bold' : ''}>G7</span>
                    </label>
                </div>
            </Field>

            <input type="hidden"
                name="caliberMm"
                value={caliberMm}
            />
            <Field 
                label="Caliber" 
                let:id
                class={cls('StretchHeight')}
            >
                <Input 
                    {id}
                    name="caliber"
                    min={3}
                    max={256}
                    on:keyup={() => { validate; setCaliberMm() }}
                    value={data.caliber || ''}
                    class="self-stretch min-h-full m-0"
                />
            </Field>
        </div>

        <p class="mt-2">Propellant</p>

        <div class="grid grid-cols-3 gap-x-2 items-stretch children-h-full">
            <Field label="Manufacturer" let:id class={cls('StretchHeight')}>
                <Input 
                    {id}
                    name="manufacturerPropellant"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.manufacturerPropellant || ''}
                />
            </Field>
            
            <Field label="Name" let:id class={cls('StretchHeight')}>
                <Input 
                    {id}
                    name="propellantName"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.propellantName || ''}
                />
            </Field>

            <Field label="Charge weight" let:id>
                <Input 
                    {id}
                    name="propellantCharge"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.propellantCharge?.toString() || ''}
                />
                <div class="grid gap-2 z-10 p-0 m-0">
                    <label class="flex gap-2 items-center text-sm">
                        <span class={data.propellantWeightUnit == 'g' ? 'font-bold' : ''}>g</span>
                        <Switch
                            name="barrelunit" 
                            checked={data.propellantWeightUnit == 'gr' ? true : false}
                        />
                        <span class={data.propellantWeightUnit == 'gr' || undefined ? 'font-bold' : ''}>gr</span>
                    </label>
                </div>
            </Field>
        </div>

        <p class="mt-2">Primer</p>

        <div class="grid grid-cols-3 gap-x-2 items-stretch children-h-full">
            <SelectField
                label="Type"
                name="type"
                options={primerTypeOptions}
                bind:value={selectedPrimerType}
                placeholder="Select primer type"
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
                    name="manufacturerPrimer"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.manufacturerPrimer || ''}
                />
            </Field>

            <Field label="Name" let:id>
                <Input 
                    {id}
                    name="propellantName"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.propellantName || ''}
                />
            </Field>
        </div>

        <p class="mt-2">Case & Cartridge</p>

        <div class="grid grid-cols-2 gap-x-2 items-stretch children-h-full">
            <Field label="Manufacturer" let:id>
                <Input 
                    {id}
                    name="manufacturerCase"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.manufacturerCase || ''}
                />
            </Field>

            <Field label="Cartridge Overall Length" let:id>
                <Input 
                    {id}
                    name="cartridgeOverallLength"
                    min={3}
                    max={256}
                    on:keyup={validate}
                    value={data.cartridgeOverallLength?.toString() || ''}
                />
                <div class="grid gap-2 z-10 p-0 m-0">
                    <label class="flex gap-2 items-center text-sm">
                        <span class={data.cartridgeOverallLengthUnit == 'imperial' ? 'font-bold' : ''}>cm</span>
                        <Switch
                            name="cartridgeOverallLengthUnit" 
                            checked={data.cartridgeOverallLengthUnit == 'metric' ? true : false}
                        />
                        <span class={data.cartridgeOverallLengthUnit == 'metric' || undefined ? 'font-bold' : ''}>in</span>
                    </label>
                </div>
            </Field>
        </div>

        <div class="grid children-h-full mt-4">
            <TextField
                name="note"
                value={data.note || ''}
                multiline
                placeholder="Notes... " 
                classes={{ input: "h-[5rem]" }}
            />
        </div>

        <div class="grid">
            <Button
                variant='fill'
                color='success'
                class={cls(
                    'mt-4 w-fit px-8 place-self-end'
                )}
            >Save</Button>
        </div>
    </div>
</form>

<style lang="css">
/* :global(div.items-stretch) {
    min-height: 100%;
    background-color: red;
} */
</style>