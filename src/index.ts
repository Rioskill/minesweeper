import { GLBuffer } from "./buffer";
import { MINE_VALUE, HIDDEN_OVERFLOW } from "./consts";
import { displayBlock, setDisplayValue } from "./display/display";
import { GameEngine } from "./gameEngine";
import { GameMap } from "./gameMap";
import { GLRenderer } from "./glRenderer";
import { GameMenu } from "./menu";
import { CoordsT, makeCoords } from "./models";
import { PageElement, PageSwitcher } from "./pageElement";
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

const ROWL = 50;
const COLL = 50;

const CHUNKW = 40;
const CHUNKH = 40;

const setupWebGL = async (canvas: HTMLCanvasElement) => {
    // Getting the WebGL rendering context.

    /** @type {WebGLRenderingContext} */
    const gl: WebGLRenderingContext | null = canvas.getContext("webgl");

    if (!gl) {
        throw new Error('your browser does not support WebGL');
    }

    const vSourceP = fetch('/src/shaders/vertexShader.vs');
    const fSourceP = fetch('/src/shaders/fragmentShader.fs');

    const vSource = await vSourceP.then(source => source.text());
    const fSource = await fSourceP.then(source => source.text());

    const renderer = new GLRenderer({
        gl: gl,
        vertexShaderSource: vSource,
        fragmenShaderSource: fSource
    });

    return renderer;
    // gl.useProgram(null);
    // if (program) {
    //   gl.deleteProgram(program);
    // }
}

export type MapGeneratorData = {
    type: 'percent',
    value: number
} | {
    type: 'result',
    value: number[][]
}

