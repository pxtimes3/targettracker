// src/lib/utils/editor/ModeSwitcher.ts
import { EditorStore, type EditorStoreInterface, type Mode } from "@/stores/EditorStore";

let currentEditorStore: EditorStoreInterface;
const unsubscribe = EditorStore.subscribe(value => {
    currentEditorStore = value;
});

export function setMode(mode: Mode): void
{
    // console.debug(`RequestedMode: ${mode}, currentMode ${currentEditorStore.mode}`);
    
    const modeCanChange: boolean = checkIfModeCanBeActivated(mode);

    if (currentEditorStore.mode == mode) {
        EditorStore.update(store => {
            return { ...store, mode: 'none'}
        })
    } else if(modeCanChange) {
        // console.debug(`Setting new mode to: ${mode}`);
        EditorStore.update(store => {
            return { ...store, mode };
        });
    }
}

/**
 * Kollar om ffa. shots kan aktiveras. Mode: shots kräver att referencepoints är = set etc.
 * 
 * @param mode 
 * @returns boolean
 */
export function checkIfModeCanBeActivated(mode: Mode): boolean
{
    if (mode == 'none') return true; // always OK
    
    if(mode == 'shots') {
        return currentEditorStore.isRefComplete && currentEditorStore.isInfoComplete;
    }

    if(mode == 'poa') {
        return currentEditorStore.isRefComplete && currentEditorStore.isInfoComplete;
    }

    // console.debug(`modeCheck for ${mode} passed.`)

    return true;
}