export interface Point {
    x: number;
    y: number;
    name?: string | null;
}

export function add(a: Point, b: Point): Point {
    return { x: a.x + b.x, y: a.y + b.y };
}

export function reversePointTransform(point: Point, imatrix: DOMMatrix): Point {
    const newX = point.x * imatrix.a + point.y * imatrix.c + imatrix.e;
    const newY = point.x * imatrix.b + point.y * imatrix.d + imatrix.f;
    return { x: newX, y: newY, name: point.name };
}

export function findDistance(a: Point, b: Point): number {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export interface ClosestPoint {
    index?: number;
}

export function findPointInRadius(points: Point[], point: Point, radius: number): ClosestPoint {
    let closestPointIndex;
    for (let i = 0; i < points.length; i++) {
        const dist = findDistance(points[i], point);
        if (dist <= radius) {
            closestPointIndex = i;
            break;
        }
    }
    return {index: closestPointIndex};
}