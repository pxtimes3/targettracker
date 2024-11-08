<script lang="ts">
	import Footer from '@/components/footer/footer.svelte';
	import Header from '@/components/header/header.svelte';
	import '../../app.css';

	let { children, data } = $props();
</script>

<Header
	data={data}
/>

<main class="container pt-4 grid grid-flow-col grid-cols-1 justify-center justify-self-center">
	<div class="container grid h-full w-full">

	{@render children?.()}
	</div>
</main>

<Footer />
