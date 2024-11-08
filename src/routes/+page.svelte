<script lang="ts">
    import Footer from "@/components/footer/footer.svelte";
    import Header from "@/components/header/header.svelte";
    import type { PageServerData } from "./$types";

    let { data }: { data: PageServerData } = $props();
</script>

<Header
	data={data}
/>

<h1>Welcome to Target Tracker!</h1>

<Footer />
