<script lang="ts">
	import * as Card from '@/components/ui/card/index.ts';
	import type { PageData } from '../$types';
	import LoginForm from './login-form.svelte';

	let { data } : { data: PageData } = $props();
</script>

<div class="relative card grid justify-center align-middle">

		<Card.Root class="mx-auto max-w-sm ">
			<Card.Header>
				<Card.Title class="text-2xl">Login</Card.Title>
				<Card.Description>Enter your email below to login to your account</Card.Description>
			</Card.Header>
			<Card.Content>
				<LoginForm
					data={data.form}
				/>
				<div class="mt-4 text-center text-sm">
				Don&apos;t have an account?
				<a href="##" class="underline">Sign up</a>
				</div>
			</Card.Content>
		</Card.Root>

</div>
