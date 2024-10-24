<script lang="ts">
	import Header from '$lib/components/header/Header.svelte';
	import '../app.css';

	let { children, data } = $props();
</script>

<Header
	data={data}
/>


<main class="px-6 ">
	{@render children?.()}
</main>
