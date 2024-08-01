import { GLBuffer } from "./buffer";
import { MINE_VALUE, HIDDEN_OVERFLOW } from "./consts";
import { displayBlock, setDisplayValue } from "./display/display";
import { GameEngine } from "./gameEngine";
import { GameMap } from "./gameMap";
import { GLRenderer } from "./glRenderer";
import { GameMenu } from "./menu";
import { CoordsT, makeCoords } from "./models";
import { Page } from "./page";
import { PageElement, PageName, PageSwitcher } from "./pageElement";
import { LoadingPage } from "./pages/loadingPage";
import { MenuPage } from "./pages/menuPage";
import { PlayingPage } from "./pages/playingPage";
import { loadTexture } from "./texture";
import { addVectors, permutations, randInt, range } from "./utils";
import { MinesweeperView } from "./view";

// const ROWS = 10000;
// const COLS = 10000;

// const ROWS = 9;
// const COLS = 9;

// const MINES = 3;

// const ROWS = 2000;
// const COLS = 2000;

// const ROWS = 50;
// const COLS = 50;

// const MINES = 10000000;

// const MINES = 400000;

// const MINES = 200;

// const MINES = 10;

export type MapGeneratorData = {
    type: 'percent',
    value: number
} | {
    type: 'result',
    value: number[][]
}

const main = () => {
    const entryPoint = document.getElementById('main');

    if (entryPoint === null) {
        throw new Error('entrypoint not found');
    }

    const pages = {
        'mainMenu': new MenuPage(),
        'loading': new LoadingPage(),
        'playing': new PlayingPage(),
    }

    const switcher = new PageSwitcher({
        entryPoint,
        pages: pages,
    });

    switcher.changePage('mainMenu', switcher);
}

window.addEventListener('load', function onLoadListener() {
    window.removeEventListener('load', onLoadListener, false);
    main();
})
