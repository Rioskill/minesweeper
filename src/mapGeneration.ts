import { HIDDEN_OVERFLOW, MINE_VALUE } from "./consts";
import { permutations, randInt, range } from "./utils";

interface MapGeneratorProps {
    cols: number
    rows: number
    mines: number
}

export class MapGenerator {
    matrix: number[][];
    cols: number;
    rows: number;
    mines: number;

    constructor(props: MapGeneratorProps) {
        this.cols = props.cols;
        this.rows = props.rows;
        this.mines = props.mines;
    }

    hasBomb(i: number, j: number) {
        if (i < 0 ||
            i >= this.rows ||
            j < 0 ||
            j >= this.cols) {
            return false;
        }
    
        return this.matrix[i][j] === MINE_VALUE;
    }
    
    calcValue(y: number, x: number) {
        if (this.matrix[y][x] === MINE_VALUE) {
            return MINE_VALUE;
        }
    
        const indices = range(-1, 2);
    
        const bombCnt = permutations(indices, indices)
            .filter(([i, j]) => !(i === 0 && j === 0))
            .map(([i, j]) => (this.hasBomb(y + i, x + j) ? 1 : 0) as number)
            .reduce((sum, n) => sum + n, 0)
    
        return bombCnt;
    }
    
    generateMap(cb?: (completePercent: number)=>void) {
        this.matrix = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    
        let currNumOfOperations = 0;
        const totalNumOfOperations = this.cols * this.rows + this.mines;

        range(this.mines).forEach(i => {
            let row = randInt(this.rows);
            let col = randInt(this.cols);
    
            while (this.matrix[row][col] === MINE_VALUE) {
                row = randInt(this.rows);
                col = randInt(this.cols);
            }
    
            currNumOfOperations++;
            this.matrix[row][col] = MINE_VALUE;

            if (cb) {
                cb(currNumOfOperations / totalNumOfOperations * 100);
            }
        })
    
        return this.matrix.map((row, i) => {
            currNumOfOperations += row.length;

            if (cb) {
                cb(currNumOfOperations / totalNumOfOperations * 100);
            }

            return row.map((_, j) => this.calcValue(i, j) + HIDDEN_OVERFLOW)
        });
    }
}
