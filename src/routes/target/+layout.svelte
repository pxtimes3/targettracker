<script lang="ts">	import Footer from '@/components/footer/footer.svelte';
import Header from '@/components/header/header.svelte';
import { onMount } from 'svelte';
import '../../app.css';

	let { children, data } = $props();
	let showCameraOption: boolean = $state(false)

	function isMobileWithTouch(): boolean {
        return ('ontouchstart' in window) &&
            (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }

    async function shouldShowCameraOption(): Promise<boolean> {
        const hasCam = await hasCamera();
        const isMobileTouch = isMobileWithTouch();
        return hasCam && isMobileTouch;
    }

    async function hasCamera(): Promise<boolean> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.some(device => device.kind === 'videoinput');
        } catch (err) {
            console.warn('Error checking for camera:', err);
            return false;
        }
    }

	onMount(async () => {
		showCameraOption = await shouldShowCameraOption();
	})
</script>

{#if !showCameraOption}
    <Header
        data={data}
    />
{/if}

<main class="container grid grid-flow-col grid-cols-1 h-full place-content-start {showCameraOption ? 'place-content-center' : 'place-self-center'}">
	<div class="container grid h-full w-full">
		{@render children?.()}
	</div>
</main>

{#if !showCameraOption}
    <Footer

    />
{/if}
