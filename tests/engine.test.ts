import { expect, test, mock, jest } from "bun:test";
import { HIDDEN_OVERFLOW, MINE_VALUE } from "../src/consts";
import { GameEngine } from "../src/core/gameEngine";
import { GameMap } from "../src/core/gameMap";
import { MinesweeperView } from "../src/core/view";
import { makeCoords } from "../src/models";
import { Renderer } from "../src/renderers/models";
import { Matrix } from "../src/core/matrix";

const canvasMock = {
    getBoundingClientRect: () => ({
        x: 0,
        y: 0
    })
} as unknown as HTMLCanvasElement

const rendererMock: Renderer = {
    updateOffset() {

    },

    destruct() {

    },

    render() {

    }
}

const getEngineWithMap = ({cols, rows, mines, data}: {cols: number, rows: number, mines: number, data: number[]}): GameEngine => {
    const map = new GameMap({
        ROWS: rows,
        COLS: cols,
        ROWL: 10,
        COLL: 10,
    })

    map.minesTotal = mines;
    map.minesRemaining = mines;

    map.matrix = new Matrix({
        rows,
        cols,
        data: new Uint8Array(data)
    })

    const view = new MinesweeperView({
        fullSize: makeCoords(cols * 10, rows * 10),
        viewSize: makeCoords(cols * 10, rows * 10),
        offset: makeCoords(0, 0),
        canvas: canvasMock
    })

    const engine = new GameEngine({
        map,
        view,
        renderer: rendererMock
    })

    return engine;
}

test('openTile clear', () => {
    const mapData = [
        100, 101, MINE_VALUE + HIDDEN_OVERFLOW, 101,
        100, 101, 101, 101,
        100, 100, 100, 100,
        100, 100, 100, 100
    ];

    const engine = getEngineWithMap({
            cols: 4,
            rows: 4,
            mines: 1,
            data: mapData
    })

   const onGameOver = jest.fn();
   engine.onGameOver = onGameOver;

    engine.openTile(makeCoords(0, 0));

    expect(engine.map.matrix.data).toEqual(new Uint8Array([
          0,   1, MINE_VALUE + HIDDEN_OVERFLOW,  101,
          0,   1,   1,   1,
          0,   0,   0,   0,
          0,   0,   0,   0
    ]))

    expect(engine.gameGoing).toEqual(true);
    expect(onGameOver).not.toHaveBeenCalled();
})

test('openTile gameEnd', () => {
    const mapData = [
        100, 101, MINE_VALUE + HIDDEN_OVERFLOW, 101,
        100, 101, 101, 101,
        100, 100, 100, 100,
        100, 100, 100, 100
    ];

    const engine = getEngineWithMap({
        cols: 4,
        rows: 4,
        mines: 1,
        data: mapData
    })

    engine.firstTileOpen = false;

    const onGameOver = jest.fn();
    engine.onGameOver = onGameOver;

    engine.openTile(makeCoords(2, 0));

    expect(engine.map.matrix.data).toEqual(new Uint8Array([
        100, 101, MINE_VALUE, 101,
        100, 101, 101, 101,
        100, 100, 100, 100,
        100, 100, 100, 100
    ]))

    expect(engine.gameGoing).toEqual(false);

    expect(onGameOver).toHaveBeenCalled();
    expect(onGameOver).toHaveBeenCalledTimes(1);
})

test('win conditions', () => {
    const mapData = [
        100, 101, MINE_VALUE + HIDDEN_OVERFLOW, 101,
        100, 101, 101, 101,
        100, 100, 100, 100,
        100, 100, 100, 100
    ];

    const engine = getEngineWithMap({
            cols: 4,
            rows: 4,
            mines: 1,
            data: mapData
    })

    const onGameOver = jest.fn();
    engine.onGameOver = onGameOver;

    engine.openTile(makeCoords(0, 0));
    engine.openTile(makeCoords(3, 0));

    expect(engine.map.matrix.data).toEqual(new Uint8Array([
          0,   1, MINE_VALUE + HIDDEN_OVERFLOW,  1,
          0,   1,   1,   1,
          0,   0,   0,   0,
          0,   0,   0,   0
    ]))

    expect(engine.openedTiles).toEqual(15);

    expect(engine.gameGoing).toEqual(false);
    expect(onGameOver).toHaveBeenCalled();
    expect(onGameOver).toHaveBeenCalledTimes(1);
})

test('createVertexGridChunk', () => {
    const mapData = [
        100, 101, MINE_VALUE + HIDDEN_OVERFLOW, 101,
        100, 101, 101, 101,
        100, 100, 100, 100,
        100, 100, 100, 100
    ];

    const map = new GameMap({
        ROWS: 4,
        COLS: 4,
        ROWL: 10,
        COLL: 10,
        CHUNKW: 2,
        CHUNKH: 2
    })

    map.minesTotal = 1;
    map.minesRemaining = 1;

    map.matrix = new Matrix({
        rows: 4,
        cols: 4,
        data: new Uint8Array(mapData)
    })

    expect(map.createVertexGridChunk(makeCoords(0, 0))).toEqual([
        0, 0,
        0, 10,
        10, 0,
        0, 10,
        10, 0,
        10, 10,

        10, 0, 
        10, 10,
        20, 0,
        10, 10,
        20, 0,
        20, 10,

        0, 10,
        0, 20,
        10, 10,
        0, 20,
        10, 10,
        10, 20,

        10, 10,
        10, 20,
        20, 10,
        10, 20,
        20, 10,
        20, 20
    ])
})
