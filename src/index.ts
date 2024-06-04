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

function initializeAttributes(gl: WebGLRenderingContext) {
    gl.enableVertexAttribArray(0);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
  
    return buffer
  }
  
  function cleanup(gl: WebGLRenderingContext, buffer: WebGLBuffer | null, program: WebGLProgram) {
    gl.useProgram(null);
    if (buffer) {
      gl.deleteBuffer(buffer);
    }
    if (program) {
      gl.deleteProgram(program);
    }
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
            // cleanup(gl, buffer, program);
            console.error(`Shader program did not link successfully. Error log: ${linkErrLog}`)
            return;
        }

        const texture = loadTexture(gl, "/textures/bomb.png");
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const vertexCoords = gl.getAttribLocation(program, "aPosition");
        const textCoords = gl.getAttribLocation(program, "vTextureCoord");

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(vertexCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexCoords);

        
        const textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

        const textureCoords = new Float32Array([
            0, 0,
            0, 1,
             1, 0,
            0, 1,
             1, 0,
             1, 1
        ]);

        gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

        gl.vertexAttribPointer(textCoords, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(textCoords);

        const dataArray = new Float32Array([
            -1, -1,
            -1, 1,
             1, -1,
            -1, 1,
             1, -1,
             1, 1
        ]);

        // const sizeInBytes = dataArray.length * dataArray.BYTES_PER_ELEMENT;        

        gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.STATIC_DRAW);

        gl.useProgram(program);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const sampler = gl.getUniformLocation(program, "uSampler");

        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(sampler, 0);

        setVec2FUniform(gl, program, "resolution", [canvas.width, canvas.height]);
        setVec2FUniform(gl, program, "size", [6, 3]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.useProgram(null);
        if (program) {
          gl.deleteProgram(program);
        }
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
