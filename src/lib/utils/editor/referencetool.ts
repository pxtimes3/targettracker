// $lib/utils/ReferenceTool.ts
import { TargetStore } from '@/stores/TargetImageStore';
import type { FederatedPointerEvent } from 'pixi.js';
import { Assets, Container, Graphics, Sprite } from 'pixi.js';

export class ReferenceTool {
    private targetContainer: Container;
    private referenceContainer: Container;
    private refLine: Graphics;
    private isDrawingReferenceLine: boolean = false;
    private aIsSet: boolean = false;
    private xIsSet: boolean = false;
    private aIsMoved: boolean = true;
    private xIsMoved: boolean = true;
    private refLineLength: number = 0;
    private refMeasurementDirty: boolean = true;
    private isDragging: boolean = false;
    private dragTarget: Sprite | null = null;
    private dragStartPosition: { x: number; y: number } | null = null;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.referenceContainer = new Container();
        this.refLine = new Graphics();
        this.initialize();
    }

    private initialize(): void {
        // Setup reference container
        this.referenceContainer.label = 'referenceContainer';
        this.targetContainer.addChild(this.referenceContainer);
        this.referenceContainer.eventMode = 'dynamic';
        this.referenceContainer.interactiveChildren = true;

        // Setup reference line
        this.refLine.label = 'reference-line';
        this.referenceContainer.addChild(this.refLine);

        // Initialize event listeners
        this.targetContainer.on('pointermove', this.updateReferenceLine.bind(this));
    }

    private updateReferenceLine(event: FederatedPointerEvent): void {
        if (!this.isDrawingReferenceLine || !this.refLine) return;

        const startPoint = this.referenceContainer.getChildByLabel('ref-a');
        const endPoint = !this.xIsSet ? undefined : this.referenceContainer.getChildByLabel('ref-x');

        if (!startPoint) return;

        this.refLine.clear();
        this.refLine.beginPath();
        this.refLine.setStrokeStyle({
            width: 3,
            color: 0x000000,
            alpha: 0.8,
            cap: 'round',
            join: 'round'
        });

        let startPos = { x: startPoint.x, y: startPoint.y };
        let endPos;

        if (endPoint) {
            endPos = { x: endPoint.x, y: endPoint.y };
        } else {
            const localPos = this.referenceContainer.toLocal(event.global);
            endPos = { x: localPos.x, y: localPos.y };
        }

        this.refLine.moveTo(startPos.x, startPos.y)
            .lineTo(endPos.x, endPos.y)
            .stroke();

        this.refLineLength = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) +
            Math.pow(endPos.y - startPos.y, 2)
        );
    }

    public async addReferencePoint(x: number, y: number): Promise<void> {
        const createSprite = async (texturePath: string, label: string) => {
            const texture = await Assets.load(texturePath);
            const sprite = new Sprite(texture);
            sprite.label = label;
            sprite.eventMode = 'dynamic';
            sprite.cursor = 'pointer';
            sprite.interactive = true;
            sprite.anchor.set(0.5);
            sprite.scale.set(1 / this.targetContainer.scale.x);

            // Convert global coordinates to target container's local space first
            const localPosInTarget = this.targetContainer.toLocal({ x, y });

            // Then convert target's local coordinates to reference container's local space
            const finalPos = this.referenceContainer.toLocal(localPosInTarget, this.targetContainer);

            sprite.position.set(finalPos.x, finalPos.y);

            sprite.on('pointerdown', (e) => {
                e.stopPropagation();
                this.handleReferencePointDrag(e);
            });

            this.referenceContainer.addChild(sprite);

            // Debug logging
            console.log({
                clickPosition: { x, y },
                localInTarget: localPosInTarget,
                finalPosition: finalPos,
                spriteGlobalPosition: this.targetContainer.toGlobal(sprite.position)
            });

            return sprite;
        };

        if (!this.aIsSet) {
            const sprite = await createSprite('/cursors/circle-a.svg', 'ref-a');
            this.aIsSet = true;
            TargetStore.setReference('a', [sprite.position.x, sprite.position.y]);
            return;
        }

        if (!this.xIsSet) {
            const sprite = await createSprite('/cursors/circle-x.svg', 'ref-x');
            this.xIsSet = true;
            TargetStore.setReference('x', [sprite.position.x, sprite.position.y]);
            this.isDrawingReferenceLine = true;
        }
    }

    private handleReferencePointDrag(event: FederatedPointerEvent): void {
        const target = event.currentTarget as Sprite;
        this.isDragging = true;
        this.dragTarget = target;
        this.dragStartPosition = { x: target.x, y: target.y };

        // Mark as moved based on which point is being dragged
        if (target.label === 'ref-a') {
            this.aIsMoved = true;
        }
        if (target.label === 'ref-x') {
            this.xIsMoved = true;
        }
        this.refMeasurementDirty = true;

        // Add drag event listeners
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    }

    private handleDragMove(event: FederatedPointerEvent): void {
        if (!this.isDragging || !this.dragTarget) return;

        const newPosition = this.referenceContainer.toLocal(event.global);
        this.dragTarget.x = newPosition.x;
        this.dragTarget.y = newPosition.y;

        // Update reference points in store
        if (this.dragTarget.label === 'ref-a') {
            TargetStore.setReference('a', [newPosition.x, newPosition.y]);
        } else if (this.dragTarget.label === 'ref-x') {
            TargetStore.setReference('x', [newPosition.x, newPosition.y]);
        }
    }

    private handleDragEnd(event: FederatedPointerEvent): void {
        if (!this.isDragging || !this.dragTarget) return;

        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPosition = null;

        // Remove drag event listeners
        this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));
    }

    public setRefMeasurement(measurement: string): void {
        const isValid = this.aIsSet &&
            this.xIsSet &&
            measurement.match(/^(?!^0$)-?\d+[.,]?\d*$/i);

        if (isValid) {
            const normalizedMeasurement = measurement.replace(/,/, '.');

            TargetStore.setReference('measurement', parseFloat(normalizedMeasurement));
            TargetStore.setReference('linelength', this.refLineLength);

            // Reset state flags
            this.aIsMoved = false;
            this.xIsMoved = false;
            this.refMeasurementDirty = false;

            // Dispatch event to notify of successful measurement set
            window.dispatchEvent(new CustomEvent('referenceMeasurementSet'));
        }
    }

    public get isDirty(): boolean
    {
        return this.refMeasurementDirty;
    }

    public get isComplete(): boolean
    {
        return this.aIsSet && this.xIsSet && !this.refMeasurementDirty;
    }

    public setVisible(visible: boolean): void {
        this.referenceContainer.visible = visible;
    }

    public destroy(): void {
        this.targetContainer.off('pointermove', this.updateReferenceLine);
        this.referenceContainer.destroy();
    }
}
