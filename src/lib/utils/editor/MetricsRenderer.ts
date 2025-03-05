// utils/editor/MetricsRenderer.ts

import { Container, Graphics } from "pixi.js";
import { type SettingsInterface, UserSettingsStore } from '@/stores/UserSettingsStore';
import { TargetStore, type TargetStoreInterface, type GroupInterface } from "@/stores/TargetImageStore";
import { Geometry } from '../geometry';
import { get } from "svelte/store";

export class MetricsRenderer {
    private targetContainer: Container;
    private userSettings: SettingsInterface;
    private userSettingsUnsubscribe: () => void;
    private geometry: Geometry;
    
    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.userSettings = get(UserSettingsStore);
        this.geometry = new Geometry();
      
        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
            // console.log('Settings updated:', settings);
            this.userSettings = settings;
            this.drawAllMetrics();
        });
    }

    public destroy() {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
    }
    
    public drawAllMetrics(group?: number): void {
        if (!group) {
            get(TargetStore).groups.forEach(group => {
                this.drawGroupMetrics(group.id);
            });
        } else {
            this.drawGroupMetrics(group);
        }
    }
    
    private drawGroupMetrics(groupId: number): void {
        this.drawMeanRadius(groupId);
        this.drawCoveringRadius(groupId);
        this.drawMPI(groupId);
        this.drawDiagonal(groupId);
        this.drawExtremeSpread(groupId);
    }
    
    private drawMeanRadius(groupId: number): void 
    {
        const currentStore: TargetStoreInterface = get(TargetStore);
        
        const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

        const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return;
        }

        const oldMr = groupContainer.getChildByLabel(`mr-${groupId}`);
        if (oldMr) {
            groupContainer.removeChild(oldMr);
        }
        
        if (!group || 
            !group.shots || 
            group.shots.length < 2 || 
            !currentStore.reference.measurement || 
            !currentStore.reference.linelength
        ) {
            // console.log('Early return conditions:', {
            //     noGroup: !group,
            //     noShots: !group?.shots,
            //     notEnoughShots: group?.shots?.length ? group.shots.length < 2 : '',
            //     noRefMeasurement: !currentStore.reference.measurement,
            //     refMeasurement: currentStore.reference.measurement,
            //     noRefLineLength: !currentStore.reference.linelength,
            //     refLineLength: currentStore.reference.linelength,
            // });
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
    
        // console.log('Calculated values:', {
        //     points,
        //     meanCenter,
        //     meanRadius,
        //     showmr: this.userSettings.showmr
        // });
    
        const graphics = new Graphics();
        graphics.clear();
        graphics.circle(0, 0, meanRadius);
        graphics.stroke({
            color: 0xFF0000,
            alpha: 0.5,
            pixelLine: true
        });
        
        graphics.position.set(meanCenter.x, meanCenter.y);
        graphics.eventMode = 'none';
        graphics.visible = this.userSettings.showmr;
        graphics.label = `mr-${groupId}`;
    
        // console.log('Group container:', groupContainer);
        
        groupContainer.addChild(graphics);
    }
    
    private drawCoveringRadius(groupId: number): void 
    {
        const group = TargetStore.getGroup(groupId);
        
        // Get the group container first
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return; // Exit if no container exists
        }
        
        // Always remove the old circle if it exists
        const oldCircle = groupContainer.getChildByLabel(`ccr-${groupId}`);
        if (oldCircle) {
            groupContainer.removeChild(oldCircle);
        }
        
        // Only proceed with drawing if we have enough shots
        if (!group || !group.shots || group.shots.length < 2) {
            return; // Exit without drawing
        }
        
        // The rest of the function remains the same
        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        const {center, radius} = this.geometry.findMinCircle(points);

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
        graphics.circle(0, 0, radius);
        graphics.position.set(center.x, center.y)
        graphics.stroke({
            color: 0x0000FF,
            pixelLine: true,
            alpha: 0.5
        });
        graphics.eventMode = 'none';
        graphics.visible = this.userSettings.showccr;
        graphics.label = `ccr-${groupId}`;
        
        groupContainer.addChild(graphics);
    }

    private drawMPI(groupId: number): void {
        const group = TargetStore.getGroup(groupId);

        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return;
        }

        const oldMpi = groupContainer.getChildByLabel(`mpi-${groupId}`);
        if (oldMpi) {
            groupContainer.removeChild(oldMpi);
        }

        if (!group || !group.shots || group.shots.length < 2) return;

        const points = group.shots.map(shot => ({x: shot.x, y: shot.y}));
        const mpi = {
            x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
            y: points.reduce((sum, p) => sum + p.y, 0) / points.length
        };
    
        const mpiContainer = new Container();
        const mpiGfx = new Graphics({
            label: `mpi-group-${groupId}-gfx`,
        })
            .circle(0, 0, 3)
            .stroke({ 
                color: 0xFF00FF,
                pixelLine: true,
                alpha: 0.9,
            })
            .fill({
                color: 0xFF00FF,
                alpha: 0.75,
            });
        
        mpiContainer.addChild(mpiGfx);
        
        mpiContainer.position.set(mpi.x, mpi.y);
        mpiContainer.eventMode = 'none';
        mpiContainer.visible = this.userSettings.showmpi;
        mpiContainer.label = `mpi-${groupId}`;
    
        
        groupContainer.addChild(mpiContainer);
            
        // Debug
        // console.log('MPI added:', {
        //     position: `${mpi.x},${mpi.y}`,
        //     visible: mpiContainer.visible,
        //     parent: mpiContainer.parent?.label
        // });
    }
    
    private drawDiagonal(groupId: number): void {
        const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

        const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return;
        }

        const oldDiagonal: Container|null = groupContainer.getChildByLabel(`diagonal-${groupId}`);
        if (oldDiagonal) {
            groupContainer.removeChild(oldDiagonal);
        }

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
        
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
        const graphics = new Graphics()
            .rect(minX, minY, width, height)   // FOM
            .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true})
            .moveTo(minX, minY)                // DIAGONAL
            .lineTo(maxX, maxY)
            .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true});
        graphics.eventMode = 'none';
        graphics.label = `diagonal-${groupId}`;
        
        groupContainer.addChild(graphics);
    }

    private drawExtremeSpread(groupId: number): void {
        const group: GroupInterface|undefined = TargetStore.getGroup(groupId);

        const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return;
        }

        const oldEs: Container|null = groupContainer.getChildByLabel(`es-${groupId}`);
        if (oldEs) {
            groupContainer.removeChild(oldEs);
        }

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
        graphics.stroke({pixelLine: true, color: 0x00FFFF});

        graphics.eventMode = 'none';
        graphics.label = `es-${groupId}`;
    
        graphics.visible = this.userSettings.showes;
    
        groupContainer.addChild(graphics);
    }
}