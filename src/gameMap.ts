import { MINE_VALUE, FLAG_OVERFLOW, HIDDEN_OVERFLOW } from "./consts";
import { CoordsT, makeCoords } from "./models";
import { permutations, randInt, range } from "./utils";

interface GameMapProps {
    ROWS: number
    COLS: number

    ROWL: number
    COLL: number

    CHUNKW: number
    CHUNKH: number
}

export class GameMap {
    map: number[][]

    ROWS: number
    COLS: number

    ROWL: number
    COLL: number

    CHUNKW: number
    CHUNKH: number

    constructor(props: GameMapProps) {
        this.ROWS = props.ROWS;
        this.COLS = props.COLS;

        this.ROWL = props.ROWL;
        this.COLL = props.COLL;

        this.CHUNKW = props.CHUNKW;
        this.CHUNKH = props.CHUNKH;
    }

    generateMatrix(mines: number) {
        const rows = this.ROWS;
        const cols = this.COLS;

        const matrix = Array(rows).fill(0).map(() => Array(cols).fill(0));
    
        range(mines).forEach(i => {
            let row = randInt(rows);
            let col = randInt(cols);
    
            while (matrix[row][col] === MINE_VALUE) {
                row = randInt(rows);
                col = randInt(cols);
            }
    
            matrix[row][col] = MINE_VALUE;
            // this.minePositions.push(makeCoords(col, row));
        })
    
        const hasBomb = (i: number, j: number) => {
            if (i < 0 ||
                i >= this.ROWS ||
                j < 0 ||
                j >= this.COLS) {
                return false;
            }
    
            return matrix[i][j] === MINE_VALUE;
        }
    
        const calcValue = (y: number, x: number) => {
            if (matrix[y][x] === MINE_VALUE) {
                return MINE_VALUE;
            }
    
            const indices = range(-1, 2);
    
            const bombCnt = permutations(indices, indices)
                .filter(([i, j]) => !(i === 0 && j === 0))
                .map(([i, j]) => (hasBomb(y + i, x + j) ? 1 : 0) as number)
                .reduce((sum, n) => sum + n, 0)
    
            return bombCnt;
        }

        this.map = matrix.map((row, i) => row.map((_, j) => calcValue(i, j) + 100));
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
    }

    removeFlagAt(tile: CoordsT) {
        this.map[tile.y][tile.x] -= FLAG_OVERFLOW;
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
}
