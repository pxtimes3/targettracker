import { EditorStore, type EditorStoreInterface } from '@/stores/EditorStore';
import { TargetStore, type GroupInterface, type TargetStoreInterface } from '@/stores/TargetImageStore';
import { UserSettingsStore, type SettingsInterface } from '@/stores/UserSettingsStore';
import { MetricsRenderer } from './MetricsRenderer';
import type { FederatedPointerEvent } from 'pixi.js';
import { Container, Sprite, Graphics } from 'pixi.js';
import { get } from 'svelte/store';

export class GroupManager {
    private targetContainer: Container;
    private editorStore: EditorStoreInterface;
    private targetStore: TargetStoreInterface;
    private userSettings: SettingsInterface;
    
    private userSettingsUnsubscribe: () => void;
    private targetStoreUnsubscribe: () => void;
 
    constructor(targetContainer: Container) {
        this.targetContainer = targetContainer;

        this.editorStore = get(EditorStore);
        this.targetStore = get(TargetStore);
        this.userSettings = get(UserSettingsStore);

        type Point = {x: number, y: number};

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

         // console.log(`ActiveGroup is now ${this.targetStore.activeGroup}.`);
    }

    public get getCurrentGroupContainer(): Container
    {
        let storedCurrentGroup = this.targetStore.activeGroup;
        const currentGroupContainer = this.targetContainer.getChildByLabel(storedCurrentGroup.toString());

        if (!currentGroupContainer) throw new Error(`Tried to get currentGroup but no currentgroup existed in targetContainer!`);

        return currentGroupContainer;
    }


    public async getGroupContainer(label: string): Promise<Container|null>
    {
        return this.targetContainer.getChildByLabel(label);
    }


    public getGroupStoreShots(id: number)
    {
        let ids: string[] = []
        
        const shots = TargetStore.getShots(id);
        if (!shots) { console.error(`No such group! (${id})`); return; }
        
        shots.forEach(shot => ids.push(shot.id.toString()))

        return ids;
    }
}