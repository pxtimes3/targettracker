<script lang="ts">
	import Header from '@/components/header/header.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import Footer from '@/components/footer/footer.svelte';

	let { children, data } = $props();
</script>

<Header
	data={data}
/>


<main class="px-8 pt-4">
	<div class="container maxw-screen-2x1 items-center">
	<ModeWatcher />
	{@render children?.()}
	</div>
</main>

<Footer />
