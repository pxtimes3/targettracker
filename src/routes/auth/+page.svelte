<script lang="ts">
	import PasswordInput from '@/components/password-input/password-input.svelte';

	import type { PageData } from '../$types';


	let { data } : { data: PageData } = $props();
	let username: string = $state('');
	let password: string = $state('');
	let error = $state("");
</script>

<div class="relative card grid h-fit max-h-fit w-fit justify-self-center align-middle self-center bg-surface-500 border-surface-900 border-[1px] px-8 py-8 mt-8">
	<div class="text-2xl">Login</div>
	<div class="text-sm">Enter your credentials below to login to your account</div>
	<form id="loginForm" method="POST" action="?/login">
		<div class="grid grid-flow-row gap-y-4 mt-8 mb-8">
			<input
				type={"text"}
				name="username"
				bind:value={username}
				placeholder="Username"
				disabled={false}
				class="{error ? "border-red-500" : ""} input-text rounded  text-surface-900 w-full"
			/>
			<PasswordInput
				name="password"
				value={password}
				textcolor="text-surface-900"
				css=" input-text rounded w-full text-surface-900"
			/>
			<button class="btn bg-primary-500"
				type="submit"
			> Login </button>
		</div>
	</form>
	<div class="mt-4 text-center text-sm opacity-75">
		Don&apos;t have an account?
		<a href="/auth/register" class="underline">Sign up!</a>
	</div>
</div>
