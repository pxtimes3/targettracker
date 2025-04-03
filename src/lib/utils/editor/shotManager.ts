// src/lib/utils/editor/shotManager.ts
import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { type FederatedPointerEvent, Container, Graphics } from 'pixi.js';
import { get } from 'svelte/store';
import { MetricsRenderer } from './MetricsRenderer';
import { GroupManager } from './groupManager';
import { DragHandler } from './dragHandler';
import { getAllChildren } from './editorUtils';
import { type ElementCreationParams, ElementType } from '@/types/editor';

export class ShotManager {
    public targetContainer: Container;
    public editorStore: EditorStoreInterface;
    public targetStore: TargetStoreInterface;
    public userSettings: SettingsInterface;
    public groupManager: GroupManager;
    public metricsRenderer: MetricsRenderer;
    public dragHandler: DragHandler;
    
    private userSettingsUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;

    constructor(
        targetContainer: Container,
        groupManager?: GroupManager,
        metricsRenderer?: MetricsRenderer,
        dragHandler?: DragHandler
    ) {
        this.targetContainer = targetContainer;

        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);
        this.groupManager = groupManager || new GroupManager(targetContainer);
        this.metricsRenderer = metricsRenderer || new MetricsRenderer(targetContainer);
        this.dragHandler = dragHandler || new DragHandler(targetContainer);
        
        this.targetStoreUnsubscribe = TargetStore.subscribe((store) => {
            this.targetStore = store;
        });

