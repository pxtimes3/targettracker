// $lib/utils/ReferenceTool.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { isNull } from 'drizzle-orm';
import type { FederatedPointerEvent } from 'pixi.js';
import { Assets, Container, Graphics, Sprite, Text } from 'pixi.js';
import { get } from 'svelte/store';

interface RefData {
    ref: {
        measurement: string | number;
        a: [number, number];
        x: [number, number];
        linelength: number;
    }
    target: {
        image: {
            originalsize: [number | undefined, number | undefined];
        }
    }
}

export class ReferenceTool {
    private targetContainer: Container;
    private referenceContainer: Container;
    private userSettings!: SettingsInterface;
    private targetStore!: TargetStoreInterface;
    private editorStore!: EditorStoreInterface;
    public  editorStoreUnsubscribe: () => void;
    private refLine: Graphics;
    private isDrawingReferenceLine: boolean = false;
    public  aIsSet: boolean = false;
    private xIsSet: boolean = false;
    private aIsMoved: boolean = true;
    public  xIsMoved: boolean = true;
    private refLineLength: number = 0;
    private refRadius: number = 16;
    public  refMeasurementDirty: boolean = true;
    private isDragging: boolean = false;
    private dragTarget: Container | null = null;
    private dragStartPosition: { x: number; y: number } | null = null;

    constructor(targetContainer: Container)
    {
        this.targetContainer = targetContainer;
        this.userSettings = get(UserSettingsStore);
        this.targetStore = get(TargetStore);
        this.referenceContainer = new Container();
        this.editorStoreUnsubscribe = EditorStore.subscribe((values) => {
            this.editorStore = values;
            this.setVisible(this.editorStore.mode === 'reference');
        });
        this.referenceContainer.visible = this.editorStore.mode === 'reference' ? true : false;
        this.refLine = new Graphics();
        this.initialize();
    }

    private initialize(): void
    {
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

    private updateReferenceLine(event?: FederatedPointerEvent): void 
    {
        if (!this.isDrawingReferenceLine || !this.refLine) return;
    
        const startPoint = this.referenceContainer.getChildByLabel('ref-a');
        const endPoint = !this.xIsSet ? undefined : this.referenceContainer.getChildByLabel('ref-x');
    
        if (!startPoint) return;
    
        this.refLine.clear();
        this.refLine.beginPath();
        this.refLine.setStrokeStyle({
            pixelLine: true,
            color: 0x000000,
            alpha: 0.8,
            cap: 'round',
            join: 'round'
        });
    
        let startPos = { x: startPoint.x, y: startPoint.y };
        let endPos = { x: 0, y: 0 };
    
        if (endPoint) {
            endPos = { x: endPoint.x, y: endPoint.y };
        } else if (event) {
            const localPos = this.referenceContainer.toLocal(event.global);
            endPos = { x: localPos.x, y: localPos.y };
        }
    
        // Calculate the total line length for reference
        this.refLineLength = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) +
            Math.pow(endPos.y - startPos.y, 2)
        );
    
        // Calculate the direction vector
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return; // Avoid division by zero
        
        // Normalize direction vector
        const ndx = dx / length;
        const ndy = dy / length;
        
        // Radius of the circles
        const radius = 16; // Same as in createSprite
        
        // Calculate start and end points at the edge of the circles
        const adjustedStartX = startPos.x + ndx * this.refRadius;
        const adjustedStartY = startPos.y + ndy * this.refRadius;
        const adjustedEndX = endPos.x - ndx * this.refRadius;
        const adjustedEndY = endPos.y - ndy * this.refRadius;
        
