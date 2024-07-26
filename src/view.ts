import { CoordsT, makeCoords } from "./models"
import { addVectors, clamp, clampCoords, getCollisionPos, substractVectors } from "./utils"

interface MinesweeperViewProps {
    fullSize: CoordsT
    viewSize: CoordsT
    offset?: CoordsT

    canvas: HTMLCanvasElement

    onOffsetUpdate?: () => void;
}

export class MinesweeperView {
    fullSize: CoordsT;
    viewSize: CoordsT;
    offset: CoordsT;

    canvas: HTMLCanvasElement;

    onOffsetUpdate?: () => void;

    constructor(props: MinesweeperViewProps) {
        this.fullSize = props.fullSize;
        this.viewSize = props.viewSize;
        this.offset = props.offset || { x: 0, y: 0 };

        this.canvas = props.canvas;
    }

    get canvasCoords() {
        const coords = this.canvas.getBoundingClientRect();
        return {
            x: coords.x,
            y: coords.y
        };
    }

    get HScrollCoords() {
        const x = this.offset.x / this.fullSize.x;
        const y = this.viewSize.y - 10;

        const x2 = (this.offset.x + this.viewSize.x) / this.fullSize.x * this.viewSize.x;
        const y2 = this.viewSize.y;

        return {
            x,
            y,
            x2,
            y2,
            width: x2 - x,
            height: y2 - y
        }
    }

    get VScrollCoords() {
        const x = this.viewSize.x - 10;
        const y2 = this.viewSize.y - this.offset.y / this.fullSize.y;

        const x2 = this.viewSize.x;
        const y = this.viewSize.y - (this.offset.y + this.viewSize.y) / this.fullSize.y * this.viewSize.y;

        return {
            x,
            y,
            x2,
            y2,
            width: x2 - x,
            height: y2 - y
        }
    }

    getHCollisionPos(pos: CoordsT) {
        return getCollisionPos(pos, this.HScrollCoords);
    }

    getVCollisionPos(pos: CoordsT) {
        return getCollisionPos(pos, this.VScrollCoords)
    }

    setOffsetX(x: number) {
        this.offset.x = clamp(0, x, this.fullSize.x - this.viewSize.x);

        if (this.onOffsetUpdate !== undefined) {
            this.onOffsetUpdate();
        }
    }

    setOffsetY(y: number) {
        this.offset.y = clamp(0, y, this.fullSize.y - this.viewSize.y);

        if (this.onOffsetUpdate !== undefined) {
            this.onOffsetUpdate();
        }
    }

    setOffset(update: CoordsT) {
        const minCoords = makeCoords(0, 0);
        const maxCoords = substractVectors(this.fullSize, this.viewSize);

        this.offset = clampCoords(minCoords, update, maxCoords);

        if (this.onOffsetUpdate !== undefined) {
            this.onOffsetUpdate();
        }
    }

    updateOffset(update: CoordsT) {
        this.setOffset(addVectors(this.offset, update));
    }

    updateViewSize() {
        this.viewSize = {
            x: this.canvas.clientWidth,
            y: this.canvas.clientHeight
        }

        this.canvas.width = this.viewSize.x;
        this.canvas.height = this.viewSize.y;
    }
}
