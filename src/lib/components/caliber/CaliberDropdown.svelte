<!-- src/lib/components/caliber/CaliberDropdown.svelte -->
<script lang="ts">
    import { SelectField, MenuItem } from 'svelte-ux';
    import { cls } from '@layerstack/tailwind';
    import { calibers } from '@/stores/CaliberStore';
    
    const { value = '', onChange = (v: string) => {}, name = 'caliber' } = $props();
    
    // console.log('Initial caliber value:', value);
    
    // Track if calibers have loaded
    let calibersLoaded = $state(false);
    
    // Local state to track the selected value
    let selectedValue = $state(value);
    
    // Create options when calibers are available
    let options = $derived($calibers.map(cal => ({
      value: cal.id,
      label: cal.name,
      group: cal.category,
      description: cal.mm + 'mm / ' + cal.in + '"',
      searchTerms: [cal.name, cal.mm, cal.in, ...cal.aliases].join(' ')
    })));
    
    // Monitor when calibers load
    $effect(() => {
      if ($calibers.length > 0) {
        calibersLoaded = true;
        // console.log('Calibers loaded, count:', $calibers.length);
        
        // Force update selectedValue after calibers load
        if (value) {
          selectedValue = value;
          // console.log('Setting selectedValue after calibers loaded:', selectedValue);
          
          // Check if the value exists in options
          const valueExists = $calibers.some(cal => cal.id === value);
          // console.log('Value exists in calibers:', valueExists);
          
          if (valueExists) {
            const selectedCaliber = $calibers.find(cal => cal.id === value);
            if (selectedCaliber) {
              // Dispatch the mm value for the initial selection
              const event = new CustomEvent('caliber-selected', {
                detail: { 
                  id: value,
                  mm: parseFloat(selectedCaliber.mm),
                  inch: selectedCaliber.in
                },
                bubbles: true
              });
              
              document.dispatchEvent(event);
            }
          }
        }
      }
    });
    
    // Update selectedValue when the value prop changes
    $effect(() => {
      // console.log('Value prop changed to:', value);
      selectedValue = value;
    });
    
    // Handle selection changes
    function handleChange(newValue: string) {
      // console.log('Selection changed to:', newValue);
      selectedValue = newValue;
      onChange(newValue);
      
      // Find the selected caliber
      const selectedCaliber = $calibers.find(cal => cal.id === newValue);
      if (selectedCaliber) {
        // Dispatch event with mm value
        const event = new CustomEvent('caliber-selected', {
          detail: { 
            id: newValue,
            mm: parseFloat(selectedCaliber.mm),
            inch: selectedCaliber.in
          },
          bubbles: true
        });
        
        document.dispatchEvent(event);
      }
    }
  </script>
  
  {#if calibersLoaded}
    <SelectField
      {name}
      options={options}
      value={selectedValue}
      placeholder="Select caliber"
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
      onChange={handleChange}
      required
    >
      <MenuItem
        slot="option"
        let:option
        let:index
        let:selected
        let:highlightIndex
        class={cls(
          index === highlightIndex && "bg-surface-content/5",
          option === selected && "font-semibold",
          option.group ? "px-4" : "px-2",
        )}
        scrollIntoView={index === highlightIndex}
      >
        <div>
          <div>{option.label}</div>
          <div class="text-sm text-surface-content/50">
            {option.description} - {option.group}
          </div>
        </div>
      </MenuItem>
    </SelectField>
  {:else}
    <div class="p-2 text-sm text-gray-500">Loading calibers...</div>
  {/if}