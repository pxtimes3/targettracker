import { Container } from "pixi.js";

export function getAllChildren(container: Container): string[] {
    let labels: string[] = [];
    container.children.forEach((child) => {
    
        if (child.label && child.label.startsWith('shot')) {
            labels.push(child.label);
        }
    });
    
    return labels;
}