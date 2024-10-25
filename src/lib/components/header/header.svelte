<script lang="ts">
    import CircleUser from "lucide-svelte/icons/circle-user";
    import Menu from "lucide-svelte/icons/menu";

	import type { PageServerData } from "../../../routes/$types";
	import Logo from "../logo/logo.svelte";
	import Button from "../ui/button/button.svelte";
	import * as DropdownMenu from "../ui/dropdown-menu/index.ts";
	import Separator from "../ui/separator/separator.svelte";
	import * as Sheet from "../ui/sheet/index.ts";
	import Lightswitch from "./Lightswitch.svelte";
	import MenuLinks from "./MenuLinks.svelte";

    let {data}: {data: PageServerData} = $props();

    if (data) console.log('data:', data)
</script>

<header class="bg-background/90 sticky top-0 flex h-[4.5rem] items-center gap-4 mt-2 px-8 md:px-8 border-b border-border/30">
	<div class="container flex max-w-screen-2x1 items-center">
		<nav
		class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
		>
		<a href="/" class="flex items-center gap-2 text-lg font-semibold md:text-base">
			<Logo />
			<span class="hidden md:block w-[20ch]">Target Tracker</span>
		</a>
		</nav>
		<Sheet.Root>
		<Sheet.Trigger asChild let:builder>
			<Button
			variant="outline"
			size="icon"
			class="shrink-0 md:hidden"
			builders={[builder]}
			>
			<Menu class="h-5 w-5" />
			<span class="sr-only">Toggle navigation menu</span>
			</Button>
		</Sheet.Trigger>
		<Sheet.Content side="left">
			<nav class="grid gap-6 text-lg font-medium">
				<a href="##" class="flex items-center gap-2 text-lg font-semibold">
					<Logo />
					<span class="sr-only">Target Tracker</span>
				</a>

				<MenuLinks
					isLoggedIn={data.user ?? false}
				/>

			</nav>
		</Sheet.Content>
		</Sheet.Root>
		<div class="flex w-full items-center gap-4 md:ml-auto md:gap-4 lg:gap-6">
			<div class="ml-auto flex gap-6">
				<div class="hidden md:flex gap-6 items-center">
					<MenuLinks
						isLoggedIn={data.user ?? false}
					/>
				</div>
				<Separator
					orientation="vertical"
					class="my-2"
					decorative={true}
				/>
				<Lightswitch />
				<Separator
					orientation="vertical"
					class="my-2"
					decorative={true}
				/>
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
						<DropdownMenu.Item>Settings</DropdownMenu.Item>
						<DropdownMenu.Item>Support</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>Logout</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</div>
	</div>
</header>
