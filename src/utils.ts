import { CoordsT, makeCoords, RectT } from "./models";

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

export const range = (n: number, m?: number): number[] => {
    if (m === undefined) {
        return [...Array(n).keys()];
    }

    return range(m - n).map(x => x + n);
}

export const permutations = <T1, T2>(a: T1[], b: T2[]) => {
    let res: (T1 | T2)[][] = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            res.push([a[i], b[j]]);
        }
    }
    return res;
}

export const randInt = (max: number) => {
    return Math.floor(Math.random() * (max));
}

export const getCollisionPos = (pos: CoordsT, rect: RectT) => {
    return {
        x: pos.x - rect.x,
        y: pos.y - rect.y,
        collision: pos.x > rect.x && pos.y > rect.y && pos.x < rect.x2 && pos.y < rect.y2
    }
}
