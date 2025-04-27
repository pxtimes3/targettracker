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

	let { data, active } : { data: {data: PageServerData, gunsEvents: GunsEvents}, active: boolean } = $props();

	let infoform : HTMLFormElement|undefined = $state();
	let saved: Boolean = $state(false);
	let saveTime: string|undefined = $state();

	const targetTypeOptions = [
		{
			value: 'one',
			label: 'oneLabel',
			description: 'one'
		}
	];

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
	]

	// word boundary för capitalcase
	const re = /(\b[a-z](?!\s))/;

	const firearmsOptions = data.gunsEvents.guns.map(guns => ({
		value: guns.gun.id,
		label: guns.gun.name,
		group: guns.gun.type.replace(re, (l) => {return l.toUpperCase()} ),
		caliber: guns.gun.caliber
	}))
	.sort((a, b) => a.group.localeCompare(b.group));

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
			<div class="p-4 grid grid-flow-row gap-y-2 justify-self-start place-self-start self-start w-full">
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field 
						label="Event"
						let:id
					>
						<Input 
							{id} 
							name="eventName" 
							value={ DateTime.now().toISODate() }
							on:keypress={ () => {saved = false} }
							required
						/>
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
				<h3 class="my-2 mt-8">Target Information</h3>
				<hr/>
				<div class="text-sm text-primary-950 grid grid-flow-col grid-cols-[1fr_auto]">
					<Field 
						label="Name"
						let:id
					>
						<Input 
							{id} 
							name="targetName" 
							value={ `Target #1 (${DateTime.now().toISODate()})` }
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
									Used for automatic scoring of your target.
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
							onchange={ () => {saved = false} }
							bind:value={$TargetStore.target.rangeUnit}
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
							onchange={ () => {saved = false} }
							options={firearmsOptions}
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
						name="note"
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
							name="visibility"
							onchange={ () => {saved = false} }
						>
							<option value="hidden">Hidden</option>
							<option value="visible">Visible</option>
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
				<Button 
					variant="fill" 
					color="success"
					onclick={() => compareFormWithStore()}
				>
					{saved ? 'Your info is Saved' : 'Save info'}
				</Button>
				
				<p class="grid place-items-end">{#if saveTime}Last saved: {saveTime} {:else} &nbsp; {/if}</p>
				
			</div>
		</div>
	</div>
{/if}