<script lang="ts">
	import { goto } from "$app/navigation";
	import AddEditAmmunition from "@/components/ammunition/AddEditAmmunition.svelte";
	import { onMount } from "svelte";

    let { data } : { data: AmmunuitionAddEditPageServerData } = $props();

    onMount(() => {
        if (!data.user.id) {
            goto('auth/');
        }
    })
</script>

<AddEditAmmunition 
    userId={data.user.id}
/>