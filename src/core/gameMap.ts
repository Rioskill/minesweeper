import { FLAG_OVERFLOW, HIDDEN_OVERFLOW } from "../consts";
import { MapGenerator } from "./mapGeneration";
import { CoordsT } from "../models";

interface GameMapProps {
    ROWS: number
    COLS: number

    ROWL: number
    COLL: number

    CHUNKW?: number
    CHUNKH?: number
}

export class GameMap {
    map: number[][]

    ROWS: number
    COLS: number

    ROWL: number
    COLL: number

    CHUNKW: number
    CHUNKH: number

    onMinesRemainingUpdate?: (minesRemaining: number)=>void

    minesTotal: number
    minesRemaining: number

    constructor(props: GameMapProps) {
        this.ROWS = props.ROWS;
        this.COLS = props.COLS;

        this.ROWL = props.ROWL;
        this.COLL = props.COLL;

        this.CHUNKW = props.CHUNKW || 0;
        this.CHUNKH = props.CHUNKH || 0;

        this.minesRemaining = 0;
    }

    calcChunkSize(viewSize: CoordsT) {
        this.CHUNKW = Math.floor(viewSize.x / this.COLL) + 1;
        this.CHUNKH = Math.floor(viewSize.y / this.ROWL) + 1;
    }

    generateMap(mines: number) {
        this.minesTotal = mines;
        this.minesRemaining = mines;
        const mapGenerator = new MapGenerator({
            cols: this.COLS,
            rows: this.ROWS,
            mines
        })

        let prevPercent = 0;
        const minPercentDiff = 2;
        this.map = mapGenerator.generateMap(percent => {
            if (Math.floor(percent) - prevPercent > minPercentDiff) {
                prevPercent = Math.floor(percent);
                console.log(percent);
            }
        })
    }

    createVertexGridChunk (chunk: CoordsT) {
        const grid: number[] = [];

        const width = this.COLL;
        const height = this.ROWL;

        const mask = [
            [0, 0],
            [0, 1],
            [1, 0],
            [0, 1],
            [1, 0],
            [1, 1],
        ]

        for (let i = chunk.y * this.CHUNKH; i < Math.min((chunk.y + 1) * this.CHUNKH, this.ROWS); i++) {
            const y = i * height;

            for (let j = chunk.x * this.CHUNKW; j < Math.min((chunk.x + 1) * this.CHUNKW, this.COLS); j++) {
                const x = j * width;
                grid.push(
                    ...mask.flatMap(([a, b]) => [x + a * width, y + b * height])
                );
            }
        }

        return grid;
    }

    createTextureCoordsChunk(chunk: CoordsT) {
        const coords: number[] = [];

        const mask = [
            [0, 0],
            [0, 1],
            [1, 0],
            [0, 1],
            [1, 0],
            [1, 1]
        ]

        const width = 1 / 11;

        for (let i = chunk.y * this.CHUNKH; i < Math.min((chunk.y + 1) * this.CHUNKH, this.ROWS); i++) {
            for (let j = chunk.x * this.CHUNKW; j < Math.min((chunk.x + 1) * this.CHUNKW, this.COLS); j++) {
                coords.push(
                    ...mask.flatMap(([a, b]) => [(this.map[i][j] + a) * width, b])
                )
            }
        }

        return coords;
    }

    getMapVal(coords: CoordsT) {
        return this.map[coords.y][coords.x];
    }


    isHidden(val: number) {
        return val >= HIDDEN_OVERFLOW && val < FLAG_OVERFLOW + HIDDEN_OVERFLOW;
    }

    isFlag(val: number) {
        return val >= FLAG_OVERFLOW && val < HIDDEN_OVERFLOW || val >= FLAG_OVERFLOW + HIDDEN_OVERFLOW;
    }

    isHiddenAt(tile: CoordsT) {
        return this.isHidden(this.getMapVal(tile));
    }

    isFlagAt(tile: CoordsT) {
        return this.isFlag(this.getMapVal(tile));
    }

    setFlagAt(tile: CoordsT) {
        this.map[tile.y][tile.x] += FLAG_OVERFLOW;

        this.minesRemaining--;
        if (this.onMinesRemainingUpdate) {
            this.onMinesRemainingUpdate(this.minesRemaining);
        }
    }

    removeFlagAt(tile: CoordsT) {
        this.minesRemaining++;
        this.map[tile.y][tile.x] -= FLAG_OVERFLOW;

        if (this.onMinesRemainingUpdate) {
            this.onMinesRemainingUpdate(this.minesRemaining);
        }
    }

    tileInBounds(coords: CoordsT) {
        return coords.x >= 0 &&
               coords.y >= 0 &&
               coords.x < this.COLS &&
               coords.y < this.ROWS;
    }

    toggleFlagAt (tile: CoordsT) {
        const val = this.getMapVal(tile);

        if (!this.isHidden(val) && !this.isFlag(val)) {
            return;
        }

        if (this.isFlag(val)) {
            this.removeFlagAt(tile);
        } else {
            this.setFlagAt(tile);
        }
    }

    getChunk(coords: CoordsT) {
        return {
            x: Math.floor(coords.x / this.COLL / this.CHUNKW),
            y: Math.floor(coords.y / this.ROWL / this.CHUNKH)
        }
    }

    get tilesCnt() {
        return this.ROWS * this.COLS;
    }
}
