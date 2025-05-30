<!-- src/routes/gun/add/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import AddEditGun from '@/components/gun/AddEditGun.svelte';
	import { onMount } from 'svelte';
	
	const emptyGun = {
		id: '',
		userId: '',
		name: '',
		type: '',
		manufacturer: '',
		model: '',
		caliber: '',
		caliberMm: 0,
		barrel: '',
		barrelLength: null,
		barrelLengthUnit: 'metric',
		barrelTwist: '',
		barrelTwistUnit: 'metric',
		stock: '',
		note: '',
	} as unknown as GunData;
	
	const gunTypes: GunType[] = ['rifle', 'pistol', 'air-rifle', 'air-pistol'];
	
	let gun = $state(emptyGun);
	
	let { sessiondata } : { sessiondata: GunEditPageServerData } = $props();

	console.log(sessiondata)
	
	// Handle successful form submission
	function onSuccess(gunId: string) {
		// Redirect to the gun details page
		goto(`/gun/${gunId}`);
	}
</script>

<AddEditGun data={gun} {gunTypes} onSuccess={onSuccess} />