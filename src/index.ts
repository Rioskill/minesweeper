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

const CHUNKW = 20;
const CHUNKH = 20;

window.addEventListener(
    "load",
    function setupWebGL(evt) {
        console.log('setting up webGL')
        // Cleaning after ourselves. The event handler removes
        // itself, because it only needs to run once.
        window.removeEventListener(evt.type, setupWebGL, false);

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

        // gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const vSource = document.querySelector("#vertex-shader");

        if (vSource === null) {
            console.error('no vertex shader');
            return;
        }

        // const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        // gl.shaderSource(vertexShader, source.innerHTML);
        // gl.compileShader(vertexShader);

        const fSource = document.querySelector("#fragment-shader");

        if (fSource === null) {
            console.error('no fragment shader');
            return;
        }

        // const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        // gl.shaderSource(fragmentShader, source.innerHTML);
        // gl.compileShader(fragmentShader);

        // error_log = gl.getShaderInfoLog(fragmentShader);
        // console.log(error_log);

        // let program = gl.createProgram();

        const renderer = new GLRenderer({
            gl: gl,
            vertexShaderSource: vSource.innerHTML,
            fragmenShaderSource: fSource.innerHTML
        });

        // if (program === null) {
        //     console.error('program is null');
        //     return;
        // }

        // gl.attachShader(program, vertexShader);
        // gl.attachShader(program, fragmentShader);
        // gl.linkProgram(program);
        // gl.detachShader(program, vertexShader);
        // gl.detachShader(program, fragmentShader);
        // gl.deleteShader(vertexShader);
        // gl.deleteShader(fragmentShader);

        // if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        //     const linkErrLog = gl.getProgramInfoLog(program);
        //     console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`)
        //     return;
        // }

        // const vBuf = new GLBuffer({
        //     gl: gl,
        //     location: locations.vertexCoords,
        //     size: 2,
        //     type: gl.ARRAY_BUFFER,
        //     dataType: gl.FLOAT
        // })

        // let dataArray: number[] = [];

        // let minesVisible: boolean = false;

        const map = new GameMap({
            ROWS,
            COLS,
            ROWL,
            COLL,
            CHUNKH,
            CHUNKW
        });

        map.generateMatrix(MINES);

        // const textureBuffer = new GLBuffer({
        //     gl: gl,
        //     location: locations.textureCoords,
        //     size: 2,
        //     type: gl.ARRAY_BUFFER,
        //     dataType: gl.FLOAT,
        // })

        console.log('map', map.map);

        // gl.useProgram(program);


        const canvasContainer = document.querySelector(".canvas-container")!;

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

        // let currentChunk: CoordsT = makeCoords(0, 0);

        // loadVisibleChunks();

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

        let canvasCoords = mainView.canvasCoords;

        const getTileFromMouseCoords = (coords: CoordsT) => {
            return {
                x: Math.floor((coords.x + mainView.offset.x) / COLL),
                y: Math.floor((mainView.viewSize.y - coords.y + mainView.offset.y) / ROWL)
            }
        }

        window.addEventListener('resize', () => {
            console.log('resize');
            canvasCoords = mainView.canvasCoords;
        })

        let HScrollClickPos: { x: number, y: number } | undefined = undefined;
        let VScrollClickPos: { x: number, y: number } | undefined = undefined;

        let originalOffset: { x: number, y: number }

        const showAllMines = () => {
            engine.minesVisible = true;
        }

        const openTile = (tileCoords: CoordsT) => {
            const val = map.getMapVal(tileCoords);

            if (map.isHidden(val) && val !== HIDDEN_OVERFLOW) {
                map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;

                if (map.getMapVal(tileCoords) === MINE_VALUE) {
                    showAllMines();
                }

                engine.loadVisibleChunks();
            } else if (val === HIDDEN_OVERFLOW) {
                const q: CoordsT[] = [];

                q.push(tileCoords);

                const coordsDeltas = [
                    makeCoords(-1, 0),
                    makeCoords(0, -1),
                    makeCoords(1, 0),
                    makeCoords(0, 1)
                ]

                const processTile = (tileCoords: CoordsT) => {
                    map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;
                    
                    if (map.map[tileCoords.y][tileCoords.x] > 0) {
                        return;
                    }

                    const coords = coordsDeltas.map(delta => addVectors(tileCoords, delta));

                    coords.forEach(coord => {
                        if (map.tileInBounds(coord)) {
                            const val = map.getMapVal(coord);
                            if (val >= HIDDEN_OVERFLOW && val !== HIDDEN_OVERFLOW + MINE_VALUE) {
                                q.push(coord);
                            }
                        }
                    })
                }

                const processTilesFromQueue = (queue: CoordsT[], num: number) => {
                    for (let i = 0; i < num && queue.length > 0; i++) {
                        const curr = q.shift();

                        if (curr === undefined || map.map[curr.y][curr.x] < HIDDEN_OVERFLOW) {
                            continue;
                        }

                        processTile(curr);
                    }

                    if (queue.length > 0) {
                        this.setTimeout(()=>processTilesFromQueue(queue, num), 0);
                    }

                    engine.loadVisibleChunks();
                }

                processTilesFromQueue(q, 1000);
            }
        }

        const processLeftClick = (coords: CoordsT) => {
            const HCollisionCoords = mainView.getHCollisionPos(coords);
            const VCollisionCoords = mainView.getVCollisionPos(coords);

            let collision = false;

            if (HCollisionCoords.collision) {
                console.log('H collision')
                HScrollClickPos = coords;
                originalOffset = {
                    x: mainView.offset.x,
                    y: mainView.offset.y
                };

                collision = true;
            } else {
                HScrollClickPos = undefined;
            }

            if (VCollisionCoords.collision) {
                console.log('V collision');
                VScrollClickPos = coords;
                originalOffset = {
                    x: mainView.offset.x,
                    y: mainView.offset.y
                }

                collision = true;
            } else {
                VScrollClickPos = undefined;
            }

            if (!collision) {
                const tile = getTileFromMouseCoords(coords)
    
                openTile(tile);
            }
        }

        const processRightClick = (coords: CoordsT) => {
            console.log('right click')
            const tile = getTileFromMouseCoords(coords);

            map.toggleFlagAt(tile);

            engine.loadVisibleChunks();
        }

        canvas.addEventListener('mousedown', event => {
            const coords = {
                x: event.clientX - canvasCoords.x,
                y: event.clientY - canvasCoords.y
            };

            if (event.button === 0) {
                processLeftClick(coords);
            } else if (event.button === 2) {
                processRightClick(coords);
            }

        })

        window.addEventListener('mousemove', event => {
            if (HScrollClickPos === undefined && VScrollClickPos === undefined) {
                return;
            }

            const coords = {
                x: event.clientX - canvasCoords.x,
                y: event.clientY - canvasCoords.y
            };

            if (HScrollClickPos) {
                const newOffset = {
                    x: HScrollClickPos.x - coords.x,
                    y: HScrollClickPos.y - coords.y
                }

                mainView.setOffsetX(originalOffset.x - newOffset.x * mainView.fullSize.x / mainView.viewSize.x)
            } else if (VScrollClickPos) {
                const newOffset = {
                    x: VScrollClickPos.x - coords.x,
                    y: VScrollClickPos.y - coords.y
                }

                mainView.setOffsetY(originalOffset.y + newOffset.y * mainView.fullSize.y / mainView.viewSize.y);
            }
        })

        window.addEventListener('mouseup', event => {
            HScrollClickPos = undefined;
            VScrollClickPos = undefined;
        })

        
        // const debounceWheel = (callback, wait) => {
        //     let wheelSum = 0;
        //     let timeoutId: number | undefined = undefined;
        //     return (...args) => {
        //     //   window.clearTimeout(timeoutId);
        //         if (timeoutId !== undefined) {
        //             wheelSum
        //         }    

        //         timeoutId = window.setTimeout(() => {
        //             callback(wheelSum);
        //             window.clearTimeout(timeoutId);
        //         }, wait);
        //     };
        //   }

        let scrollCoord = makeCoords(0, 0);
        let scrollTimeoutId: number | undefined = undefined;

        canvas.addEventListener('wheel', event => {
            if (scrollTimeoutId === undefined) {
                scrollTimeoutId = window.setTimeout(() => {

                    mainView.updateOffset(scrollCoord);
                    scrollCoord = makeCoords(0, 0);
                    window.clearTimeout(scrollTimeoutId);
                    scrollTimeoutId = undefined;
                }, 10)
            }
            scrollCoord = addVectors(scrollCoord, makeCoords(event.deltaX, -event.deltaY))
        })

        engine.loadVisibleChunks();

        // requestAnimationFrame(render);

        this.requestAnimationFrame(() => engine.update());

        // gl.useProgram(null);
        // if (program) {
        //   gl.deleteProgram(program);
        // }
    },
    false,
);
