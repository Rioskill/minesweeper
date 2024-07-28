import { GLBuffer } from "./buffer";
import { MINE_VALUE, HIDDEN_OVERFLOW } from "./consts";
import { GameEngine } from "./gameEngine";
import { GameMap } from "./gameMap";
import { GLRenderer } from "./glRenderer";
import { CoordsT, makeCoords } from "./models";
import { loadTexture } from "./texture";
import { addVectors, permutations, randInt, range } from "./utils";
import { MinesweeperView } from "./view";

// const ROWS = 10000;
// const COLS = 10000;

const ROWS = 2000;
const COLS = 2000;


// const ROWS = 1000;
// const COLS = 1000;

// const ROWS = 50;
// const COLS = 50;

// const MINES = 10000000;

const MINES = 400000;

// const MINES = 50;

// const MINES = 10;

const ROWL = 50;
const COLL = 50;

const CHUNKW = 40;
const CHUNKH = 40;

type PageName = 'loading' | 'playing';

type PageElement = {
    tag: string,
    class?: string
    id?: string
    children?: PageElement[]
}

const createPage = (element: PageElement) => {
    const el = document.createElement(element.tag);

    if (element.class) {
        el.className = element.class;
    }

    if (element.id) {
        el.id = element.id;
    }

    element.children?.forEach(child => {
        el.appendChild(createPage(child));
    });

    return el;
}

interface PageProps {
    entryPoint: HTMLElement;
    pages: { [key: string]: PageElement }
}

class PageSwitcher {
    entryPoint: HTMLElement;
    currentPage: PageName;
    pages: { [key: string]: PageElement }

    constructor(props: PageProps) {
        this.currentPage = 'playing';
        this.entryPoint = props.entryPoint;
        this.pages = props.pages;
    }

    buildLayout() {
        this.entryPoint.innerHTML = "";
        this.entryPoint.appendChild(createPage(this.pages[this.currentPage]));
    }

    changePage(pageName: PageName) {
        if (pageName === this.currentPage) {
            return;
        }

        this.currentPage = pageName;
        this.buildLayout();
    }
}

// window.addEventListener(
//     "load",
const setupWebGL = () => {
    console.log('setting up webGL')
    // Cleaning after ourselves. The event handler removes
    // itself, because it only needs to run once.
    // window.removeEventListener(evt.type, setupWebGL, false);

    // References to the document elements.
    const canvas = document.querySelector("canvas");

    if (canvas === null) {
        console.error('canvas is null');
        return;
    }

    // Getting the WebGL rendering context.

    /** @type {WebGLRenderingContext} */
    const gl: WebGLRenderingContext | null = canvas.getContext("webgl");

    // If failed, inform user of failure. Otherwise, initialize
    // the drawing buffer (the viewport) and clear the context
    // with a solid color.
    if (!gl) {
        console.error('your browser does not support WebGL')
        return;
    }

    const vSource = document.querySelector("#vertex-shader");

    if (vSource === null) {
        console.error('no vertex shader');
        return;
    }

    const fSource = document.querySelector("#fragment-shader");

    if (fSource === null) {
        console.error('no fragment shader');
        return;
    }

    const renderer = new GLRenderer({
        gl: gl,
        vertexShaderSource: vSource.innerHTML,
        fragmenShaderSource: fSource.innerHTML
    });

    const map = new GameMap({
        ROWS,
        COLS,
        ROWL,
        COLL,
        CHUNKH,
        CHUNKW
    });

    map.generateMap(MINES);

    console.log('map', map.map);
    canvas.oncontextmenu = () => false;

    const mainView = new MinesweeperView({
        fullSize: {
            x: COLL * COLS,
            y: ROWL * ROWS
        },
        viewSize: {
            x: canvas.clientWidth,
            y: canvas.clientHeight
        },
        canvas: canvas
    })

    const engine = new GameEngine({
        map: map,
        view: mainView,
        renderer: renderer
    })

    mainView.onOffsetUpdate = () => engine.loadVisibleChunks();

    document.addEventListener('keydown', event => {
        if (event.code === 'ArrowLeft') {
            mainView.updateOffset(makeCoords(-10, 0));
        } else if (event.code === 'ArrowRight') {
            mainView.updateOffset(makeCoords(10, 0));
        } else if (event.code === 'ArrowDown') {
            mainView.updateOffset(makeCoords(0, -10));
        } else if (event.code === 'ArrowUp') {
            mainView.updateOffset(makeCoords(0, 10));
        }
    })

    window.addEventListener('resize', () => {
        mainView.updateCanvasCoords();
    })

    canvas.addEventListener('mousedown', event => {
        const coords = {
            x: event.clientX - mainView.canvasCoords.x,
            y: event.clientY - mainView.canvasCoords.y
        };

        if (event.button === 0) {
            engine.processLeftClick(coords);
        } else if (event.button === 2) {
            engine.processRightClick(coords);
        }
    })

    window.addEventListener('mousemove', event => {
        engine.processMouseMove(makeCoords(event.clientX, event.clientY));
    })

    window.addEventListener('mouseup', () => {
        engine.processMouseUp();
    })

    canvas.addEventListener('wheel', event => {
        engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
    })

    engine.loadVisibleChunks();

    requestAnimationFrame(() => engine.update());

    // gl.useProgram(null);
    // if (program) {
    //   gl.deleteProgram(program);
    // }
}
// },
// false,
// );

const main = () => {
    const entryPoint = document.getElementById('main');

    if (entryPoint === null) {
        throw new Error('entrypoint not found');
    }

    const pages = {
        'playing': {
            tag: 'div',
            class: 'canvas-container',
            children: [
                {
                    tag: 'canvas',
                    id: 'canvas'
                }
            ]
        },
    }

    const switcher = new PageSwitcher({
        entryPoint,
        pages: pages
    });

    switcher.buildLayout();

    setupWebGL();
}

window.addEventListener('load', () => {
    main();
})
