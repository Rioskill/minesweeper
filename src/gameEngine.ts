import { HIDDEN_OVERFLOW, MINE_VALUE } from "./consts";
import { GameMap } from "./gameMap";
import { GLRenderer } from "./glRenderer";
import { CoordsT, makeCoords } from "./models";
import { addVectors } from "./utils";
import { MinesweeperView } from "./view";

interface GameEngineProps {
    map: GameMap
    view: MinesweeperView
    renderer: GLRenderer
}

export class GameEngine {
    map: GameMap
    view: MinesweeperView
    renderer: GLRenderer

    minesVisible: boolean
    currentBaseChunk: CoordsT

    constructor(props: GameEngineProps) {
        this.map = props.map;
        this.view = props.view;
        this.renderer = props.renderer;

        this.minesVisible = false;
        this.currentBaseChunk = makeCoords(0, 0);
    }

    loadVisibleChunks() {
        const chunkDeltas = [
            makeCoords(0, 0),
            makeCoords(0, 1),
            makeCoords(1, 0),
            makeCoords(1, 1)
        ]

        const chunk = this.map.getChunk(this.view.offset);

        if (chunk !== this.currentBaseChunk) {
            this.currentBaseChunk = chunk;

            this.renderer.loadChunks(
                this.map,
                chunkDeltas.map(delta => addVectors(chunk, delta))
            )
        }
    }

    update() {
        this.view.updateViewSize();

        this.renderer.render({
            viewportSize: this.view.viewSize,
            fullSize: this.view.fullSize,
            viewSize: this.view.viewSize,
            offset: this.view.offset,

            COLS: this.map.COLS,
            ROWS: this.map.ROWS,
            minesVisible: this.minesVisible,
        })

        requestAnimationFrame(() => this.update());
    }

    getTileFromMouseCoords(coords: CoordsT) {
        return {
            x: Math.floor((coords.x + this.view.offset.x) / this.map.COLL),
            y: Math.floor((this.view.viewSize.y - coords.y + this.view.offset.y) / this.map.ROWL)
        }
    }

    processLeftClick(coords: CoordsT) {
        const collision = this.view.processScrollClick(coords);

        console.log(collision)
        if (!collision) {
            const tile = this.getTileFromMouseCoords(coords)

            this.openTile(tile);
        }
    }

    showAllMines() {
        this.minesVisible = true;
    }

    processRightClick(coords: CoordsT) {
        const tile = this.getTileFromMouseCoords(coords);

        this.map.toggleFlagAt(tile);

        this.loadVisibleChunks();
    }

    openTile(tileCoords: CoordsT) {
        const val = this.map.getMapVal(tileCoords);

        if (this.map.isHidden(val) && val !== HIDDEN_OVERFLOW) {
            this.map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;

            if (this.map.getMapVal(tileCoords) === MINE_VALUE) {
                this.showAllMines();
            }

            this.loadVisibleChunks();
        } else if (val === HIDDEN_OVERFLOW) {
            const q: CoordsT[] = [];

            q.push(tileCoords);

            const coordsDeltas = [
                makeCoords(-1, 0),
                makeCoords(0, -1),
                makeCoords(1, 0),
                makeCoords(0, 1)
            ]

            const processTile = (tileCoords: CoordsT) => {
                this.map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;
                
                if (this.map.map[tileCoords.y][tileCoords.x] > 0) {
                    return;
                }

                const coords = coordsDeltas.map(delta => addVectors(tileCoords, delta));

                coords.forEach(coord => {
                    if (this.map.tileInBounds(coord)) {
                        const val = this.map.getMapVal(coord);
                        if (val >= HIDDEN_OVERFLOW && val !== HIDDEN_OVERFLOW + MINE_VALUE) {
                            q.push(coord);
                        }
                    }
                })
            }

            const processTilesFromQueue = (queue: CoordsT[], num: number) => {
                for (let i = 0; i < num && queue.length > 0; i++) {
                    const curr = q.shift();

                    if (curr === undefined || this.map.map[curr.y][curr.x] < HIDDEN_OVERFLOW) {
                        continue;
                    }

                    processTile(curr);
                }

                if (queue.length > 0) {
                    setTimeout(()=>processTilesFromQueue(queue, num), 0);
                }

                this.loadVisibleChunks();
            }

            processTilesFromQueue(q, 1000);
        }
    }

    processMouseMove(mouseCoords: CoordsT) {
        this.view.processScrollMove(mouseCoords);
    }

    processMouseUp() {
        this.view.processMouseUp();
    }

    processWheel(offsetDelta: CoordsT) {
        this.view.updateOffset(offsetDelta);
    }

}
