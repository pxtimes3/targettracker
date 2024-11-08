<script lang="ts">
	import '../../app.css';

	let { children, data } = $props();
</script>

<main class="container grid grid-flow-col grid-cols-1 h-[100vh] place-content-center">
	<div class="container grid h-full w-full">
		{@render children?.()}
	</div>
</main>
