<script lang="ts">
	import PasswordInput from '@/components/password-input/password-input.svelte';
	import Button from '@/components/ui/button/button.svelte';
	import * as Card from '@/components/ui/card/index.ts';
	import Input from '@/components/ui/input/input.svelte';
	import type { PageData } from '../$types';
	

	let { data } : { data: PageData } = $props();
	let username: string = $state('');
	let password: string = $state('');
	let error = $state("");
</script>

<div class="relative card grid h-fit max-h-fit justify-center align-middle self-center">
	<Card.Root class="mx-auto max-w-sm ">
		<Card.Header>
			<Card.Title class="text-2xl">Login</Card.Title>
			<Card.Description>Enter your email below to login to your account</Card.Description>
		</Card.Header>
		<Card.Content>
			<form id="loginForm" method="POST" action="?/login">
				<div class="grid grid-flow-row gap-y-2">
				<Input
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
				<Button
					type="submit"
				> Login </Button>
				</div>
			</form>
			<div class="mt-4 text-center text-sm">
			Don&apos;t have an account?
			<a href="/auth/register" class="underline">Sign up</a>
			</div>
		</Card.Content>
	</Card.Root>

</div>
