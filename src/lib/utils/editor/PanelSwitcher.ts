// src/lib/utils/editor/PanelSwitcher.ts
import { activePanel as storeActivePanel } from "@/stores/EditorStore";
import { activeButton as storeActiveButton } from "@/stores/EditorStore";
import { get } from "svelte/store";

/**
 * Sätter activePanel i EditorStore. 
 * 
 * @param name string 
 * @returns Array<string|undefined>
 */
export function togglePanels(name: string): Array<string|undefined>
{
    const currentPanel = get(storeActivePanel);
    const currentButton = get(storeActiveButton);
    
    const newPanel = currentPanel === name ? undefined : name;
    const newButton = currentButton === name ? undefined : name;
    
    storeActivePanel.set(newPanel);
    storeActiveButton.set(newButton);

    return [newPanel, newButton];
}