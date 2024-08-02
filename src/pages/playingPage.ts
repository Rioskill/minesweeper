import { displayBlock } from "../display/display";
import { GameEngine } from "../gameEngine";
import { GameMap } from "../gameMap";
import { makeCoords } from "../models";
import { COLL, ROWL, CHUNKW, CHUNKH } from "../consts";
import { GameMenu } from "../menu";
import { GLRenderer } from "../renderers/glRenderer";
import { MinesweeperView } from "../view";
import { Page } from "../page";
import { onLoadingLoadProps } from "./loadingPage";
import { PageSwitcher } from "../pageElement";
import { CanvasRenderer } from "../renderers/canvasRenderer";
import { Renderer } from "../renderers/models";

interface onPlayingLoadProps extends onLoadingLoadProps {
    mapData: number[][]
}

export class PlayingPage implements Page {
    events: {
        name: string,
        target: any,
        listener: EventListener
    }[]

    engine: GameEngine | undefined;
    renderer: Renderer | undefined;

    setupEvents(engine: GameEngine, {ROWS, COLS, MINES, mapData, switcher}: onPlayingLoadProps) {
        const mainView = engine.view;
        const canvas = mainView.canvas;

        const restartBtn = document.getElementById('restart-btn');

        const glBtn = document.getElementById('gl-btn');
        const canvasBtn = document.getElementById('canvas-btn');

        this.events = [
            {
                name: 'keydown',
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
            {
                name: 'mousedown',
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
            {
                name: 'mousemove',
                target: window,
                listener: event => {
                    engine.processMouseMove(makeCoords(event.clientX, event.clientY));
                }
            },
            {
                name: 'mouseup',
                target: window,
                listener: () => {
                    engine.processMouseUp();
                }
            },
            {
                name: 'wheel',
                target: canvas,
                listener: event => {
                    engine.processWheel(makeCoords(event.deltaX, -event.deltaY));
                }
            },
            {
                name: 'resize',
                target: window,
                listener: () => {
                    engine.view.updateCanvasCoords();
                    engine.map.calcChunkSize(engine.view.viewSize);
                    engine.updateOffset();
                }
            },
            {
                name: 'click',
                target: restartBtn,
                listener: () => {
                    switcher.changePage('loading', {
                        ROWS,
                        COLS,
                        MINES,
                        switcher
                    });
                }
            },
            {
                name: 'click',
                target: glBtn,
                listener: () => {
                    this.setRenderer('gl');
                }
            },
            {
                name: 'click',
                target: canvasBtn,
                listener: () => {
                    this.setRenderer('canvas');
                }
            },
        ]

        this.events.forEach(({name, target, listener}) => {
            target.addEventListener(name, listener);
        })
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
    }

    async setupCanvasRenderer(canvas: HTMLCanvasElement) {
        const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("no 2d canvas context");
        }

        const renderer = new CanvasRenderer({
            ctx
        });

        return renderer;
    }

    onLoad({ROWS, COLS, MINES, mapData, switcher}: onPlayingLoadProps) {
        const canvasContainer = document.querySelector(".canvas-container") as HTMLElement;
        const canvas = document.querySelector("canvas")!;
    
        document.documentElement.style.setProperty("--max-view-width", `${COLL * COLS + 14}px`);
        document.documentElement.style.setProperty("--max-view-height", `${ROWL * ROWS + 14}px`);
    
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

        const setupFunc: (canvas: HTMLCanvasElement)=>Promise<Renderer> = this.setupCanvasRenderer.bind(this);
    
        setupFunc(canvas).then(renderer => {
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
        
            this.engine = new GameEngine({
                map: map,
                view: mainView,
                renderer: renderer
            })
    
            mainView.onOffsetUpdate = () => this.engine!.updateOffset();
    
            this.setupEvents(this.engine, {
                ROWS,
                COLS,
                MINES,
                mapData,
                switcher
            });
    
            this.engine.onGameOver = (status) => {
                menu.stopTimer();
    
                if (status === 'win') {
                    menu.setRestartBtnStatus('cool');
                } else {
                    menu.setRestartBtnStatus('dead');
                }
            }
    
            this.startGame(this.engine);
        })
    }

    changeCanvas(): HTMLCanvasElement {
        const origCanvas = this.engine!.view.canvas;
        const newCanvas = origCanvas.cloneNode();

        for(const event of this.events) {
            if (event.target !== origCanvas) {
                continue;
            }

            origCanvas.removeEventListener(event.name, event.listener);
            event.target = newCanvas;
            newCanvas.addEventListener(event.name, event.listener);
        }

        origCanvas.parentNode?.replaceChild(newCanvas, origCanvas);

        const canvas = newCanvas as HTMLCanvasElement;
        return canvas;
    }

    setRenderer(rendererName: 'gl' | 'canvas') {
        if (this.engine === undefined) {
            return;
        }

        const canvas = this.changeCanvas();

        this.engine.view.canvas = canvas;

        this.renderer?.destruct();

        if (rendererName === 'gl') {
            this.setupWebGL(canvas).then(renderer => {
                this.renderer = renderer;
                this.engine!.renderer = renderer;
                this.engine?.updateOffset();
            });
            return;
        }

        if (rendererName === 'canvas') {
            this.setupCanvasRenderer(canvas).then(renderer => {
                this.renderer = renderer;
                this.engine!.renderer = renderer;
                this.engine?.updateOffset();
            });
            return;
        }
    }

    onUnload() {
        this.events.forEach(({name, target, listener}) => {
            target.removeEventListener(name, listener);
        })

        if (this.renderer) {
            this.renderer.destruct();
            this.renderer = undefined;
        }
    }

    startGame(engine: GameEngine) {
        engine.updateOffset();
    
        requestAnimationFrame(() => engine.update());
    }

    render() {
        return {
            tag: 'div',
            class: 'main-container',
            children: [
                {
                    tag: 'div',
                    class: 'game-container',
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
                {
                    tag: 'div',
                    class: 'options-container',
                    children: [
                        {
                            tag: 'button',
                            id: 'gl-btn',
                            text: 'webGL'
                        },
                        {
                            tag: 'button',
                            id: 'canvas-btn',
                            text: 'canvas'
                        }
                    ]
                }
            ]
        }
    }
}
