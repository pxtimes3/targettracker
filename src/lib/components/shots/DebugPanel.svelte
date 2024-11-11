<script lang="ts">
    let {
        mouse,
        rotation,
        zoom,
        window
    }: {
        mouse: { x:undefined|number, y:undefined|number },
        rotation: number,
        zoom: any,
        window: { x:undefined|number, y:undefined|number }
    } = $props();
</script>

<div class="absolute
            bottom-5
            right-5
            grid
            grid-flow-col gap-x-4

            font-mono
            text-xs
            leading-3
            p-2
            border-[1px]
            w-fit
            h-fit
            bg-gradient-to-br from-slate-500 to-slate-700
            opacity-50
            hover:opacity-100"
        >
        <div>
            Mouse: {`${mouse.x}:${mouse.y}`}
        </div>
        <div>
            Window: {`${window.x}:${window.y}`}
        </div>
        <div>
            Rotation: {`${rotation}`}
        </div>
        <div>
            Scale: {`${zoom}`}
        </div>
    </div>
