import { COLL, ROWL } from "../consts";
import { GameMap } from "../gameMap";
import { CoordsT, makeCoords } from "../models";
import { Renderer, RenderProps } from "./models";

interface CanvasRendererProps {
    ctx: CanvasRenderingContext2D
}

export class CanvasRenderer implements Renderer{
    ctx: CanvasRenderingContext2D
    img: HTMLImageElement
    cellW: number

    constructor(props: CanvasRendererProps) {
        this.ctx = props.ctx;

        this.img = new Image();

        this.img.addEventListener('load', () => {
            this.cellW = this.img.naturalWidth / 11;
        })

        this.img.src = "/textures/digits.png";
    }

    updateOffset(map: GameMap, offset: CoordsT) {

    }

    drawCell(n: number, pos: CoordsT) {
        this.ctx.drawImage(
            this.img,                           // src
            this.cellW * n, 0,                  // img coords
            this.cellW, this.img.naturalHeight, // img size
            pos.x, pos.y,                       // canvas coords
            COLL, ROWL                          // size on canvas
        );
    }

    render(props: RenderProps) {
        this.ctx.fillStyle="rgb(255, 0, 255)";
        this.ctx.fillRect(0, 0, props.viewSize.x, props.viewSize.y);

        // this.drawCell(4, makeCoords(0, 0));

        const topLeft = {
            x: Math.floor(props.offset.x / COLL),
            y: Math.floor((props.offset.y) / ROWL)
        };

        const bottomRight = {
            x: Math.min(Math.floor((props.offset.x + props.viewSize.x) / COLL) + 1, props.COLS),
            y: Math.min(Math.floor((props.offset.y + props.viewSize.y) / ROWL) + 1, props.ROWS)
        }

        const convertVal = (val: number) => {
            if (val >= 150) {
                return val - 150;
            }
            if (val >= 100) {
                return val - 100;
            }

            return val;
        }

        // console.log(topLeft, bottomRight)

        // console.log(props.offset.y / ROWL)

        for(let i = topLeft.y; i < bottomRight.y; i++) {
            for(let j = topLeft.x; j < bottomRight.x; j++) {
                const val = convertVal(props.map.map[i][j]);

                const pos = {
                    x: j * COLL - props.offset.x,
                    y: props.viewSize.y - (i + 1) * ROWL + props.offset.y
                }

                // console.log(i, j)

                this.drawCell(val, pos);
            }
        }
    }

    destruct() {

    }
}
