import { GLBuffer } from "./buffer";
import { BOMB_VALUE, HIDDEN_OVERFLOW } from "./consts";
import { GameMap } from "./gameMap";
import { CoordsT, makeCoords } from "./models";
import { loadTexture } from "./texture";
import { addVectors, permutations, randInt, range } from "./utils";
import { MinesweeperView } from "./window";

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

const CHUNKW = 30;
const CHUNKH = 30;

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

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        let source = document.querySelector("#vertex-shader");

        if (source === null) {
            console.error('no vertex shader');
            return;
        }

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, source.innerHTML);
        gl.compileShader(vertexShader);

        let error_log = gl.getShaderInfoLog(vertexShader);
        console.log(error_log);

        source = document.querySelector("#fragment-shader");

        if (source === null) {
            console.error('no fragment shader');
            return;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, source.innerHTML);
        gl.compileShader(fragmentShader);

        error_log = gl.getShaderInfoLog(fragmentShader);
        console.log(error_log);

        let program = gl.createProgram();

        if (program === null) {
            console.error('program is null');
            return;
        }

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.detachShader(program, vertexShader);
        gl.detachShader(program, fragmentShader);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const linkErrLog = gl.getProgramInfoLog(program);
            console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`)
            return;
        }

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // const texture = loadTexture(gl, "/textures/bomb.png");
        const texture = loadTexture(gl, "/textures/digits.png");

        const locations = {
            vertexCoords: gl.getAttribLocation(program, "aPosition"),
            textureCoords: gl.getAttribLocation(program, "aTextureCoord"),
            digitNum: gl.getAttribLocation(program, "digitNum"),
            sampler: gl.getUniformLocation(program, "uSampler"),
        }

        const vBuf = new GLBuffer({
            gl: gl,
            location: locations.vertexCoords,
            size: 2,
            type: gl.ARRAY_BUFFER,
            dataType: gl.FLOAT
        })

        let dataArray: number[] = [];

        const map = new GameMap({
            ROWS,
            COLS,
            ROWL,
            COLL,
            CHUNKH,
            CHUNKW
        });

        map.generateMatrix(MINES);

        const loadChunk = (chunk: CoordsT) => {
            dataArray = map.createVertexGridChunk(chunk);
            const textureCoords = map.createTextureCoordsChunk(chunk);

            vBuf.setData(new Float32Array(dataArray));
            textureBuffer.setData(new Float32Array(textureCoords));
        }

        const loadChunks = (chunks: CoordsT[]) => {
            // console.log('load chunks', chunks)
            dataArray = chunks.flatMap(map.createVertexGridChunk.bind(map));
            const textureCoords = chunks.flatMap(chunk => map.createTextureCoordsChunk(chunk));

            vBuf.setData(new Float32Array(dataArray));
            textureBuffer.setData(new Float32Array(textureCoords));
        }

        const textureBuffer = new GLBuffer({
            gl: gl,
            location: locations.textureCoords,
            size: 2,
            type: gl.ARRAY_BUFFER,
            dataType: gl.FLOAT,
        })

        // const map = generateMatrix(ROWS, COLS, MINES);



        console.log('map', map.map);

        gl.useProgram(program);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.sampler, 0);

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

        let currentChunk: CoordsT = makeCoords(0, 0);

        const getChunk = (coords: CoordsT) => {
            return {
                x: Math.floor(coords.x / COLL / CHUNKW),
                y: Math.floor(coords.y / ROWL / CHUNKH)
            }
        }

        const loadVisibleChunks = () => {
            const chunkDeltas = [
                makeCoords(0, 0),
                makeCoords(0, 1),
                makeCoords(1, 0),
                makeCoords(1, 1)
            ]

            const chunk = getChunk(mainView.offset);

            if (chunk !== currentChunk) {
                currentChunk = chunk;

                loadChunks(chunkDeltas.map(delta => addVectors(chunk, delta)))
            }
        }

        loadVisibleChunks();

        mainView.onOffsetUpdate = loadVisibleChunks;

        document.addEventListener('keydown', event => {

            // console.log(mainView.fullSize, mainView.offset);

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

        const openTile = (tileCoords: CoordsT) => {
            const val = map.getMapVal(tileCoords);

            if (map.isHidden(val) && val !== HIDDEN_OVERFLOW) {
                map.map[tileCoords.y][tileCoords.x] -= HIDDEN_OVERFLOW;
                loadVisibleChunks();
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
                            if (val >= HIDDEN_OVERFLOW && val !== HIDDEN_OVERFLOW + BOMB_VALUE) {
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

                    loadVisibleChunks();
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
            
            loadVisibleChunks();
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

        canvas.addEventListener('wheel', event => {
            mainView.updateOffset(makeCoords(event.deltaX, -event.deltaY));
        })

        const render = () => {
            mainView.viewSize = {
                x: canvas.clientWidth,
                y: canvas.clientHeight
            };

            canvas.width = mainView.viewSize.x;
            canvas.height = mainView.viewSize.y;
            gl.viewport(0, 0, mainView.viewSize.x, mainView.viewSize.y);

            setVec2FUniform(gl, program, "fullSize", [mainView.fullSize.x, mainView.fullSize.y]);
            setVec2FUniform(gl, program, "viewSize", [mainView.viewSize.x, mainView.viewSize.y]);

            setVec2FUniform(gl, program, "offset", [mainView.offset.x, mainView.offset.y]);
            setVec2FUniform(gl, program, "matrixSize", [COLS, ROWS]);

            setFUniform(gl, program, "l", mainView.fullSize[0] / COLS);
            gl.drawArrays(gl.TRIANGLES, 0, dataArray.length / 2);

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);

        // gl.useProgram(null);
        // if (program) {
        //   gl.deleteProgram(program);
        // }
    },
    false,
);

const setFUniform = (gl: WebGLRenderingContext, program: WebGLProgram, location: string, value: any) => {
    const glLocation = gl.getUniformLocation(program, location);
    gl.uniform1f(glLocation, value);
}

const setVec2FUniform = (gl: WebGLRenderingContext, program: WebGLProgram, location: string, value: any[]) => {
    const glLocation = gl.getUniformLocation(program, location);
    gl.uniform2fv(glLocation, value);
}
