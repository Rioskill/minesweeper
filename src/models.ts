export interface CoordsT {
    x: number
    y: number
}

export const makeCoords = (x: number, y: number) => (
    { x, y }
)

export const unfoldCoords = (coords: CoordsT): [number, number] => {
    return [coords.x, coords.y];
}

export interface RectT extends CoordsT {
    x2: number
    y2: number
}
