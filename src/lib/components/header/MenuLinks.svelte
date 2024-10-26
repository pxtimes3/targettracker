<script lang="ts">
    import ChevronDown from "lucide-svelte/icons/chevron-down";
    import * as DropdownMenu from "../ui/dropdown-menu/index.ts";

    let { isLoggedIn = false } : { isLoggedIn?: boolean } = $props();
</script>


{#if isLoggedIn}<a href="/dashboard" class="text-muted-foreground hover:text-foreground"> Dashboard </a>{/if}
{#if isLoggedIn}<a href="/target" class="text-muted-foreground hover:text-foreground"> Upload Target </a>{/if}
<a href="/faq" class="text-muted-foreground hover:text-foreground"> FAQ </a>
<DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
        <!--<Button
            builders={[builder]}
            variant="ghost"
            size="icon"
            class="rounded px-4 text-lg"
        >-->
        <div
            use:builder.action {...builder}
            class="flex items-center"
        >
            Tools
            <ChevronDown
                size={12}
                class="ml-2"
            />
        </div>

    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
    <!--
        <DropdownMenu.Label>Your Account</DropdownMenu.Label>
        <DropdownMenu.Separator />
    -->
        <DropdownMenu.Item
            href="/tools/ballistics"
        >Ballistics Calculator</DropdownMenu.Item>
        <DropdownMenu.Item
            href="/tools/unitconverter"
        >Unit Converter</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
            href="/tools/targets"
        >Printable Targets</DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>
{#if !isLoggedIn}<a href="##" class="text-muted-foreground hover:text-foreground"> Sign up! </a>{/if}
