<script lang="ts">
	import type { PageServerData } from './$types'
	import { z } from 'zod';
	import { Button } from 'flowbite-svelte'
	import { slide } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing';
	import { DateTime } from "luxon";
	import { EditorStore, activePanel } from '@/stores/EditorStore';
	import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
	import { LucideBug, LucideCheck, LucideLocate, LucideLocateFixed, LucideRefreshCcw, LucideRotateCcwSquare, LucideRotateCwSquare, LucideRuler, LucideTarget, LucideX, SlidersHorizontal } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { data, active } : { data: PageServerData, active: boolean } = $props();
	let infoform : HTMLFormElement|undefined = $state();
	let saved: Boolean = $state(false);
	let saveTime: string|undefined = $state();

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
		class="absolute justify-items-end z-50 left-16 grid grid-rows-[auto_1fr_auto_auto] grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 w-128 max-w-128 h-full"
		transition:slide={{axis: 'x', duration: 150, easing: quadInOut }}
	>
		<form id="infoform" bind:this={infoform}>
			<div id="header" class="w-full py-2 px-4 text-xs text-black h-8 place-items-center leading-0 uppercase grid grid-cols-2">
				<p class="tracking-widest pointer-events-none justify-self-start whitespace-nowrap">Target information</p>
				<p class="justify-self-end">
					<LucideX size="14" class="cursor-pointer" onclick={(e) => $activePanel = ''} />
				</p>
			</div>
			<div class="p-4 mb-8 grid grid-flow-row gap-y-2 justify-self-start place-self-start self-start w-full">
				<div class="text-sm text-primary-950">
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
				<div class="relative mt-8">
					<div>Weather Data</div>
					<hr/>
					<div class="text-sm text-primary-950 grid grid-cols-6 grid-rows-[auto_auto] gap-x-4 mt-4">
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
				<div class="mt-8">Notes</div>
				<hr/>
				<div class="text-sm text-primary-950 mt-4">
					<textarea 
						id="note"
						class="block w-full bg-gray-200 text-gray-700 border rounded py-2 px-2 mb-3 leading-tight focus:outline-none focus:bg-white"
						rows="4"
						onchange={ () => {saved = false} }
					></textarea>
				</div>
			</div>
		</form>		
		<div class="w-full px-4 py-4 pb-8 grid grid-cols-[auto_auto] justify-between place-content-center max-h-8">
			<div class="justify-self-end place-self-center text-xs italic opacity-50">
				{#if saveTime}
					<span>Last saved: {saveTime}</span>
				{/if}
			</div>
			<button 
				type="button" 
				class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
				onclick={() => compareFormWithStore()}
			>
				{saved ? 'Saved' : 'Save'}
			</button>
		</div>
	</div>
{/if}