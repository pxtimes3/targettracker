// src/lib/utils/editor/ModeSwitcher.ts
import { EditorStore, type EditorStoreInterface, type Mode } from "@/stores/EditorStore";
import { canWeActivateMode } from "./EditorUtils";

let currentEditorStore: EditorStoreInterface;
const unsubscribe = EditorStore.subscribe(value => {
    currentEditorStore = value;
});

export function setMode(mode: Mode): void
{
    console.debug(`RequestedMode: ${mode}, currentMode ${currentEditorStore.mode}`);
    
    const modeCanChange = canWeActivateMode(mode);

    if (currentEditorStore.mode == mode) {
        console.debug(`${currentEditorStore.mode} : ${mode}`);
        EditorStore.update(store => {
            return { ...store, mode: 'none'}
        })
    } else if(modeCanChange.status) {
        console.debug(`Setting new mode to: ${mode}`);
        EditorStore.update(store => {
            return { ...store, mode };
        });
    }
}