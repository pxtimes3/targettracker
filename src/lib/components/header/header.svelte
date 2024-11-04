<script lang="ts">
    import KeySquare from "lucide-svelte/icons/key-square";
    import Menu from "lucide-svelte/icons/menu";

	import type { PageServerData } from "../../../routes/$types";
	import Logo from "../logo/logo.svelte";
	import Lightswitch from "./Lightswitch.svelte";
	import MenuLinks from "./MenuLinks.svelte";

    let {data}: {data: PageServerData} = $props();

	let isLoggedIn: boolean = $state(false);
	let password = $state("");

	$effect(() => {
		if (data.user && data.user.id) {
			isLoggedIn = true;
		} else {
			isLoggedIn = false;
		}
	})


</script>

<header class="bg-surface-900/85 sticky top-0 flex h-[4.5rem] backdrop-blur-xl items-center gap-4 pt-2 px-8 md:px-8 border-b-[1px] border-b-surface-50/20 justify-center">
	<div class="container flex max-w-screen-2x1 items-center">
		<nav
			class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
		<a href="/" class="flex items-center gap-2 text-lg font-semibold md:text-base">
			<Logo />
			<span class="hidden md:block w-[20ch]">Target Tracker</span>
		</a>
		</nav>
		<div>
			<button
				class="shrink-0 md:hidden"
			>
			<Menu class="h-5 w-5" />
			<span class="sr-only">Toggle navigation menu</span>
			</button>
		</div>
		<div class="md:hidden">
			<nav class="grid gap-6 text-lg font-medium">
				<a href="##" class="flex items-center gap-2 text-lg font-semibold">
					<Logo />
					<span class="sr-only">Target Tracker</span>
				</a>

				<MenuLinks
					isLoggedIn={data.user ?? false}
				/>

			</nav>
		</div>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-4 lg:gap-6">
			<div class="ml-auto flex">
				<div class="hidden md:flex gap-6 items-center">
					<MenuLinks
						isLoggedIn={data.user ?? false}
					/>
				</div>
				<Lightswitch />
				{#if isLoggedIn}
				<!--
					<DropdownMenu.Root>
						<DropdownMenu.Trigger asChild let:builder>
							<Button
								builders={[builder]}
								variant="ghost"
								size="icon"
								class="rounded"
							>
							<CircleUser class="h-5 w-5" />
							<span class="sr-only">Toggle user menu</span>
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Label>Your Account</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item href="/dashboard">Dashboard</DropdownMenu.Item>
							<DropdownMenu.Item href="/dashboard/settings">Settings</DropdownMenu.Item>
							<DropdownMenu.Item href="/dashboard/invite">Invite friends</DropdownMenu.Item>
							<DropdownMenu.Item href="/faq">FAQ / Support</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item>
								<form method="post" action="/?/logout" use:enhance>
									<button>Sign out</button>
								</form>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				-->
					USER
				{:else}
					<button
						class="rounded"
					>
						<KeySquare class="h-5 w-5" />
						<span class="sr-only">Login</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
</header>
