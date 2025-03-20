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