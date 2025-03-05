<script lang="ts">
	import type { PageServerData } from './$types'
	import { Button } from 'svelte-ux';
	import { slide } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing';
	import { DateTime } from "luxon";
	import { EditorStore, activePanel } from '@/stores/EditorStore';
	import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
	import { LucideChevronUp, LucideChevronDown, type Icon as IconType } from 'lucide-svelte';
	import { onMount } from 'svelte';

	type Chevron = {
		name: string;
		icon: typeof IconType;
	}

	const chevronIcon = {
		'up': {
			name: 'up',
			icon: LucideChevronUp
		},
		'dn': {
			name: 'dn',
			icon: LucideChevronDown
		}
	}

	let { data, active } : { data: PageServerData, active: boolean } = $props();

	let infoform : HTMLFormElement|undefined = $state();
	let saved: Boolean = $state(false);
	let saveTime: string|undefined = $state();

	function toggleSection(e: Event, id: string): void
	{
		const section = document.getElementById(id);
		if (!section) {
			console.error(`No section with id ${id}.`);
			return;
		}

		// chevron

	}

	function compareFormWithStore() {
		if (!infoform) { return; }
		
		const fields: HTMLFormControlsCollection = infoform.elements;
		
		const fieldsArray = Array.from(fields);
		
		fieldsArray.forEach(field => {
			if (!(field instanceof HTMLInputElement || 
				  field instanceof HTMLTextAreaElement || 
				  field instanceof HTMLSelectElement)) {
				return;
			}

			if (field.type === 'submit' || !field.id) return;
			
			const fieldId = field.id;
			const fieldValue = field.value;

			const storeValue = $TargetStore[fieldId as keyof TargetStoreInterface];
			
			if (fieldValue !== storeValue) {
				saved = false;
				($TargetStore as any)[fieldId] = fieldValue;

				if (($TargetStore as any)[fieldId] === fieldValue) {
					saved = true;
					saveTime = DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS);
				}

				// debug
				// console.log(`Field ${fieldId} differs:`, {
				//	form: fieldValue,
				//	store: storeValue
				// });
			}
		});
	}

	onMount(() => {
		setInterval(compareFormWithStore, 15000);
	})
	
</script>

{#if $activePanel === 'info-panel'}
	<div 
		id="info-panel" 
		class="absolute justify-items-end z-50 left-16 grid grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 dark:bg-slate-800 w-[36rem] h-full overflow-y-auto overflow-x-hidden"
		transition:slide={{axis: 'x', duration: 150, easing: quadInOut }}
	>
		<form id="infoform" bind:this={infoform} class="w-full">
			<div class="p-4 mb-8 grid grid-flow-row gap-y-2 justify-self-start place-self-start self-start w-full">
				<div class="my-2">Target Information</div>
				<hr/>
				<div class="text-sm text-primary-950 mt-2">
					<label for="name">Name</label>
					<input 
						type="text" 
						class="appearance-none block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
						id="name" 
						name="name"
						placeholder="{ DateTime.now().toISODate() }"
						onkeypress={ () => {saved = false} }
					/>
				</div>
				<div class="text-sm text-primary-950">
					<label for="type">Target type</label>
					<select 
						id="type"
						class="block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white"
						onchange={ () => {saved = false} }
					>
						<option>Target type:</option>
					</select>
				</div>
				<div class="text-sm text-primary-950">
					<label for="firearm">Firearm</label>
					<select 
						id="firearm"
						class="block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white"
						onchange={ () => {saved = false} }
					>
						<option>Create new</option>
					</select>
				</div>
				<div class="text-sm text-primary-950">
					<label for="ammunition">Ammunition</label>
					<select 
						id="ammunition"
						class="block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white"
						onchange={ () => {saved = false} }
					>
						<option>Create new</option>
					</select>
				</div>
				<div class="mt-4">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div 
						class="my-2 w-full"
						onclick={(e) => toggleSection(e, 'weatherdata')}
					>
						<span>Weather Data</span>
						<div>{chevronIcon.up.icon}</div>
					</div>
					<hr/>
					<div id="weatherdata" class="text-sm text-primary-950 grid grid-cols-6 grid-rows-[auto_auto] gap-x-4 mt-4 hidden">
						<div class="grid grid-rows-[auto_1fr] grid-cols-1 row-start-1 col-span-3">
							<label for="windspeed">Windspeed</label>
							<input 
								type="text"
								class="appearance-none bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
								id="windspeed"
								onchange={ () => {saved = false} }
							>
						</div>
						<div class="grid grid-rows-[auto_1fr] grid-cols-1 row-start-1 col-span-3">
							<label for="wind_direction">Wind direction</label>
							<input 
								type="text"
								class="appearance-none bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
								id="wind_direction"
								onchange={ () => {saved = false} }
							>
						</div>
						<div class="grid grid-rows-[auto_1fr] grid-cols-1 row-start-2 col-span-2">
							<label for="temperature">Temperature</label>
							<input 
								type="text"
								class="appearance-none bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
								id="temperature"
								onchange={ () => {saved = false} }
							>
						</div>
						<div class="grid grid-rows-[auto_1fr] grid-cols-1 row-start-2 col-span-2">
							<label for="humidity">Humidity</label>
							<input 
								type="text"
								class="appearance-none bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
								id="humidity"
								onchange={ () => {saved = false} }
							>
						</div>
						<div class="grid grid-rows-[auto_1fr] grid-cols-1 row-start-2 col-span-2">
							<label for="altitude">Altitude</label>
							<input 
								type="text"
								class="appearance-none bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white" 
								id="altitude"
								onchange={ () => {saved = false} }
							>
						</div>
					</div>
				</div>
				<div class="mt-4">Notes</div>
				<hr/>
				<div class="text-sm text-primary-950 mt-4">
					<textarea 
						id="note"
						class="block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white"
						rows="4"
						onchange={ () => {saved = false} }
					></textarea>
				</div>
				<div class="mt-4">Visibility</div>
				<hr/>
				<div>
					<label class="inline-flex items-center cursor-pointer">
						<input type="checkbox" value="" class="sr-only peer">
						<div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
						<span class="ms-3 text-sm font-medium">Public</span>
					</label>
				</div>
			</div>
		</form>		
		<div class="w-full px-4 py-4 pb-8 grid grid-cols-[auto_auto] justify-between place-content-center max-h-8">
			<div class="justify-self-end place-self-center text-xs italic opacity-50">
				{#if saveTime}
					<span>Last saved: {saveTime}</span>
				{/if}
			</div>
			<Button 
				variant="fill" 
				color="success"
				onclick={() => compareFormWithStore()}
			>
				{saved ? 'Saved' : 'Save'}
			</Button>
		</div>
	</div>
{/if}