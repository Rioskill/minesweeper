import { GameMap } from "../gameMap"
import { CoordsT } from "../models"
import { MinesweeperView } from "../view"

export interface RenderProps {
    viewportSize: CoordsT
    view: MinesweeperView
    // fullSize: CoordsT
    // viewSize: CoordsT
    // offset: CoordsT
    COLS: number
    ROWS: number

    minesVisible: boolean
    map: GameMap
}

export interface Renderer {
    updateOffset: (map: GameMap, offset: CoordsT)=>void
    destruct: ()=>void;
    render: (props: RenderProps)=>void
}
