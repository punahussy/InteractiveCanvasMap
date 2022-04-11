export interface Point {
    x: number;
    y: number;
    name?: string | null;
}

export function add(a: Point, b: Point): Point {
    return {x: a.x + b.x, y: a.y + b.y};
}

export function reversePointTransform(point: Point, imatrix: DOMMatrix): Point {
    const newX = point.x * imatrix.a + point.y * imatrix.c + imatrix.e;
    const newY = point.x * imatrix.b + point.y * imatrix.d + imatrix.f;
    return { x: newX, y: newY, name: point.name };
}