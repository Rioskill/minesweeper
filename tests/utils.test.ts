import { expect, test } from "bun:test";
import { addVectors, clamp, getCollisionPos, negate, permutations, range, substractVectors } from "../src/utils";
import { makeCoords } from "../src/models";

test('clamp соблюдает нижнюю границу', () => {
    expect(clamp(10, 5, 20)).toEqual(10);
})

test('clamp соблюдает вернюю границу', () => {
    expect(clamp(10, 25, 20)).toEqual(20);
})

test('clamp возвращает число в диапазон', () => {
    expect(clamp(10, 15, 20)).toEqual(15);
})

test('addVectors', () => {
    const first = makeCoords(1, 2);
    const second = makeCoords(3, 7);

    expect(addVectors(first, second)).toEqual(makeCoords(4, 9));
})

test('substractVectors', () => {
    const first = makeCoords(1, 2);
    const second = makeCoords(3, 7);

    expect(substractVectors(first, second)).toEqual(addVectors(first, negate(second)));
})

test('range', () => {
    expect(range(4)).toEqual([0, 1, 2, 3]);

    expect(range(1, 2)).toEqual([1]);
    expect(range(1, 5)).toEqual([1, 2, 3, 4]);

    expect(range(4, 1)).toEqual([]);
})

test('permutations', () => {
    const a = [1, 2, 3];
    const b = ['a', 'b'];

    expect(permutations(a, b)).toEqual([
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
        [3, 'a'],
        [3, 'b']
    ]);
})

test('permutation with empty array', () => {
    const a = [1, 2, 3];

    expect(permutations(a, [])).toEqual([]);
    expect(permutations([], a)).toEqual([]);
})

test('getCollisionPos', () => {
    const rect = {
        x: 4,
        y: 4,
        x2: 10,
        y2: 6,
        width: 6,
        height: 2
    };

    const pos1 = makeCoords(5, 5);
    const pos2 = makeCoords(2, 2);
    const pos3 = makeCoords(5, 2);
    const pos4 = makeCoords(2, 5);

    expect(getCollisionPos(pos1, rect)).toEqual({
        x: 1,
        y: 1,
        collision: true
    })

    expect(getCollisionPos(pos2, rect)).toEqual({
        x: -2,
        y: -2,
        collision: false
    })

    expect(getCollisionPos(pos3, rect)).toEqual({
        x: 1,
        y: -2,
        collision: false
    })

    expect(getCollisionPos(pos4, rect)).toEqual({
        x: -2,
        y: 1,
        collision: false
    })
})
