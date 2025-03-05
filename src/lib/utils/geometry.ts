
export class Geometry {
    public makeCircleFromTwoPoints(p1: {x: number, y: number}, 
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

    public findMinCircle(points: Array<{x: number, y: number}>): {center: {x: number, y: number}, radius: number} {
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
}