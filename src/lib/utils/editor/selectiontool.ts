import type { Application, FederatedPointerEvent } from 'pixi.js';
import { Container, Graphics, Sprite } from 'pixi.js';

export class SelectionTool {
    public selectionRect: Graphics;
    public isSelecting: boolean = false;
    public startPos: { x: number; y: number } = { x: 0, y: 0 };
    public targetContainer: Container;
    public app: Application;

    constructor(targetContainer: Container, app: Application) 
    {
        this.targetContainer = targetContainer;
        this.selectionRect = new Graphics();
        this.selectionRect.label = 'selectionRect'
        // this.targetContainer.addChild(this.selectionRect);
        this.app = app;
        this.app.stage.addChild(this.selectionRect);

        // Debug
        this.selectionRect.setStrokeStyle({
            width: 2,
            color: 0xff0000,
            alpha: 0.7,
            alignment: 1
        });
        this.selectionRect.fill({
            color: 0xff0000,
            alpha: 0.2
        });
        this.selectionRect.rect(0, 0, 100, 100);

        // Initialize event listeners
        // this.initializeEvents();
    }

    // public initializeEvents(): void {
    //     this.targetContainer.eventMode = 'static';
    //     this.targetContainer.on('pointerdown', this.onSelectionStart.bind(this));
    //     this.targetContainer.on('pointermove', this.onSelectionMove.bind(this));
    //     this.targetContainer.on('pointerup', this.onSelectionEnd.bind(this));
    //     this.targetContainer.on('pointerupoutside', this.onSelectionEnd.bind(this));
    // }

    public onSelectionStart(e: FederatedPointerEvent): void 
    {
        const pos = e.global;
        this.startPos = { x: pos.x, y: pos.y };
        this.isSelecting = true;
    }

    /**
     * TODO: Ta reda på varför selectionRect inte funkar med v8-syntax.
     * @param e 
     * @returns void
     */
    public onSelectionMove(e: FederatedPointerEvent): void 
    {
        if (!this.isSelecting) return;
        
        this.selectionRect.clear();

        // this.selectionRect.setStrokeStyle({
        //     width: 2, 
        //     color: 0xff0000, 
        //     alpha: 0.7, 
        //     alignment: 1
        // });
        // this.selectionRect.fill({
        //     color: 0xff0000, 
        //     alpha: 0.2
        // });

        console.log('Drawing selection rectangle:', {
            start: this.startPos,
            current: e.global,
            isSelecting: this.isSelecting
        });

        this.selectionRect.lineStyle(1, 0xff0000, 0.7);
        this.selectionRect.beginFill(0xff0000, 0.2);

        const width = e.global.x - this.startPos.x;
        const height = e.global.y - this.startPos.y;

        this.selectionRect.drawRect(
            this.startPos.x,
            this.startPos.y,
            width,
            height
        );

        // this.selectionRect.rect(
        //     this.startPos.x,
        //     this.startPos.y,
        //     width,
        //     height
        // )
        this.selectionRect.endFill();
    }

    public onSelectionEnd(e: FederatedPointerEvent): void 
    {
        if (!this.isSelecting) return;

        // const localPos = this.targetContainer.toLocal(e.global);
        const localPos = e.global;
        this.isSelecting = false;

        // Find shots
        const selectedShots = this.findShotsInSelection(
            this.startPos,
            { x: e.x, y: localPos.y }
        );

        this.selectionRect.clear();

        const selectionEvent = new CustomEvent('shotsSelected', {
            detail: { shots: selectedShots }
        });
        window.dispatchEvent(selectionEvent);
    }

    public findShotsInSelection(start: { x: number; y: number }, end: { x: number; y: number }): Sprite[] 
    {
        const selectedShots: Sprite[] = [];
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);

        // console.log('Selection lrtb:', { left, right, top, bottom });

        this.targetContainer.children.forEach(child => {
            if (child instanceof Container) {
                child.children.forEach(subChild => {
                    if (subChild instanceof Sprite && subChild.label?.startsWith('shot-')) {
                        // sprite pos => to global
                        const globalPos = subChild.getGlobalPosition();
                        // console.log(`Shot ${subChild.label} global:`, globalPos);

                        if (
                            globalPos.x >= left &&
                            globalPos.x <= right &&
                            globalPos.y >= top &&
                            globalPos.y <= bottom
                        ) {
                            selectedShots.push(subChild);
                            console.log(`Selected shot: ${subChild.label}`);
                        }
                    }
                });
            }
        });
        
        // console.log('Selected shots:', selectedShots);
        return selectedShots;
    }

    public destroy(): void 
    {
        this.targetContainer.off('pointerdown', this.onSelectionStart);
        this.targetContainer.off('pointermove', this.onSelectionMove);
        this.targetContainer.off('pointerup', this.onSelectionEnd);
        this.targetContainer.off('pointerupoutside', this.onSelectionEnd);
        this.selectionRect.destroy();
    }
}
