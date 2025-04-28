<script lang="ts">
	/*
		TODO: WeatherData som accordion.
		TODO: Val av firearm i infopanel ska utesluta kalibrar som inte passar.
	*/
	import type { PageServerData } from '$types';
	import { Button, Field, Input, MenuItem, Popover, SelectField, TextField, Toggle, type MenuOption } from 'svelte-ux';
	import { slide } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing';
	import { DateTime } from "luxon";
	import { EditorStore, activePanel } from '@/stores/EditorStore';
	import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
	import { CircleHelp, PlusSquare } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cls } from '@layerstack/tailwind';
	import type { UUIDTypes } from 'uuid';

	let { data } : { data: {data: PageServerData, gunsEvents: GunsEvents} } = $props();

	let infoform : HTMLFormElement|undefined = $state();
	let saved: Boolean = $state(false);
	let saveTime: string|undefined = $state();
	
	let visibilitySelectedValue = $state(false);
	const visibilityOptions: MenuOption[] = [
		{
			label: 'Hidden',
			description: 'Not shown on your public page.',
			value: false
		},
		{
			label: 'Visible',
			description: 'Shown on your public page (if its set to public).',
			value: true
		},
	]; // default för visibility
  	
	const handleChange = () => {
    	saved = false;
  	};

	const targetTypeOptions = [
		{
			value: 'one',
			label: 'oneLabel',
			description: 'one'
		}
	];

	let distanceSelected = $state('meters');
	const distanceOptions: MenuOption[] = [
		{
			value: "meters",
			label: "Meters",
			description: "Range is in meters."
		},
		{
			value: "yards",
			label: "Yards",
			description: "Range is in yards."
		},
	];

	/* EVENT */
	let selectedEvent: string = $state('');
	let eventInputContainer: HTMLDivElement|undefined = $state();
	let eventInput: Input|undefined = $state();
	let eventInputValue: string|undefined = $state();
	let infoEventElement: HTMLInputElement|undefined = $state();
	let eventOptions = $state(data.gunsEvents.events.map(event => ({
		value: event.event.id,
		label: event.event.name
	})));
	
	eventOptions.push(
		{
			value: undefined,
			label: '---',
			// @ts-ignore
			disabled: true
		},
		{
			value: 'createEvent',
			label: 'Create new Event',
		}
	);

	function handleEventSelectChange(event: any): void
	{
		console.log('handleEventSelectChange', event);
		if (!event.detail.value) return;
		const selectedValue = event.detail.value;
		console.log('selectedValue:', selectedValue)
		if (!eventInputContainer) { console.error('No eventInputContainer found!'); return; }
		if (!infoEventElement) { console.error('No infoEventElement found!'); return; }
  
		if (selectedValue === 'createEvent') {
			event.preventDefault();
			eventInputContainer.classList.remove('hidden');
			infoEventElement.value = '';
		} else {
			if (!infoEventElement) { console.error('No infoEventElement found!'); return; }
			console.log('Should change infoEventElement value?')
			eventInputContainer.classList.add('hidden');
			infoEventElement.value = '';
			infoEventElement.value = selectedValue;
		}
	}

	function setInfoElementValue(e: Event): void
	{
		if (infoEventElement && eventInputValue?.length) {
			infoEventElement.value = eventInputValue;
		}
	}

	// word boundary för capitalcase
	const re = /(\b[a-z](?!\s))/;

	let selectedFirearm: string = $state('');
	const firearmsOptions = data.gunsEvents.guns.map(guns => ({
		value: guns.gun.id,
		label: guns.gun.name,
		group: guns.gun.type.replace(re, (l) => {return l.toUpperCase()} ),
		caliber: guns.gun.caliber
	}))
	.sort((a, b) => a.group.localeCompare(b.group));
	
	function firearmChanged(e: Event): void
	{
		saved = false;
		$TargetStore.info.firearm = selectedFirearm;
	}

	const ammunitionOptions = data.gunsEvents.ammunition.map(amm => ({
		value: amm.id,
		label: amm.name,
		group: amm.type,
	}))
	.sort((a, b) => a.group.localeCompare(b.group));

	function createNew(type: 'firearm'|'ammunition')
	{
		// TODO: open drawer with src/lib/components/gun/AddEditGun.svelte or ammunition/AddEditAmmunition
	}

	function compareFormWithStore() // TODO: Hitta en bättre metod för compareFormWithStore
	{
		if (!infoform) return;
		
		// Helper function to check if a path exists in the interface type
		const pathExistsInInterface = (path: string): boolean => {
			// We'll use a type checking approach based on the structure of TargetStoreInterface
			try {
				const parts = path.split('.');
				let currentObj = $TargetStore;
				
				for (let i = 0; i < parts.length - 1; i++) {
					const part = parts[i];
					
					// Handle array indices
					if (!isNaN(Number(part)) && Array.isArray(currentObj[part as keyof typeof currentObj])) {
						const arrayProp = currentObj[part as keyof typeof currentObj] as any[];
						// Check if the index exists
						if (arrayProp.length <= Number(part)) {
							return false;
						}
						currentObj = arrayProp[Number(part)];
					} else if (currentObj && typeof currentObj === 'object' && part in currentObj) {
						currentObj = currentObj[part as keyof typeof currentObj];
					} else {
						return false;
					}
				}
				
				// Check if the final property exists
				const lastPart = parts[parts.length - 1];
				return currentObj && typeof currentObj === 'object' && lastPart in currentObj;
			} catch (e) {
				console.error(`Error checking interface for path ${path}:`, e);
				return false;
			}
		};
		
		// Helper functions for property access
		const getNestedValue = (obj: any, path: string): any => {
			return path.split('.').reduce((prev, curr) => 
				prev && prev[curr] !== undefined ? prev[curr] : undefined, obj);
		};
		
		const setNestedValue = (obj: any, path: string, value: any): boolean => {
			// First check if path exists in interface
			if (!pathExistsInInterface(path)) {
				console.warn(`Path ${path} does not exist in TargetStoreInterface, skipping update`);
				return false;
			}
			
			const parts = path.split('.');
			const lastKey = parts.pop();
			if (!lastKey) return false;
			
			const target = parts.reduce((prev, curr) => {
				if (prev && typeof prev === 'object' && curr in prev) {
					return prev[curr];
				}
				return undefined;
			}, obj);
			
			if (target && typeof target === 'object') {
				target[lastKey] = value;
				return target[lastKey] === value;
			}
			return false;
		};
		
		// Process each field
		Array.from(infoform.elements).forEach(field => {
			// Skip non-form elements, submit buttons, and unnamed fields
			if (!(field instanceof HTMLInputElement || 
				field instanceof HTMLTextAreaElement || 
				field instanceof HTMLSelectElement) || 
				field.type === 'submit' || 
				!field.name) {
				return;
			}
			
			const fieldName = field.name;
			const fieldValue = field.value;
			
			// Skip if path doesn't exist in interface
			if (!pathExistsInInterface(fieldName)) {
				// console.warn(`Field ${fieldName} does not exist in TargetStoreInterface, skipping update`);
				return;
			}
			
			const storeValue = getNestedValue($TargetStore, fieldName);
			
			// Skip if values are the same
			if (fieldValue === storeValue) return;
			
			// Update the store
			saved = false;
			const updateSuccess = fieldName.includes('.') 
				? setNestedValue($TargetStore, fieldName, fieldValue)
				: (($TargetStore as any)[fieldName] = fieldValue, 
				($TargetStore as any)[fieldName] === fieldValue);
			
			if (updateSuccess) {
				saved = true;
				saveTime = DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS);
			}
			
			// debug
			console.log(`Field ${fieldName} differs:`, {
				form: fieldValue,
				store: storeValue
			});
		});
	}

	onMount(() => {
		setInterval(compareFormWithStore, 150);
		console.log(data)
	});

	$effect(() => {
	if (infoEventElement?.value) {
		console.log('infoEventElement?.value:', infoEventElement?.value);
	}
	});
	
