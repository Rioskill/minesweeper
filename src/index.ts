import { GLBuffer } from "./buffer";
import { CoordsT, makeCoords } from "./models";
import { loadTexture } from "./texture";
import { addVectors } from "./utils";
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

const BOMB_VALUE = 10;

const ROWL = 50;
const COLL = 50;

const CHUNKW = 30;
const CHUNKH = 30;

const range = (n: number, m?: number): number[] => {
    if (m === undefined) {
        return [...Array(n).keys()];
    }

    return range(m - n).map(x => x + n);
}

const permutations = <T1, T2>(a: T1[], b: T2[]) => {
    let res: (T1 | T2)[][] = [];
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) {
            res.push([a[i], b[j]]);
        }
    }
    return res;
}

const randInt = (max: number) => {
    return Math.floor(Math.random() * (max));
}

function generateMatrix(rows: number, cols: number, mines: number) {
    const matrix = Array(rows).fill(0).map(() => Array(cols).fill(0));

    range(mines).forEach(i => {
        let row = randInt(rows);
        let col = randInt(cols);

        while (matrix[row][col] === BOMB_VALUE) {
            row = randInt(rows);
            col = randInt(cols);
        }

        matrix[row][col] = BOMB_VALUE;
    })

    const hasBomb = (i: number, j: number) => {
        if (i < 0 ||
            i >= ROWS ||
            j < 0 ||
            j >= COLS) {
            return false;
        }

        return matrix[i][j] === BOMB_VALUE;
    }

    const calcValue = (y: number, x: number) => {
        if (matrix[y][x] === BOMB_VALUE) {
            return BOMB_VALUE;
        }

        const indices = range(-1, 2);

        const bombCnt = permutations(indices, indices)
            .filter(([i, j]) => !(i === 0 && j === 0))
            .map(([i, j]) => (hasBomb(y + i, x + j) ? 1 : 0) as number)
            .reduce((sum, n) => sum + n, 0)

        return bombCnt;
    }

    return matrix.map((row, i) => row.map((_, j) => calcValue(i, j) + 100));
}

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

        const createVertexGrid = () => {
            const grid: number[] = [];

            // const width = 1 / COLS;
            // const height = 1 / ROWS;

            const width = COLL;
            const height = ROWL;

            const mask = [
                [0, 0],
                [0, 1],
                [1, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ]

            for (let i = 0; i < ROWS; i++) {
                const y = i * height;

                for (let j = 0; j < COLS; j++) {
                    const x = j * width;
                    grid.push(
                        ...mask.flatMap(([a, b]) => [x + a * width, y + b * height])
                    );
                }
            }

            return grid;
        }

        const createVertexGridChunk = (chunk: CoordsT) => {
            const grid: number[] = [];

            // const width = 1 / COLS;
            // const height = 1 / ROWS;

            const width = COLL;
            const height = ROWL;

            const mask = [
                [0, 0],
                [0, 1],
                [1, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ]

            for (let i = chunk.y * CHUNKH; i < Math.min((chunk.y + 1) * CHUNKH, ROWS); i++) {
                const y = i * height;

                for (let j = chunk.x * CHUNKW; j < Math.min((chunk.x + 1) * CHUNKW, COLS); j++) {
                    const x = j * width;
                    grid.push(
                        ...mask.flatMap(([a, b]) => [x + a * width, y + b * height])
                    );
                }
            }

            return grid;
        }

        const createTextureCoords = (map: number[][]) => {
            const coords: number[] = [];

            const mask = [
                [0, 0],
                [0, 1],
                [1, 0],
                [0, 1],
                [1, 0],
                [1, 1]
            ]

            const width = 1 / 11;

            for (let i = 0; i < ROWS * COLS; i++) {
                // const num = (x: number) => x % 9;
                const num = (x: number) => map[Math.floor(x / ROWS)][x % ROWS];
                coords.push(
                    ...mask.flatMap(([a, b]) => [(num(i) + a) * width, b])
                )
            }

            return coords;
        }

        const createTextureCoordsChunk = (map: number[][], chunk: CoordsT) => {
            const coords: number[] = [];

            const mask = [
                [0, 0],
                [0, 1],
                [1, 0],
                [0, 1],
                [1, 0],
                [1, 1]
            ]

            const width = 1 / 11;

            for (let i = chunk.y * CHUNKH; i < Math.min((chunk.y + 1) * CHUNKH, ROWS); i++) {
                for (let j = chunk.x * CHUNKW; j < Math.min((chunk.x + 1) * CHUNKW, COLS); j++) {
                    coords.push(
                        ...mask.flatMap(([a, b]) => [(map[i][j] + a) * width, b])
                    )
                }
            }

            return coords;
        }

        let dataArray: number[] = [];

        const loadChunk = (chunk: CoordsT) => {
            dataArray = createVertexGridChunk(chunk);
            const textureCoords = createTextureCoordsChunk(map, chunk);

            vBuf.setData(new Float32Array(dataArray));
            textureBuffer.setData(new Float32Array(textureCoords));
        }

        const loadChunks = (chunks: CoordsT[]) => {
            // console.log('load chunks', chunks)
            dataArray = chunks.flatMap(createVertexGridChunk);
            const textureCoords = chunks.flatMap(chunk => createTextureCoordsChunk(map, chunk));

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

        const map = generateMatrix(ROWS, COLS, MINES);

        console.log('map', map);

        gl.useProgram(program);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.sampler, 0);

        const canvasContainer = document.querySelector(".canvas-container")!;

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

                // console.log(currentChunk)

                // loadChunk(chunk);
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

        const getMapVal = (coords: CoordsT) => {
            return map[coords.y][coords.x];
        }

        const coordsInBounds = (coords: CoordsT) => {
            return coords.x >= 0 &&
                   coords.y >= 0 &&
                   coords.x < COLS &&
                   coords.y < ROWS;
        }

        const openTile = (tileCoords: CoordsT) => {
            const val = getMapVal(tileCoords);

            if (val > 100) {
                map[tileCoords.y][tileCoords.x] -= 100;
                loadVisibleChunks();
            } else if (val === 100) {
                const q: CoordsT[] = [];

                q.push(tileCoords);

                const coordsDeltas = [
                    makeCoords(-1, 0),
                    makeCoords(0, -1),
                    makeCoords(1, 0),
                    makeCoords(0, 1)
                ]

                const processTile = (tileCoords: CoordsT) => {
                    map[tileCoords.y][tileCoords.x] -= 100;
                    
                    if (map[tileCoords.y][tileCoords.x] > 0) {
                        return;
                    }

                    const coords = coordsDeltas.map(delta => addVectors(tileCoords, delta));

                    coords.forEach(coord => {
                        if (coordsInBounds(coord)) {
                            const val = getMapVal(coord);
                            if (val >= 100 && val !== 110) {
                                q.push(coord);
                            }
                        }
                    })
                }

                const processTilesFromQueue = (queue: CoordsT[], num: number) => {
                    for (let i = 0; i < num && queue.length > 0; i++) {
                        const curr = q.shift();

                        if (curr === undefined || map[curr.y][curr.x] < 100) {
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

        canvas.addEventListener('mousedown', event => {
            const coords = {
                x: event.clientX - canvasCoords.x,
                y: event.clientY - canvasCoords.y
            };

            const HCollisionCoords = mainView.getHCollisionPos(coords);
            const VCollisionCoords = mainView.getVCollisionPos(coords);

            if (HCollisionCoords.collision) {
                console.log('H collision')
                HScrollClickPos = coords;
                originalOffset = {
                    x: mainView.offset.x,
                    y: mainView.offset.y
                };
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
            } else {
                VScrollClickPos = undefined;
            }

            const tile = getTileFromMouseCoords(coords)

            // console.log('click at', getCellFromMouseCoords(coords));

            openTile(tile);

            // if (map[tile.y][tile.x] > 100) {
            //     map[tile.y][tile.x] -= 100;
            //     loadVisibleChunks();
            // }
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
