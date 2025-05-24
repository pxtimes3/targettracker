<script lang="ts">
	import { Field, Input, Switch } from "svelte-ux";
    import { validate } from "@/utils/forms";
	
    let { data } = $props();
</script>

<h3 class="text-sm uppercase text-primary-content dark:text-white/75 tracking-wide mb-2">Case</h3>
<div class="grid grid-cols-2 gap-x-2 mb-4 items-stretch children-h-full">
    <Field label="Case Manufacturer" let:id>
        <Input 
            {id}
            name="manufacturerCase"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.manufacturerCase || ''}
        />
    </Field>

    <Field label="Case name" let:id>
        <Input 
            {id}
            name="caseName"
            min={3}
            max={256}
            on:keyup={validate}
            value={data.caseName?.toString() || ''}
        />
    </Field>
</div>