</script>

{#if $activePanel === 'info-panel'}
	<div 
		id="info-panel" 
		class="absolute justify-items-end z-50 left-16 grid grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 dark:bg-slate-800 w-[36rem] h-full overflow-y-auto overflow-x-hidden"
		transition:slide={{axis: 'x', duration: 150, easing: quadInOut }}
	>
		<form id="infoform" bind:this={infoform} class="w-full">
			<div class="p-4 grid grid-flow-row gap-y-2 justify-self-start place-self-start self-start w-full">
				<input 
					type="hidden"
					name="info.event"
					bind:this={infoEventElement}
					value=""
				/>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field
						label="Choose a previous Event or create a new Event"
						let:id
					>
						<div class="w-full grid grid-flow-row">
						<SelectField
							{id}
							name="eventSelect"
							options={eventOptions}
							placeholder="Existing events"
							on:change={handleEventSelectChange}
						>
						</SelectField>

						<div class="hidden" id="eventInputContainer" bind:this={eventInputContainer}>
							<Input 
								{id} 
								name="eventInput"
								placeholder="Your event name."
								on:keypress={ () => {saved = false} }
								bind:value={eventInputValue}
								on:change={(e) => setInfoElementValue(e)}
								class="border rounded p-2 mt-2"
							/>
						</div>
						</div>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									A group of targets or just a single target if you were in a hurry that day.
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<h3 class="mt-4">Target Information</h3>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field 
						label="Name"
						let:id
					>
						<Input 
							{id} 
							name="info.name" 
							placeholder={ `Target #1 (${DateTime.now().toISODate()})` }
							bind:value={$TargetStore.info.name}
							on:keypress={ () => {saved = false} }
							required
						/>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									A friendly name for the target so you can find it later.
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto] opacity-40">
					<Field
						label="Target Type"
						let:id
					>
						<SelectField
							options={targetTypeOptions}
							disabled
							name="type"
							on:change={ () => {saved = false} }
						>
						</SelectField>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Used for automatic scoring of your target. (Coming Soon&trade;)
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field
						label="Distance"
						let:id
					>
						<Input 
							{id} 
							name="targetName" 
							placeholder=80
							type="number"
							on:keypress={ () => {saved = false} }
							required
						/>
						<SelectField
							name="distanceUnit"
							options={distanceOptions}
							bind:value={distanceSelected}
							onchange={ () => {saved = false} }
							class="max-w-36"
						>
						</SelectField>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Distance to target.
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field
						label="Firearm"
						let:id
						placeholder="Select firearm"
					>
						<SelectField
							bind:value={selectedFirearm}
							options={firearmsOptions}
							name="info.firearm"
						>
							<MenuItem
								slot="option"
								let:option
								let:index
								let:selected
								let:highlightIndex
								class={cls(
									index === highlightIndex && "bg-surface-content/5",
									option === selected && "font-semibold",
									option.label ? "px-4" : "px-2",
								)}
								scrollIntoView={index === highlightIndex}
							>
								<div>
									<div class="">{option.label}</div>
									<div class="text-sm text-surface-content/50">
										{option.group} {option.caliber}
									</div>
								</div>
							</MenuItem>
						</SelectField>
						<Button 
							class="ml-2 p-1"
							title="Add new firearm"
							on:click={ () => createNew('firearm') }
						>
							<PlusSquare />
						</Button>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Choose a firearm or create a new firearm.
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field
						label="Ammunition"
						let:id
						placeholder="Select firearm"
					>
						<SelectField
							onchange={ () => {saved = false} }
							options={ammunitionOptions}
							name="info.ammunition"
						>
							<MenuItem
								slot="option"
								let:option
								let:index
								let:selected
								let:highlightIndex
								class={cls(
									index === highlightIndex && "bg-surface-content/5",
									option === selected && "font-semibold",
									option.label ? "px-4" : "px-2",
								)}
								scrollIntoView={index === highlightIndex}
							>
								<div>
									<div class="">{option.label}</div>
									<div class="text-sm text-surface-content/50">
										{option.group} {option.caliber}
									</div>
								</div>
							</MenuItem>
						</SelectField>
						<Button 
							class="ml-2 p-1"
							title="Add new ammunition"
							on:click={ () => createNew('ammunition') }
						>
							<PlusSquare />
						</Button>
					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Choose ammunition or create a new ammuntion entry.
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<TextField
						label="Note"
						name="info.note"
						multiline
						onchange={ () => {saved = false} }
						placeholder="Today was a nice day... "
					></TextField>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Any useful notes... 
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field
						label="Visibility"
						let:id
					>
						<SelectField
							name="info.public"
							options={visibilityOptions}
							bind:value={visibilitySelectedValue}
							on:change={handleChange}
						>
						<MenuItem
							slot="option"
							let:option
							let:index
							let:selected
							let:highlightIndex
							class={cls(
								index === highlightIndex && "bg-surface-content/5",
								option === selected && "font-semibold",
								option.label ? "px-4" : "px-2",
							)}
							scrollIntoView={index === highlightIndex}
						>
							<div>
								<div class="">{option.label}</div>
								<div class="text-sm text-surface-content/50">
									{option.group} {option.caliber}
								</div>
							</div>
						</MenuItem>
					</SelectField>

					</Field>
					<div class="ml-2">
						<Toggle let:on={open} let:toggle let:toggleOff>
							<Popover {open} on:close={toggleOff} placement="bottom-end" class="mt-[-1rem]">
								<div class="px-3 py-3 bg-surface-100 border shadow text-sm max-w-48 rounded italic">
									Display your best targets on your public page (if your profile is set to public).
								</div>
							</Popover>
							<Button
								on:click={toggle}
								class="p-1"
							>
								<CircleHelp size="16" />
							</Button>
						</Toggle>
					</div>
				</div>
			</div>
		</form>		
		<div class="w-full px-4 py-4 pb-8 grid grid-cols-1 items-end place-content-end mr-8">
			<div class="justify-self-end place-self-end text-xs italic opacity-50">
				<!--
				<Button 
					variant="fill" 
					color="success"
					onclick={() => compareFormWithStore()}
				>
					{saved ? 'Your info is Saved' : 'Save info'}
				</Button>
				-->
				
				<p class="grid place-items-end">{#if saveTime}Last saved: {saveTime} {:else} &nbsp; {/if}</p>
				
			</div>
		</div>
	</div>
{/if}