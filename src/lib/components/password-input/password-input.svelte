<!-- svelte-ignore event_directive_deprecated -->
<!-- password-input.svelte -->
<script lang="ts">
	import { zxcvbn } from '@zxcvbn-ts/core';
// import { matcherPwnedFactory } from '@zxcvbn-ts/matcher-pwned';
	import { Eye, EyeOff } from "lucide-svelte";

	let {
		id = "password",
		value = $bindable(),
		badPass = $bindable(false),
		name = "password",
		placeholder = "Enter password",
		required = $bindable(true),
		checkPass = $bindable(false),
		css = $bindable(''),
		disabled = false
	}: {
		id?: string,
		value?: string,
		name?: string,
		badPass?: boolean,
		checkPass?: boolean,
		placeholder?: string,
		required?: boolean,
		css?: string,
		disabled?: boolean
	} = $props();

	const badPassThreshold = 1;

	let pwInput: HTMLInputElement;
	let pwStrength: HTMLDivElement|undefined = $state();
	let showPassword = $state(false);
	let error = $state("");

	async function checkPwnd(e?: Event)
	{
		if (!value) return;
		let entropy = zxcvbn(value);
		if (checkPass === true && entropy.score <= badPassThreshold) {
			badPass = true;
			error = `Your password is not secure enough. Here is a few recommendations for a secure password:<br/>`;
		}
	}

	function togglePasswordVisibility(e: Event) {
		e.preventDefault();
		e.stopPropagation(); // Prevent event bubbling
		showPassword = !showPassword;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="relative" onclick={(e) => e.stopPropagation()}>
	<input
		type={showPassword ? "text" : "password"}
		bind:value
		bind:this={pwInput}
		onchange={checkPwnd}
		{placeholder}
		{disabled}
		{required}
		id="password"
		name={name}
		class={error ? css + " border-red-500" : css}
	/>
	<button
		class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
		onclick={togglePasswordVisibility}
		type="button"
	>
		{#if showPassword}
			<EyeOff class="h-4 w-4" />
		{:else}
			<Eye class="h-4 w-4" />
		{/if}
	</button>
	{#if error}
		<div bind:this={pwStrength}><p class="text-sm text-red-500 mt-1">{@html error}</p></div>
	{/if}
</div>