        this.userSettingsUnsubscribe = UserSettingsStore.subscribe((settings) => {
            this.userSettings = settings;
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

    public async addElement(params: ElementCreationParams): Promise<Container|undefined> {
        const { x, y, groupId, type } = params;
        
        const { groupContainer, storeGroup } = await this.prepareGroupForElement(groupId);
        if (!groupContainer || !storeGroup) return;

        const position = this.targetContainer.toLocal({x, y});
        let element: Container;
        
        if (type === ElementType.SHOT) {
            // Shot
            const shots = storeGroup.shots;
            if (!shots) {
                console.error(`No shots-array found in store-group ${groupId}!`, storeGroup);
                return;
            }
          
            const label = `shot-${shots.length.toString()}-${groupId}`;
            element = this.createShotGraphic(label);
          
            const newShot = {
                id: shots.length.toString(),
                group: parseInt(groupId),
                x: position.x,
                y: position.y,
                score: 0,
            };
            TargetStore.addShot(newShot, parseInt(groupId));
            console.log('added shot to store:', newShot, `group ${parseInt(groupId)}`);
          
            element.on('pointerdown', (e) => {
                e.stopPropagation();
                if (e.button === 1) { this.removeShot(e) }
                if (e.button === 0) { this.dragHandler.handleSpriteDrag(e); }
            });
        } else {
            // POA
            const label = `poa-${groupId}`;
            element = this.createPoaGraphic(label);
          
            storeGroup.poa = {x: position.x, y: position.y};
          
            element.on('pointerdown', (e) => {
                e.stopPropagation();
                this.dragHandler.handleSpriteDrag(e);
            });
        }
        
        element.position.set(position.x, position.y);
        
        if (type === ElementType.SHOT) {
            element.scale.set(this.setScale());
            element.width = 48;
            element.height = 48;
            element.zIndex = 99;
        }
        
        groupContainer.addChild(element);
        
        if (type === ElementType.SHOT) {
            this.metricsRenderer.drawAllMetrics(parseInt(groupId));
        }
        
        return element;
    }
      
    public async prepareGroupForElement(groupId: string): Promise<{
        groupContainer: Container|null,
        storeGroup: GroupInterface|undefined
    }> {
        // First check if a container for this group already exists
        const groupContainer = await this.groupManager.getGroupContainer(groupId);
        
        // If container exists, find the corresponding store group
        if (groupContainer) {
            const storeGroup = this.targetStore.groups.find((g) => g.id === parseInt(groupId));
            
            // If store group doesn't exist, log error and return null for both
            if (!storeGroup) {
                console.error(`Found container for group ${groupId} but no matching group in the store!`);
                return { groupContainer: null, storeGroup: undefined };
            }
            
            return { groupContainer, storeGroup };
        }
        
        // No container exists, create a new group
        const newGroup = this.groupManager.createGroup();
        if (!newGroup || !newGroup.group || !newGroup.container) {
            console.error(`Failed creating new group! group: ${groupId}`);
            return { groupContainer: null, storeGroup: undefined };
        }
        
        return { 
            groupContainer: newGroup.container, 
            storeGroup: newGroup.group 
        };
    }
    
    
      
    public async addShot(x: number, y: number, groupId: string): Promise<Container|undefined> 
    {
        return this.addElement({ x, y, groupId, type: ElementType.SHOT });
    }
      
    public async addPoa(x: number, y: number, groupId: string): Promise<Container|undefined> 
    {
        const currentPoa = TargetStore.getGroup(parseInt(groupId))?.poa;
        
        if (!currentPoa) {
            // No existing POA, create a new one
            return this.addElement({ x, y, groupId, type: ElementType.POA });
        }
        
        const groupContainer: Container|null = this.targetContainer.getChildByLabel(groupId);
        if (!groupContainer) { 
            console.error('We have a POA but could not fetch the group container!'); 
            return; 
        }
        
        const poaContainer: Container|null = groupContainer.getChildByLabel(/poa-.*/); 

        if (!poaContainer) {
            return this.addElement({ x, y, groupId, type: ElementType.POA });
        } else {
            // Move existing POA
            const position = this.targetContainer.toLocal({x, y});
            poaContainer.position = {x: position.x, y: position.y};
            // Update store
            TargetStore.updatePoa(parseInt(groupId), position.x, position.y);
            return poaContainer;
        }
    }

    public assignSelectedShotsToGroup(value: string): void
    {
        const shots = this.editorStore.selected;
        let group: GroupInterface|undefined;
        let container: Container|null;

        if (value === 'createNew') {
            const res = this.groupManager.createGroup();
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

    // Improved removeShot method
    public removeShot(e: FederatedPointerEvent): void {
        // Validate that target has a label property
        if (!e.target || !e.target.label) {
            console.error('Cannot remove shot: Event target has no label');
            return;
        }
        
        // Use a more robust regex pattern with named groups
        const match = e.target.label.match(/^shot-(?<shotId>\d+)-(?<groupId>\d+)$/);
        if (!match || !match.groups) {
            console.error(`Invalid shot label format: ${e.target.label}`);
            return;
        }
        
        const shotId = match.groups.shotId;
        const groupId = parseInt(match.groups.groupId);
        
        if (isNaN(groupId)) {
            console.error(`Invalid group ID in label: ${e.target.label}`);
            return;
        }
        
        // Get the group container
        const groupContainer = this.targetContainer.getChildByLabel(groupId.toString());
        if (!groupContainer) {
            console.error(`No container found for group ID: ${groupId}`);
            return;
        }
        
        try {
            // Remove from store
            TargetStore.removeShot(groupId, shotId);
            
            // Remove sprite
            this.removeShotSprite(e.target.label, groupContainer);
            
            // Update remaining shots
            this.updateRemainingShots(groupId, groupContainer);
            
            // Redraw metrics
            this.metricsRenderer.drawAllMetrics(groupId);
            
            // Log for debugging
            this.logShotRemoval(shotId, groupId, groupContainer);
        } catch (error) {
            console.error(`Error removing shot ${shotId} from group ${groupId}:`, error);
        }
    }
    
    // Improved removeShotSprite method
    public removeShotSprite(label: string, container: Container): void {
        const sprite = container.getChildByLabel(label);
        if (!sprite) {
            console.warn(`No sprite found with label: ${label} in container`);
            return;
        }
        container.removeChild(sprite);
    }
    
    public updateRemainingShots(groupId: number, container: Container): void {
        const updatedGroup = TargetStore.getGroup(groupId);
        if (!updatedGroup || !updatedGroup.shots) return;
        
        const shotSprites = container.children.filter(child => 
            child.label && child.label.startsWith('shot-'));
        
        for (let i = 0; i < shotSprites.length; i++) {
            const storeShot = updatedGroup.shots[i];
            if (storeShot) {
                shotSprites[i].label = `shot-${storeShot.id}-${groupId}`;
            }
        }
    }
    
    private logShotRemoval(shotId: string, groupId: number, container: Container): void {
        console.debug(`Removed shot ${shotId}`);
        console.debug(`shots:`, {
            groupContainer: getAllChildren(container),
            groupstore: this.groupManager.getGroupStoreShots(groupId)
        });
    }


    public setScale(scale: number = 1)
    {
        return scale / this.targetContainer.scale.x;
    }


    public createShotGraphic(label: string): Container
    {
        const shot = new Container();
        
        const width = 48;
        const height = 48;
        const radius = width / 2;

        const circle = new Graphics()
            .circle(0, 0, radius)
            .moveTo(0, -24)
            .lineTo(0, -34)
            .moveTo(0, 24)
            .lineTo(0, 34)
            .moveTo(-24, 0)
            .lineTo(-34, 0)
            .moveTo(24, 0)
            .lineTo(34, 0)
            .stroke({ color: 0x000000, pixelLine: true })
            .fill({color:0xFFFFFF, alpha: 0.25});    // fill so we can drag anywhere in the circle
        circle.label = `${label}-graphics`;

        shot.addChild(circle);
        
        shot.label = label;
        shot.eventMode = 'dynamic';
        shot.cursor = 'pointer';
        shot.interactive = true;
        
        shot.pivot.set(0, 0);

        return shot;
    }

    public createPoaGraphic(label: string): Container
    {
        const poa = new Container();
        poa.setSize(30);
        
        const radius = 15;
        const lineLength = 5;

        const circle = new Graphics()
            .circle(0, 0, radius)
            .circle(0, 0, radius - lineLength)
            .moveTo(0, -radius)
            .lineTo(0, -radius - lineLength)
            .moveTo(0, radius)
            .lineTo(0, radius + lineLength)
            .moveTo(-radius, 0)
            .lineTo(-radius - lineLength, 0)
            .moveTo(radius, 0)
            .lineTo(radius + lineLength, 0)
            .stroke({ color: 0x000000, pixelLine: true })
            .fill({color:0x000000, alpha: 0});    // fill so we can drag anywhere in the circle
        circle.setSize(36);
        circle.label = `${label}-graphics`;

        poa.addChild(circle);
        
        poa.label = label;
        poa.eventMode = 'dynamic';
        poa.cursor = 'pointer';
        poa.interactive = true;
        
        poa.pivot.set(0, 0);
        

        return poa;
    }
}