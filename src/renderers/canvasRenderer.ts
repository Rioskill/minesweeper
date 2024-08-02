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
    stroke: number

    constructor(props: CanvasRendererProps) {
        this.ctx = props.ctx;

        this.img = new Image();

        this.img.addEventListener('load', () => {
            this.cellW = this.img.naturalWidth / 11;
        })

        this.img.src = "/textures/digits.png";

        this.stroke = 2;
    }

    updateOffset(map: GameMap, offset: CoordsT) {

    }

    drawClosedTile(pos: CoordsT) {
        const s = this.stroke / 2;

        this.ctx.lineWidth = this.stroke;

        this.ctx.fillStyle = "rgb(204, 196, 179)";
        this.ctx.fillRect(
            pos.x, pos.y,
            COLL, ROWL
        );

        
        this.ctx.strokeStyle = "black";
        this.ctx.beginPath();

        this.ctx.moveTo(pos.x + s, pos.y + ROWL - s);
        this.ctx.lineTo(pos.x + COLL - s, pos.y + ROWL - s);
        this.ctx.lineTo(pos.x + COLL - s, pos.y + s);

        this.ctx.stroke();

        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();

        this.ctx.moveTo(pos.x + COLL - s, pos.y + s);
        this.ctx.lineTo(pos.x + s, pos.y + s);
        this.ctx.lineTo(pos.x + s, pos.y + ROWL - s);

        this.ctx.stroke();
    }

    drawTile(n: number, pos: CoordsT) {
        const s = this.stroke / 2;

        if (n >= 100) {
            this.drawClosedTile(pos);
            if (n <= 110) {
                return;
            }
            n = 9;
        }

        this.ctx.drawImage(
            this.img,                           // src
            this.cellW * n, 0,                  // img coords
            this.cellW, this.img.naturalHeight, // img size
            pos.x, pos.y,                       // canvas coords
            COLL , ROWL                         // size on canvas
        );

        if (n !== 9) {
            this.ctx.lineWidth = this.stroke;
            this.ctx.strokeStyle = "rgb(179, 179, 179)";
    
            this.ctx.strokeRect(
                pos.x + s, pos.y + s,
                COLL - this.stroke, ROWL - this.stroke
            );
        }

    }

    render(props: RenderProps) {
        this.ctx.fillStyle="rgb(255, 0, 255)";
        this.ctx.fillRect(0, 0, props.viewSize.x, props.viewSize.y);

        const topLeft = {
            x: Math.floor(props.offset.x / COLL),
            y: Math.floor((props.offset.y) / ROWL)
        };

        const bottomRight = {
            x: Math.min(Math.floor((props.offset.x + props.viewSize.x) / COLL) + 1, props.COLS),
            y: Math.min(Math.floor((props.offset.y + props.viewSize.y) / ROWL) + 1, props.ROWS)
        }

        for(let i = topLeft.y; i < bottomRight.y; i++) {
            for(let j = topLeft.x; j < bottomRight.x; j++) {
                const val = props.map.map[i][j];

                const pos = {
                    x: j * COLL - props.offset.x,
                    y: props.viewSize.y - (i + 1) * ROWL + props.offset.y
                }

                this.drawTile(val, pos);
            }
        }
    }

    destruct() {

    }
}
