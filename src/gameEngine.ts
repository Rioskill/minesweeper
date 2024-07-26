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
        // this.loadVisibleChunks();

        this.renderer.render({
            viewportSize: this.view.viewSize,
            fullSize: this.view.fullSize,
            viewSize: this.view.viewSize,
            offset: this.view.offset,

            COLS: this.map.COLS,
            ROWS: this.map.ROWS,
            minesVisible: this.minesVisible,
            cb: ()=>this.update()
        })
    }
}
