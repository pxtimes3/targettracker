<script lang="ts">
	/*
		TODO: WeatherData som accordion.
		TODO: Val av firearm i infopanel ska utesluta kalibrar som inte passar.
	*/
	import type { PageServerData } from '$types';
	import { slide } from 'svelte/transition'
	import { quadInOut } from 'svelte/easing';
	import { DateTime } from "luxon";
	import { EditorStore } from '@/stores/EditorStore';
	import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
	import { onMount } from 'svelte';
	import Visibility from './InfoPanel/Visibility.svelte';
	import Note from './InfoPanel/Note.svelte';
	import Ammunition from './InfoPanel/Ammunition.svelte';
	import Firearm from './InfoPanel/Firearm.svelte';
	import Distance from './InfoPanel/Distance.svelte';
	import Name from './InfoPanel/Name.svelte';
	import TargetType from './InfoPanel/TargetType.svelte';
	import Event from './InfoPanel/Event.svelte';

	let { data } : { data: {data: PageServerData, gunsEvents: GunsEvents} } = $props();

	let infoform : HTMLFormElement|undefined = $state();
	let saved: Boolean = $state(false);
	let saveTime: string|undefined = $state();

	let selectedFirearm: string = $state('');
	let selectedAmmunition: string = $state('');
	let targetName: string = $state('');
	
	const pathExistsInInterface = (path: string): boolean => {
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
					// @ts-ignore
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

	const getNestedValue = (obj: any, path: string): any => {
		return path.split('.').reduce((prev, curr) => 
			prev && prev[curr] !== undefined ? prev[curr] : undefined, obj);
	};
	
	export function compareFormWithStore() {
		if (!infoform) return;
		
		// Create a copy of the current store
		const updatedStore = structuredClone($TargetStore);
		let hasChanges = false;
		
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
				return;
			}
			
			const storeValue = getNestedValue($TargetStore, fieldName);
			
			// Skip if values are the same
			if (fieldValue === storeValue) return;
			
			// Update the cloned store
			const parts = fieldName.split('.');
			let current = updatedStore;
			
			for (let i = 0; i < parts.length - 1; i++) {
				// @ts-ignore
				current = current[parts[i]];
			}
			
			const lastPart = parts[parts.length - 1];
			// @ts-ignore
			current[lastPart] = fieldValue;
			hasChanges = true;
			
			// debug
			console.log(`Field ${fieldName} differs:`, {
				form: fieldValue,
				store: storeValue
			});
		});
		
		// Only update the store if there were changes
		if (hasChanges) {
			$TargetStore = updatedStore;
			saved = true;
			saveTime = DateTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS);
		}
	}

	onMount(() => {
		// setInterval(compareFormWithStore, 150);
		console.log('infoPanel data:', data);
	});

	$effect(() => {
		
	});
	
</script>

{#if $EditorStore.mode === 'info'}
	<div 
		id="info-panel" 
		class="absolute justify-items-end z-50 left-16 grid grid-flow-row pb-0 px-2 py-4 space-y-0 bg-slate-400 dark:bg-slate-800 w-[36rem] h-full overflow-y-auto overflow-x-hidden"
		transition:slide={{axis: 'x', duration: 150, easing: quadInOut }}
	>
		<form id="infoform" bind:this={infoform} class="w-full">
			<div class="p-4 grid grid-flow-row gap-y-2 justify-self-start place-self-start self-start w-full">
				<Event 
					{data}
					saved={false}
				/>
				<h3 class="mt-4">Target Information</h3>
				
				<Name 
					saved={false}
					value=''
				/>

				<TargetType
					saved={false}
				/>
				
				<Distance
					saved={false}
				/>
				
				<Firearm
					{data}
					selected={selectedFirearm}
				/>

				<Ammunition 
					{data}
				/>
				
				<Note 
					saved={false}
				/>

				<Visibility 
					saved={false}
				/>
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