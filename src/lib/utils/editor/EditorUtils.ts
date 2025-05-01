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

export function getElementPosition(button: any): { x: number, y: number }
{
    console.log(`button:`, button);
    let position: { x: number, y: number } = { x: 0, y: 0 };
    
    position.x = button.offsetWidth;
    position.y = button.offsetTop;
    
    return position;
}