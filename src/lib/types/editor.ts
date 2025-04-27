// types/editor.ts
export interface Point {
    x: number;
    y: number;
}
  
export interface Circle {
    center: Point;
    radius: number;
}

export enum ElementType {
    SHOT = 'shot',
    POA = 'poa'
}
    
export interface ElementCreationParams {
    x: number;
    y: number;
    groupId: string;
    type: ElementType;
}

export interface ActionSuccess {
    type: 'success';
    status: number;
    data: Array<{
        id: string;
        submitted: string;
        updated: string;
        user_id: string;
        image_name: string;
        result: string;
        error: null;
    }>;
}

export interface ActionFailure {
    type: 'failure';
    status: number;
    data: {
        error: string;
    };
}

export type ActionResponse = ActionSuccess | ActionFailure;

export interface AnalysisResult {
    predictions: Array<{
        [x: string]: any;
        x: number;
        y: number;
        group?: string;
    }>;
    count: number;
}