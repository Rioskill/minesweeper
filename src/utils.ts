import { CoordsT, makeCoords } from "./models";

export const clamp = (min: number, num: number, max: number) => {
    return Math.min(Math.max(num, min), max);
}

export const clampCoords = (min: CoordsT, coords: CoordsT, max: CoordsT) => {
    return {
        x: clamp(min.x, coords.x, max.x),
        y: clamp(min.y, coords.y, max.y)
    }
}

export const addVectors = (first: CoordsT, second: CoordsT) => {
    return makeCoords(first.x + second.x, first.y + second.y);
}

export const substractVectors = (first: CoordsT, second: CoordsT) => {
    return makeCoords(first.x - second.x, first.y - second.y);
}

export const negate = (coords: CoordsT) => {
    return {
        x: -coords.x,
        y: -coords.y
    }
}
