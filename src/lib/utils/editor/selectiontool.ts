import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Graphics, Sprite } from 'pixi.js';

export class SelectionTool {
    private selectionRect: Graphics;
    private isSelecting: boolean = false;
    private startPos: { x: number; y: number } = { x: 0, y: 0 };
    private targetContainer: Container;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.selectionRect = new Graphics();
        this.targetContainer.addChild(this.selectionRect);

        // Initialize event listeners
        this.initializeEvents();
    }

    private initializeEvents(): void {
        this.targetContainer.eventMode = 'static';
        this.targetContainer.on('pointerdown', this.onSelectionStart.bind(this));
        this.targetContainer.on('pointermove', this.onSelectionMove.bind(this));
        this.targetContainer.on('pointerup', this.onSelectionEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.onSelectionEnd.bind(this));
    }

    private onSelectionStart(event: FederatedPointerEvent): void {
        const localPos = this.targetContainer.toLocal(event.global);
        this.startPos = { x: localPos.x, y: localPos.y };
        this.isSelecting = true;
    }

    private onSelectionMove(event: FederatedPointerEvent): void {
        if (!this.isSelecting) return;

        const localPos = this.targetContainer.toLocal(event.global);

        // Clear previous rectangle
        this.selectionRect.clear();

        // Draw new rectangle
        this.selectionRect.setStrokeStyle({width: 2, color: 0xff0000, alpha: 0.7, alignment: 1});
        this.selectionRect.fill({color: 0xff0000, alpha: 0.2});

        const width = localPos.x - this.startPos.x;
        const height = localPos.y - this.startPos.y;

        this.selectionRect.rect(
            this.startPos.x,
            this.startPos.y,
            width,
            height
        );
    }

    private onSelectionEnd(event: FederatedPointerEvent): void {
        if (!this.isSelecting) return;

        const localPos = this.targetContainer.toLocal(event.global);
        this.isSelecting = false;

        // Find shots within selection rectangle
        const selectedShots = this.findShotsInSelection(
            this.startPos,
            { x: localPos.x, y: localPos.y }
        );

        // Clear selection rectangle
        this.selectionRect.clear();

        // Emit custom event with selected shots
        const selectionEvent = new CustomEvent('shotsSelected', {
            detail: { shots: selectedShots }
        });
        window.dispatchEvent(selectionEvent);
    }

    private findShotsInSelection(start: { x: number; y: number }, end: { x: number; y: number }): Sprite[] {
        const selectedShots: Sprite[] = [];
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);

        // Recursively search through all children
        this.targetContainer.children.forEach(child => {
            if (child instanceof Container) {
                child.children.forEach(subChild => {
                    if (subChild instanceof Sprite && subChild.label?.startsWith('shot-')) {
                        if (
                            subChild.x >= left &&
                            subChild.x <= right &&
                            subChild.y >= top &&
                            subChild.y <= bottom
                        ) {
                            selectedShots.push(subChild);
                        }
                    }
                });
            }
        });

        return selectedShots;
    }

    public destroy(): void {
        this.targetContainer.off('pointerdown', this.onSelectionStart);
        this.targetContainer.off('pointermove', this.onSelectionMove);
        this.targetContainer.off('pointerup', this.onSelectionEnd);
        this.targetContainer.off('pointerupoutside', this.onSelectionEnd);
        this.selectionRect.destroy();
    }
}
