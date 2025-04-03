// utils/editor/GraphicsFactory.ts

import { Container, Graphics } from "pixi.js";
import { type SettingsInterface } from '@/stores/UserSettingsStore';
import type { Point } from "@/types/editor";

export class GraphicsFactory {
    constructor(private readonly targetContainer: Container) {}

    public createMeanRadiusGraphics(
        groupId: number, 
        meanCenter: Point, 
        meanRadius: number, 
        visible: boolean
    ): Graphics {
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
        graphics.visible = visible;
        graphics.label = `mr-${groupId}`;
        
        return graphics;
    }
    
    public createCoveringRadiusGraphics(
        groupId: number, 
        center: Point, 
        radius: number, 
        visible: boolean
    ): Graphics {
        const graphics = new Graphics();
        graphics.clear();
        graphics.circle(0, 0, radius);
        graphics.position.set(center.x, center.y);
        graphics.stroke({
            color: 0x0000FF,
            pixelLine: true,
            alpha: 0.5
        });
        graphics.eventMode = 'none';
        graphics.visible = visible;
        graphics.label = `ccr-${groupId}`;
        
        return graphics;
    }

    // Old - gör en simpel cirkel
    public createMPIGraphics(
        groupId: number, 
        mpi: Point, 
        visible: boolean
    ): Container {
        const mpiContainer = new Container();
        const mpiGfx = new Graphics({
            label: `mpi-group-${groupId}-gfx`,
        });
            //.circle(0, 0, 3)
        const outerRadius = 8;
        const innerRadius = outerRadius / 2;
        const numPoints = 5;

        mpiGfx.moveTo(0, -outerRadius);
        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? innerRadius : outerRadius;
            const angle = Math.PI * (i + 1) / numPoints - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            mpiGfx.lineTo(x, y);
        }
        mpiGfx.closePath();

        mpiGfx.stroke({ 
            color: 0xFF00FF,
            pixelLine: true,
            alpha: 0.9,
        })
        mpiGfx.fill({
            color: 0xFF00FF,
            alpha: 0.75,
        });
        
        mpiContainer.addChild(mpiGfx);
        mpiContainer.position.set(mpi.x, mpi.y);
        mpiContainer.eventMode = 'none';
        mpiContainer.visible = visible;
        mpiContainer.label = `mpi-${groupId}`;
        
        return mpiContainer;
    }

    
    public createDiagonalGraphics(
        groupId: number, 
        minX: number, 
        minY: number, 
        width: number, 
        height: number, 
        visible: boolean
    ): Graphics {
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
        const graphics = new Graphics()
            .rect(minX, minY, width, height)   // FOM
            .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true})
            .moveTo(minX, minY)                // DIAGONAL
            .lineTo(minX + width, minY + height)
            .stroke({width: strokeWidth, color: 0x00FF00, pixelLine: true});
        graphics.eventMode = 'none';
        graphics.visible = visible;
        graphics.label = `diagonal-${groupId}`;
        
        return graphics;
    }

    public createExtremeSpreadGraphics(
        groupId: number, 
        point1: Point, 
        point2: Point, 
        visible: boolean
    ): Graphics {
        const graphics = new Graphics();
        graphics.clear();
        
        graphics.moveTo(point1.x, point1.y);
        graphics.lineTo(point2.x, point2.y);
        const strokeWidth = 2 * 1/this.targetContainer.scale.x;
        graphics.stroke({pixelLine: true, color: 0x00FFFF});

        graphics.eventMode = 'none';
        graphics.label = `es-${groupId}`;
        graphics.visible = visible;
        
        return graphics;
    }
}