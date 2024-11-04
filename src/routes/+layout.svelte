<script lang="ts">
	import Footer from '@/components/footer/footer.svelte';
	import Header from '@/components/header/header.svelte';
	import '../app.css';

	let { children, data } = $props();
</script>
<Header
	data={data}
/>
<main class="px-8 pt-4">
	<div class="container grid h-full">

	{@render children?.()}
	</div>
</main>

<Footer />
