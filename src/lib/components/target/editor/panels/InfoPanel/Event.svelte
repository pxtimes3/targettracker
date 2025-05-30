<script lang="ts">
    import { cls } from "@layerstack/tailwind";
	import { Field, SelectField, Input, MenuItem, type MenuOption, Toggle, Button, Popover } from "svelte-ux";
    import { CircleHelp, PlusSquare } from "lucide-svelte";
    import AddEditGun from "@/components/gun/AddEditGun.svelte";
    import { type UUIDTypes } from "uuid";
    import { GunStore } from "@/stores/GunStore";
	import { string } from "zod";

    let { saved, data } : { saved: boolean, data: any } = $props();
    let selectedEvent: string = $state('');
	let eventInputContainer: HTMLDivElement|undefined = $state();
	let eventInput: Input|undefined = $state();
	let eventInputValue: string|undefined = $state();

    let infoEventElement: HTMLInputElement|undefined = $state();
    let eventOptions = $state(data.gunsEvents.events.map((event: any) => ({
		value: event.id,
		label: event.name
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

    $effect(() => {
        
    });
</script>

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