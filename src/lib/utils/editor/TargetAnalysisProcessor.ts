import { TargetStore, type TargetStoreInterface } from "@/stores/TargetImageStore";
import { ShotPoaTool } from './PlaceShotPoaTool';
import { deserialize } from '$app/forms';
import type { ActionResponse, AnalysisResult,  } from "@/types/editor";
import type { Container } from "pixi.js";

export class TargetAnalysisProcessor {
    // Methods: initializeAnalysis, fetchAnalysis, processAnalysisResults, etc.
    private shotPoaTool: ShotPoaTool;
    private targetStore: TargetStoreInterface;
    private targetContainer: Container;

    constructor(targetStore: TargetStoreInterface, shotPoaTool: ShotPoaTool, targetContainer: Container)
    {
        this.shotPoaTool = shotPoaTool;
        this.targetStore = targetStore;
        this.targetContainer = targetContainer;
    }

    public async initializeAnalysis(userId: string): Promise<void> 
    {
        if (this.targetStore.analysisFetched) {
             // console.log('Analysis already fetched, skipping...');
            return;
        }

        try {
            const analysis = await this.fetchAnalysis(userId);

             // console.log('Fetched analysis:', analysis);

            if (analysis && analysis?.predictions?.length > 0) {
                await this.processAnalysisResults(analysis);
                TargetStore.update(store => ({ ...store, analysisFetched: true }));
            } else {
                console.warn('No analysis to process... ');
            }
        } catch (error) {
            console.error('Failed to initialize analysis:', error);
        }
    }

    public async fetchAnalysis(userId: string) 
    {
        if (!this.targetStore.target.image.filename) {
            console.error('No this.targetStore.target.image.filename!');
            return;
        }
        const formData = new FormData();

         // console.log(`Appending userId: ${userId} & imagename: ${this.targetStore.target.image.filename} to formData.`);

        formData.append('user_id', userId);
        formData.append('imagename', this.targetStore.target.image.filename);

        const response = await fetch('?/fetchanalysis', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: {[key:string]: any} = deserialize(await response.text()) as ActionResponse;

        if (result.type === 'success' && result.data[0]?.result) {
            return JSON.parse(result.data[0].result) as AnalysisResult;
        }
    }

    public async processAnalysisResults(analysis: any) {
        if (this.targetStore.groups.length === 0) {
            const newGroup = await this.shotPoaTool.createGroup();
            if (!newGroup) {
                throw new Error('Failed to create initial group');
            }
        } else {
             // console.log(`this.targetStore.groups.length is ${this.targetStore.groups.length}`);
        }

        for (const prediction of analysis.predictions) {
            const coords = this.targetContainer.toGlobal({
                x: prediction.xy[0],
                y: prediction.xy[1]
            });
            await this.shotPoaTool.addShot(coords.x, coords.y, '1');
        }
    }    
}