<script lang="ts">
    import type { PageServerData } from './$types';

    let { data }: { data: PageServerData } = $props();

    console.log(data)
</script>
<h1>Welcome to Target Tracker!</h1>
