import { displayBlock } from "../display/display";
import { GameEngine } from "../gameEngine";
import { GameMap } from "../gameMap";
import { makeCoords } from "../models";
import { COLL, ROWL, CHUNKW, CHUNKH } from "../consts";
import { GameMenu } from "../menu";
import { GLRenderer } from "../glRenderer";
import { MinesweeperView } from "../view";
import { Page } from "../page";
import { onLoadingLoadProps } from "./loadingPage";

interface onPlayingLoadProps extends onLoadingLoadProps {
    mapData: number[][]
}

export class PlayingPage implements Page {
    events: {[key: string]: {
        target: any,
        listener: EventListener
    }}

    setupEvents(engine: GameEngine) {
        const mainView = engine.view;
        const canvas = mainView.canvas;

        this.events = {
            'keydown': {
                target: document,
                listener: event => {
                    if (event.code === 'ArrowLeft') {
                        mainView.updateOffset(makeCoords(-10, 0));
                    } else if (event.code === 'ArrowRight') {
                        mainView.updateOffset(makeCoords(10, 0));
                    } else if (event.code === 'ArrowDown') {
                        mainView.updateOffset(makeCoords(0, -10));
                    } else if (event.code === 'ArrowUp') {
                        mainView.updateOffset(makeCoords(0, 10));
                    }
                }
            },
            'mousedown': {
                target: canvas,
                listener: event => {
                    const coords = {
                        x: event.clientX - mainView.canvasCoords.x,
                        y: event.clientY - mainView.canvasCoords.y
                    };
            
                    if (event.button === 0) {
                        engine.processLeftClick(coords);
                    } else if (event.button === 2) {
                        engine.processRightClick(coords);
                    }
                }
            },
            'mousemove': {
                target: window,
                listener: event => {
                    engine.processMouseMove(makeCoords(event.clientX, event.clientY));
                }
            },
            'mouseup': {
                target: window,
                listener: () => {
                    engine.processMouseUp();
                }
            },
            'wheel': {
                target: canvas,
                listener: event => {
                    engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
                }
            },
            'resize': {
                target: window,
                listener: () => {
                    engine.view.updateCanvasCoords();
                    engine.map.calcChunkSize(engine.view.viewSize);
                    engine.loadVisibleChunks();
                }
            }
        }

        Object.entries(this.events).forEach(([name, {target, listener}]) => {
            target.addEventListener(name, listener);
        })
    
        // const keyDown = document.addEventListener('keydown', event => {
        //     if (event.code === 'ArrowLeft') {
        //         mainView.updateOffset(makeCoords(-10, 0));
        //     } else if (event.code === 'ArrowRight') {
        //         mainView.updateOffset(makeCoords(10, 0));
        //     } else if (event.code === 'ArrowDown') {
        //         mainView.updateOffset(makeCoords(0, -10));
        //     } else if (event.code === 'ArrowUp') {
        //         mainView.updateOffset(makeCoords(0, 10));
        //     }
        // })
    
        // const mouseDown = canvas.addEventListener('mousedown', event => {
        //     const coords = {
        //         x: event.clientX - mainView.canvasCoords.x,
        //         y: event.clientY - mainView.canvasCoords.y
        //     };
    
        //     if (event.button === 0) {
        //         engine.processLeftClick(coords);
        //     } else if (event.button === 2) {
        //         engine.processRightClick(coords);
        //     }
        // })
    
        // const mouseMove = window.addEventListener('mousemove', event => {
        //     engine.processMouseMove(makeCoords(event.clientX, event.clientY));
        // })
    
        // const mouseUp = window.addEventListener('mouseup', () => {
        //     engine.processMouseUp();
        // })
    
        // const wheel = canvas.addEventListener('wheel', event => {
        //     engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
        // })
    
        // const resize = window.addEventListener('resize', () => {
        //     engine.view.updateCanvasCoords();
        //     engine.map.calcChunkSize(engine.view.viewSize);
        //     engine.loadVisibleChunks();
        // })
    
        // this.events = {
        //     'keydown': keyDown,
        //     'mousedown': mouseDown,
        //     'mousemove': mouseMove,
        //     'mouseup': mouseUp,
        //     'wheel': wheel,
        //     'resize': resize
        // }
    }

    async setupWebGL(canvas: HTMLCanvasElement) {
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

    onLoad({ROWS, COLS, MINES, mapData, switcher}: onPlayingLoadProps) {
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
    
        this.setupWebGL(canvas).then(renderer => {
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
    
            this.setupEvents(engine);
    
            engine.onGameOver = (status) => {
                menu.stopTimer();
    
                if (status === 'win') {
                    menu.setRestartBtnStatus('cool');
                } else {
                    menu.setRestartBtnStatus('dead');
                }
            }
    
            this.startGame(engine);
        })
    }

    startGame(engine: GameEngine) {
        engine.loadVisibleChunks();
    
        requestAnimationFrame(() => engine.update());
    }

    render() {
        return {
            tag: 'div',
            class: 'main-container',
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
        }
    }
}
