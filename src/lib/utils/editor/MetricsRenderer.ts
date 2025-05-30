// utils/editor/MetricsRenderer.ts

import { Container } from "pixi.js";
import { type SettingsInterface, UserSettingsStore } from '@/stores/UserSettingsStore';
import { TargetStore, type TargetStoreInterface, type GroupInterface } from "@/stores/TargetImageStore";
import { Geometry } from '../geometry';
import { GraphicsFactory } from "./GraphicsFactory";
import { get } from "svelte/store";

export class MetricsRenderer {
    public targetContainer: Container;
    public userSettings: SettingsInterface;
    public targetStore: TargetStoreInterface;
    public userSettingsUnsubscribe: () => void;
    public geometry: Geometry;
    public graphicsFactory: GraphicsFactory;
    
    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;
        this.userSettings = get(UserSettingsStore);
        this.targetStore = get(TargetStore);
        this.geometry = new Geometry();
        this.graphicsFactory = new GraphicsFactory(targetContainer);
      
        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
            this.userSettings = settings;
            this.drawAllMetrics();
        });
    }

    public destroy()
    {
        if (this.userSettingsUnsubscribe) {
            this.userSettingsUnsubscribe();
        }
    }
    
    public drawAllMetrics(group?: number): void 
    {
        if (!group) {
            this.targetStore.groups.forEach(group => {
                this.drawGroupMetrics(group.id);
            });
        } else {
            this.drawGroupMetrics(group);
        }
    }
    
    public drawGroupMetrics(groupId: number): void 
    {
        this.drawMeanRadius(groupId);
        this.drawCoveringRadius(groupId);
        this.drawMPI(groupId);
        this.drawDiagonal(groupId);
        this.drawExtremeSpread(groupId);
    }
    
    public drawMeanRadius(groupId: number): void 
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
            // console.warn('No reference points set!');
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
    
        TargetStore.update(store => {
            const group = store.groups.find(g => g.id === groupId);
            if (group) {
                group.metrics = group.metrics || {};
                group.metrics.meanradius = {
                    px: meanRadius,
                    mm: TargetStore.pxToMm(meanRadius)
                };
            }
            return store;
        });
    
        const graphics = this.graphicsFactory.createMeanRadiusGraphics(
            groupId,
            meanCenter,
            meanRadius,
            this.userSettings.showmr
        );
        
        groupContainer.addChild(graphics);
    }
    
    public drawCoveringRadius(groupId: number): void 
    {
        const group = TargetStore.getGroup(groupId);
        
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            return;
        }
        
        const oldCircle = groupContainer.getChildByLabel(`ccr-${groupId}`);
        if (oldCircle) {
            groupContainer.removeChild(oldCircle);
        }
        
        if (!group || !group.shots || group.shots.length < 2) {
            return; // Inget eller bara en träff 
        }
        
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
                group.metrics.coveringradius = {
                    px: ccrRadiusInPixels,
                    mm: TargetStore.pxToMm(ccrRadiusInPixels)
                };
            }
            return store;
        });
        
        const graphics = this.graphicsFactory.createCoveringRadiusGraphics(
            groupId,
            center,
            radius,
            this.userSettings.showccr
        );
        
        groupContainer.addChild(graphics);
    }

    public drawMPI(groupId: number): void {
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

        const graphics = this.graphicsFactory.createMPIGraphics(
            groupId,
            {x: mpi.x, y: mpi.y},
            this.userSettings.showmpi
        );
        
        groupContainer.addChild(graphics);
    }
    
    public drawDiagonal(groupId: number): void {
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
        
        const diagonalGfx = this.graphicsFactory.createDiagonalGraphics(
            groupId,
            minX,
            minY,
            width,
            height,
            this.userSettings.showdiagonal
        )
        
        groupContainer.addChild(diagonalGfx);
    }

    public drawExtremeSpread(groupId: number): void {
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
    
        const graphics = this.graphicsFactory.createExtremeSpreadGraphics(
            groupId,
            point1,
            point2,
            this.userSettings.showes
        )
        
        groupContainer.addChild(graphics);
    }
}