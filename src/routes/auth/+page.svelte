<script lang="ts">
	import PasswordInput from '@/components/password-input/password-input.svelte';

	import type { PageData } from '../$types';


	let { data } : { data: PageData } = $props();
	let username: string = $state('');
	let password: string = $state('');
	let error = $state("");
</script>

<div class="relative card grid h-fit max-h-fit justify-center align-middle self-center">
	<div class="card mx-auto max-w-sm ">

			<div class="text-2xl">Login</div>
			<div>Enter your email below to login to your account</div>
			<form id="loginForm" method="POST" action="?/login">
				<div class="grid grid-flow-row gap-y-2">
				<input
					type={"text"}
					name="username"
					bind:value={username}
					placeholder="username"
					disabled={false}
					class={error ? "border-red-500" : ""}
				/>
				<PasswordInput
					name="password"
					value={password}
				/>
				<button class="btn"
					type="submit"
				> Login </button>
				</div>
			</form>
			<div class="mt-4 text-center text-sm">
			Don&apos;t have an account?
			<a href="/auth/register" class="underline">Sign up</a>
			</div>
	</div>
</div>
