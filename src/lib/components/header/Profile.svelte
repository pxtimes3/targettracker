<script lang="ts">
    import type { PageServerData } from "$types";
    import { Menu, Toggle, Button, MenuItem } from 'svelte-ux';
    import { enhance } from "$app/forms";

    let { data }: { data: PageServerData } = $props();
</script>

{#if data}
    <Toggle let:on={open} let:toggle let:toggleOff>
        <Button on:click={toggle}>
          Your Profile
          <Menu {open} on:close={toggleOff} transitionParams={{ duration: 125 }} matchWidth>
            <MenuItem><a href="/dashboard">Dashboard</a></MenuItem>
            <MenuItem>Settings</MenuItem>
            <MenuItem>FAQ</MenuItem>
            <MenuItem><form method="post" action="/?/logout" use:enhance><button>Sign Out</button></form></MenuItem>
          </Menu>
        </Button>
      </Toggle> 
{:else}
    Login
{/if}
<!-- Gammal skit -->
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
