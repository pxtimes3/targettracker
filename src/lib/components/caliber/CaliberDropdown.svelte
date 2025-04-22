<!-- src/lib/components/caliber/CaliberDropdown.svelte -->
<script lang="ts">
    import { SelectField, MenuItem } from 'svelte-ux';
    import { cls } from '@layerstack/tailwind';
    import { calibers } from '@/stores/CaliberStore';
	import { handleCaliberChange } from '@/utils/caliber';
	import { UserSettingsStore } from '@/stores/UserSettingsStore';
    
    export let value: string = '';
    export let onChange: (value: string) => void = () => {};
    export let name: string = 'caliber';
    
    // calibers => opts
    $: options = $calibers.map(cal => ({
        value: cal.id,
        label: cal.name,
        group: cal.category,
        description: $UserSettingsStore.isometrics ? 
            `${cal.mm}mm` : 
            `${cal.in}"`,
        mm: cal.mm,
        inch: cal.in,
        searchTerms: [cal.name, cal.mm, cal.in, ...cal.aliases].join(' ')
    }));
</script>
  
<div class="mb-4 text-surface-content text-sm">Search by name, or size (mm/in)</div>
  
<SelectField
    id="caliber"
    options={options}
    {value}
    {name}
    
    onChange={(selectedValue: any) => {
        const selectedOption = options.find(opt => opt.value === selectedValue);
        value = selectedValue;
        
        if (onChange && selectedOption) {
            onChange(selectedValue);
            
            const mmValue = parseFloat(selectedOption.mm);
            const event = new CustomEvent('caliber-selected', {
                detail: { 
                    id: selectedValue,
                    mm: mmValue,
                    inch: selectedOption.inch
                },
                bubbles: true
            });
            
            document.dispatchEvent(event);
        }
    }}

    search={async (text, options) => {
        text = text?.trim();
        if (!text || options.length === 0) {
            return options;
        } else {
            const words = text?.toLowerCase().split(" ") ?? [];
            return options.filter((option) => {
                const searchableText = [option.label, option.value, option.description, option.searchTerms]
                    .join(" ")
                    .toLowerCase();
                return words.every((word) => searchableText.includes(word));
            });
        }
    }}
  >
    <MenuItem
        slot="option"
        let:option
        let:index
        let:selected
        let:highlightIndex
        class={
            cls(
                index === highlightIndex && "bg-surface-content/5",
                option === selected && "font-semibold",
                option.group ? "px-4" : "px-2",
            )
        }
        scrollIntoView={index === highlightIndex}
        disabled={option.disabled}
    >
        <div>
            <div>{option.label}</div>
            <div class="text-sm text-surface-content/50">
                {$UserSettingsStore.isometrics ? `${option.mm}mm` : `${option.inch}"`} - {option.group}
            </div>
        </div>
    </MenuItem>
</SelectField>