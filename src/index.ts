import { GLBuffer } from "./buffer";
import { loadTexture } from "./texture";

const ROWS = 20;
const COLS = 20;

const MINES = 30;

const BOMB_VALUE = 10;

const ROWL = 50;
const COLL = 50;

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

    return matrix.map((row, i) => row.map((_, j) => calcValue(i, j)));
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

                    // console.log(mask.map(([a, b]) => [x + a * width, y + b * height]))

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

        const dataArray = createVertexGrid();

        // console.log(dataArray)

        vBuf.setData(new Float32Array(dataArray));

        // vBuf.setData(new Float32Array([
        //     0, 0,
        //     0, 500,
        //     500, 0,
        //     0, 500,
        //     500, 0,
        //     500, 500
        // ]))

        // vBuf.setData(new Float32Array([
        //     -1, -1,
        //     -1, 1,
        //     1, -1,
        //     -1, 1,
        //     1, -1,
        //     1, 1,
        // ]));

        const textureBuffer = new GLBuffer({
            gl: gl,
            location: locations.textureCoords,
            size: 2,
            type: gl.ARRAY_BUFFER,
            dataType: gl.FLOAT,
        })

        const map = generateMatrix(ROWS, COLS, MINES);

        console.log(map);

        const textureCoords = createTextureCoords(map);

        console.log(textureCoords)

        textureBuffer.setData(new Float32Array(textureCoords));

        gl.useProgram(program);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.sampler, 0);

        const canvasContainer = document.querySelector(".canvas-container")!;

        const l = 50;

        // const originalL = fullSize[0] / COLS;
        // const originalWidth = window.innerWidth;

        const fullSize = [
            COLL * COLS,
            ROWL * ROWS
        ]

        const offset = [0, 0];

        let viewSize = [
            canvas.clientWidth,
            canvas.clientHeight
        ];

        document.addEventListener('keydown', event => {
            // console.log('press', event.code)
            if (event.code === 'ArrowLeft') {
                offset[0] = Math.max(-100, offset[0] - 10);
            } else if (event.code === 'ArrowRight') {
                offset[0] = Math.min(fullSize[0], offset[0] + 10);
            } else if (event.code === 'ArrowDown') {
                offset[1] = Math.max(-100, offset[1] - 10);
            } else if (event.code === 'ArrowUp') {
                offset[1] = Math.min(fullSize[1], offset[1] + 10);
            }
        })

        const getCanvasCoords = () => {
            const coords = canvas.getBoundingClientRect();
            return {
                x: coords.x,
                y: coords.y
            };
        }

        const getHScrollCoords = () => {
            const x = offset[0] / fullSize[0]
            const y = viewSize[1] - 10

            const x2 = (offset[0] + viewSize[0]) / fullSize[0] * viewSize[1];
            const y2 = viewSize[1];

            return {
                x,
                y,
                x2,
                y2,
                width: x2 - x,
                height: y2 - y
            }
        }

        const HScrollCollision = (x: number, y: number) => {
            const HCoords = getHScrollCoords();
            return x > HCoords.x && y > HCoords.y && x < HCoords.x2 && y < HCoords.y2;
        }

        const getHScrollCollisionPos = (x: number, y: number) => {
            const HCoords = getHScrollCoords();

            return {
                x: x - HCoords.x,
                y: y - HCoords.y,
                collision: x > HCoords.x && y > HCoords.y && x < HCoords.x2 && y < HCoords.y2
            }
        }

        let canvasCoords = getCanvasCoords();

        window.addEventListener('resize', () => {
            console.log('resize');
            canvasCoords = getCanvasCoords();
        })

        let HScrollClickPos: { x: number, y: number } | undefined;
        let originalOffset: { x: number, y: number }

        canvas.addEventListener('mousedown', event => {
            const coords = {
                x: event.clientX - canvasCoords.x,
                y: event.clientY - canvasCoords.y
            };

            const collisionCoords = getHScrollCollisionPos(coords.x, coords.y);

            if (collisionCoords.collision) {
                console.log('collision')
                // HScrollClickPos = {
                //     x: collisionCoords.x,
                //     y: collisionCoords.y
                // }
                HScrollClickPos = coords;
                originalOffset = {
                    x: offset[0],
                    y: offset[1]
                };
            } else {
                HScrollClickPos = undefined;
            }

            console.log('mouse down', coords.x, coords.y, HScrollClickPos)
        })

        canvas.addEventListener('mousemove', event => {
            if (HScrollClickPos === undefined) {
                return;
            }

            const coords = {
                x: event.clientX - canvasCoords.x,
                y: event.clientY - canvasCoords.y
            };

            const newOffset = {
                x: HScrollClickPos.x - coords.x,
                y: HScrollClickPos.y - coords.y
            }

            offset[0] = originalOffset.x - newOffset.x * fullSize[0] / viewSize[0];

            console.log('mouse move', coords.x, coords.y)
        })

        const render = () => {
            // const fullSize = [
            //     canvas.clientWidth,
            //     canvas.clientHeight
            // ]

            // const fullSize = [1000, 1000]

            viewSize = [
                canvas.clientWidth,
                canvas.clientHeight
            ];

            canvas.width = viewSize[0];
            canvas.height = viewSize[1];

            // console.log(viewSize)

            // createTextureCoords
            // const resolution = [canvas.width, canvas.height];
            // const resolution = [canvas.clientWidth, canvas.clientHeight];
            // const resolution = fullSize;

            // const resolution = [
            //     l * COLS,
            //     l * ROWS
            // ]

            // canvas.width = resolution[0];
            // canvas.height = resolution[1];

            // canvas.width = fullSize[0];
            // canvas.height = fullSize[1];

            // const offset = [
            //     canvasContainer.scrollLeft,
            //     canvasContainer.scrollTop,
            // ];

            // const offset = [0, 0];

            // console.log('l', resolution[0] / COLS);

            gl.viewport(0, 0, viewSize[0], viewSize[1]);

            // console.log(fullSize, viewSize, offset)
            // console.log(resolution)
            // setVec2FUniform(gl, program, "resolution", resolution)

            setVec2FUniform(gl, program, "fullSize", fullSize);
            setVec2FUniform(gl, program, "viewSize", viewSize);

            setVec2FUniform(gl, program, "offset", offset);
            setVec2FUniform(gl, program, "matrixSize", [COLS, ROWS]);

            setFUniform(gl, program, "l", fullSize[0] / COLS);
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
