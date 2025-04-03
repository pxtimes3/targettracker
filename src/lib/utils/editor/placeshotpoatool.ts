// src/lib/utils/editor/placeshotpoatool.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { MetricsRenderer } from './MetricsRenderer';
import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Sprite, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { DragHandler } from './dragHandler';
import { ShotManager } from './shotManager';
import { GroupManager } from './groupManager';

export class ShotPoaTool {
    private targetContainer: Container;
    private editorStore: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private userSettings: SettingsInterface;
    private metricsRenderer: MetricsRenderer;
    private groupManager: GroupManager;
    private dragHandler: DragHandler;
    private shotManager: ShotManager;
    
    private isSelected: boolean = false;
    private userSettingsUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        
        this.metricsRenderer = new MetricsRenderer(targetContainer);
        this.dragHandler = new DragHandler(targetContainer);
        this.groupManager = new GroupManager(targetContainer);
        this.shotManager = new ShotManager(targetContainer, this.groupManager, this.metricsRenderer, this.dragHandler);
        
        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);

        type Point = {x: number, y: number};

        this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });

        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
             // console.log('Settings updated:', settings);
            this.userSettings = settings;
            this.metricsRenderer.drawAllMetrics();
        });
    }

    public destroy() {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
        if (this.targetStoreUnsubscribe) {
            this.targetStoreUnsubscribe();
        }
    }

    public async addShot(x: number, y: number, group: string): Promise<void>
    {
        const shot = await this.shotManager.addShot(x, y, group);
        this.metricsRenderer.drawAllMetrics(parseInt(group));
    }

    public async addPoa(x: number, y: number, group: string): Promise<void>
    {
        const poa = await this.shotManager.addPoa(x, y, group);
        this.metricsRenderer.drawAllMetrics(parseInt(group));
    }

    public async drawAllMetrics(group?: GroupInterface): Promise<void>
    {
        this.metricsRenderer.drawAllMetrics(group?.id);
    }
    
    public async createGroup(): Promise<{group: GroupInterface, container: Container} | null>
    {
        return this.groupManager.createGroup();
    }

    public async assignSelectedShotsToGroup(): Promise<void>
    {
        // not used
    }

    // public async addShot(x: number, y: number, group: string): Promise<void>
    // {
    //     // console.log(`addShot called: x:${x}, y:${y}, group:${group}`);

    //     let groupContainer: Container|null;
    //     let storeGroup: GroupInterface|undefined;
    //     let shots; // ShotInterface

    //     groupContainer = await this.getGroupContainer(group);
    //     if (!groupContainer) { 
    //         const newGroup = this.createGroup();

    //         if (!newGroup) {
    //             throw new Error(`Failed creating new group! group: ${group}`);
    //         }

    //         storeGroup = newGroup.group;
    //         groupContainer = newGroup.container;
    //     } else {
    //         storeGroup = this.targetStore.groups.find((g) => g.id === parseInt(group));
    //         if (!storeGroup) { console.error(`Tried to add shot to group ${group} in targetStore but no such group was found!`); return; }
    //     }

    //     shots = storeGroup.shots
    //     if (!shots) { console.error(`No shots-array found in store-group ${group}!`, storeGroup); return; }

    //     const label = `shot-${shots.length.toString()}-${group}`;
    //     const shot = this.createShotGraphic(label);
    //     const position = this.targetContainer.toLocal({x,y});

    //     shot.position.set(position.x, position.y);
    //     shot.scale.set(this.setScale());
    //     shot.width = 48;
    //     shot.zIndex = 99;

    //     shot.height = shot.width;

    //     groupContainer?.addChild(shot);

    //     const newShot = {
    //         id: shots.length.toString(),
    //         group: parseInt(group),
    //         x: position.x,
    //         y: position.y,
    //         score: 0,
    //     };

    //     TargetStore.addShot(newShot, parseInt(group));
    //     console.log('added shot to store:', newShot, `group ${parseInt(group)}`);

    //     this.metricsRenderer.drawAllMetrics(parseInt(group))

    //     shot.on('pointerdown', (e) => {
    //         e.stopPropagation();
    //         if (e.button === 1) { this.removeShot(e) }
    //         if (e.button === 0) { this.handleSpriteDrag(e); }
    //     });

    //     console.log('Shot created:', {
    //         label: shot.label,
    //     //     position: `${shot.position.x},${shot.position.y}`,
    //     //     parent: shot.parent?.label,
    //     //     visible: shot.visible,
    //     //     scale: `${shot.scale.x},${shot.scale.y}`,
    //     //     children: shot.children.length
    //     });

    //     console.debug(`shots:`, {
    //         groupContainer: this.getAllChildren(groupContainer),
    //         groupstore: this.getGroupStoreShots(parseInt(group)),
    //     });
    // }

    // private drawMeanRadius(groupId: number): void 
    // {
    //     const currentStore: TargetStoreInterface = get(TargetStore);
        
    //     const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

    //     const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
    //     if (!groupContainer) {
    //         return;
    //     }

    //     const oldMr = groupContainer.getChildByLabel(`mr-${groupId}`);
    //     if (oldMr) {
    //         groupContainer.removeChild(oldMr);
    //     }
        
    //     if (!group || 
    //         !group.shots || 
    //         group.shots.length < 2 || 
    //         !currentStore.reference.measurement || 
    //         !currentStore.reference.linelength
    //     ) {
    //         // console.log('Early return conditions:', {
    //         //     noGroup: !group,
    //         //     noShots: !group?.shots,
    //         //     notEnoughShots: group?.shots?.length ? group.shots.length < 2 : '',
    //         //     noRefMeasurement: !currentStore.reference.measurement,
    //         //     refMeasurement: currentStore.reference.measurement,
    //         //     noRefLineLength: !currentStore.reference.linelength,
    //         //     refLineLength: currentStore.reference.linelength,
    //         // });
    //         return;
    //     }
        
    //     const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
    //     const meanCenter = {
    //         x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    //         y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    //     };
    
    //     const meanRadius = points.reduce((sum, p) => 
    //         sum + Math.sqrt(
    //             Math.pow(p.x - meanCenter.x, 2) + 
    //             Math.pow(p.y - meanCenter.y, 2)
    //         ), 0) / points.length;
    
    //     // console.log('Calculated values:', {
    //     //     points,
    //     //     meanCenter,
    //     //     meanRadius,
    //     //     showmr: this.userSettings.showmr
    //     // });
    
    //     const graphics = new Graphics();
    //     graphics.clear();
    //     graphics.circle(0, 0, meanRadius);
    //     graphics.stroke({
    //         color: 0xFF0000,
    //         alpha: 0.5,
    //         pixelLine: true
    //     });
        
    //     graphics.position.set(meanCenter.x, meanCenter.y);
    //     graphics.eventMode = 'none';
    //     graphics.visible = this.userSettings.showmr;
    //     graphics.label = `mr-${groupId}`;
    
    //     // console.log('Group container:', groupContainer);
        
    //     groupContainer.addChild(graphics);
    // }
    
    // private drawCoveringRadius(groupId: number): void 
    // {
    //     const group = TargetStore.getGroup(groupId);
        
    //     // Get the group container first
    //     const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
    //     if (!groupContainer) {
    //         return; // Exit if no container exists
    //     }
        
    //     // Always remove the old circle if it exists
    //     const oldCircle = groupContainer.getChildByLabel(`ccr-${groupId}`);
    //     if (oldCircle) {
    //         groupContainer.removeChild(oldCircle);
    //     }
        
    //     // Only proceed with drawing if we have enough shots
    //     if (!group || !group.shots || group.shots.length < 2) {
    //         return; // Exit without drawing
    //     }
        
    //     // The rest of the function remains the same
    //     const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
    //     const {center, radius} = this.findMinCircle(points);

    //     const ccrRadiusInPixels = points.reduce((sum, p) => 
    //         sum + Math.sqrt(
    //             Math.pow(p.x - center.x, 2) + 
    //             Math.pow(p.y - center.y, 2)
    //         ), 0) / points.length;
        
    //     // => targetstore
    //     TargetStore.update(store => {
    //         const group = store.groups.find(g => g.id === groupId);
    //         if (group) {
    //             group.metrics = group.metrics || {};
    //             group.metrics.meanradius = {
    //                 px: ccrRadiusInPixels,
    //                 mm: TargetStore.pxToMm(ccrRadiusInPixels)
    //             };
    //         }
    //         return store;
    //     });
        
    //     const graphics = new Graphics();
    //     graphics.clear();
    //     graphics.circle(0, 0, radius);
    //     graphics.position.set(center.x, center.y)
    //     graphics.stroke({
    //         color: 0x0000FF,
    //         pixelLine: true,
    //         alpha: 0.5
    //     });
    //     graphics.eventMode = 'none';
    //     graphics.visible = this.userSettings.showccr;
    //     graphics.label = `ccr-${groupId}`;
        
    //     groupContainer.addChild(graphics);
    // }
    
    // private drawMPI(groupId: number): void {
    //     const group = TargetStore.getGroup(groupId);

    //     const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
    //     if (!groupContainer) {
    //         return;
    //     }

    //     const oldMpi = groupContainer.getChildByLabel(`mpi-${groupId}`);
    //     if (oldMpi) {
    //         groupContainer.removeChild(oldMpi);
    //     }

    //     if (!group || !group.shots || group.shots.length < 2) return;

    //     const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
    //     const mpi = {
    //         x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    //         y: points.reduce((sum, p) => sum + p.y, 0) / points.length
    //     };
    
    //     const mpiContainer = new Container();
    //     const cross = new Graphics()
    //         .moveTo(0, -5)
    //         .lineTo(0, 5)
    //         .moveTo(-5, 0)
    //         .lineTo(5, 0)
    //         .circle(0, 0, 3)
    //         .stroke({ 
    //             color: 0xFF00FF,
    //             pixelLine: true
    //         })
    //     cross.label = `mpi-group-${groupId}-gfx`;
        
    //     mpiContainer.addChild(cross);
        
    //     mpiContainer.position.set(mpi.x, mpi.y);
    //     mpiContainer.eventMode = 'none';
    //     mpiContainer.visible = this.userSettings.showmpi;
    //     mpiContainer.label = `mpi-${groupId}`;
    
        
    //     groupContainer.addChild(mpiContainer);
            
    //     // Debug
    //     // console.log('MPI added:', {
    //     //     position: `${mpi.x},${mpi.y}`,
    //     //     visible: mpiContainer.visible,
    //     //     parent: mpiContainer.parent?.label
    //     // });
    // }
    
    // private drawDiagonal(groupId: number): void {
    //     const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

    //     const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
    //     if (!groupContainer) {
    //         return;
    //     }

    //     const oldDiagonal: Container|null = groupContainer.getChildByLabel(`diagonal-${groupId}`);
    //     if (oldDiagonal) {
    //         groupContainer.removeChild(oldDiagonal);
    //     }

    //     if (!group || !group.shots || group.shots.length < 2) return;
        
    //     const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        
    //     // Calculate extremes
    //     const minX = Math.min(...points.map(p => p.x));
    //     const maxX = Math.max(...points.map(p => p.x));
    //     const minY = Math.min(...points.map(p => p.y));
    //     const maxY = Math.max(...points.map(p => p.y));
        
    //     const width = maxX - minX;   // X^
    //     const height = maxY - minY;  // Y^
        
    //     // Calculate Diagonal
    //     const diagonalPx = Math.sqrt(width * width + height * height);
    //     const diagonalMm = TargetStore.pxToMm(diagonalPx);
        
    //     // Calculate Figure of Merit (FoM)
    //     const fomPx = (width + height) / 2;
    //     const fomMm = TargetStore.pxToMm(fomPx);
        
    //     // Store measurements
    //     TargetStore.update(store => {
    //         const group = store.groups.find(g => g.id === groupId);
    //         if (group) {
    //             group.metrics = group.metrics || {};
    //             group.metrics.diagonal = {
    //                 px: diagonalPx,
    //                 mm: diagonalMm,
    //                 width: width,    // store extreme width
    //                 height: height,  // store extreme height
    //             };
    //             group.metrics.fom = {
    //                 px: fomPx,
    //                 mm: fomMm
    //             };
    //         }
    //         return store;
    //     });
        
    //     const strokeWidth = 2 * 1/this.targetContainer.scale.x;
    //     const graphics = new Graphics()
    //         .rect(minX, minY, width, height)   // FOM
    //         .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true})
    //         .moveTo(minX, minY)                // DIAGONAL
    //         .lineTo(maxX, maxY)
    //         .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true});
    //     graphics.eventMode = 'none';
    //     graphics.label = `diagonal-${groupId}`;
        
    //     groupContainer.addChild(graphics);
    // }

    // private drawExtremeSpread(groupId: number): void {
    //     const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

    //     const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
    //     if (!groupContainer) {
    //         return;
    //     }

    //     const oldEs: Container|null = groupContainer.getChildByLabel(`es-${groupId}`);
    //     if (oldEs) {
    //         groupContainer.removeChild(oldEs);
    //     }

    //     if (!group || !group.shots || group.shots.length < 2) return;
        
    //     const shots = group.shots;
    //     let maxDistance = 0;
    //     let point1 = shots[0];
    //     let point2 = shots[0];
    
    //     // Find the two most distant shots
    //     for (let i = 0; i < shots.length; i++) {
    //         for (let j = i + 1; j < shots.length; j++) {
    //             const distance = Math.sqrt(
    //                 Math.pow(shots[i].x - shots[j].x, 2) + 
    //                 Math.pow(shots[i].y - shots[j].y, 2)
    //             );
                
    //             if (distance > maxDistance) {
    //                 maxDistance = distance;
    //                 point1 = shots[i];
    //                 point2 = shots[j];
    //             }
    //         }
    //     }

    //     // => targetstore
    //     TargetStore.update(store => {
    //         const group = store.groups.find(g => g.id === groupId);
    //         if (group) {
    //             group.metrics = group.metrics || {};
    //             group.metrics.extremespread = {
    //                 px: maxDistance,
    //                 mm: TargetStore.pxToMm(maxDistance)
    //             };
    //         }
    //         return store;
    //     });
    
    //     const graphics = new Graphics();
    //     graphics.clear();
        
    //     graphics.moveTo(point1.x, point1.y);
    //     graphics.lineTo(point2.x, point2.y);
    //     const strokeWidth = 2 * 1/this.targetContainer.scale.x;
    //     graphics.stroke({pixelLine: true, color: 0x00FFFF});

    //     graphics.eventMode = 'none';
    //     graphics.label = `es-${groupId}`;
    
    //     graphics.visible = this.userSettings.showes;
    
    //     groupContainer.addChild(graphics);
    // }
    
    // public drawAllMetrics(group?: number): void 
    // {
    //     // console.log('Drawing all metrics', { group, groups: this.targetStore.groups });
    //     if (!group) {
    //         this.targetStore.groups.forEach((group) => {
    //             const groupId = group.id;
    //             this.drawMeanRadius(groupId);
    //             this.drawCoveringRadius(groupId);
    //             this.drawMPI(groupId);
    //             this.drawDiagonal(groupId);
    //             this.drawExtremeSpread(groupId);
    //         })
    //     } else {
    //         this.drawMeanRadius(group);
    //         this.drawCoveringRadius(group);
    //         this.drawMPI(group);
    //         this.drawDiagonal(group);
    //         this.drawExtremeSpread(group);
    //     }
    // }


    // public async addPoa(x: number, y: number, group: string): Promise<void>
    // {
    //     const label = `poa-${group}`;
    //     const poa = this.createPoaGraphic(label);
    //     const position = this.targetContainer.toLocal({x,y});

    //     let groupContainer: Container|null;
    //     let storeGroup: GroupInterface|undefined;
    //     let shots; // ShotInterface

    //     groupContainer = await this.getGroupContainer(group);
    //     if (!groupContainer) { 
    //         const newGroup = this.createGroup();

    //         if (!newGroup) {
    //             throw new Error(`Failed creating new group! group: ${group}`);
    //         }

    //         storeGroup = newGroup.group;
    //         groupContainer = newGroup.container;
    //     } else {
    //         storeGroup = this.targetStore.groups.find((g) => g.id === parseInt(group));
    //         if (!storeGroup) { console.error(`Tried to add shot to group ${group} in targetStore but no such group was found!`); return; }
    //     }

    //     poa.position.set(position.x, position.y)
    //     // poa.scale.set(this.setScale());

    //     groupContainer.addChild(poa);

    //     // add to group
    //     // const storeGroup: GroupInterface|undefined = this.targetStore.groups.find((g) => g.id === parseInt(group));
    //     // if (!storeGroup) { console.error(`Tried to add poa to group ${group} in targetStore but no such group was found!`); return; }

    //     storeGroup.poa = {x: position.x, y: position.y};
        
    //     poa.on('pointerdown', (e) => {
    //         e.stopPropagation();
    //         this.handleSpriteDrag(e);
    //     });
    // }

    // public setScale(scale: number = 1)
    // {
    //     return scale / this.targetContainer.scale.x;
    // }

    // public createGroup(): {group: GroupInterface, container: Container} | null
    // {
    //     const newGroup: GroupInterface | undefined = this.createNewTargetStoreGroup();
    //     if (!newGroup) {
    //         console.error('Newgroup was null!');
    //         return null;
    //     } 
        
    //     // console.log('newGroup:', newGroup);
        
    //     const groupContainer = this.createNewGroupContainer(newGroup.id)
    //     if (groupContainer === null) { console.error(`Failed to createNewGroupContainer`); return null; };

    //     // console.log('created group:', newGroup, groupContainer);
    //     return {group: newGroup, container: groupContainer};
    // }

    // public createNewTargetStoreGroup(): GroupInterface | undefined
    // {
    //     const newGroup: GroupInterface = {
    //         id: this.targetStore.groups.length + 1,
    //         shots: [],
    //         poa: {x: 0, y: 0},
    //         metrics: {},
    //         score: 0,
    //     };

    //     try {
    //         this.targetStore.groups.push(newGroup);
    //         const createdGroup = this.targetStore.groups[this.targetStore.groups.length - 1];
    //         // console.log(`Created new group:`, createdGroup);
    //         return createdGroup;
    //     } catch (e) {
    //         // TODO: Logging.
    //         throw new Error(`Failed to push new group to store!`);
    //     }
    // }
    // public createNewGroupContainer(id: number): Container | null
    // {
    //     try {
    //         let groupContainer = new Container();
    //         groupContainer.label = id.toString();

    //         // console.log(`Creating group: ${groupContainer.label} ${groupContainer.uid}`);
    //         this.targetContainer.addChild(groupContainer);

    //         return groupContainer
    //     } catch (e) {
    //         // TODO: Logging.
    //         console.error(`Failed to create new group!`, e);
    //         return null;
    //     }
    // }
    // public removeGroup(id: string): void|undefined
    // {
    //     if (this.targetStore.groups.length === 1) {
    //         console.warn(`Tried to remove the one group that exists. Exiting.`);
    //         return;
    //     }

    //     let group = this.targetStore.groups.findIndex((g) => g.id === parseInt(id));
    //     if (group === -1) {
    //         console.error(`No such group (${id}) in targetStore.`);
    //         return;
    //     }

    //     let container = this.targetContainer.getChildByLabel(id);
    //     if (!container) {
    //         console.error(`No such groupContainer (${id}) in targetContainer.`);
    //         return;
    //     }

    //     container.removeChildren();
    //     this.targetContainer.removeChild(container);
    //     this.targetStore.groups.splice(group, 1);
    //     this.targetStore.activeGroup = this.targetStore.groups.length;

    //      // console.log(`ActiveGroup is now ${this.targetStore.activeGroup}.`);
    // }

    // public get getCurrentGroupContainer(): Container
    // {
    //     let storedCurrentGroup = this.targetStore.activeGroup;
    //     const currentGroupContainer = this.targetContainer.getChildByLabel(storedCurrentGroup.toString());

    //     if (!currentGroupContainer) throw new Error(`Tried to get currentGroup but no currentgroup existed in targetContainer!`);

    //     return currentGroupContainer;
    // }

    // private createShotGraphic(label: string): Container
    // {
    //     const shot = new Container();
        
    //     const width = 48;
    //     const height = 48;
    //     const radius = width / 2;

    //     const circle = new Graphics()
    //         .circle(0, 0, radius)
    //         .moveTo(0, -24)
    //         .lineTo(0, -34)
    //         .moveTo(0, 24)
    //         .lineTo(0, 34)
    //         .moveTo(-24, 0)
    //         .lineTo(-34, 0)
    //         .moveTo(24, 0)
    //         .lineTo(34, 0)
    //         .stroke({ color: 0x000000, pixelLine: true })
    //         .fill({color:0xFFFFFF, alpha: 0.25});    // fill so we can drag anywhere in the circle
    //     circle.label = `${label}-graphics`;

    //     shot.addChild(circle);
        
    //     shot.label = label;
    //     shot.eventMode = 'dynamic';
    //     shot.cursor = 'pointer';
    //     shot.interactive = true;
        
    //     shot.pivot.set(0, 0);

    //     return shot;
    // }

    // private createPoaGraphic(label: string): Container
    // {
    //     const poa = new Container();
    //     poa.setSize(30);
        
    //     const radius = 15;
    //     const lineLength = 5;

    //     const circle = new Graphics()
    //         .circle(0, 0, radius)
    //         .circle(0, 0, radius - lineLength)
    //         .moveTo(0, -radius)
    //         .lineTo(0, -radius - lineLength)
    //         .moveTo(0, radius)
    //         .lineTo(0, radius + lineLength)
    //         .moveTo(-radius, 0)
    //         .lineTo(-radius - lineLength, 0)
    //         .moveTo(radius, 0)
    //         .lineTo(radius + lineLength, 0)
    //         .stroke({ color: 0x000000, pixelLine: true })
    //         .fill({color:0x000000, alpha: 0});    // fill so we can drag anywhere in the circle
    //     circle.setSize(36);
    //     circle.label = `${label}-graphics`;

    //     poa.addChild(circle);
        
    //     poa.label = label;
    //     poa.eventMode = 'dynamic';
    //     poa.cursor = 'pointer';
    //     poa.interactive = true;
        
    //     poa.pivot.set(0, 0);
        

    //     return poa;
    // }

    // private async getGroupContainer(label: string): Promise<Container|null>
    // {
    //     return this.targetContainer.getChildByLabel(label);
    // }

    private get getShotsTotal(): number
    {
        return this.targetContainer.getChildrenByLabel(/^shot-/i, true).length || 0;
    }

    // private handleSpriteDrag(e: FederatedPointerEvent): void
    // {
    //     const target = e.currentTarget as Sprite;
    //     this.isDragging = true;
    //     this.dragTarget = target;
    //     this.dragStartPosition = { x: target.x, y: target.y};

    //     console.log(`Dragging ${target.label}`)

    //     this.targetContainer.eventMode = 'dynamic';
    //     this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
    //     this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
    //     this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    // }

    // private handleDragMove(e: FederatedPointerEvent): void
    // {
    //     if (!this.isDragging || !this.dragTarget) return;

    //     const newPosition = this.targetContainer.toLocal(e.global);
    //     this.dragTarget.x = newPosition.x;
    //     this.dragTarget.y = newPosition.y;

    //     console.log(`Finished dragging ${this.dragTarget.label}`);
    // }

    // private handleDragEnd(e: FederatedPointerEvent): void
    // {
    //     if (!this.isDragging || !this.dragTarget) return;

    //     let id;
    //     if (this.dragTarget.label.startsWith('shot')) {
    //         const match = this.dragTarget.label.match(/^shot-(\d+)-(\d+)$/i);
    //         if (!match) { 
    //             console.error(`dragTarget label => id failed!`); 
    //             return; 
    //         }
            
    //         // Get the actual shot ID from the label
    //         id = match[1];
    //         const groupId = parseInt(match[2]);

    //         console.log(`handleDragEnd`, `shotId: ${id}` );
    //         TargetStore.updateShot(id, groupId, this.dragTarget.x, this.dragTarget.y);
    //     } else if (this.dragTarget.label.startsWith('poa')) {
    //         id = this.dragTarget.label.match(/^poa-(\d+)$/i)?.[1];
    //         if (!id) { console.error(`dragTarget label => id failed!`); return; }
    //         TargetStore.updatePoa(parseInt(id), this.dragTarget.x, this.dragTarget.y)
    //     }

    //     this.isDragging = false;
    //     this.dragTarget = null;
    //     this.dragStartPosition = null;

    //     this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
    //     this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
    //     this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));

    //     this.metricsRenderer.drawAllMetrics();
    // }

    // public assignSelectedShotsToGroup(value: string): void
    // {
    //     const shots = this.editorStore.selected;
    //     let group: GroupInterface|undefined;
    //     let container: Container|null;

    //     if (value === 'createNew') {
    //         const res = this.createGroup();
    //         if (res && res.group && res.container) {
    //             group = res.group;
    //             container = res.container;
    //         } else {
    //             throw new Error(`this.createGroup() caused an error!`)
    //         }
    //     } else {
    //         group = this.targetStore.groups.find((g) => g.id === parseInt(value));
    //         container = this.targetContainer.getChildByLabel(value);

    //         if (!group) {
    //             throw new Error(`No group found with id: ${value}`);
    //         }
    //         if (!container) {
    //             throw new Error(`No container found with the label ${value}`);
    //         }
    //     }
            
    //     shots.forEach((shot) => {
    //         // update targetStore
    //         const ids = shot.label.match(/shot-(\d+)-(\d+)/i);
    //         if (!ids[1]) { console.error(`Found no shotID in label ${shot.label}!`); return; }
    //         if (!ids[2]) { console.error(`Found no groupID in label ${shot.label}!`); return; }
    //         TargetStore.setShot(ids[1], group.id, shot.x, shot.y, 0);
    //         TargetStore.removeShot(ids[2], ids[1]);
            
    //         // update label
    //         shot.label = `shot-${group.shots?.length}-${group.id}`;
    //         // add to new container
    //         container.addChild(shot);
    //         // remove from old container
    //         const oldContainer = this.targetContainer.getChildByLabel(ids[2]);
    //         if (!oldContainer) { console.error(`No container labelled ${ids[2]}!`); return; }
    //         oldContainer.removeChild(shot);
    //     });
    // }

    // public removeShot(e: FederatedPointerEvent): void
    // {
    //     const ids = [...e.target.label.matchAll(/^shot-(\d+)-(\d+)$/g)];
    //     if (ids) {
    //         let shotid = ids[0][1];
    //         let groupid = parseInt(ids[0][2]);
            
    //         // Remove shot from store
    //         TargetStore.removeShot(groupid, shotid);
            
    //         // Remove sprite from container
    //         const groupContainer = this.targetContainer.getChildByLabel(ids[0][2]);
    //         if (groupContainer) {
    //             const sprite = groupContainer.getChildByLabel(e.target.label);
    //             if (sprite) {
    //                 groupContainer.removeChild(sprite);
    //             } else {
    //                 throw new Error(`No such sprite (${e.target.label})`);
    //             }
                
    //             // Get the updated shots from the store
    //             const updatedGroup = TargetStore.getGroup(groupid);
    //             if (updatedGroup && updatedGroup.shots) {
    //                 // Get all shot sprites in this group
    //                 const shotSprites = groupContainer.children.filter(child => 
    //                     child.label && child.label.startsWith('shot-'));
                    
    //                 // Relabel shots to match their new indices AND IDs
    //                 for (let i = 0; i < shotSprites.length; i++) {
    //                     // Get the corresponding shot from the store
    //                     const storeShot = updatedGroup.shots[i];
    //                     if (storeShot) {
    //                         // Update the label to use the store shot ID
    //                         shotSprites[i].label = `shot-${storeShot.id}-${groupid}`;
    //                     }
    //                 }
    //             }
                
    //             this.metricsRenderer.drawAllMetrics(groupid);
                
    //             console.debug(`Removed shot ${shotid}`);
    //             console.debug(`shots:`, {
    //                 groupContainer: this.getAllChildren(groupContainer),
    //                 groupstore: this.getGroupStoreShots(groupid)
    //             });
    //         } else {
    //             throw new Error(`No such groupcontainer (${ids[0][2]})`);
    //         }
    //     }
    // }

    // private getAllChildren(container: Container)
    // {
    //     let labels: string[] = []
    //     container.children.forEach((child) => {
    //         if (child.label.startsWith('shot')) {
    //             labels.push(child.label);
    //         }
    //     });
    //     return labels;
    // }

    // private getGroupStoreShots(id: number)
    // {
    //     let ids: string[] = []
        
    //     const shots = TargetStore.getShots(id);
    //     if (!shots) { console.error(`No such group! (${id})`); return; }
        
    //     shots.forEach(shot => ids.push(shot.id.toString()))

    //     return ids;
    // }


    // private makeCircleFromTwoPoints(p1: {x: number, y: number}, 
    //                                 p2: {x: number, y: number}): {center: {x: number, y: number}, radius: number} 
    // {
    //     const center = {
    //         x: (p1.x + p2.x) / 2,
    //         y: (p1.y + p2.y) / 2
    //     };
        
    //     const radius = Math.sqrt(
    //         Math.pow(p1.x - center.x, 2) + 
    //         Math.pow(p1.y - center.y, 2)
    //     );

    //     return {center, radius};
    // }

    // private findMinCircle(points: Array<{x: number, y: number}>): {center: {x: number, y: number}, radius: number} {
    //     if (points.length === 0) return { center: {x: 0, y: 0}, radius: 0 };
    //     if (points.length === 1) return { center: points[0], radius: 0 };
    //     if (points.length === 2) return this.makeCircleFromTwoPoints(points[0], points[1]);
    
    //     // Find the two points furthest from each other
    //     let maxDist = 0;
    //     let point1 = points[0];
    //     let point2 = points[0];
    
    //     for (let i = 0; i < points.length; i++) {
    //         for (let j = i + 1; j < points.length; j++) {
    //             const dist = Math.sqrt(
    //                 Math.pow(points[i].x - points[j].x, 2) + 
    //                 Math.pow(points[i].y - points[j].y, 2)
    //             );
    //             if (dist > maxDist) {
    //                 maxDist = dist;
    //                 point1 = points[i];
    //                 point2 = points[j];
    //             }
    //         }
    //     }
    
    //     // Center is halfway between furthest points
    //     const center = {
    //         x: (point1.x + point2.x) / 2,
    //         y: (point1.y + point2.y) / 2
    //     };
    
    //     // Radius is half the distance between furthest points
    //     const radius = maxDist / 2;
    
    //     return { center, radius };
    // }
 
    public isReferenceSet(): boolean {
        return !!(
            this.targetStore.reference.measurement &&
            this.targetStore.reference.linelength &&
            this.targetStore.reference.a &&
            this.targetStore.reference.x
        );
    }  
}
