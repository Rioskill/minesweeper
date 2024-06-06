import { GLBuffer } from "./buffer";
import { loadTexture } from "./texture";

const ROWS = 6;
const COLS = 6;

const MINES = 6;

const range = (n: number) => {
    return [...Array(n).keys()]
}

const randInt = (max: number) => {
    return Math.floor(Math.random() * max);
}

function generateMatrix(rows: number, cols: number, mines: number) {
    const matrix = Array(rows).fill(0).map(() => Array(cols).fill(0));

    range(mines).forEach(i => {
        let row = randInt(rows);
        let col = randInt(cols);

        while (matrix[row][col] === -1) {
            row = randInt(rows);
            col = randInt(cols);
        }

        matrix[row][col] = -1;
    })

    return matrix;
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

        const dataArray = new Float32Array([
            -1, -1,
            -1, 1,
             1, -1,
            -1, 1,
             1, -1,
             1, 1
        ]);

        vBuf.setData(dataArray);

        // const textureBuffer = new GLFloatBuffer({
        //     gl: gl,
        //     location: locations.textureCoords,
        //     size: 2,
        //     type: gl.ARRAY_BUFFER
        // })
        
        // const textureCoords = new Float32Array([
        //     0, 0,
        //     0, 1,
        //      1, 0,
        //     0, 1,
        //      1, 0,
        //      1, 1
        // ]);

        // textureBuffer.setData(textureCoords);

        // const digitBuffer = new GLBuffer({
        //     gl: gl,
        //     location: locations.digitNum,
        //     size: 1,
        //     type: gl.ARRAY_BUFFER,
        //     dataType: gl.BYTE
        // })

        // const digits = new Uint8Array([
        //     0, 1, 2, 3
        // ]);

        // digitBuffer.setData(digits);

        gl.useProgram(program);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(locations.sampler, 0);

        const canvasContainer = document.querySelector(".canvas-container")!;

        const originalL = 50;
        const originalWidth = window.innerWidth;

        // this.window.addEventListener('resize', evt => {
        //     console.log('resize', originalWidth / this.window.innerWidth);
        // }, true)

        const fullSize = [
            canvasContainer.clientWidth,
            canvasContainer.clientHeight
        ]
        
        const render = () => {
            // const resolution = [canvas.width, canvas.height];
            // const resolution = [canvas.clientWidth, canvas.clientHeight];
            const resolution = fullSize;

            const viewSize = [canvas.clientWidth, canvas.clientHeight];

            canvas.width = resolution[0];
            canvas.height = resolution[1];

            const offset = [
                canvasContainer.scrollLeft,
                canvasContainer.scrollTop,
            ];

            gl.viewport(0, 0, viewSize[0] / 2, viewSize[1] / 2);
            // console.log(resolution)
            setVec2FUniform(gl, program, "resolution", resolution);
            setVec2FUniform(gl, program, "offset", offset);
            setFUniform(gl, program, "l", originalL * originalWidth / this.window.innerWidth);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
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
