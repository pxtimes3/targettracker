<script lang="ts">
	import type { PageServerData } from "../../../routes/$types";
	    let {data}: {data: PageServerData} = $props();
    if (data) console.log('data:0', data)
</script>

<header class="bg-background sticky top-0 flex h-20 items-center gap-4 border-b px-4 md:px-6">
    <nav class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <a href="##" class="flex items-center gap-2 text-lg font-semibold md:text-base">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon lucide lucide-package-2 h-6 w-6"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"></path><path d="M12 3v6"></path></svg>
                <span class="sr-only">Acme Inc</span>
        </a>
        <a href="##" class="text-foreground hover:text-foreground transition-colors">Dashboard</a>
        <a href="##" class="text-muted-foreground hover:text-foreground transition-colors">Orders</a>
        <a href="##" class="text-muted-foreground hover:text-foreground transition-colors">Products</a>
        <a href="##" class="text-muted-foreground hover:text-foreground transition-colors">Customers</a>
        <a href="##" class="text-muted-foreground hover:text-foreground transition-colors">Analytics</a>
    </nav>
</header>

<!-- <div class="navbar">
    <div class="flex-1">
      <button class="p-4 text-xl">TargetTracker</button>
    </div>
    <div class="flex-none gap-2">
    <button tabindex="-1" class="btn btn-ghost">
        <a href="/target">
            <div class="flex-none gap-2 w-fit">
                <span class="text-sm">Upload Target</span>
            </div>
        </a>
    </button>
    <Profile
        data={data}
    />
    <div class="dropdown dropdown-end m-4">
        <div tabindex="0" role="button" class="btn btn-ghost">
          <div class="flex-none gap-2 w-8 ">
            <span class="text-sm">Profile</span>
          </div>
          <svg width="24px" height="24px" class="ml-3 h-2 w-2 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
        </div>

        <ul
          tabindex="0"
          class="menu menu-sm dropdown-content bg-base-200 rounded-sm z-[1] mt-3 w-52 p-2 shadow">
          <li>
            <button class="justify-between">
              Your Profile
              <span class="badge">New</span>
            </button>
          </li>
          <li><a>Settings</a></li>
          <li><a>Logout</a></li>
        </ul>
      </div>
    </div>
    <div class="mr-5">
        <Lightswitch
            width='8'
            height='8'
        />
    </div>
  </div> -->
