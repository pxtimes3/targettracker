// TODO: PlaceShotPoaTool.ts - Refactor

// src/lib/utils/editor/placeshotpoatool.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type ShotInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import type { FederatedPointerEvent } from 'pixi.js';
import { Assets, Container, Sprite, Graphics, Circle, Text } from 'pixi.js';
import { get } from 'svelte/store';

export class ShotPoaTool {
    private targetContainer: Container;
    private editorStore: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private userSettings: SettingsInterface;
    private texturePath: string;
    private isDragging: boolean = false;
    private dragTarget: Sprite | null = null;
    private dragStartPosition: {x: number, y: number} | null = null;
    private isSelected: boolean = false;
    private userSettingsUnsubscribe: () => void;

    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);
        this.texturePath = '/cursors/shot.svg';

        type Point = {x: number, y: number};

        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
            console.log('Settings updated:', settings);
            this.userSettings = settings;
            this.drawAllMetrics();
        });
    }

    public destroy() {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
    }

    public async addShot(x: number, y: number, group: string): Promise<void>
    {
        console.log(`addShot called: x:${x}, y:${y}, group:${group}`);

        const label = `shot-${this.getShotsTotal + 1}-${group}`;
        const shot = await this.createSprite(label);
        const position = this.targetContainer.toLocal({x,y});

        let groupContainer: Container|null;
        let storeGroup: GroupInterface|undefined;
        let shots; // ShotInterface

        groupContainer = await this.getGroupContainer(group);
        if (!groupContainer) { 
            const newGroup = this.createGroup();

            if (!newGroup) {
                throw new Error(`Failed creating new group! group: ${group}`);
            }

            storeGroup = newGroup.group;
            groupContainer = newGroup.container;
        } else {
            storeGroup = this.targetStore.groups.find((g) => g.id === parseInt(group));
            if (!storeGroup) { console.error(`Tried to add shot to group ${group} in targetStore but no such group was found!`); return; }
        }

        shots = storeGroup.shots
        if (!shots) { console.error(`No shots array found in store-group ${group}!`, storeGroup); return; }

        shot.position.set(position.x, position.y);
        shot.scale.set(this.setScale());
        shot.width = 48;
        shot.zIndex = 99;

        shot.height = shot.width;

        groupContainer?.addChild(shot);

        const newShot = {
            id: this.getShotsTotal.toString(),
            group: parseInt(group),
            x: position.x,
            y: position.y,
            score: 0,
        };

        TargetStore.addShot(newShot, parseInt(group));

        this.drawAllMetrics(parseInt(group))

        shot.on('pointerdown', (e) => {
            e.stopPropagation();
            if (e.button === 1) { this.removeShot(e) }
            if (e.button === 0) { this.handleSpriteDrag(e); }
        });
    }

    private drawMeanRadius(groupId: number): void {
        const group = TargetStore.getGroup(groupId);
        console.log('Drawing MR, group:', group);
        if (!group || !group.shots || group.shots.length < 2 || !this.targetStore.reference.measurement || !this.targetStore.reference.linelength) {
            console.log('Early return conditions:', {
                noGroup: !group,
                noShots: !group?.shots,
                notEnoughShots: group?.shots?.length ? group.shots.length < 2 : '',
                noRefMeasurement: !this.targetStore.reference.measurement,
                noRefLineLength: !this.targetStore.reference.linelength
            });
            return;
        }
        
        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        const meanCenter = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
    
        const meanRadius = points.reduce((sum, p) => 
            sum + Math.sqrt(
                Math.pow(p.x - meanCenter.x, 2) + 
                Math.pow(p.y - meanCenter.y, 2)
            ), 0) / points.length;
    
        console.log('Calculated values:', {
            points,
            meanCenter,
            meanRadius,
            showmr: this.userSettings.showmr
        });
    
        // Draw graphics
        const graphics = new Graphics();
        graphics.clear();

        graphics.circle(0, 0, meanRadius);
        // Draw circle
        graphics.stroke({
            width: 2 * 1/this.targetContainer.scale.x,
            color: 0xFF0000,
            alpha: 0.5
        });
        
        // Position after drawing
        graphics.position.set(meanCenter.x, meanCenter.y);
        graphics.eventMode = 'none';
        graphics.visible = this.userSettings.showmr;
        graphics.label = `mr-${groupId}`;
    
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        console.log('Group container:', groupContainer);
        
        if (groupContainer) {
            const oldCircle = groupContainer.getChildByLabel(`mr-${groupId}`);
            if (oldCircle) {
                console.log('Removing old circle');
                groupContainer.removeChild(oldCircle);
            }
            groupContainer.addChild(graphics);
            console.log('Added new circle');
        }
    }
    
    private drawCoveringRadius(groupId: number): void 
    {
        const group = TargetStore.getGroup(groupId);
        if (!group || !group.shots || group.shots.length < 2) return;
        
        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        const {center, radius} = this.findMinCircle(points);

        const ccrRadiusInPixels = points.reduce((sum, p) => 
            sum + Math.sqrt(
                Math.pow(p.x - center.x, 2) + 
                Math.pow(p.y - center.y, 2)
            ), 0) / points.length;
        
        // => targetstore
        TargetStore.update(store => {
            const group = store.groups.find(g => g.id === groupId);
            if (group) {
                group.metrics = group.metrics || {};
                group.metrics.meanradius = {
                    px: ccrRadiusInPixels,
                    mm: TargetStore.pxToMm(ccrRadiusInPixels)
                };
            }
            return store;
        });
        
        const graphics = new Graphics();
        graphics.clear();
        graphics.scale.set(this.setScale());
        graphics.circle(0, 0, radius * 1/this.setScale());
        graphics.position.set(center.x, center.y)
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
        graphics.stroke({width: strokeWidth, color: 0x0000ff, alpha: 0.5});
        graphics.eventMode = 'none';

        graphics.visible = this.userSettings.showccr;
        

        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (groupContainer) {
            const oldCircle = groupContainer.getChildByLabel(`ccr-${groupId}`);
            if (oldCircle) groupContainer.removeChild(oldCircle);
            graphics.label = `ccr-${groupId}`;
            groupContainer.addChild(graphics);

            console.log(`CCR. center: ${center.x},${center.y} radii: ${radius}`);
        }
    }
    
    private drawMPI(groupId: number): void 
    {
        const group = TargetStore.getGroup(groupId);
        if (!group || !group.shots || group.shots.length < 2) return;
        
        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        const mpi = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
    
        const graphics = new Graphics();
        graphics.clear();
        
        const sz  = 10;
        const w   = 2;
        const off = (sz / 2) - (w / 2);

        graphics.scale.set(this.setScale());
        graphics
            .rect(0 - off, 0, sz, w).fill({color: 0xFF00FF})
            .rect(0, 0 - off, w, sz).fill({color: 0xFF00FF});
        graphics.position.set(mpi.x, mpi.y);
        graphics.eventMode = 'none';

        graphics.visible = this.userSettings.showmpi;

        graphics.label = `mpi-${groupId}`;

        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (groupContainer) {
            const oldMPI = groupContainer.getChildByLabel(`mpi-${groupId}`);
            if (oldMPI) groupContainer.removeChild(oldMPI);
            groupContainer.addChild(graphics);
        }
    }
    
    private drawDiagonal(groupId: number): void {
        const group = TargetStore.getGroup(groupId);
        if (!group || !group.shots || group.shots.length < 2) return;
        
        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        
        // Calculate extremes
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));
        
        const width = maxX - minX;   // X^
        const height = maxY - minY;  // Y^
        
        // Calculate Diagonal
        const diagonalPx = Math.sqrt(width * width + height * height);
        const diagonalMm = TargetStore.pxToMm(diagonalPx);
        
        // Calculate Figure of Merit (FoM)
        const fomPx = (width + height) / 2;
        const fomMm = TargetStore.pxToMm(fomPx);
        
        // Store measurements
        TargetStore.update(store => {
            const group = store.groups.find(g => g.id === groupId);
            if (group) {
                group.metrics = group.metrics || {};
                group.metrics.diagonal = {
                    px: diagonalPx,
                    mm: diagonalMm,
                    width: width,    // store extreme width
                    height: height,  // store extreme height
                };
                group.metrics.fom = {
                    px: fomPx,
                    mm: fomMm
                };
            }
            return store;
        });
        
        // Draw graphics
        const graphics = new Graphics();
        graphics.clear();
        
        // Scale the graphics inversely to maintain constant line width
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
    
        // Draw rectangle
        graphics.rect(minX, minY, width, height);
        graphics.stroke({width: strokeWidth, color: 0x00FF00});
        
        // Draw diagonal
        graphics.moveTo(minX, minY);
        graphics.lineTo(maxX, maxY);
        graphics.stroke({width: strokeWidth, color: 0x00FF00});
        
        // Add labels if needed
        const diagonalLabel = new Text({
            text: `D: ${diagonalMm.toFixed(1)}mm`,
            style: {
                fontSize: 12 * 1/this.targetContainer.scale.x,
                fill: 0x00FF00
            }
        });
        diagonalLabel.position.set(maxX + 5, maxY);
        
        const fomLabel = new Text({
            text: `FoM: ${fomMm.toFixed(1)}mm`,
            style: {
                fontSize: 12 * 1/this.targetContainer.scale.x,
                fill: 0x00FF00
            }
        });
        fomLabel.position.set(maxX + 5, maxY + 15 * 1/this.targetContainer.scale.x);
        
        graphics.addChild(diagonalLabel);
        graphics.addChild(fomLabel);
        graphics.eventMode = 'none';
        graphics.label = `diagonal-${groupId}`;
        
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (groupContainer) {
            const oldDiagonal = groupContainer.getChildByLabel(`diagonal-${groupId}`);
            if (oldDiagonal) groupContainer.removeChild(oldDiagonal);
            groupContainer.addChild(graphics);
        }
    }

    private drawExtremeSpread(groupId: number): void {
        const group = TargetStore.getGroup(groupId);
        if (!group || !group.shots || group.shots.length < 2) return;
        
        const shots = group.shots;
        let maxDistance = 0;
        let point1 = shots[0];
        let point2 = shots[0];
    
        // Find the two most distant shots
        for (let i = 0; i < shots.length; i++) {
            for (let j = i + 1; j < shots.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(shots[i].x - shots[j].x, 2) + 
                    Math.pow(shots[i].y - shots[j].y, 2)
                );
                
                if (distance > maxDistance) {
                    maxDistance = distance;
                    point1 = shots[i];
                    point2 = shots[j];
                }
            }
        }

        // => targetstore
        TargetStore.update(store => {
            const group = store.groups.find(g => g.id === groupId);
            if (group) {
                group.metrics = group.metrics || {};
                group.metrics.extremespread = {
                    px: maxDistance,
                    mm: TargetStore.pxToMm(maxDistance)
                };
            }
            return store;
        });
    
        const graphics = new Graphics();
        graphics.clear();
        
        graphics.moveTo(point1.x, point1.y);
        graphics.lineTo(point2.x, point2.y);
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
        graphics.stroke({width: strokeWidth, color: 0x00FFFF});

        graphics.eventMode = 'none';
        graphics.label = `es-${groupId}`;
    
        graphics.visible = this.userSettings.showes;
    
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (groupContainer) {
            const oldES = groupContainer.getChildByLabel(`es-${groupId}`);
            if (oldES) groupContainer.removeChild(oldES);
            groupContainer.addChild(graphics);
        }
    }
    
    public drawAllMetrics(group?: number): void 
    {
        console.log('Drawing all metrics', { group, groups: this.targetStore.groups });
        if (!group) {
            this.targetStore.groups.forEach((group) => {
                const groupId = group.id;
                this.drawMeanRadius(groupId);
                this.drawCoveringRadius(groupId);
                this.drawMPI(groupId);
                this.drawDiagonal(groupId);
                this.drawExtremeSpread(groupId);
            })
        } else {
            this.drawMeanRadius(group);
            this.drawCoveringRadius(group);
            this.drawMPI(group);
            this.drawDiagonal(group);
            this.drawExtremeSpread(group);
        }
    }


    public async addPoa(x: number, y: number, group: string): Promise<void>
    {
        const label = `poa-${group}`;
        const poa = await this.createSprite(label, '/cursors/poa.svg');
        const groupContainer = await this.getGroupContainer(group);
        const position = this.targetContainer.toLocal({x,y});

        poa.position.set(position.x, position.y)
        poa.scale.set(this.setScale());
        poa.width = 48;
        poa.height = poa.width;

        groupContainer?.addChild(poa);

        // add to group
        const storeGroup: GroupInterface|undefined = this.targetStore.groups.find((g) => g.id === parseInt(group));
        if (!storeGroup) { console.error(`Tried to add poa to group ${group} in targetStore but no such group was found!`); return; }

        storeGroup.poa = {x: position.x, y: position.y};
        
        poa.on('pointerdown', (e) => {
            e.stopPropagation();
            this.handleSpriteDrag(e);
        });
    }

    public setScale(scale: number = 1)
    {
        return scale / this.targetContainer.scale.x;
    }

    public createGroup(): {group: GroupInterface, container: Container} | null
    {
        const newGroup: GroupInterface | undefined = this.createNewTargetStoreGroup();
        if (!newGroup) {
            console.error('Newgroup was null!');
            return null;
        } 
        
        // console.log('newGroup:', newGroup);
        
        const groupContainer = this.createNewGroupContainer(newGroup.id)
        if (groupContainer === null) { console.error(`Failed to createNewGroupContainer`); return null; };

        // console.log('created group:', newGroup, groupContainer);
        return {group: newGroup, container: groupContainer};
    }

    public createNewTargetStoreGroup(): GroupInterface | undefined
    {
        const newGroup: GroupInterface = {
            id: this.targetStore.groups.length + 1,
            shots: [],
            poa: {x: 0, y: 0},
            metrics: {},
            score: 0,
        };

        try {
            this.targetStore.groups.push(newGroup);
            const createdGroup = this.targetStore.groups[this.targetStore.groups.length - 1];
            // console.log(`Created new group:`, createdGroup);
            return createdGroup;
        } catch (e) {
            // TODO: Logging.
            throw new Error(`Failed to push new group to store!`);
        }
    }

    public createNewGroupContainer(id: number): Container | null
    {
        try {
            let groupContainer = new Container();
            groupContainer.label = id.toString();

            // console.log(`Creating group: ${groupContainer.label} ${groupContainer.uid}`);
            this.targetContainer.addChild(groupContainer);

            return groupContainer
        } catch (e) {
            // TODO: Logging.
            console.error(`Failed to create new group!`, e);
            return null;
        }
    }

    public removeGroup(id: string): void|undefined
    {
        if (this.targetStore.groups.length === 1) {
            console.warn(`Tried to remove the one group that exists. Exiting.`);
            return;
        }

        let group = this.targetStore.groups.findIndex((g) => g.id === parseInt(id));
        if (group === -1) {
            console.error(`No such group (${id}) in targetStore.`);
            return;
        }

        let container = this.targetContainer.getChildByLabel(id);
        if (!container) {
            console.error(`No such groupContainer (${id}) in targetContainer.`);
            return;
        }

        container.removeChildren();
        this.targetContainer.removeChild(container);
        this.targetStore.groups.splice(group, 1);
        this.targetStore.activeGroup = this.targetStore.groups.length;

        console.log(`ActiveGroup is now ${this.targetStore.activeGroup}.`);
    }

    public get getCurrentGroupContainer(): Container
    {
        let storedCurrentGroup = this.targetStore.activeGroup;
        const currentGroupContainer = this.targetContainer.getChildByLabel(storedCurrentGroup.toString());

        if (!currentGroupContainer) throw new Error(`Tried to get currentGroup but no currentgroup existed in targetContainer!`);

        return currentGroupContainer;
    }

    private async createSprite(
        label: string,
        texturePath: string = this.texturePath,
    ): Promise<Sprite>
    {
        const texture = await Assets.load(texturePath);
        const sprite = new Sprite(texture);

        sprite.label = label;
        sprite.eventMode = 'dynamic';
        sprite.cursor = 'pointer';
        sprite.interactive = true;
        sprite.anchor.set(0.5);
        // sprite.scale.set(1 / this.targetContainer.scale.x);

        return sprite;
    }

    private async getGroupContainer(label: string): Promise<Container|null>
    {
        return this.targetContainer.getChildByLabel(label);
    }

    private get getShotsTotal(): number
    {
        return this.targetContainer.getChildrenByLabel(/^shot-/i, true).length || 0;
    }

    private handleSpriteDrag(e: FederatedPointerEvent): void
    {
        const target = e.currentTarget as Sprite;
        this.isDragging = true;
        this.dragTarget = target;
        this.dragStartPosition = { x: target.x, y: target.y};

        // console.log(`Dragging ${target.label}`)

        this.targetContainer.eventMode = 'dynamic';
        this.targetContainer.on('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.on('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    }

    private handleDragMove(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        const newPosition = this.targetContainer.toLocal(e.global);
        this.dragTarget.x = newPosition.x;
        this.dragTarget.y = newPosition.y;
    }

    private handleDragEnd(e: FederatedPointerEvent): void
    {
        if (!this.isDragging || !this.dragTarget) return;

        let id;
        if (this.dragTarget.label.startsWith('shot')) {
            id = this.dragTarget.label.match(/^shot-(\d+)-\d+$/i)?.[1];
            if (!id) { console.error(`dragTarget label => id failed!`); return; }
            console.log(get(TargetStore))
            TargetStore.updateShot(id, parseInt(this.dragTarget.parent.label), this.dragTarget.x, this.dragTarget.y);
        } else if (this.dragTarget.label.startsWith('poa')) {
            id = this.dragTarget.label.match(/^poa-(\d+)$/i)?.[1];
            console.log(`poagroup: ${id}`)
            if (!id) { console.error(`dragTarget label => id failed!`); return; }
            TargetStore.updatePoa(parseInt(id), this.dragTarget.x, this.dragTarget.y)
        }

        this.isDragging = false;
        this.dragTarget = null;
        this.dragStartPosition = null;

        this.targetContainer.off('pointermove', this.handleDragMove.bind(this));
        this.targetContainer.off('pointerup', this.handleDragEnd.bind(this));
        this.targetContainer.off('pointerupoutside', this.handleDragEnd.bind(this));

        this.drawAllMetrics();
    }

    public assignSelectedShotsToGroup(value: string): void
    {
        const shots = this.editorStore.selected;
        let group: GroupInterface|undefined;
        let container: Container|null;

        if (value === 'createNew') {
            const res = this.createGroup();
            if (res && res.group && res.container) {
                group = res.group;
                container = res.container;
            } else {
                throw new Error(`this.createGroup() caused an error!`)
            }
        } else {
            group = this.targetStore.groups.find((g) => g.id === parseInt(value));
            container = this.targetContainer.getChildByLabel(value);

            if (!group) {
                throw new Error(`No group found with id: ${value}`);
            }
            if (!container) {
                throw new Error(`No container found with the label ${value}`);
            }
        }
            
        shots.forEach((shot) => {
            // update targetStore
            const ids = shot.label.match(/shot-(\d+)-(\d+)/i);
            if (!ids[1]) { console.error(`Found no shotID in label ${shot.label}!`); return; }
            if (!ids[2]) { console.error(`Found no groupID in label ${shot.label}!`); return; }
            TargetStore.setShot(ids[1], group.id, shot.x, shot.y, 0);
            TargetStore.removeShot(ids[2], ids[1]);
            
            // update label
            shot.label = `shot-${group.shots?.length}-${group.id}`;
            // add to new container
            container.addChild(shot);
            // remove from old container
            const oldContainer = this.targetContainer.getChildByLabel(ids[2]);
            if (!oldContainer) { console.error(`No container labelled ${ids[2]}!`); return; }
            oldContainer.removeChild(shot);
        });
    }

    public removeShot(e: FederatedPointerEvent): void
    {
        const ids = [...e.target.label.matchAll(/^shot-(\d+)-(\d+)$/g)];
        if (ids) {
            console.log(e.target.label, ids)
            let shotid = ids[0][1];
            let groupid = parseInt(ids[0][2]);
            const res = TargetStore.removeShot(groupid, shotid);

            const groupContainer = this.targetContainer.getChildByLabel(ids[0][2]);
            
            if (groupContainer) {
                const sprite = groupContainer.getChildByLabel(e.target.label);
                console.log(sprite);
                if (sprite) {
                    groupContainer.removeChild(sprite);
                } else {
                    throw new Error(`No such sprite (${e.target.label})`);
                }
            } else {
                throw new Error(`No such groupcontainer (${ids[0][2]})`);
            }
        }
    }


    private makeCircleFromTwoPoints(p1: {x: number, y: number}, 
                                    p2: {x: number, y: number}): {center: {x: number, y: number}, radius: number} 
    {
        const center = {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
        
        const radius = Math.sqrt(
            Math.pow(p1.x - center.x, 2) + 
            Math.pow(p1.y - center.y, 2)
        );

        return {center, radius};
    }

    private addLabel(x: number, y: number, text: string, color: number): Text 
    {
        const label = new Text({
            text: `${text}`,
            style: {
                fontSize: 24,
                fill: color,
                stroke: 0xffffff,
                fontFamily: 'Arial'
            }
        });
        label.anchor.set(0, 0.5);
        label.position.set(x + 5, y);
        return label;
    }
    
    private findMinCircle(points: Array<{x: number, y: number}>): {center: {x: number, y: number}, radius: number} {
        if (points.length === 0) return { center: {x: 0, y: 0}, radius: 0 };
        if (points.length === 1) return { center: points[0], radius: 0 };
        if (points.length === 2) return this.makeCircleFromTwoPoints(points[0], points[1]);
    
        // Find the two points furthest from each other
        let maxDist = 0;
        let point1 = points[0];
        let point2 = points[0];
    
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dist = Math.sqrt(
                    Math.pow(points[i].x - points[j].x, 2) + 
                    Math.pow(points[i].y - points[j].y, 2)
                );
                if (dist > maxDist) {
                    maxDist = dist;
                    point1 = points[i];
                    point2 = points[j];
                }
            }
        }
    
        // Center is halfway between furthest points
        const center = {
            x: (point1.x + point2.x) / 2,
            y: (point1.y + point2.y) / 2
        };
    
        // Radius is half the distance between furthest points
        const radius = maxDist / 2;
    
        return { center, radius };
    }
 
    public isReferenceSet(): boolean {
    return !!(
        this.targetStore.reference.measurement &&
        this.targetStore.reference.linelength &&
        this.targetStore.reference.a &&
        this.targetStore.reference.x
    );
}
    private mmToPixels(mm: number): number {
        const ref = this.targetStore.reference;
        if (!ref.linelength || !ref.measurement) return 0;
        
        // value to mm if in inches
        const length = this.userSettings.isometrics 
            ? ref.measurement * 10
            : ref.measurement * 25.4;
        
        return (mm * ref.linelength) / length;
    }    
}
