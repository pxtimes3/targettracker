<!-- svelte-ignore event_directive_deprecated -->
<!-- password-input.svelte -->
<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Eye, EyeOff } from "lucide-svelte";

	let {
		value = $bindable(""),
		placeholder = "Enter password",
		disabled = false
	}: {
		value: string,
		placeholder: string,
		disabled?: boolean
	} = $props();

	let showPassword = $state(false);
	let error = $state("");

	function togglePasswordVisibility(e: Event) {
		e.preventDefault();
		e.stopPropagation(); // Prevent event bubbling
		showPassword = !showPassword;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative" on:click|stopPropagation>
	<Input
		type={showPassword ? "text" : "password"}
		bind:value
		{placeholder}
		{disabled}
		class={error ? "border-red-500" : ""}
	/>
	<Button
		variant="ghost"
		size="icon"
		class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
		on:click={togglePasswordVisibility}
		type="button"
	>
		{#if showPassword}
			<EyeOff class="h-4 w-4" />
		{:else}
			<Eye class="h-4 w-4" />
		{/if}
	</Button>
</div>
{#if error}
	<p class="text-sm text-red-500 mt-1">{error}</p>
{/if}
