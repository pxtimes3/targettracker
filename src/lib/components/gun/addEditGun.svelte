<!-- src/lib/components/gun/addEditGun.svelte -->
<script lang="ts">
    import { validate, convertComma } from "@/utils/forms";
    import CaliberDropdown from "../caliber/CaliberDropdown.svelte";
    import { UserSettingsStore } from "$src/lib/stores/UserSettingsStore";
    import { Field, Input, Switch, TextField, SelectField, MenuItem } from "svelte-ux";
    import { cls } from "@layerstack/tailwind";
    import { 
      createGunTypeOptions, 
      handleCaliberInput, 
      onCaliberSelected, 
      setupCaliberListener, 
      fetchCsrfToken, 
      handleSubmit 
    } from "./addeditgun";
  
    let { data, gunTypes }: { data: GunData, gunTypes: string[] } = $props();
    
    let selectedType = $state(data.type || '');
    let selectedCaliber = $state(data.caliber || '');
    let caliberMm = $state(data.caliberMm || 0);
    let note = $state(data.note || '');
    let csrfToken = $state('');
    
    let gunTypeOptions = $derived(createGunTypeOptions(gunTypes));
    
    $effect(() => {
      // console.log('Current selectedCaliber:', selectedCaliber);
      // console.log('Data from props:', data);
      
      const cleanup = setupCaliberListener((value) => caliberMm = value);
      
      fetchCsrfToken().then(token => csrfToken = token);
      
      return cleanup;
    });
  </script>
  
  <form onsubmit={(e) => handleSubmit(e, data, csrfToken)}>
    <div class="grid grid-flow-row gap-2">
      <input 
        type="hidden"
        id="id"
        name="id"
        value={data.id}
      />
  
      <Field label="Name" let:id>
        <Input 
          name="name"
          {id}
          min={3}
          max={256}
          placeholder="Winchester R93 .17 Hornet"
          on:keyup={validate}
          value={data.name}
        />
      </Field>
  
      <SelectField
        label="Type"
        name="type"
        options={gunTypeOptions}
        bind:value={selectedType}
        placeholder="Select gun type"
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
            option === selected && "font-semibold"
          )}
          scrollIntoView={index === highlightIndex}
        >
          {option.label}
        </MenuItem>
      </SelectField>

        <Field label="Manufacturer" let:id>
            <Input 
                {id}
                name="manufacturer"
                min={3}
                max={256}
                placeholder="Winchester R93 .17 Hornet"
                on:keyup={validate}
                value={data.manufacturer || ''}
            />
        </Field>

        <Field label="Model" let:id>
            <Input 
                {id}
                name="model"
                min={3}
                max={256}
                placeholder=""
                on:keyup={validate}
                value={data.model || ''}
            />
        </Field>

        <input 
            type="hidden"
            id="caliber_mm"
            name="caliber_mm"
            value={caliberMm}
        />
        
        <!-- Caliber dropdown -->
        <Field label="Caliber" let:id>
            <CaliberDropdown 
              value={selectedCaliber}
              onChange={(caliberId: string) => onCaliberSelected(caliberId, (value) => selectedCaliber = value)}
              name="caliber"
            />
        </Field>
        <!-- alt -->
        <!--
        <div class="relative">
            <input 
                type="text"
                id="caliber_manual"
                name="caliber_manual"
                placeholder={$UserSettingsStore.isometrics ? "Enter caliber in mm" : "Enter caliber in inches"}
                onkeyup={handleCaliberInput}
            />
            <div class="text-xs text-surface-content/70 mt-1">
                {$UserSettingsStore.isometrics ? 
                    "Examples: 9, 5.56, 7.62" : 
                    "Examples: .308, .223, .45"}
            </div>
        </div>
        -->
        
        <Field label="Barrel length" let:id>
            <Input 
                {id}
                name="barrellength"
                min={3}
                max={256}
                placeholder='12"'
                on:keyup={validate}
                value={data.barrelLength?.toString() || ''}
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.barrelLengthUnit == 'imperial' ? 'font-bold' : ''}>in</span>
                    <Switch
                        name="barrelunit" 
                        checked={data.barrelLengthUnit == 'metric' ? true : false}
                    />
                    <span class={data.barrelLengthUnit == 'metric' || undefined ? 'font-bold' : ''}>cm</span>
                </label>
            </div>
        </Field>

        <Field label="Barrel twist" let:id>
            <Input 
                {id}
                name="barreltwist"
                min={3}
                max={256}
                placeholder='1:nn'
                on:keyup={validate}
                value={data.barrelTwist || ''}
            />
            <div class="grid gap-2 z-10">
                <label class="flex gap-2 items-center text-sm">
                    <span class={data.barrelLengthUnit == 'imperial' ? 'font-bold' : ''}>in</span>
                    <Switch
                        name="barreltwistunit" 
                        checked={data.barrelTwistUnit == 'metric' || undefined ? true : false}
                    />
                    <span class={data.barrelLengthUnit == 'metric' || undefined ? 'font-bold' : ''}>cm</span>
                </label>
            </div>
        </Field>

        <Field label="Stock / Chassis" let:id>
            <Input 
                {id}
                name="stock"
                min={3}
                max={256}
                placeholder="Spuhr Bravo"
                on:keyup={validate}
                value={data.stock || ''}
            />
        </Field>

        <TextField 
            label="Note:" 
            multiline 
            classes={{ input: "h-[4.55rem]" }} 
            id="note"
            name="note"
            spellcheck="false"
            bind:value={note}
        />
    </div>
    <button
        type="submit"
    >Save</button>
</form>