const setupEvents = (engine: GameEngine) => {
    const mainView = engine.view;
    const canvas = mainView.canvas;

    const keyDown = document.addEventListener('keydown', event => {
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

    const mouseDown = canvas.addEventListener('mousedown', event => {
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

    const mouseMove = window.addEventListener('mousemove', event => {
        engine.processMouseMove(makeCoords(event.clientX, event.clientY));
    })

    const mouseUp = window.addEventListener('mouseup', () => {
        engine.processMouseUp();
    })

    const wheel = canvas.addEventListener('wheel', event => {
        engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
    })

    const resize = window.addEventListener('resize', () => {
        engine.view.updateCanvasCoords();
        engine.map.calcChunkSize(engine.view.viewSize);
        engine.loadVisibleChunks();
    })

    return {
        'keydown': keyDown,
        'mousedown': mouseDown,
        'mousemove': mouseMove,
        'mouseup': mouseUp,
        'wheel': wheel,
        'resize': resize
    }
}

const startGame = (engine: GameEngine) => {
    engine.loadVisibleChunks();

    requestAnimationFrame(() => engine.update());
}

interface onLoadingLoadProps {
    switcher: PageSwitcher,
    ROWS: number
    COLS: number
    MINES: number
}

const onLoadingLoad = ({switcher, ROWS, COLS, MINES}: onLoadingLoadProps) => {
    const progress = document.querySelector('progress');
    const percentIndicator = document.getElementById('percent-indicator');

    if (progress === null) {
        throw new Error('no progress bar on page');
    }

    progress.max = 100;

    if (percentIndicator === null) {
        throw new Error('no percent indicator on page');
    }

    const mapGenerationWorker = new Worker('build/gameMapGeneratorWorker.js');

    mapGenerationWorker.onmessage = (evt) => {
        const data: MapGeneratorData = evt.data;

        if (data.type === 'percent') {
            const val = Math.floor(data.value);
            progress.value = val;
            percentIndicator.textContent = `${val}%`;
        } else if(data.type === 'result') {
            mapGenerationWorker.terminate();
            
            switcher.changePage('playing', {
                ROWS,
                COLS,
                MINES,
                mapData: data.value,
                switcher
            });
        } else {
            console.log(data);
        }
    }

    mapGenerationWorker.postMessage({
        cols: COLS,
        rows: ROWS,
        mines: MINES
    });
}

interface onPlayingLoadProps extends onLoadingLoadProps {
    mapData: number[][]
}

const onPlayingLoad = ({ROWS, COLS, MINES, mapData, switcher}: onPlayingLoadProps) => {
    const canvasContainer = document.querySelector(".canvas-container") as HTMLElement;
    const canvas = document.querySelector("canvas")!;

    document.documentElement.style.setProperty("--max-view-width", `${COLL * COLS + 14}px`);
    document.documentElement.style.setProperty("--max-view-height", `${ROWL * ROWS + 14}px`);

    const btn = document.getElementById('restart-btn');
    btn?.addEventListener('click', () => {
        switcher.changePage('loading', {
            ROWS,
            COLS,
            MINES,
            switcher
        });
    })

    if (canvas === null) {
        throw new Error('canvas is null');
    }

    const map = new GameMap({
        ROWS,
        COLS,
        ROWL,
        COLL,
        CHUNKH,
        CHUNKW
    });

    map.minesRemaining = MINES;
    map.minesTotal = MINES;

    const timerDisplay = document.getElementById('timer-display');
    const minesCntDisplay = document.getElementById('mines-cnt-display');
    const restartBtn = document.getElementById('restart-btn');
    
    const menu = new GameMenu({
        minesDisplay: minesCntDisplay!,
        timerDisplay: timerDisplay!,
        restartBtn: restartBtn!
    });

    menu.setMinesDisplayValue(map.minesRemaining);
    menu.setTimerDisplayValue(0);
    menu.startTimer();

    map.onMinesRemainingUpdate = menu.setMinesDisplayValue.bind(menu);

    // map.map = data.value;
    map.map = mapData;

    setupWebGL(canvas).then(renderer => {
        if (renderer === undefined) {
            throw new Error('no renderer');   
        };

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
    
        map.calcChunkSize(mainView.viewSize);
    
        const engine = new GameEngine({
            map: map,
            view: mainView,
            renderer: renderer
        })

        mainView.onOffsetUpdate = () => engine.loadVisibleChunks();

        setupEvents(engine);

        engine.onGameOver = (status) => {
            menu.stopTimer();

            if (status === 'win') {
                menu.setRestartBtnStatus('cool');
            } else {
                menu.setRestartBtnStatus('dead');
            }
        }

        startGame(engine);
    })
}

const numberInputBlock = (label: string, inputParams?: any): PageElement => ({
    tag: 'div',
    class: 'input-block',
    children: [
        {
            tag: 'label',
            text: label
        },
        {
            tag: 'input',
            params: {
                'type': 'number',
                ...inputParams
            }
        },
    ]
})

const main = () => {
    const entryPoint = document.getElementById('main');

    if (entryPoint === null) {
        throw new Error('entrypoint not found');
    }

    let cols = 9;
    let rows = 9;
    let mines = 3;

    const colsInputOnChange = (ev) => {
        cols = parseInt(ev.target.value);
        
        const minesInput = document.getElementById('mines-input') as HTMLInputElement;

        minesInput.max = (rows * cols).toString();
    }

    const rowsInputOnchange = (ev) => {
        rows = parseInt(ev.target.value);
        const minesInput = document.getElementById('mines-input') as HTMLInputElement;

        minesInput.max = (rows * cols).toString();
    }

    const minesInputOnChange = (ev) => {
        mines = parseInt(ev.target.value);
    }

    let submitGameParams: (()=>void) | undefined = undefined;
    const onSubmit = () => submitGameParams!();

    const pages = {
        'playing': {
            tag: 'div',
            class: 'main-container',
            onLoad: onPlayingLoad,
            children: [
                {
                    tag: 'div',
                    class: 'menu',
                    children: [
                        displayBlock('mines-cnt-display'),
                        {
                            tag: 'button',
                            id: 'restart-btn',
                            children: [
                                {
                                    tag: 'img',
                                    params: {
                                        src: 'textures/smiles/regular.png',
                                        alt: 'you win. Restart'
                                    }
                                }
                            ]
                        },
                        displayBlock('timer-display'),
                    ]
                },
                {
                    tag: 'div',
                    class: 'canvas-container',
                    children: [
                        {
                            tag: 'canvas',
                            id: 'canvas'
                        }
                    ]
                }
            ]
        },
        'loading': {
            tag: 'div',
            class: 'progressbar-container',
            onLoad: onLoadingLoad,
            children: [
                {
                    tag: 'label',
                    text: 'Generating map'
                },
                {
                    tag: 'div',
                    class: 'progressbar',
                    children: [
                        {
                            tag: 'progress',
                        },
                        {
                            tag: 'span',
                            id: 'percent-indicator',
                            text: '0%'
                        }
                    ]
                }
            ]
        },
        'mainMenu': {
            tag: 'div',
            class: 'main-menu',
            children: [
                {
                    tag: 'div',
                    class: 'main-menu__input-block',
                    children: [
                        numberInputBlock('cols', {
                            id: 'cols-input',
                            min: 9,
                            value: 9,
                            
                        }),
                        numberInputBlock('rows', {
                            id: 'rows-input',
                            min: 9,
                            value: 9,
                            
                        }),
                        numberInputBlock('mines', {
                            id: 'mines-input',
                            value: 3,
                            min: 0,
                            max: 81,
                        }),
                    ]
                },
                {
                    tag: 'button',
                    class: 'btn',
                    id: 'submit',
                    text: 'Начать игру'
                }
            ],
            onLoad: () => {
                const colsInput = document.getElementById('cols-input');
                const rowsInput = document.getElementById('rows-input');
                const minesInput = document.getElementById('mines-input');
                const submitBtn = document.getElementById('submit');

                colsInput?.addEventListener('change', colsInputOnChange);
                rowsInput?.addEventListener('change', rowsInputOnchange);

                minesInput?.addEventListener('change', minesInputOnChange);

                submitBtn?.addEventListener('click', onSubmit);
            },
            onUnload: () => {
                const colsInput = document.getElementById('cols-input');
                const rowsInput = document.getElementById('cols-input');
                const minesInput = document.getElementById('mines-input');
                const submitBtn = document.getElementById('submit');

                colsInput?.removeEventListener('change', colsInputOnChange);
                rowsInput?.removeEventListener('change', rowsInputOnchange);

                minesInput?.removeEventListener('change', minesInputOnChange);

                submitBtn?.removeEventListener('click', onSubmit);
            }
        }
    }

    const switcher = new PageSwitcher({
        entryPoint,
        pages: pages,
        initialPage: 'mainMenu'
    });

    submitGameParams = () => {
        console.log('submit', {
            COLS: cols,
            ROWS: rows,
            MINES: mines,
            switcher
        })
        switcher.changePage('loading', {
            COLS: cols,
            ROWS: rows,
            MINES: mines,
            switcher
        })
    }

}

window.addEventListener('load', function onLoadListener() {
    window.removeEventListener('load', onLoadListener, false);
    main();
})