        // Draw only the visible part of the line
        this.refLine.moveTo(adjustedStartX, adjustedStartY)
            .lineTo(adjustedEndX, adjustedEndY)
            .stroke();
    }

    public async addReferencePoint(x: number, y: number): Promise<void>
    {
        if (!this.aIsSet) {
            const sprite = await this.createPoint('ref-a', x, y);
            this.aIsSet = true;
            TargetStore.update(store => ({
                ...store,
                reference: {
                    ...store.reference,
                    a: [sprite.position.x, sprite.position.y]
                }
            }));
            return;
        }

        if (!this.xIsSet) {
            const sprite = await this.createPoint('ref-x', x, y);
            this.xIsSet = true;
            TargetStore.update(store => ({
                ...store,
                reference: {
                    ...store.reference,
                    x: [sprite.position.x, sprite.position.y]
                }
            }));
            this.isDrawingReferenceLine = true;
        }

        if (this.xIsSet && this.aIsSet) {
            console.log('A + X is set!');
        }
    }

    private async createPoint(label: string, x: number, y: number): Promise<Container> 
    {
        const container = new Container({
            label: label,
            eventMode: 'dynamic',
            cursor: 'pointer',
            interactive: true,
        });
        container.label = label;
    
        const idLabel: RegExpMatchArray|null = label.match(/\w$/);
        const text = idLabel && idLabel[0] ? idLabel[0] : '';
        
        const lineWidth = 1.5;
        const letterSize = this.refRadius * 1.2;
        
        // Create the circle
        const marker = new Graphics({label: label})
            .circle(0, 0, this.refRadius)
            .stroke({color: 0x000000, pixelLine: true})
            .fill({color: 0xFFFFFF, alpha: 0.5});
        
        // Create the letter graphic
        const letterGraphic = new Graphics();
        
        // Draw the appropriate letter
        if (text.toUpperCase() === 'A') {
            // Draw letter A
            const halfWidth = letterSize * 0.4;
            const height = letterSize * 0.8;
            
            // Left line of A
            letterGraphic.moveTo(-halfWidth, height/2)
                .lineTo(0, -height/2);
            
            // Right line of A
            letterGraphic.moveTo(0, -height/2)
                .lineTo(halfWidth, height/2);
            
            // Crossbar of A
            letterGraphic.moveTo(-halfWidth * 0.7, height/6)
                .lineTo(halfWidth * 0.7, height/6);
        } 
        else if (text.toUpperCase() === 'X') {
            // Draw letter X
            const size = letterSize * 0.4;
            
            // First diagonal of X
            letterGraphic.moveTo(-size, -size)
                .lineTo(size, size);
            
            // Second diagonal of X
            letterGraphic.moveTo(size, -size)
                .lineTo(-size, size);
        }

        letterGraphic.stroke({color: 0x000000, width: lineWidth, pixelLine: true});
        
        container.addChild(marker, letterGraphic);
        
        const localPosInTarget = this.targetContainer.toLocal({ x, y });
        const finalPos = this.referenceContainer.toLocal(localPosInTarget, this.targetContainer);
        
        container.position.set(finalPos.x, finalPos.y);
        // container.scale.set(1 / this.targetContainer.scale.x);
        
        container.on('pointerdown', (e) => {
            e.stopPropagation();
            this.handleReferencePointDrag(e);
        });
        
        this.referenceContainer.addChild(container);
        
        return container;
    }

    private handleReferencePointDrag(event: FederatedPointerEvent): void 
    {
        // The current target is now the container, not the sprite
        const container = event.currentTarget as Container;
        this.isDragging = true;
        this.dragTarget = container;
        this.dragStartPosition = { x: container.x, y: container.y };
    
        if (container.label === 'ref-a') {
            this.aIsMoved = true;
        }
        if (container.label === 'ref-x') {
            this.xIsMoved = true;
        }
        this.refMeasurementDirty = true;
    
        // Add drag event listeners
        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    }
    
    private handleDragMove(event: FederatedPointerEvent): void 
    {
        if (!this.isDragging || !this.dragTarget) return;
    
        const newPosition = this.referenceContainer.toLocal(event.global);
        this.dragTarget.x = newPosition.x;
        this.dragTarget.y = newPosition.y;
    
        // Update reference points
        if (this.dragTarget.label === 'ref-a') {
            TargetStore.update(store => ({
                ...store,
                reference: {
                    ...store.reference,
                    a: [newPosition.x, newPosition.y]
                }
            }));
    
            EditorStore.update(store => ({
                ...store,
                aIsMoved: true,
                isRefDirty: true
            }));
        } else if (this.dragTarget.label === 'ref-x') {
            TargetStore.update(store => ({
                ...store,
                reference: {
                    ...store.reference,
                    x: [newPosition.x, newPosition.y]
                }
            }));
            EditorStore.update(store => ({
                ...store,
                xIsMoved: true,
                isRefDirty: true
            }));
        }
        
        // Update the reference line when dragging
        this.updateReferenceLine();
    }

    private handleDragEnd(event: FederatedPointerEvent): void 
    {
        if (!this.isDragging || !this.dragTarget) return;
        
        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPosition = null;
    
        // Remove listeners
        this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));
        
        // Update the reference line one last time
        this.updateReferenceLine();
    }

    public setRefMeasurement(): void {
        const measurement = this.normalizeMeasurement(this.editorStore.refMeasurement);
        const refA = this.referenceContainer.getChildByLabel('ref-a');
        const refX = this.referenceContainer.getChildByLabel('ref-x');
        
        if (!refA || !refX || !measurement) {
            console.error('Missing required values');
            return;
        }
    
        // Single store update with all values
        TargetStore.update(store => {
            const newRef = {
                ...store.reference,
                measurement: parseFloat(measurement),
                linelength: this.refLineLength,
                a: [refA.position.x, refA.position.y] as [number, number],
                x: [refX.position.x, refX.position.y] as [number, number]
            };
    
            // Calculate immediately with the new values
            const calculation = {
                cm: (10 * this.refLineLength) / (parseFloat(measurement) * 10),
                px: (100 * parseFloat(measurement) * 10) / this.refLineLength
            };
    
            return {
                ...store,
                reference: {
                    ...newRef,
                    cm: calculation.cm,
                    px: calculation.px
                }
            };
        });
    
        this.resetEditorState();
        this.clearWarnings();
    }

    private isValidMeasurementInput(measurement: string): boolean {
        const refA = this.referenceContainer.getChildByLabel('ref-a');
        const refX = this.referenceContainer.getChildByLabel('ref-x');
    
        return !!refA && 
               !!refX && 
               !!measurement.match(/^(?!^0$)-?\d+[.,]?\d*$/i);
    }

    private normalizeMeasurement(measurement: string): string
    {
        return measurement
            .replace(/,/, '.')
            .replace(/^0+(?=\d+\.)|^0+(?=\d+)/, '');
    }

    private updateTargetStore(normalizedMeasurement: string): void
    {
        this.targetStore.reference.measurement = parseFloat(normalizedMeasurement);
        this.targetStore.reference.linelength = this.refLineLength;
    }

    private hasReferenceValuesChanged(calculation: { cm: number, px: number }): number | boolean
    {
        const oldVal = {
            cm: this.targetStore.reference.cm,
            px: this.targetStore.reference.px
        };

        return calculation.cm &&
            calculation.px &&
            calculation.cm !== oldVal.cm &&
            calculation.px !== oldVal.px;
    }

    private updateReferenceValues(calculation: { cm: number, px: number }): void
    {
        this.targetStore.reference.cm = calculation.cm;
        this.targetStore.reference.px = calculation.px;
        console.log(`Setting cm & px to ${calculation.cm} & ${calculation.px}`);
    }

    private resetEditorState(): void
    {
        EditorStore.update(store => ({
            ...store,
            aIsMoved: false,
            xIsMoved: false,
            isRefDirty: false,
            isRefComplete: true
        }));
    }

    private clearWarnings(): void
    {
        EditorStore.update(store => ({
            ...store,
            warnings: store.warnings?.filter(warning => warning.id !== 'atoxinputinvalid') ?? []
        }));
    }

    private addInvalidInputWarning(): void
    {
        EditorStore.update(store => ({
            ...store,
            warnings: [
                ...(store.warnings ?? []),
                { message: 'Invalid value!', id: 'atoxinputinvalid' }
            ],
        }));
    }

    private handleCalculationError(measurement: string, normalizedMeasurement: string): void {
        console.error(
            `Failed to set cm/px! Measurement was: ${measurement}, ` +
            `normalized: ${normalizedMeasurement}, ` +
            `lineLengh: ${this.refLineLength}`
        );
    }

    private isRefValid(refData: any): refData is RefData 
    {
        console.log("Validating ref data:", refData);
        
        const missing: string[] = [];
    
        // More specific checks
        if (refData.ref.measurement === undefined || refData.ref.measurement === null) 
            missing.push('measurement');
        
        if (!Array.isArray(refData.ref.a) || refData.ref.a.length !== 2 || 
            refData.ref.a[0] === undefined || refData.ref.a[1] === undefined) 
            missing.push('a coordinates');
        
        if (!Array.isArray(refData.ref.x) || refData.ref.x.length !== 2 || 
            refData.ref.x[0] === undefined || refData.ref.x[1] === undefined) 
            missing.push('x coordinates');
        
        if (refData.ref.linelength === undefined || refData.ref.linelength === 0) 
            missing.push('linelength');
    
        if (missing.length > 0) {
            console.log('Missing fields:', missing);
            console.log('Current data:', refData);
            return false;
        }
    
        return true;
    }

    public calculateReferenceValues(): {cm: number, px: number} | undefined {
        // Get fresh store data
        const currentStore = get(TargetStore);
        
        // Create validation data structure from current store
        const validationData = {
            ref: {
                measurement: currentStore.reference.measurement,
                a: currentStore.reference.a,
                x: currentStore.reference.x,
                linelength: currentStore.reference.linelength
            },
            target: {
                image: {
                    originalsize: currentStore.target.image.originalsize
                }
            }
        };
    
        console.log("Calculating with data:", validationData);
    
        if (!this.isRefValid(validationData)) {
            console.error('Invalid data for calculation');
            return;
        }
    
        const userSettings = get(UserSettingsStore);
    
        // We know these exist because isRefValid passed
        const ref = currentStore.reference;
    
        // convert length to mm
        let length: number = ref.measurement! * 10;
        // convert length to mm if imperial
        if (!userSettings.isometrics) {
            length = length * 2.54;
        }
    
        const mmToPixels = (mm: number) => (mm * ref.linelength!) / length;
        const pxToMm = (pixels: number) => (pixels * length) / ref.linelength!;
    
        return {
            cm: mmToPixels(10),
            px: pxToMm(100)
        };
    }
    
    /*
    const linePercentOfTarget = (ref.linelength / target.image.originalsize[0]);
    const totalWidthInMm = (target.image.originalsize[0] * length) / ref.linelength;
    // ---//
    console.log('length:', length); // mm
    console.log('reflinelength:', ref.linelength); // length of referenceline in pixels
    console.log('image.x:', target.image.originalsize[0]); // pixels
    console.log(`line is ${linePercentOfTarget * 100}% of target`);
    console.log(`if line(px) is ${length}mm then the entire image is ${totalWidthInMm} mm wide.`);
    console.log(`then 46mm is ${mmToPixels(46)} px`);
    console.log(`and 100px is ${pxToMm(100)} mm`);
    */
    

    public get isDirty(): boolean
    {
        return this.refMeasurementDirty;
    }

    public get isComplete(): boolean
    {
        return this.aIsSet && this.xIsSet && !this.refMeasurementDirty;
    }

    public setVisible(visible: boolean): void
    {
        this.referenceContainer.visible = visible;
    }

    public destroy(): void
    {
        this.targetContainer.off('pointermove', this.updateReferenceLine);
        this.referenceContainer.destroy();
        if (this.editorStoreUnsubscribe) {
            this.editorStoreUnsubscribe();
        }
    }
}
