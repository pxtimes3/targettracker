// src/lib/utils/editor/EditorUtils.ts
import { EditorStore, type Mode } from "@/stores/EditorStore";
import { TargetStore } from "@/stores/TargetImageStore";
import { Container } from "pixi.js";
import { get } from "svelte/store";

export function getAllChildren(container: Container): string[] {
    let labels: string[] = [];
    container.children.forEach((child) => {
        if (child.label && child.label.startsWith('shot')) {
            labels.push(child.label);
        }
    });
    
    return labels;
}

export function getElementPosition(button: any): { x: number, y: number }
{
    console.log(`button:`, button);
    let position: { x: number, y: number } = { x: 0, y: 0 };
    
    position.x = button.offsetWidth;
    position.y = button.offsetTop;
    
    return position;
}

export function canWeActivateMode(mode: Mode): { status: boolean, missing: string[]}
{
    console.debug(`CanWeActivateMode called with mode: ${mode}`);
    const missing: string[] = [];

    // checks
    const targetImage: boolean = get(TargetStore).target.image.filename ? true : false;
    const isRefComplete: boolean = get(EditorStore).isRefComplete;
    const isFirearmSelected: boolean = get(TargetStore).info.firearm.length == 36;
    const isAmmunitionSelected: boolean = get(TargetStore).info.ammunition.length == 36;
    const isDistanceSet: boolean = get(TargetStore).target.range ? true : false;
    const isEventValid: boolean = get(TargetStore).info.event.length > 2 ? true : false;

    if (mode == 'shots' || mode == 'poa') {
        if (!isRefComplete)         missing.push(`Reference is not set. ${get(EditorStore).isRefComplete}`);
        if (!isEventValid)          missing.push(`You need to select a previous event or create one. ${get(TargetStore).info.event.length}`)
        if (!isFirearmSelected)     missing.push(`You need to choose what firearm was used. ${get(TargetStore).info.firearm.length}`);
        if (!isAmmunitionSelected)  missing.push(`You need to choose what ammunition was used. ${get(TargetStore).info.ammunition.length}`);
        if (!isDistanceSet)         missing.push(`No distance to target set. ${get(TargetStore).target.range}`);
    }

    if (mode == 'rotate') {
        if (!targetImage)           missing.push('Target image is missing!');
    }

    

    return { status: missing.length == 0 ? true : false, missing: missing}
}