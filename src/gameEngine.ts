import { GameMap } from "./gameMap";

interface GameEngineProps {
    map: GameMap
}

class GameEngine {
    map: GameMap

    

    constructor(props: GameEngineProps) {
        this.map = props.map;
    }


}
