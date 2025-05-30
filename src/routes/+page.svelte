<script lang="ts">
    import Footer from "@/components/footer/footer.svelte";
    import Header from "@/components/header/header.svelte";
    import type { PageServerData } from "$types";
	import { onMount } from "svelte";

    let { data }: { data: PageServerData } = $props();

    type Route = {
        path: string;
        name: string;
    };
    
    let routes: Route[] = $state([]);
    
    onMount(async () => {
    // This uses Vite's import.meta.glob to get all route files
    const modules = import.meta.glob('/src/routes/**/+page.svelte');
    
    routes = Object.keys(modules)
      .map((path) => {
        // Convert file path to route path
        const routePath = path
          .replace('/src/routes', '')
          .replace('/+page.svelte', '')
          .replace(/\/\[([^\]]+)\]/g, '/:$1') // Convert [param] to :param
          .replace(/\/$/, ''); // Remove trailing slash
          
        // Create a display name that shows folder/subfolder structure
        const segments = routePath.split('/').filter(Boolean);
        const name = segments.length === 0 ? 'Home' : segments.join('/');
          
        return {
          path: routePath || '/',
          name: name
        };
      })
      .sort((a, b) => a.path.localeCompare(b.path));
  });
</script>

<Header
	data={data}
/>

<h1>Welcome to Target Tracker!</h1>

<ul class="list-disc ml-4">
    {#each routes as route}
      <li>
        <a href={route.path}>{route.name}</a>
      </li>
    {/each}
</ul>

<Footer />
