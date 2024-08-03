import { HIDDEN_OVERFLOW, MINE_VALUE } from "./consts";
import { GameMap } from "./gameMap";
import { GLRenderer } from "./renderers/glRenderer";
import { CoordsT, makeCoords } from "./models";
import { addVectors } from "./utils";
import { MinesweeperView } from "./view";
import { Renderer } from "./renderers/models";

interface GameEngineProps {
    map: GameMap
    view: MinesweeperView
    renderer: Renderer
}

export class GameEngine {
    map: GameMap
    view: MinesweeperView
    renderer: Renderer

    minesVisible: boolean

    gameGoing: boolean
    onGameOver: (status: 'win' | 'lose')=>void

    openedTiles: number

    constructor(props: GameEngineProps) {
        this.map = props.map;
        this.view = props.view;
        this.renderer = props.renderer;

        this.minesVisible = false;

        this.gameGoing = true;

        this.openedTiles = 0;
    }

    stopGame(status: 'win' | 'lose' = 'lose') {
        this.gameGoing = false;
        this.showAllMines();
        this.onGameOver(status);
    }

    updateOffset() {
        this.renderer.updateOffset(this.map, this.view.offset);
    }

    update() {
        this.view.updateViewSize();

        this.renderer.render({
            viewportSize: this.view.viewSize,

            view: this.view,

            COLS: this.map.COLS,
            ROWS: this.map.ROWS,
            minesVisible: this.minesVisible,
            map: this.map,
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

        if (!collision && this.gameGoing) {
            const tile = this.getTileFromMouseCoords(coords)

            this.openTile(tile);
        }
    }

    showAllMines() {
        this.minesVisible = true;
    }

    processRightClick(coords: CoordsT) {
        if(!this.gameGoing) {
            return;
        }

        const tile = this.getTileFromMouseCoords(coords);

        this.map.toggleFlagAt(tile);

        this.updateOffset();
    }

    updateOpenedTilesCnt(cnt: number = 1) {
        this.openedTiles++;

        if (this.openedTiles === this.map.tilesCnt - this.map.minesTotal) {
            this.stopGame('win');
        }
    }

    openTile(tileCoords: CoordsT) {
        const val = this.map.getMapVal(tileCoords);

        if (this.map.isHidden(val) && val !== HIDDEN_OVERFLOW) {
            this.map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;
            
            if (this.map.getMapVal(tileCoords) === MINE_VALUE) {
                this.stopGame();
            }
            
            this.updateOpenedTilesCnt();
            
            this.updateOffset();
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
                this.updateOpenedTilesCnt();
                
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

                this.updateOffset();
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
