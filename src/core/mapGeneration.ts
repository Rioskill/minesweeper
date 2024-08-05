import { HIDDEN_OVERFLOW, MINE_VALUE } from "../consts";
import { permutations, randInt, range } from "../utils";
import { Matrix } from "./matrix";

interface MapGeneratorProps {
    cols: number
    rows: number
    mines: number
}

export class MapGenerator {
    // matrix: number[][];
    matrix: Matrix
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
    
        return this.matrix[i][j] === MINE_VALUE || this.matrix[i][j] === MINE_VALUE + HIDDEN_OVERFLOW;
    }

    get neighbourDeltas() {
        const indices = range(-1, 2);
        return permutations(indices, indices)
            .filter(([i, j]) => !(i === 0 && j === 0))
    }
    
    calcValue(y: number, x: number) {
        if (this.matrix[y][x] === MINE_VALUE) {
            return MINE_VALUE;
        }
    
        const bombCnt = this.neighbourDeltas
            .map(([i, j]) => (this.hasBomb(y + i, x + j) ? 1 : 0) as number)
            .reduce((sum, n) => sum + n, 0)
    
        return bombCnt;
    }

    repositionMine(row: number, col: number) {
        const [newRow, newCol] = this.findMinePlace();

        this.matrix[row][col] = this.calcValue(row, col) + HIDDEN_OVERFLOW;
        this.matrix[newRow][newCol] = MINE_VALUE + HIDDEN_OVERFLOW;

        const handleNotMines = (baseRow: number, baseCol: number, cb: (y: number, x: number)=>void) => {
            return ([y, x]: number[]) => {
                const i = baseRow + y;
                const j = baseCol + x;

                if (
                        i < 0 ||
                        i >= this.rows ||
                        j < 0 ||
                        j >= this.cols ||
                        this.matrix[i][j] === MINE_VALUE ||
                        this.matrix[i][j] === MINE_VALUE + HIDDEN_OVERFLOW
                    ) {
                    return;
                }

                cb(i, j);
            }
        }

        this.neighbourDeltas.forEach(handleNotMines(row, col, (i, j) => this.matrix[i][j]--));
        this.neighbourDeltas.forEach(handleNotMines(newRow, newCol, (i, j) => this.matrix[i][j]++));
    }

    findMinePlace() {
        let row = randInt(this.rows);
        let col = randInt(this.cols);

        let tries = 0;
        const maxTries = 10;

        while (this.matrix[row][col] === MINE_VALUE + HIDDEN_OVERFLOW && tries < maxTries) {
            row = randInt(this.rows);
            col = randInt(this.cols);
            tries++;
        }

        return [row, col];
    }
    
    generateMap(cb?: (completePercent: number)=>void) {
        // this.matrix = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        this.matrix = new Matrix({
            rows: this.rows,
            cols: this.cols
        });
    
        let currNumOfOperations = 0;
        const totalNumOfOperations = this.cols * this.rows + this.mines;

        //random sampling
        const list: [number, number][] = [];
        let index = 0;

        for (let row = 0; row < this.matrix.rows; row++) {
            for (let col = 0; col < this.matrix.cols; col++) {
                const thisIndex = index;
                index++;

                if (index < this.mines) {
                    list.push([row, col]);
                } else {
                    const j = randInt(thisIndex);
                    if (j < this.mines) {
                        list[j] = [row, col];
                    }
                }
            }
        }

        list.forEach(([row, col]) => this.matrix[row][col] = MINE_VALUE);
    
        for (let row = 0; row < this.matrix.rows; row++) {
            currNumOfOperations += this.matrix.rows;

            if (cb) {
                cb(currNumOfOperations / totalNumOfOperations * 100);
            }

            for (let col = 0; col < this.matrix.cols; col++) {
                this.matrix[row][col] = this.calcValue(row, col) + HIDDEN_OVERFLOW
            }
        }

        return this.matrix;
    }
}
